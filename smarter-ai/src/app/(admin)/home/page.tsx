"use client";

import { useAuth } from "@/lib/auth";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { OrbitingActionButtons } from "@/components/ui/OrbitingActionButtons";
import AskAdamAdmin from "@/components/newUI/admin/dashboard/ask-adam-admin";
import { recruitmentTemplates } from "@/lib/ai-utils";
import { Sidebar } from "@/components/newUI/admin/chat/Sidebar";
import { AIPageWrapper } from "@/lib/ai-navigation";
import { AIContentBlock } from "@/components/ui/ai-navigation/AIContentBuilder";

export default function AdminHomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const askAdamRef = useRef<any>(null);

  // Redirect non-admin users to their appropriate pages
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && isAuthenticated && user?.role !== "admin") {
      router.push("/application-form");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Handle action button clicks
  const handleActionButton = (action: string) => {
    let template = "";

    switch (action) {
      case "findCandidates":
        template = recruitmentTemplates.findCandidates;
        break;
      case "reviewResumes":
        template = recruitmentTemplates.reviewResumes;
        break;
      case "scheduleInterviews":
        template = recruitmentTemplates.scheduleInterviews;
        break;
      case "jobPostings":
        template = recruitmentTemplates.jobPostings;
        break;
      case "upcomingInterviews":
        template = recruitmentTemplates.upcomingInterviews;
        break;
      default:
        template = "I need assistance with recruitment for [position].";
    }

    // Set the input value
    setInputValue(template);
    
    // Set the input in the AskAdam component without submitting
    if (askAdamRef.current && askAdamRef.current.setInputValueOnly) {
      askAdamRef.current.setInputValueOnly(template);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null; // Will be redirected by the useEffect
  }

  return (
    <AIPageWrapper>
      <div className="flex min-h-screen">
        {/* Chat Sidebar - hidden on mobile, visible on desktop */}
        <AIContentBlock delay={0} blockType="list" className="hidden lg:block">
          <Sidebar />
        </AIContentBlock>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden">
          {/* Top section with orbiting buttons - NO ANIMATION WRAPPER */}
          <div className="flex-shrink-0 flex items-center justify-center py-4 sm:py-8 px-2 sm:px-4">
            <OrbitingActionButtons onActionClick={handleActionButton} />
          </div>
          
          {/* Bottom section with chat - anchored to bottom with margin */}
          <div className="flex-1 flex flex-col justify-end px-2 sm:px-4 pb-32 sm:pb-16 min-h-0">
            <div className="w-full max-w-4xl mx-auto">
              <AIContentBlock delay={1} blockType="card">
                <AskAdamAdmin 
                  initialInputValue={inputValue} 
                  ref={askAdamRef} 
                  hideInitialSuggestions={true} 
                />
              </AIContentBlock>
            </div>
          </div>
        </div>
      </div>
    </AIPageWrapper>
  );
} 