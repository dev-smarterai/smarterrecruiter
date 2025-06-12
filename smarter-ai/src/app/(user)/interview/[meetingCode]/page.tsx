"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/Button";
import { Clock, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";

// Define props for page params
interface PageProps {
  params: {
    meetingCode: string;
  };
}

export default function InterviewAccessPage({ params }: PageProps) {
  const { meetingCode } = params;
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  // Get access validation
  const clientTimezoneOffset = new Date().getTimezoneOffset() * -1; // Convert JavaScript's negative offset to positive for BST
  console.log("Client timezone offset:", clientTimezoneOffset, "minutes");
  console.log("Current local time:", new Date().toString());
  console.log("Current UTC time:", new Date().toUTCString());
  
  const accessCheck = useQuery(api.interview_access.validateInterviewAccess, {
    meetingCode,
    clientTimezoneOffset,
  });
  
  // Handle starting the interview
  const handleStartInterview = () => {
    // Redirect to the actual interview room
    window.location.href = `/ai-meeting/${meetingCode}`;
  };
  
  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);
  
  // Effect to handle access check results
  useEffect(() => {
    if (accessCheck === undefined) {
      setIsLoading(true);
      return;
    }
    
    setIsLoading(false);
    
    if (accessCheck.canAccess) {
      setAccessGranted(true);
      // If there was a countdown timer, clear it
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    } else if (accessCheck.message.includes("Please return") && accessCheck.message.includes("minutes")) {
      // Extract minutes from message (assuming it contains "Please return X minutes before")
      const minutesMatch = accessCheck.message.match(/return (\d+) minutes/);
      if (minutesMatch && minutesMatch[1]) {
        const waitMinutes = parseInt(minutesMatch[1], 10);
        
        // Set initial countdown in seconds
        setCountdown(waitMinutes * 60);
        
        // Start countdown timer
        if (!intervalId) {
          const id = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                // When countdown reaches zero, recheck access
                clearInterval(id);
                // Reload the page to recheck access
                window.location.reload();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          setIntervalId(id);
        }
      }
    } else {
      // If there was a countdown timer but we're now in a state where we shouldn't
      // have one (e.g., "interview expired" rather than "come back in X minutes"),
      // clear the interval
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
  }, [accessCheck, intervalId, meetingCode]);
  
  // Format countdown time as MM:SS
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-blue-200 animate-spin"></div>
          </div>
          <h1 className="mb-2 text-center text-2xl font-semibold">Verifying Interview Access</h1>
          <p className="text-center text-gray-600">
            Please wait while we verify your scheduled interview time...
          </p>
        </div>
      </div>
    );
  }
  
  // Access granted state
  if (accessGranted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          <div className="flex justify-center mb-6 text-green-500">
            <CheckCircle size={56} />
          </div>
          <h1 className="mb-2 text-center text-2xl font-semibold">Interview Access Granted</h1>
          <p className="mb-6 text-center text-gray-600">
            You're all set! You can now begin your AI interview.
          </p>
          
          {accessCheck.interviewData && (
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h2 className="mb-2 font-medium">Interview Details:</h2>
              <p className="mb-1"><strong>Position:</strong> {accessCheck.interviewData.position}</p>
              <p className="mb-1"><strong>Scheduled Time:</strong> {accessCheck.interviewData.time}</p>
              <p><strong>Code:</strong> {meetingCode}</p>
            </div>
          )}
          
          <Button 
            onClick={handleStartInterview} 
            className="w-full flex items-center justify-center gap-2"
          >
            Begin Interview <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    );
  }
  
  // Access denied state
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="flex justify-center mb-6 text-amber-500">
          <AlertCircle size={56} />
        </div>
        <h1 className="mb-2 text-center text-2xl font-semibold">Access Temporarily Restricted</h1>
        
        <div className="mb-6 rounded-lg bg-amber-50 p-4 text-amber-800">
          <p>{accessCheck?.message}</p>
        </div>
        
        {countdown > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-center font-medium">Auto-refreshing in:</h2>
            <div className="flex justify-center">
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
                <Clock size={20} className="text-blue-500" />
                <span className="text-xl font-mono">{formatCountdown(countdown)}</span>
              </div>
            </div>
            <p className="mt-2 text-center text-sm text-gray-500">
              This page will automatically check again when it's time for your interview.
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => window.location.reload()} 
            variant="secondary"
          >
            Check Again
          </Button>
          <a 
            href="/" 
            className="text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
} 