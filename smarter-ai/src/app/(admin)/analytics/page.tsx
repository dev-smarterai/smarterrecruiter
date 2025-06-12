"use client";

import React from "react";
import {
  CostSavingsCard,
  EmployeeRetentionCard,
  HiringManagerFeedbackCard,
  RecruiterResponseTimeCard,
  TotalCandidatesSourcedCard,
  ScreeningTimeComparisonCard,
  ConversionRateBySourceCard,
} from "@/components/newUI/admin/analyticsmain/recruitment";

import RecruitmentDashboard from "@/components/newUI/admin/analyticsmain/analyticsmain";
import AskAdamAdmin from "@/components/newUI/admin/dashboard/ask-adam-admin";
// AI Navigation imports
import { AIPageWrapper } from "@/lib/ai-navigation"
import { AIContentBlock, AIGrid } from "@/components/ui/ai-navigation/AIContentBuilder"

export default function AnalyticsDashboardPage() {
  return (
    <AIPageWrapper>
      <main className="flex flex-col">
        {/* Main dashboard takes full viewport height */}
        <AIContentBlock delay={0} blockType="card">
          <div className="min-h-screen">
            <RecruitmentDashboard />
          </div>
        </AIContentBlock>
        
        {/* Additional components below the fold */}
        <AIContentBlock delay={1} blockType="grid">
          <div className="">
            <AIGrid staggerDelay={0.1}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mt-6 lg:mt-0 items-stretch w-full">
                {/* Responsive analytics cards grid: 1col mobile, 2col sm, 3col md, 4col xl */}
                <AskAdamAdmin hideInitialSuggestions={false} />
                <CostSavingsCard />
                <EmployeeRetentionCard />
                <HiringManagerFeedbackCard />
                <RecruiterResponseTimeCard />
                <TotalCandidatesSourcedCard />
                <ScreeningTimeComparisonCard />
                <ConversionRateBySourceCard />
              </div>
            </AIGrid>
          </div>
        </AIContentBlock>
      </main>
    </AIPageWrapper>
  );
}
