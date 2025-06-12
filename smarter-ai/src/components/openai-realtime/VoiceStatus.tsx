"use client";

import React, { useState, useEffect } from 'react';
import { Play, OctagonX, Volume2, MicIcon, Wand2, Loader2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import StartIcon from "../../../public/start.svg"
import Image from 'next/image';

interface VoiceStatusProps {
  currentVolume: number;
  isSessionActive: boolean;
  handleStartStopClick: () => void;
  isAISpeaking?: boolean;
  isConnecting?: boolean;
}

const VoiceStatus: React.FC<VoiceStatusProps> = ({
  currentVolume,
  isSessionActive,
  handleStartStopClick,
  isAISpeaking = false,
  isConnecting = false
}) => {
  const [waveAmplitude, setWaveAmplitude] = useState(0);

  // Update wave amplitude based on volume and speaking status
  useEffect(() => {
    if (!isSessionActive) {
      setWaveAmplitude(0);
      return;
    }

    // When AI is speaking, make the wave more pronounced
    if (isAISpeaking) {
      setWaveAmplitude(Math.max(0.4, currentVolume * 1.5));
    } else {
      // When listening, more subtle waves proportional to input volume
      setWaveAmplitude(currentVolume > 0.02 ? currentVolume : 0.05);
    }
  }, [currentVolume, isSessionActive, isAISpeaking]);

  return (
    <div className="flex flex-col items-center">
      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Status Indicator - Only show when active */}
        {/* {(isSessionActive || isAISpeaking) && (
          <div className="flex flex-col items-center mb-4">
            <div className={cn(
              "rounded-full py-3 px-10 flex justify-center",
              isAISpeaking
                ? "bg-blue-500 text-white"
                : isSessionActive
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-gray-500 border border-gray-200"
            )}>
              <AnimatePresence mode="wait">
                {isAISpeaking ? (
                  <motion.div
                    key="ai-speaking"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Volume2 size={30} />
                  </motion.div>
                ) : isSessionActive ? (
                  <motion.div
                    key="listening"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MicIcon size={30} />
                  </motion.div>
                ) : (
                  ""
                )}
              </AnimatePresence>
            </div>
          </div>
        )} */}

        {/* Control Button */}
        <motion.button
          onClick={handleStartStopClick}
          disabled={isConnecting}
          className={cn(
            "border py-4 pl-4 pr-4 flex items-center justify-center gap-2 bg-custom-gradientt rounded-md",
            isConnecting ? "bg-blue-400 cursor-not-allowed" :
              isSessionActive
                ? ""
                : ""
          )}
          whileHover={{ scale: isConnecting ? 1 : 1.05 }}
          whileTap={{ scale: isConnecting ? 1 : 0.95 }}
        >
          {isConnecting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Starting Interview...</span>
            </>
          ) : isSessionActive ? (
            <>
              <OctagonX size={16} />
              <span>End Interview</span>
            </>
          ) : (
            <>
             <Image src={StartIcon} alt='start' width={30} height={30}/>
              <span>Start Interview</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default VoiceStatus; 
