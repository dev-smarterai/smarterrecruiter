import { WorkloadReductionCard } from "@/components/newUI/admin/analyticsmain/components/workload-reduction-card"
import { CandidateEngagementCard } from "@/components/newUI/admin/analyticsmain/components/candidate-engagement-card"
import { SourceComparisonCard } from "@/components/newUI/admin/analyticsmain/components/source-comparison-card"
import { InterviewToHireCard } from "@/components/newUI/admin/analyticsmain/components/interview-to-hire-card"
import { OfferAcceptanceCard } from "@/components/newUI/admin/analyticsmain/components/offer-acceptance-card"
import { TimeInStageCard } from "@/components/newUI/admin/analyticsmain/components/time-in-stage-card"
import { ScreeningSuccessCard } from "@/components/newUI/admin/analyticsmain/components/screening-success-card"
import { PredictiveHiringCard } from "@/components/newUI/admin/analyticsmain/components/predictive-hiring-card"
import { SuggestedTalentCard } from "@/components/newUI/admin/analyticsmain/components/suggested-talent-card"
import { TimeToFillCard } from "@/components/newUI/admin/analyticsmain/components/time-to-fill-card"
import { CostPerHireCard } from "@/components/newUI/admin/analyticsmain/components/cost-per-hire-card"
import { CandidateQualityCard } from "@/components/newUI/admin/analyticsmain/components/candidate-quality-card"
import { SmartRecommendationsCard } from "@/components/newUI/admin/analyticsmain/components/smart-recommendations-card"

export default function RecruitmentDashboard() {
  return (
    <div className=" ">
      <div className=" flex flex-col lg:flex-row gap-5">
        {/* Left Section */}
        <div className="w-full lg:w-2/3 space-y-1">
          {/* Top Part - Recruiter Workload Reduction */}
          <WorkloadReductionCard />

          {/* Bottom Part - 4x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pt-3 gap-5">
            <InterviewToHireCard />
            <OfferAcceptanceCard />
            <TimeInStageCard />
            <ScreeningSuccessCard />
            <TimeToFillCard />
            <CostPerHireCard />
            <CandidateQualityCard />
            <SmartRecommendationsCard />
          </div>
        </div>

        {/* Right Section - 2x2 Grid */}
        <div className="w-full lg:w-1/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CandidateEngagementCard />
          <SourceComparisonCard />
          <PredictiveHiringCard />
          <SuggestedTalentCard />
        </div>
      </div>
    </div>
  )
}
