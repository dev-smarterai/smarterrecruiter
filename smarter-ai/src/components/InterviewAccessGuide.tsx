"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { CalendarCheck, Clock, Key, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { convex } from "@/lib/convex";

export default function InterviewAccessGuide() {
  const [meetingCode, setMeetingCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const router = useRouter();
  const { user } = useAuth();
  const errorRef = useRef<HTMLDivElement>(null);
  
  // Effect to scroll to error message when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [error]);
  
  // Get candidate information for the current user
  const candidatesData = useQuery(
    api.candidates.getCandidatesByUserId,
    user?._id ? { userId: user._id } : "skip"
  );
  
  // Get the first candidate if available (most users will have only one candidate profile)
  const candidateData = candidatesData && candidatesData.length > 0 ? candidatesData[0] : null;
  
  // Get upcoming interview requests for this candidate
  const interviewRequests = useQuery(
    api.interviews.getInterviewRequestsByCandidate,
    candidateData?._id ? { candidateId: candidateData._id } : "skip"
  ) || [];
  
  // Filter to only show pending/accepted interviews with meeting codes
  const upcomingInterviews = interviewRequests.filter(interview => 
    (interview.status === "pending" || interview.status === "accepted" || interview.status === "Scheduled") && 
    interview.meetingCode
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meetingCode.trim()) {
      setError("Please enter your interview access code");
      return;
    }
    
    setIsValidating(true);
    setError("");
    
    try {
      // Get the client's current local time
      const now = new Date();
      const clientLocalTime = {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        day: now.getDate(),
        month: now.getMonth(),
        year: now.getFullYear()
      };
      
      // Call the Convex query directly
      const result = await convex.query(api.interview_access.validateInterviewAccess, { 
        meetingCode: meetingCode,
        userId: user?._id,
        clientLocalTime
      });
      
      if (result.canAccess) {
        // Navigate to the ai-meeting page with the meeting code
        router.push(`/ai-meeting?meetingId=${meetingCode}`);
      } else {
        setError(result.message || "Invalid interview code. Please check and try again.");
      }
    } catch (error) {
      console.error("Error validating access:", error);
      setError("Error validating your access code. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleAccessInterview = async (code: string) => {
    setIsValidating(true);
    setError("");
    
    try {
      // Get the client's current local time
      const now = new Date();
      const clientLocalTime = {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        day: now.getDate(),
        month: now.getMonth(),
        year: now.getFullYear()
      };
      
      // Call the Convex query directly
      const result = await convex.query(api.interview_access.validateInterviewAccess, { 
        meetingCode: code,
        userId: user?._id,
        clientLocalTime
      });
      
      if (result.canAccess) {
        // Navigate to the ai-meeting page with the meeting code
        router.push(`/ai-meeting?meetingId=${code}`);
      } else {
        setError(result.message || "This meeting code is no longer valid for access.");
      }
    } catch (error) {
      console.error("Error validating access:", error);
      setError("Error validating your access code. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };
  
  // Show loading state if we're still loading data
  if (candidatesData === undefined || interviewRequests === undefined) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-gray-600">Loading your interview schedule...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Access Your Scheduled Interview</h2>
      
      {upcomingInterviews.length > 0 ? (
        <div className="mb-4 sm:mb-6">
          <h3 className="text-sm sm:text-md font-medium mb-2 sm:mb-3">Your Upcoming Interviews</h3>
          <div className="space-y-3">
            {upcomingInterviews.map((interview) => (
              <div key={interview._id} className="border rounded-lg p-2 sm:p-3 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <div className="flex items-center gap-2 mb-1 sm:mb-0">
                    <Calendar size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base">{interview.position}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 ml-6 sm:ml-0">
                    {interview.status === "pending" && "Pending"}
                    {interview.status === "accepted" && "Confirmed"}
                    {interview.status === "Scheduled" && "Scheduled"}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 ml-6 sm:ml-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <div>Date: {format(new Date(interview.date), "MMMM d, yyyy")}</div>
                    <div>Time: {interview.time}</div>
                  </div>
                  <div className="mt-1">Access Code: <span className="font-mono font-medium">{interview.meetingCode}</span></div>
                </div>
                <Button 
                  onClick={() => handleAccessInterview(interview.meetingCode)}
                  className="w-full text-xs sm:text-sm py-1"
                  disabled={isValidating}
                >
                  {isValidating ? "Validating..." : "Access Interview"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : candidateData ? (
        <div className="bg-gray-50 rounded-md p-3 sm:p-4 mb-4 sm:mb-6 text-center text-gray-600 text-sm">
          <p>You don't have any scheduled interviews at this time.</p>
        </div>
      ) : null}
      
      {error && (
        <div ref={errorRef} className="rounded-md bg-red-50 p-3 sm:p-4 mt-3 sm:mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 sm:mt-6 border-t pt-3 sm:pt-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">Important Information:</h3>
        <ul className="list-disc ml-4 sm:ml-5 text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
          <li>You can access the interview <strong>15 minutes before</strong> your scheduled time</li>
          <li>Access remains open for <strong>60 minutes after</strong> your scheduled time</li>
          <li>You must use the access code on the scheduled date</li>
          <li>Please ensure you have a working microphone and are in a quiet environment</li>
          <li>The interview will last approximately 15-30 minutes</li>
        </ul>
      </div>
    </div>
  );
} 