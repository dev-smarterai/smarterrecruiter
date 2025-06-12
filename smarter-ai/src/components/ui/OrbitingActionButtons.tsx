"use client";

import React, { useRef, useEffect, createRef, useState } from "react";
import { UserIcon, FileText, CalendarIcon, BriefcaseIcon } from "lucide-react";
import { OrbVideo } from "@/components/OrbVideo";
import { AnimatedBeam } from "@/components/newUI/admin/chat/animated-beam";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  error?: boolean;
  loading?: boolean;
}

function ActionButton({ icon, label, onClick, active, disabled, error, loading }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-all shadow-sm hover:shadow-md relative text-[10px]",
        "sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs",
        loading
          ? "bg-yellow-50 text-yellow-500 border-yellow-200"
          : active
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent"
          : error
          ? "bg-red-50 text-red-500 border-red-200"
          : disabled
          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none"
          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-200"
      )}
    >
      <span
        className={cn(
          "p-0.5 rounded-full",
          "sm:p-1"
        )}
      >
        {icon}
      </span>
      <span className="text-[10px] sm:text-xs font-medium">{label}</span>
      {error && <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-red-500 rounded-full"></span>}
      {loading && <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-yellow-500 rounded-full animate-pulse"></span>}
    </button>
  );
}

interface OrbitingActionButtonsProps {
  onActionClick: (action: string) => void;
}

export function OrbitingActionButtons({ onActionClick }: OrbitingActionButtonsProps) {
  const orbRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<React.RefObject<HTMLDivElement>>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [refsReady, setRefsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Create refs for each button
    buttonRefs.current = Array(5).fill(null).map(() => createRef<HTMLDivElement>());
    
    // Check if mobile on mount and window resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Set a small delay to ensure refs are properly initialized
    const timer = setTimeout(() => {
      setRefsReady(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Responsive calculations
  const containerSize = isMobile ? 280 : 420; // Bigger container on desktop (was 340)
  const orbSize = isMobile ? 120 : 200; // Much bigger orb on desktop (was 150)
  const buttonRadius = isMobile ? orbSize / 2 + 70 : orbSize / 2 + 120; // Longer beams on desktop (was 100)

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: containerSize,
        height: containerSize,
        minWidth: isMobile ? 280 : 420,
        minHeight: isMobile ? 280 : 420,
      }}
      ref={containerRef}
    >
      {/* Centered orb */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: orbSize,
          height: orbSize,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        ref={orbRef}
      >
        <OrbVideo
          width={undefined}
          height={undefined}
          style={{ 
            width: "100%", 
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover"
          }}
        />
      </div>
      {/* Arrange action buttons in a circle around the orb */}
      {(() => {
        const centerX = containerSize / 2;
        const centerY = containerSize / 2;
        const buttonWidth = isMobile ? 60 : 70; // Smaller buttons on mobile
        const buttonHeight = isMobile ? 35 : 40;
        const buttons = [
          { icon: <UserIcon className="w-3 h-3 sm:w-4 sm:h-4" />, label: "Find Candidates", action: "findCandidates" },
          { icon: <FileText className="w-3 h-3 sm:w-4 sm:h-4" />, label: "Review Resumes", action: "reviewResumes" },
          { icon: <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />, label: "Schedule Interviews", action: "scheduleInterviews" },
          { icon: <BriefcaseIcon className="w-3 h-3 sm:w-4 sm:h-4" />, label: "Job Postings", action: "jobPostings" },
          { icon: <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />, label: "Upcoming Interviews", action: "upcomingInterviews" },
        ];
        return buttons.map((btn, i, arr) => {
          const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 2; // Start from top
          const btnX = centerX + buttonRadius * Math.cos(angle) - buttonWidth / 2;
          const btnY = centerY + buttonRadius * Math.sin(angle) - buttonHeight / 2;
          return (
            <React.Fragment key={btn.label}>
              <div
                style={{
                  position: "absolute",
                  left: btnX,
                  top: btnY,
                  zIndex: 2,
                  width: buttonWidth,
                  height: buttonHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "auto",
                }}
                ref={buttonRefs.current[i]}
              >
                <ActionButton 
                  icon={btn.icon} 
                  label={btn.label} 
                  onClick={() => onActionClick(btn.action)}
                />
              </div>
        
                <AnimatedBeam 
                  containerRef={containerRef}
                  fromRef={buttonRefs.current[i]}
                  toRef={orbRef}
                  curvature={-40}
                  pathColor="rgba(255, 255, 255, 0.5)"
                  pathWidth={2.5}
                  pathOpacity={0.5}
                  gradientStartColor="#ffffff"
                  gradientStopColor="#f8fafc"
                  reverse={i % 2 === 0}
                  delay={i * 0.2}
                />
            </React.Fragment>
          );
        });
      })()}
    </div>
  );
} 