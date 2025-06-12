import { useEffect, useState, useRef, useCallback } from "react";

// Define the SpeechRecognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

interface UseRecordVoiceProps {
  onTranscriptReceived?: (transcript: string) => void;
}

export const useRecordVoice = ({ onTranscriptReceived }: UseRecordVoiceProps = {}) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [recording, setRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // Track retries for network errors
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  // Ref to store audio chunks during recording
  const chunks = useRef<Blob[]>([]);
  // Use a ref to always have the latest "recording" state
  const recordingRef = useRef(recording);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  // Define speech recognition setup without stopRecording dependency
  const setupSpeechRecognition = useCallback(() => {
    const win = window as SpeechRecognitionWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser");
      return null;
    }
    
    try {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';
        
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText = result[0].transcript;
            break;
          } else {
            interimText = result[0].transcript;
          }
        }
        
        if (finalText) {
          setInterimTranscript("");
          if (onTranscriptReceived) {
            onTranscriptReceived(finalText);
          }
        } else if (interimText) {
          setInterimTranscript(interimText);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        
        if (event.error === 'not-allowed') {
          setPermissionDenied(true);
          setRecording(false);
          return;
        }
        
        // Handle network errors specially - this is common in Chrome/Arc
        if (event.error === 'network') {
          // Set network error state
          setNetworkError(true);
          
          // Only retry if we're still supposed to be recording
          if (recordingRef.current && retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            
            // Exponential backoff for retries: 500ms, 1000ms, 2000ms
            const backoffTime = Math.min(500 * Math.pow(2, retryCountRef.current - 1), 2000);
            console.log(`Network error in speech recognition. Retrying in ${backoffTime}ms (attempt ${retryCountRef.current} of ${maxRetries})...`);
            
            setTimeout(() => {
              if (recordingRef.current) {
                try {
                  recognitionInstance.start();
                  console.log("Speech recognition restarted after network error");
                  
                  // Reset network error state if start was successful
                  setNetworkError(false);
                } catch (error) {
                  console.error("Failed to restart speech recognition after network error:", error);
                  setRecording(false);
                }
              }
            }, backoffTime);
            
            return;
          } else {
            console.warn(`Speech recognition network error: maximum retry count (${maxRetries}) exceeded or no longer recording`);
          }
        }
        
        // For any other errors or if max retries exceeded
        setRecording(false);
      };
      
      recognitionInstance.onend = () => {
        // Use recordingRef to check the latest value
        if (recordingRef.current) {
          try {
            // Only try to restart if we're still supposed to be recording
            recognitionInstance.start();
            // If we successfully restart, reset the retry counter
            retryCountRef.current = 0;
          } catch (error) {
            console.error("Error restarting speech recognition:", error);
            setRecording(false);
          }
        }
      };
      
      return recognitionInstance;
    } catch (error) {
      console.error("Error setting up speech recognition:", error);
      return null;
    }
  }, [onTranscriptReceived, maxRetries]);

  // Initialize media recorder without circular dependency
  const setupMediaRecorder = useCallback(async (): Promise<MediaRecorder | null> => {
    try {
      setIsInitializing(true);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false // Explicitly set video to false
      });
      
      streamRef.current = stream;
      
      const newMediaRecorder = new MediaRecorder(stream);
      
      newMediaRecorder.onstart = () => {
        chunks.current = [];
        setPermissionDenied(false);
      };
      
      newMediaRecorder.ondataavailable = (ev) => {
        chunks.current.push(ev.data);
      };
      
      newMediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
        console.log("Audio recording saved:", audioBlob);
      };
      
      return newMediaRecorder;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setPermissionDenied(true);
      }
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Now define stopRecording with the proper dependencies
  const stopRecording = useCallback(() => {
    // Stop speech recognition
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }
    
    // Stop media recorder if active
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch (error) {
        console.error("Error stopping media recorder:", error);
      }
    }
    
    setRecording(false);
    setInterimTranscript("");
  }, [mediaRecorder, recognition]);

  // Initialize both recognition and media recorder on mount
  useEffect(() => {
    const initializeRecognition = async () => {
      // Set up speech recognition
      const recognitionInstance = setupSpeechRecognition();
      if (recognitionInstance) {
        setRecognition(recognitionInstance);
      }
      
      // No need to set up media recorder here - we'll do it lazily
    };
    
    initializeRecognition();
    
    // Cleanup function
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          console.error("Error cleaning up speech recognition:", error);
        }
      }
      
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error("Error cleaning up media stream:", error);
        }
      }
    };
  }, [setupSpeechRecognition]);

  // Handle visibility change - pause recognition when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && recording) {
        stopRecording();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recording, stopRecording]);

  const startRecording = useCallback(async () => {
    if (recording || isInitializing) return;
    
    setIsInitializing(true);
    
    try {
      // Reset retry counter when starting a new recording session
      retryCountRef.current = 0;
      
      // Check browser support first
      const win = window as SpeechRecognitionWindow;
      if (!win.SpeechRecognition && !win.webkitSpeechRecognition) {
        throw new Error("Speech recognition is not supported in this browser");
      }
      
      // Ensure we have a recognition instance
      let recognitionInstance = recognition;
      if (!recognitionInstance) {
        recognitionInstance = setupSpeechRecognition();
        if (recognitionInstance) {
          setRecognition(recognitionInstance);
        } else {
          throw new Error("Failed to initialize speech recognition");
        }
      }
      
      // Request microphone permission and set up media recorder
      let recorder = mediaRecorder;
      if (!recorder) {
        recorder = await setupMediaRecorder();
        if (recorder) {
          setMediaRecorder(recorder);
        }
        // We can continue without a recorder, as long as speech recognition works
      }
      
      // Start speech recognition first
      if (recognitionInstance) {
        try {
          recognitionInstance.start();
        } catch (error) {
          // Handle the "already started" error by stopping and restarting
          if (error instanceof DOMException && error.name === "InvalidStateError") {
            try {
              recognitionInstance.stop();
              // Small delay to ensure clean restart
              await new Promise(resolve => setTimeout(resolve, 100));
              recognitionInstance.start();
            } catch (restartError) {
              console.error("Error restarting speech recognition:", restartError);
              throw restartError;
            }
          } else {
            console.error("Error starting speech recognition:", error);
            throw error;
          }
        }
      } else {
        throw new Error("Speech recognition could not be initialized");
      }
      
      // Then start media recorder
      if (recorder) {
        try {
          chunks.current = [];
          recorder.start();
        } catch (error) {
          console.error("Error starting media recorder:", error);
          // Don't throw here - if speech recognition started, we can still continue
        }
      }
      
      // Everything started successfully
      setRecording(true);
      setPermissionDenied(false);
      setInterimTranscript("");
      setNetworkError(false);
      
    } catch (error) {
      console.error("Error in startRecording:", error);
      // Try to clean up anything that might have started
      if (recognition) {
        try { recognition.stop(); } catch (e) {}
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch (e) {}
      }
      
      // Reset recording state
      setRecording(false);
      
      // Re-throw to allow component to handle the error
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [
    mediaRecorder, 
    recognition, 
    recording, 
    isInitializing,
    setupSpeechRecognition, 
    setupMediaRecorder
  ]);

  return { 
    recording, 
    startRecording, 
    stopRecording, 
    permissionDenied,
    interimTranscript,
    isInitializing,
    networkError
  };
};
