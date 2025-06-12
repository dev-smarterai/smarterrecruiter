"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useTrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";

interface VideoCameraProps {
  isActive: boolean;
  className?: string;
  aiAudioElement?: HTMLAudioElement | null;
  recordingEnabled?: boolean;
  meetingId?: string;
  candidateId?: any;
  isCameraEnabled?: boolean;
  isAISpeaking?: boolean;
  isMuted?: boolean;
  toggleMute?: () => void;
  toggleCamera?: () => void;
  openSettings?: () => void;
  micIcon?: any;
  camIcon?: any;
  settingsIcon?: any;
}

export function VideoCamera({
  isActive,
  className,
  aiAudioElement,
  isCameraEnabled = true,
  isAISpeaking = false,
  isMuted = false,
  toggleMute = () => {},
  toggleCamera = () => {},
  openSettings = () => {},
  micIcon,
  camIcon,
  settingsIcon,
}: VideoCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [timer, setTimer] = useState(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [initStage, setInitStage] = useState<string>("not-started");
  const mountedRef = useRef(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  
  // LiveKit track toggle hooks (will only be active when inside a LiveKitRoom)
  const { toggle: toggleMicTrack } = useTrackToggle({ source: Track.Source.Microphone });
  const { toggle: toggleCameraTrack } = useTrackToggle({ source: Track.Source.Camera });

  // Format seconds to MM:SS format
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize camera on component mount only once
  useEffect(() => {
    console.log("Camera initialization effect running");

    const initializeCamera = async () => {
      if (!videoRef.current || cameraInitialized) return;

      try {
        setInitStage("requesting-permissions");
        console.log("Requesting camera access...");

        // Try a simpler camera request first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        if (!mountedRef.current) {
          console.log("Component unmounted during initialization, cleaning up");
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Store the stream reference for later control
        streamRef.current = stream;

        setInitStage("got-stream");
        console.log("Got camera stream, tracks:", stream.getTracks().length);

        if (videoRef.current) {
          console.log("Setting video stream to video element...");
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            if (!mountedRef.current) return;

            setInitStage("metadata-loaded");
            console.log("Video metadata loaded, playing...");

            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  if (!mountedRef.current) return;
                  setInitStage("playing");
                  console.log("Video is now playing! Video dimensions:",
                    videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
                  setCameraInitialized(true);
                  setCameraError(null);
                })
                .catch(e => {
                  console.error("Error playing video:", e);
                  setCameraError(`Could not play video stream: ${e.message}`);
                  setInitStage("play-error");
                });
            }
          };

          // Debug if stream is providing frames
          const track = stream.getVideoTracks()[0];
          if (track) {
            console.log("Video track settings:", track.getSettings());
            console.log("Video track constraints:", track.getConstraints());
            console.log("Video track enabled:", track.enabled);
            console.log("Video track readyState:", track.readyState);
          }
        }
      } catch (err: any) {
        if (!mountedRef.current) return;
        console.error("Error accessing camera:", err);
        setCameraError(err.message || "Could not access camera");
        setInitStage("permission-error");
      }
    };

    initializeCamera();

    // Clean up function only runs on unmount
    return () => {
      console.log("Camera component is unmounting");
      mountedRef.current = false;

      if (videoRef.current && videoRef.current.srcObject) {
        console.log("Cleaning up video stream on unmount...");
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          console.log("Stopping track:", track.kind, track.readyState);
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
    };
  }, []); // Only run on mount, not when cameraInitialized changes

  // Handle camera enabled state changes
  useEffect(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isCameraEnabled;
        console.log(`Camera ${isCameraEnabled ? 'enabled' : 'disabled'}, track:`, track.readyState);
      });
      
      // If camera is disabled, display a visual indicator
      if (videoRef.current) {
        videoRef.current.style.opacity = isCameraEnabled ? "1" : "0";
      }
    }
  }, [isCameraEnabled]);

  // Handle timer and countdown based on conversation activity
  useEffect(() => {
    console.log("isActive changed:", isActive);

    // Clear any existing interval first to avoid duplicates
    if (intervalIdRef.current) {
      console.log("Clearing existing interval");
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    let countdownInterval: NodeJS.Timeout | null = null;
    let timerStartTimeout: NodeJS.Timeout | null = null;

    if (isActive) {
      console.log("Starting timer and countdown...");
      // Start countdown
      setShowCountdown(true);
      setCountdownNumber(3);
      setTimer(0);

      // Handle countdown animation
      countdownInterval = setInterval(() => {
        setCountdownNumber(prev => {
          if (prev > 1) return prev - 1;
          setShowCountdown(false);
          return 1;
        });
      }, 1000);

      // Start the timer after countdown
      timerStartTimeout = setTimeout(() => {
        intervalIdRef.current = setInterval(() => {
          setTimer(prev => prev + 1);
        }, 1000);
      }, 3000);
    } else {
      console.log("Stopping timer and countdown...");
      setShowCountdown(false);
      setTimer(0);
    }

    // Cleanup
    return () => {
      if (intervalIdRef.current) {
        console.log("Cleaning up timer interval in effect cleanup");
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      if (timerStartTimeout) {
        clearTimeout(timerStartTimeout);
      }
    };
  }, [isActive]); // Only depend on isActive

  // Function to handle microphone toggle with LiveKit integration
  const handleMicToggle = () => {
    // Try to use LiveKit's track toggle if available, fallback to regular toggle
    try {
      toggleMicTrack();
    } catch (error) {
      console.log("LiveKit mic toggle not available, using fallback", error);
    }
    // Always call the parent's toggle function to maintain current behavior
    toggleMute();
  };

  // Function to handle camera toggle with LiveKit integration
  const handleCameraToggle = () => {
    // Try to use LiveKit's track toggle if available, fallback to regular toggle
    try {
      toggleCameraTrack();
    } catch (error) {
      console.log("LiveKit camera toggle not available, using fallback", error);
    }
    // Always call the parent's toggle function to maintain current behavior
    toggleCamera();
  };

  return (
    <div className={cn("relative w-full h-full bg-gray-100 dark:bg-gray-800 overflow-hidden", className)}>
      {cameraError ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-red-500 text-sm p-4 text-center">
            {cameraError} (Stage: {initStage})
          </p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            className="absolute inset-0"
          />
          {!cameraInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <p className="text-white text-sm">
                Initializing camera... ({initStage})
              </p>
            </div>
          )}
          {!isCameraEnabled && cameraInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
              <div className="text-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="48" 
                  height="48" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-white opacity-80 mx-auto mb-2"
                >
                  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                <p className="text-white text-sm">Camera is off</p>
              </div>
            </div>
          )}
          
          {/* AI speaking orb video */}
          {/* {isAISpeaking && ( */}
            <div className="absolute bottom-16 right-2 z-10">
              <video
                
                muted
                
                width={200}
                height={200}
                className="rounded-md border bg-white shadow-md"
              >
                <source src="/orb.webm" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          {/* )} */}

          {/* Controls bar */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex justify-center gap-6 rounded-full py-3 px-6">
            {micIcon ? (
              <div className="relative">
                <Image 
                  src={micIcon} 
                  width={40} 
                  height={40} 
                  alt="Microphone" 
                  className="cursor-pointer hover:opacity-80" 
                  onClick={handleMicToggle}
                />
                {isMuted && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                    <div className="w-[2px] h-12 bg-red-500 rotate-45 rounded-full transform translate-y-[-3px]"></div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleMicToggle}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
              >
                {isMuted ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                )}
              </button>
            )}

            {camIcon ? (
              <Image 
                src={camIcon} 
                width={40} 
                height={40} 
                alt="Camera" 
                className={`cursor-pointer hover:opacity-80 ${!isCameraEnabled ? 'opacity-50' : ''}`}
                onClick={handleCameraToggle}
              />
            ) : (
              <button
                onClick={handleCameraToggle}
                className={`w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 ${!isCameraEnabled ? 'opacity-50' : ''}`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M14.5 4h-5C7.46 4 6 5.46 6 7.5v9c0 2.04 1.46 3.5 3.5 3.5h5c2.04 0 3.5-1.46 3.5-3.5v-9C18 5.46 16.54 4 14.5 4Z"></path>
                  <path d="m18 12 5-3v6l-5-3Z"></path>
                </svg>
              </button>
            )}

            {settingsIcon ? (
              <Image 
                src={settingsIcon} 
                width={40} 
                height={40} 
                alt="More options" 
                className="cursor-pointer hover:opacity-80"
                onClick={openSettings}
              />
            ) : (
              <button
                onClick={openSettings}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>
            )}
          </div>
        </>
      )}

      {/* Countdown overlay */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              key={countdownNumber}
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="text-white text-9xl font-bold"
            >
              {countdownNumber}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer display */}
      {isActive && !showCountdown && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 rounded-full px-3 py-1.5">
          <div className="text-white text-sm font-semibold">
            {formatTime(timer)}
          </div>
        </div>
      )}
    </div>
  );
} 
