"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function MeetingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has a candidate profile
  const userCandidatesQuery = useQuery(
    api.candidates.getCandidatesByUserId,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  const userCandidate = userCandidatesQuery?.[0];

  // Improved redirect logic with debouncing to avoid flashes
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout | null = null;
    
    try {
      // Reset error state
      setError(null);
      
      // If user is not logged in yet, continue loading
      if (!user) {
        return;
      }
      
      // If the query hasn't loaded yet, continue loading
      if (userCandidatesQuery === undefined) {
        return;
      }
      
      // If user has a meeting code, redirect to the AI meeting directly
      if (userCandidate?.meetingCode) {
        // Set a small delay to avoid flashing between states
        redirectTimer = setTimeout(() => {
          router.push(`/ai-meeting?meetingId=${userCandidate.meetingCode}`);
        }, 300);
        return;
      }
      
      // If user has no candidate profile, send them to application form
      if (user && !userCandidate) {
        redirectTimer = setTimeout(() => {
          router.push("/application-form");
        }, 300);
        return;
      }
      
      // User has a candidate profile but no meeting, show the meeting page
      setIsLoading(false);
      
    } catch (err) {
      console.error("Error in meeting page:", err);
      setError("An error occurred while loading your profile. Please try again.");
      setIsLoading(false);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [user, userCandidatesQuery, userCandidate, router]);

  // If the page is still loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <div className="w-full max-w-md">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-center">Preparing Voice AI</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center my-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
              <p>
                Please wait...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If there was an error
  if (error) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <div className="w-full max-w-md">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-center text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                {error}
              </p>
              <Button 
                className="w-full" 
                onClick={() => router.push("/application-form")}
              >
                Go to Application Form
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If the user has a candidate profile but no meeting code yet
  return (
    <div className="flex items-center justify-center h-full py-8">
      <div className="w-full max-w-md">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-center">Schedule A Meeting</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              You don't have any meetings scheduled yet. Please contact your recruiter to schedule a meeting.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 