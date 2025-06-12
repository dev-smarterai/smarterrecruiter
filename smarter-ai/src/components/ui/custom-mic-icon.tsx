import React from "react";
import { cn } from "@/lib/utils";

interface CustomMicIconProps {
  isRecording?: boolean;
  className?: string;
  size?: number;
}

export const CustomMicIcon: React.FC<CustomMicIconProps> = ({ 
  isRecording = false, 
  className, 
  size = 20 
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Base microphone */}
      <svg 
        width={size} 
        height={size}
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={cn(
          isRecording && "animate-pulse"
        )}
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>

      {/* Recording indicator pulse */}
      {isRecording && (
        <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
      )}
    </div>
  );
}; 