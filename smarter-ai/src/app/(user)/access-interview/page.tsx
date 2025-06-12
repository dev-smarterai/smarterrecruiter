"use client";

import InterviewAccessGuide from "@/components/InterviewAccessGuide";
import { useAuth } from "@/lib/auth";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/Card";

export default function AccessInterviewPage() {
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
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access an interview.</p>
        </Card>
      </div>
    );
  }

  if (user && !candidateData) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">No candidate profile found</h2>
          <p className="text-gray-600">You need to complete your candidate profile before accessing an interview.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* <h1 className="text-2xl font-bold mb-6">Access AI Interview</h1> */}
      <div className="max-w-xl mx-auto">
        <InterviewAccessGuide />
      </div>
    </div>
  );
} 