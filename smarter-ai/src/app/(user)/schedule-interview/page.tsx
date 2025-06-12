"use client";

import { Navigation } from "@/components/ui/Navigation";
import SelfScheduleInterview from "@/components/SelfScheduleInterview";
import { useAuth } from "@/lib/auth";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/Card";

export default function ScheduleInterviewPage() {
  const { user } = useAuth();
  
  // Get candidate information for the current user
  const candidatesData = useQuery(
    api.candidates.getCandidatesByUserId,
    user?._id ? { userId: user._id } : "skip"
  );
  
  // Get the first candidate if available (most users will have only one candidate profile)
  const candidateData = candidatesData && candidatesData.length > 0 ? candidatesData[0] : null;
  
  // Add loading state for candidate data
  if (candidatesData === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading user profile...</p>
      </div>
    );
  }

  // Handle case where user isn't logged in or has no candidate profile
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-8 text-center">
              <h2 className="text-lg font-semibold mb-2">Please log in</h2>
              <p className="text-gray-600">You need to be logged in to schedule an interview.</p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (user && !candidateData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-8 text-center">
              <h2 className="text-lg font-semibold mb-2">No candidate profile found</h2>
              <p className="text-gray-600">You need to complete your candidate profile before scheduling an interview.</p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <main className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Schedule an AI Interview</h1>
            <p className="mt-2 text-sm text-gray-500">
              Schedule a practice interview with our AI system to prepare for your real interviews.
              Select a time that works for you, and you'll receive a personalized access code.
            </p>
          </div>
          
          {/* Information banner about time-based restrictions */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Important Access Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>After scheduling, you'll be able to access your interview:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li><strong>15 minutes before</strong> your scheduled interview time</li>
                    <li>Up to <strong>60 minutes after</strong> your scheduled interview time</li>
                    <li>Only on the day of your scheduled interview</li>
                  </ul>
                  <p className="mt-1">If you miss your time window, you'll need to reschedule.</p>
                </div>
              </div>
            </div>
          </div>
          
          <SelfScheduleInterview />
        </div>
      </main>
    </div>
  );
} 