// Recruiting-Insights UI Cards – pixel-perfect Figma recreation
// -----------------------------------------------------------------------------
// 7 independent React components mirroring Figma 1:1 (minus the AI-Assist panel).
// Every typographic scale, spacing, border radius, icon, and chart proportion
// has been tuned to match the provided design reference. All dynamic values
// flow in via props so the UI updates as data changes. Tailwind's arbitrary
// values (e.g. h-[90px]) are used where the default scale didn't align exactly
// with the mock.
// -----------------------------------------------------------------------------
//  📦 Dependencies
//  • Tailwind CSS (with JIT arbitrary values enabled)
//  • shadcn/ui  – <Card>, <Separator>, <Progress>, etc.
//  • lucide-react – icon set
//  • recharts – all chart visualisations
// -----------------------------------------------------------------------------
//  ⬇️  Components exported:
//  > CostSavingsCard
//  > EmployeeRetentionCard
//  > HiringManagerFeedbackCard
//  > RecruiterResponseTimeCard
//  > TotalCandidatesSourcedCard
//  > ScreeningTimeComparisonCard
//  > ConversionRateBySourceCard
// -----------------------------------------------------------------------------

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@radix-ui/react-progress";
import {
  PiggyBank,
  Bot,
  CircleUser,
  Lightbulb,
  Clock,
  Filter,
  TimerReset,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { GaugeChart } from "./oldanalytics";
import {
  RecruiterWorkloadReductionCard,
  CandidateEngagementScoreCard,
  AdamVsOtherSourcesCard,
  InterviewToHireRatioCard,
  OfferAcceptanceRateCard,
  TimeInEachHiringStageCard,
  ScreeningSuccessRateCard,
  TimeToFillCard,
  CostPerHireCard,
  CandidateQualityScoreCard,
  SmartRecommendationsCard,
  PredictiveHiringTrendsCard,
  AISuggestedTalentPoolsCard
} from "./oldanalytics";

// ------- 🎨  Design Tokens ----------------------------------------------------
const accentBlue = "#5865F2";     // matches mock-up primary (purple-blue)
const accentGreen = "#31C16F";    // matches mock-up success green
const accentGrey  = "#E5E7EB";    // subtle chart bg / divider

// ------- 🎨 Design Tokens ----------------------------------------------------

const lightBlue = "#EEF0FF" // light blue background

// Tailwind class shortcuts used repeatedly
const cardBase =
  "w-full max-w-sm sm:max-w-md md:max-w-lg min-h-[360px] rounded-3xl bg-white shadow-[0px_4px_24px_rgba(0,0,0,0.06)] px-4 sm:px-6 pt-5 pb-6 flex flex-col";
const sectionLabel = "text-xs text-gray-500"
const metricNumber = "font-semibold text-[32px] leading-none text-gray-900"



// Helper – circle icon wrapper to keep all leading icons identical
const LeadIcon = ({ children, color }) => (
  <div
    className="flex items-center justify-center w-8 h-8 rounded-full"
    style={{ backgroundColor: `${color}1A` /* 10% tint */ }}
  >
    {children}
  </div>
);

// 1️⃣  Cost Savings ------------------------------------------------------------
export const CostSavingsCard = ({
  workloadSavings = 6700,
  advertisingSavings = 5700,
  month = "April",
  monthDelta = 18, // positive = ↑
}) => {
  const total = workloadSavings + advertisingSavings;
  
  // Calculate percentages for the donut chart
  const workloadPercentage = (workloadSavings / total) * 100;
  const advertisingPercentage = (advertisingSavings / total) * 100;
  
  // SVG circle parameters
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash for workload (green portion)
  const workloadStrokeDash = (workloadPercentage / 100) * circumference;
  const advertisingStrokeDash = (advertisingPercentage / 100) * circumference;
  
  return (
    <Card className={cardBase + " flex flex-col"}>
      {/* Top: header and subtitle */}
      <div>
        <CardHeader className="flex flex-row items-center gap-3 p-0 mb-3">
          <LeadIcon color={accentGreen}>
            <PiggyBank size={16} strokeWidth={2} className="text-[#31C16F]" />
          </LeadIcon>
          <div className="flex flex-col items-start">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Cost Savings
            </CardTitle>
            <p className="text-xs text-gray-500 leading-[14px] text-left">
              AI-driven savings in workload<br />and ad spend
            </p>
          </div>
        </CardHeader>
        <Separator className="my-2" />
      </div>
      {/* Middle: metric/visual, centered */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <p className="text-[24px] font-semibold text-gray-900 leading-none">
              ${total.toLocaleString()} saved
            </p>
            <p className={sectionLabel}>Total savings ({month})</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#F3F4F6"
                  strokeWidth="8"
                />
                {/* Workload portion (green) */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#31C16F"
                  strokeWidth="8"
                  strokeDasharray={`${workloadStrokeDash} ${circumference}`}
                  strokeLinecap="round"
                />
                {/* Advertising portion (blue) */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#5865F2"
                  strokeWidth="8"
                  strokeDasharray={`${advertisingStrokeDash} ${circumference}`}
                  strokeDashoffset={-workloadStrokeDash}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[6px] h-[6px] rounded-full bg-gray-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom: details/action */}
      <div>
        <ul className="text-xs mb-3 space-y-2">
          <li className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#31C16F1A]">
              <CircleUser size={12} className="text-[#31C16F]" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Workload</div>
              <div className="text-gray-500">${workloadSavings.toLocaleString()} saved from<br />reduced hours</div>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#5865F21A]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5865F2" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Advertising</div>
              <div className="text-gray-500">${advertisingSavings.toLocaleString()} saved from<br />optimized sourcing</div>
            </div>
          </li>
        </ul>
        
        <div className="flex items-center gap-1 mb-3 text-sm font-medium" style={{ color: accentGreen }}>
          <TrendingUp size={14} />
          <span>{monthDelta}% savings vs March</span>
        </div>
        
        <p className="text-xs text-gray-500 mb-4 italic">
          AI reduced manual hours by 40% and<br />eliminated low-performing ad channels.
        </p>
        
        <button className="w-full text-[15px] font-semibold text-white bg-[#5865F2] rounded-[12px] h-10 hover:opacity-90 transition">
          View Savings Breakdown
        </button>
      </div>
    </Card>
  );
};

// 2️⃣  Employee Retention ------------------------------------------------------
export const EmployeeRetentionCard = ({
  retentionRate = 92,
  monthDelta = 6, // positive ↑
}) => (
  <Card className={cardBase + " items-center text-center flex flex-col"}>
    {/* Top: header and subtitle */}
    <div>
      <CardHeader className="p-0 mb-3 flex flex-col items-center gap-3 w-full">
        <div className="flex flex-row items-center gap-3 w-full justify-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-3xl" style={{ backgroundColor: '#5865F21A' }}>
            <Bot size={20} strokeWidth={2} className="text-[#5865F2]" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 w-auto text-left">
            Employee Retention
          </CardTitle>
        </div>
        <p className="text-xs text-gray-500 leading-[14px] w-full text-center">
          Retention rate for hires made<br />via Adam (AI)
        </p>
      </CardHeader>
    </div>
    {/* Middle: metric/visual, centered */}
    <div className="flex-1 flex flex-col justify-center">
      <p className="font-semibold text-[50px] leading-none text-gray-900 mt-2 mb-1">{retentionRate}%</p>
      <p className="text-xs text-gray-500 mb-2 leading-none">Retention<br />After 6 months</p>
    </div>
    {/* Bottom: details/action */}
    <div>
      <div className="flex items-center justify-center gap-1 mb-4 text-[15px] font-medium" style={{ color: '#31C16F' }}>
        <TrendingUp size={14} />
        <span>+{monthDelta}% vs manual hires</span>
      </div>
      <p className="text-xs text-gray-500 mb-5 max-w-[200px] mx-auto text-center">
        Adam-assisted hires show higher retention in engineering and design roles.
      </p>
      <button
        className="w-full text-[15px] font-semibold text-white bg-[#5865F2] rounded-[12px] h-10 hover:opacity-90 transition"
      >
        View Retention by Role
      </button>
    </div>
  </Card>
);

// 3️⃣  Hiring Manager Feedback Score ------------------------------------------
export const HiringManagerFeedbackCard = ({
  score = 4.6,
  month = "April",
  delta = 0.3,
}) => {
  const percentage = (score / 5) * 100;
  return (
    <Card className={cardBase + " flex flex-col"}>
      {/* Top: header and subtitle */}
      <div>
        <CardHeader className="p-0 mb-3 flex flex-row items-center gap-3 w-full">
          <LeadIcon color={accentBlue}>
            <Lightbulb size={16} strokeWidth={2} className="text-[#5865F2]" />
          </LeadIcon>
          <div className="flex flex-col items-start">
            <CardTitle className="text-xl font-bold text-gray-900 text-left">
              Hiring Manager Feedback Score
            </CardTitle>
            <p className="text-xs text-gray-500 text-left">Avg. rating of candidate quality</p>
          </div>
        </CardHeader>
      </div>
      {/* Middle: metric/visual, centered */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="relative w-56 h-56 mb-4">
          <GaugeChart
            percentage={percentage}
            size={200}
            strokeWidth={16}
            gradient={["#A8B4FF", "#31C16F"]}
          >
            <div className="flex flex-col items-center">
              <span className="text-[40px] font-bold text-gray-900 leading-none">{score.toString().replace('.', ',')}</span>
              <span className="text-lg text-gray-400 font-medium">/5</span>
            </div>
          </GaugeChart>
        </div>
      </div>
      {/* Bottom: details/action */}
      <div>
        <Separator className="my-3" />
        <div className="w-full text-left">
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" fill="none" stroke="#5865F2" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span className="font-medium text-gray-900 text-sm">{month}: {score.toString().replace('.', ',')}</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-[#31C16F] mb-3">
            <TrendingUp size={14} />
            <span>+{delta.toString().replace('.', ',')} vs March</span>
          </div>
          <p className="text-xs text-gray-500">
            Your best ratings were given for executive candidates
          </p>
        </div>
      </div>
    </Card>
  );
};

// 4️⃣ Recruiter Response Time -------------------------------------------------
export const RecruiterResponseTimeCard = ({
    avgHours = 3.2,
    bestHours = 1.5,
    bestDate = "Apr 10",
    trendSeries = [
      { x: 0, y: 4 },
      { x: 1, y: 3.5 },
      { x: 2, y: 2 },
      { x: 3, y: 3.8 },
      { x: 4, y: 3.2 },
    ],
    monthDelta = -12, // negative = ↓
  }) => (
    <Card className={cardBase + " flex flex-col"}>
      {/* Top: header and subtitle */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EEF0FF]">
            <Clock size={18} className="text-[#5865F2]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Recruiter Response Time</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Average time to respond<br />to candidate outreach
        </p>
      </div>
      {/* Middle: metric/visual, centered */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-1">
          <p className="text-[28px] font-semibold text-gray-900">{avgHours} hrs</p>
          <p className="text-xs text-gray-600">Avg. response time (April)</p>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium mb-2 text-red-500">
          <TrendingDown size={14} />
          <span>{Math.abs(monthDelta)}% vs March</span>
        </div>
        <div className="h-[40px] w-full mb-2">
          <svg width="100%" height="40" viewBox="0 0 280 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0,20 C20,5 40,30 60,10 C80,0 100,20 120,30 C140,35 160,10 180,20 C200,30 220,10 240,20 C260,30 280,20 280,20"
              stroke="#5865F2"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
      </div>
      {/* Bottom: details/action */}
      <div>
        <p className="text-xs text-gray-600 mb-2">
          Best: {bestHours} hrs on {bestDate}
        </p>
        <Separator className="mb-2" />
        <button className="w-full text-[15px] font-semibold text-gray-900 hover:text-[#5865F2] h-8">View Full Report</button>
      </div>
    </Card>
  )
  
  // 5️⃣ Total Candidates Sourced ----------------------------------------------
  export const TotalCandidatesSourcedCard = ({
    role = 85,
    department = 57,
    location = 103,
    total = 2445,
    month = "April",
    monthDelta = 18,
    highlight = "Engineering roles based in New York",
  }) => (
    <Card className={cardBase + " flex flex-col"}>
      {/* Top: header and subtitle */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EEF0FF]">
            <Filter size={18} className="text-[#5865F2]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Total Candidates Sourced</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Breakdown by role, department,<br />and location
        </p>
      </div>
      {/* Middle: metric/visual, centered */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex rounded-[10px] overflow-hidden mb-3">
          <div className="flex-1 bg-[#E4E8FF] flex flex-col items-center justify-center py-2 border-r border-white">
            <span className="text-lg font-semibold text-gray-900">{role}</span>
            <span className="text-xs text-gray-600 mt-1">Role</span>
          </div>
          <div className="flex-1 bg-[#DCE0FF] flex flex-col items-center justify-center py-2 border-r border-white">
            <span className="text-lg font-semibold text-gray-900">{department}</span>
            <span className="text-xs text-gray-600 mt-1">Department</span>
          </div>
          <div className="flex-1 bg-[#D3D7FF] flex flex-col items-center justify-center py-2">
            <span className="text-lg font-semibold text-gray-900">{location}</span>
            <span className="text-xs text-gray-600 mt-1">Location</span>
          </div>
        </div>
      </div>
      {/* Bottom: details/action */}
      <div>
        <p className="text-base font-semibold text-gray-900 mb-1">
          {month}: {total.toLocaleString()} candidates
        </p>
        <div className="flex items-center gap-1 text-xs font-medium mb-1 text-[#31C16F]">
          <TrendingUp size={14} />
          <span>{monthDelta}% vs March</span>
        </div>
        <p className="text-xs text-gray-600 italic">
          Highest sourcing activity seen in<br />{highlight}
        </p>
      </div>
    </Card>
  )
  
  // 6️⃣ AI vs Manual Screening Time -------------------------------------------
  export const ScreeningTimeComparisonCard = ({
    manualHours = 8,
    aiHours = 2.5,
    candidates = 1800,
    hoursSaved = 99,
    hoursSavedLabel = "5,5",
    jobBoardsHours = 90,
  }) => {
    return (
      <Card className={cardBase}>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EEF0FF]">
            <TimerReset size={18} className="text-[#5865F2]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">AI vs Manual Screening Time</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2">Avg. time to screen candidates (per 100)</p>
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-medium text-gray-900">Manual Screening</p>
            <span className="text-xs text-gray-900">{hoursSavedLabel} hrs saved</span>
          </div>
          <div className="h-6 bg-[#EEF0FF] rounded-md mb-1"></div>
          <p className="text-right text-xs text-gray-600">{manualHours} hours</p>
        </div>
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-900 mb-1">AI Screening (Adam)</p>
          <div className="h-6 bg-[#EEF0FF] w-[30%] rounded-md mb-1"></div>
          <p className="text-right text-xs text-gray-600">{aiHours} hours</p>
        </div>
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-900 mb-1">Job Boards</p>
          <div className="h-6 bg-[#EEF0FF] w-[100%] rounded-md mb-1"></div>
          <p className="text-right text-xs text-gray-600">{jobBoardsHours} hours</p>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p className="text-xs text-gray-600">April: {candidates.toLocaleString()} candidates</p>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p className="text-xs text-gray-600">{hoursSaved} hours total time saved</p>
        </div>
        <p className="text-xs text-[#31C16F] italic">Adam reduced screening time by over 68% this month</p>
      </Card>
    )
  }
  
  // 7️⃣ Conversion Rate by Source ---------------------------------------------
  export const ConversionRateBySourceCard = ({
    data = [
      { name: "Adam (AI Recuiter)", apply: 42, interview: 28 },
      { name: "Referrals", apply: 35, interview: 22 },
      { name: "Job Boards", apply: 18, interview: 9 },
    ],
  }) => (
    <Card className={cardBase}>
      <div className="mb-1">
        <h3 className="text-xl font-semibold text-gray-900">Conversion Rate by Source</h3>
        <p className="text-sm text-gray-600">Advancement to interviews/offers</p>
      </div>
      <div className="mt-3 space-y-3">
        {data.map((src) => (
          <div key={src.name}>
            <div className="flex justify-between items-baseline mb-1">
              <p className="text-xs font-medium text-gray-900">{src.name}</p>
              <span className="text-xs font-medium text-gray-900">{src.apply}%</span>
            </div>
            <div className="relative h-2 mb-1">
              <div className="absolute inset-0 bg-[#EEF0FF] rounded-full"></div>
              <div
                className="absolute inset-y-0 left-0 bg-[#5865F2] rounded-full"
                style={{ width: `${(src.interview / src.apply) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-gray-600">Interview</p>
              <p className="text-xs text-gray-600">{src.interview}%</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-3 mb-3">
        Adam shows the highest conversion<br />from applicant to offer across all sources.
      </p>
    </Card>
  )
  
// AI Assist Card (Top Left) --------------------------------------------------
export const AIComponent = () => (
  <div className="w-full max-w-xs sm:max-w-sm md:max-w-md min-h-[420px] rounded-[20px] bg-white shadow-[0px_4px_24px_rgba(0,0,0,0.06)] px-4 sm:px-6 pt-5 pb-6 flex flex-col items-center ">
    <div className="flex flex-col items-center w-full">
      <div className="w-[72px] h-[72px] rounded-full overflow-hidden mb-4 mt-2 shadow-[0_2px_8px_rgba(88,101,242,0.10)]">
        <video
          src="./orb.webm"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      <h2 className="text-[15px] font-semibold text-gray-900 mb-2 text-center">How can I help you<br />today?</h2>
      <div className="w-full flex flex-col gap-2 mb-2">
        <button className="w-full bg-[#F4F6FF] text-[#5865F2] text-[13px] font-medium rounded-[10px] py-1.5 px-2.5 text-left hover:bg-[#e6eaff] transition">Generate Candidate Summary</button>
        <button className="w-full bg-[#F4F6FF] text-[#5865F2] text-[13px] font-medium rounded-[10px] py-1.5 px-2.5 text-left hover:bg-[#e6eaff] transition">Are they a good fit for our role?</button>
        <button className="w-full bg-[#F4F6FF] text-[#5865F2] text-[13px] font-medium rounded-[10px] py-1.5 px-2.5 text-left hover:bg-[#e6eaff] transition">What is their experience level</button>
        <div className="flex items-center gap-2 bg-[#F4F6FF] rounded-[10px] py-1.5 px-2.5 mt-1">
          <span className="text-[#5865F2] text-[13px] font-medium">Candidate Summary</span>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">PDF</span>
        </div>
      </div>
      <input
        type="text"
        placeholder="Ask me anything..."
        className="w-full mt-2 text-[13px] rounded-[10px] border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5865F2] bg-[#F8FAFF] placeholder-gray-400"
      />
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// 🏁  Export in one default object for convenience -----------------------------
export default {
  CostSavingsCard,
  EmployeeRetentionCard,
  HiringManagerFeedbackCard,
  RecruiterResponseTimeCard,
  TotalCandidatesSourcedCard,
  ScreeningTimeComparisonCard,
  ConversionRateBySourceCard,
};

/*************************************
 * Example dashboard grid – OPTIONAL
 * You can delete this or adapt it; kept here for convenience so you can see
 * everything in one go. Feeds default props so you get the exact visuals from
 * the reference image.
 *************************************/
export const RecruiterDashboardGrid = () => (
  <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 auto-rows-max">
    {/* first row */}
    <div className="lg:col-span-2">
      <RecruiterWorkloadReductionCard />
    </div>
    <CandidateEngagementScoreCard />
    <AdamVsOtherSourcesCard />

    {/* second row – small KPI cards */}
    <InterviewToHireRatioCard />
    <OfferAcceptanceRateCard />
    <TimeInEachHiringStageCard />
    <ScreeningSuccessRateCard />

    {/* third row – small KPI cards */}
    <TimeToFillCard />
    <CostPerHireCard />
    <CandidateQualityScoreCard />
    <SmartRecommendationsCard />

    {/* large chart & talent pools */}
    <div className="lg:col-span-2">
      <PredictiveHiringTrendsCard />
    </div>
    <div className="lg:col-span-2">
      <AISuggestedTalentPoolsCard />
    </div>
  </div>
);