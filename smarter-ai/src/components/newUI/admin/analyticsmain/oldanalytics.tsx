import React from "react";
import {
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/*************************************
 * Generic UI primitives
 *************************************/

/**
 * A very small card wrapper so we don't depend on any external UI kit. If you
 * already have shadcn/ui in your project you can safely swap this with their
 * <Card /> component – the *internal* markup of each component will keep
 * working exactly the same because everything is pure Tailwind.
 */
export const Card = ({ className = "", children }) => (
  <div
    className={`bg-white rounded-2xl shadow-md p-6 flex flex-col ${className}`}
  >
    {children}
  </div>
);

/*************************************
 * Re‑usable chart helpers
 *************************************/

/**
 * GaugeChart – radial progress indicator that accepts any percentage value.
 *
 * @param {number}  percentage   – 0‑100.
 * @param {number}  size         – rendered width / height in pixels.
 * @param {number}  strokeWidth  – thickness of the ring.
 * @param {string[]} gradient    – array with two HEX colours for the sweep.
 * @param {ReactNode} children   – anything you want to render in the centre.
 */
export const GaugeChart = ({
  percentage = 75,
  size = 160,
  strokeWidth = 12,
  gradient = ["#4dd0e1", "#7c4dff"],
  children,
}) => {
  const data = [{ name: "progress", value: percentage }];

  return (
    <div
      className="relative flex items-center justify-center mx-auto"
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="80%"
          outerRadius="100%"
          barSize={strokeWidth}
          startAngle={90}
          endAngle={-270}
          data={data}
        >
          <defs>
            <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
          <RadialBar
            cornerRadius={strokeWidth / 2}
            background={{ fill: "#f1f5f9" }}
            dataKey="value"
            fill="url(#gauge-gradient)"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* centred label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {children}
      </div>
    </div>
  );
};

/**
 * DoughnutChart – for the “Adam vs Other Sources” card.
 *
 * @param {Array<{name:string,value:number,color:string}>} slices – MUST sum to 100.
 * @param {number} size – width/height in px.
 * @param {ReactNode} children – inner label(s).
 */
export const DoughnutChart = ({ slices, size = 200, children }) => (
  <div
    className="relative flex items-center justify-center mx-auto"
    style={{ width: size, height: size }}
  >
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={slices}
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          startAngle={90}
          endAngle={450}
          paddingAngle={0}
          dataKey="value"
        >
          {slices.map((entry, index) => (
            <Cell key={`slice-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      {children}
    </div>
  </div>
);

/*************************************
 * Dashboard cards (1‑1 with the design)
 *************************************/

/**
 * Recruiter Workload Reduction
 */
export const RecruiterWorkloadReductionCard = ({
  month = "April",
  hoursSaved = 134,
  diffVsPrev = 28, // +28 hrs vs March
  percentOfTarget = 80, // for the gauge; can be any 0‑100 value
  summary = "AI tools saved you the equivalent of 3 full work weeks.",
}) => (
  <Card className="max-w-sm w-full">
    <h2 className="text-lg font-bold mb-1 text-slate-900">Recruiter Workload Reduction</h2>
    <p className="text-sm text-slate-500 mb-4">
      Estimated hours saved through automation
    </p>

    <GaugeChart percentage={percentOfTarget} size={220}>
      <p className="text-4xl font-semibold text-slate-900">
        {hoursSaved}
        <span className="text-xl font-normal ml-1">hrs</span>
      </p>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        saved this month
      </p>
    </GaugeChart>

    <ul className="mt-4 space-y-1 text-sm text-slate-700">
      <li>
        <span className="font-medium">{month}:</span> {hoursSaved} hrs
      </li>
      <li className={diffVsPrev >= 0 ? "text-emerald-600" : "text-rose-600"}>
        {diffVsPrev >= 0 ? "+" : ""}
        {diffVsPrev} hrs vs March
      </li>
    </ul>

    <p className="mt-3 text-sm text-slate-500 leading-snug">{summary}</p>
  </Card>
);

/**
 * Candidate Engagement Score
 */
export const CandidateEngagementScoreCard = ({
  month = "April",
  score = 88,
  avgResponseTime = 3.2, // in hours
  changeVsPrev = 6, // +6% vs prev period
  note = "Strong engagement observed from tech and product roles.",
}) => (
  <Card className="max-w-xs w-full">
    <h2 className="text-lg font-bold mb-1 text-slate-900">
      Candidate Engagement Score
    </h2>
    <p className="text-sm text-slate-500 mb-4">
      Avg. responsiveness rate across touchpoints
    </p>

    <GaugeChart percentage={score} size={180}>
      <p className="text-3xl font-semibold text-slate-900">
        {score}
        <span className="text-lg font-normal">%</span>
      </p>
      <p className="text-xs uppercase tracking-wide text-slate-500">Engaged</p>
    </GaugeChart>

    <ul className="mt-4 space-y-1 text-sm text-slate-700">
      <li>
        <span className="font-medium">{month}:</span> {avgResponseTime} hrs
      </li>
      <li className={changeVsPrev >= 0 ? "text-emerald-600" : "text-rose-600"}>
        {changeVsPrev >= 0 ? "+" : ""}
        {changeVsPrev}% vs March
      </li>
    </ul>

    <p className="mt-3 text-sm text-slate-500 leading-snug">{note}</p>
  </Card>
);

/**
 * Adam vs Other Sources
 */
export const AdamVsOtherSourcesCard = ({
  adamPercent = 62,
  adamLabel = "Adam (AI Recruiter)",
  otherLabel = "Other Sources",
  month = "April",
  totalCandidates = 2445,
  uniqueCandidates = 1517,
}) => {
  const slices = [
    { name: adamLabel, value: adamPercent, color: "#809cff" },
    { name: otherLabel, value: 100 - adamPercent, color: "#e5e9ff" },
  ];

  return (
    <Card className="max-w-xs w-full">
      <h2 className="text-lg font-bold mb-1 text-slate-900">
        {adamLabel.split(" ")[0]} vs Other Sources
      </h2>
      <p className="text-sm text-slate-500 mb-4">Sourcing percentage comparison</p>

      <DoughnutChart slices={slices} size={180}>
        <p className="text-3xl font-semibold text-slate-900">{adamPercent}%</p>
      </DoughnutChart>

      <div className="flex justify-between text-sm mt-4">
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: slices[0].color }}
          />
          {adamLabel}
        </span>
        <span>{adamPercent}%</span>
      </div>
      <div className="flex justify-between text-sm mt-1">
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: slices[1].color }}
          />
          {otherLabel}
        </span>
        <span>{100 - adamPercent}%</span>
      </div>

      <ul className="mt-4 space-y-1 text-sm text-slate-700">
        <li>
          <span className="font-medium">{month}:</span> {totalCandidates.toLocaleString()} candidates
        </li>
        <li>{uniqueCandidates.toLocaleString()} unique candidates</li>
      </ul>

      <p className="mt-3 text-sm text-slate-500 leading-snug">
        {adamLabel.split(" ")[0]} contributed over {adamPercent}% of source
        candidates this month
      </p>
    </Card>
  );
};

/**
 * Interview‑to‑Hire Ratio (simple metric card)
 */
export const InterviewToHireRatioCard = ({
  interviews = 94,
  hires = 17,
  ratio = (interviews / hires).toFixed(1),
  note = "Common benchmark for mid‑level engineering roles",
}) => (
  <Card className="w-full max-w-[230px]">
    <h3 className="text-sm font-medium text-slate-500 mb-1">
      Interview‑to‑Hire Ratio
    </h3>
    <p className="text-4xl font-semibold text-slate-900 mb-4">{ratio}</p>
    <div className="text-sm text-slate-700 space-y-1 mb-4">
      <p>
        <span className="font-medium">Interviews:</span> {interviews}
      </p>
      <p>
        <span className="font-medium">Hires:</span> {hires}
      </p>
    </div>
    <p className="text-xs text-slate-500 leading-snug">{note}</p>
  </Card>
);

/**
 * Offer Acceptance Rate
 */
export const OfferAcceptanceRateCard = ({
  rate = 89,
  industryAvg = 75,
}) => (
  <Card className="w-full max-w-[230px]">
    <h3 className="text-sm font-medium text-slate-500 mb-1">
      Offer Acceptance Rate
    </h3>
    <p className="text-4xl font-semibold text-slate-900 mb-4">{rate}%</p>
    <p className="text-sm text-slate-700 mb-2">
      Your offer acceptance rate is {rate}% compared to an industry average of
      {" "}
      {industryAvg}%
    </p>
  </Card>
);

/**
 * Time in Each Hiring Stage – renders a simple table
 */
export const TimeInEachHiringStageCard = ({
  stages = [
    { name: "Application Review", days: 2.5 },
    { name: "Initial Screening", days: 1.4 },
    { name: "Interview Rounds", days: 8.8 },
    { name: "Offer Stage", days: 3.0 },
    { name: "Other", days: 1.5 },
  ],
}) => (
  <Card className="w-full max-w-[230px]">
    <h3 className="text-sm font-medium text-slate-500 mb-3">
      Time in Each Hiring Stage
    </h3>
    <table className="w-full text-sm text-slate-700">
      <tbody>
        {stages.map((s) => (
          <tr key={s.name} className="border-b last:border-0">
            <td className="py-1 pr-2 whitespace-nowrap">{s.name}</td>
            <td className="py-1 text-right font-medium">{s.days} d</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

/**
 * Screening Success Rate – gauge
 */
export const ScreeningSuccessRateCard = ({ rate = 72 }) => (
  <Card className="w-full max-w-[230px]">
    <h3 className="text-sm font-medium text-slate-500 mb-3">
      Screening Success Rate
    </h3>
    <GaugeChart percentage={rate} size={140}>
      <p className="text-2xl font-semibold text-slate-900">{rate}%</p>
      <p className="text-xs uppercase tracking-wide text-slate-500">Passed</p>
    </GaugeChart>
  </Card>
);

/**
 * Time to Fill – tiny trend line
 */
export const TimeToFillCard = ({
  data = [
    { month: "Jan", days: 17 },
    { month: "Feb", days: 15 },
    { month: "Mar", days: 14 },
    { month: "Apr", days: 14 },
  ],
  current = 14,
  changeVsPrev = -3, // -3 days vs March
}) => (
  <Card className="w-full max-w-[230px]">
    <h3 className="text-sm font-medium text-slate-500 mb-1">Time to Fill</h3>
    <p className="text-4xl font-semibold text-slate-900 mb-4">{current} d</p>

    <ResponsiveContainer width="100%" height={60} className="mb-2">
      <LineChart data={data} margin={{ left: -18, right: 0, top: 0, bottom: 0 }}>
        <Line type="monotone" dataKey="days" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>

    <p className="text-sm text-slate-700">
      {changeVsPrev >= 0 ? "+" : ""}
      {changeVsPrev} d vs March
    </p>
  </Card>
);

/**
 * Cost per Hire
 */
export const CostPerHireCard = ({
  cost = 3400,
  changeVsPrev = 200,
}) => (
  <Card className="w-full max-w-[230px]">
    <h3 className="text-sm font-medium text-slate-500 mb-1">Cost per Hire</h3>
    <p className="text-4xl font-semibold text-slate-900 mb-4">
      ${cost.toLocaleString()}
    </p>
    <p
      className={`text-sm  ${
        changeVsPrev >= 0 ? "text-rose-600" : "text-emerald-600"
      }`}
    >
      {changeVsPrev >= 0 ? "+" : ""}${changeVsPrev.toLocaleString()} vs March
    </p>
  </Card>
);

/**
 * Candidate Quality Score – gauge 0‑100
 */
export const CandidateQualityScoreCard = ({ score = 82 }) => (
  <Card className="w-full max-w-[230px]">
    <h3 className="text-sm font-medium text-slate-500 mb-3">
      Candidate Quality Score
    </h3>
    <GaugeChart percentage={score} size={140}>
      <p className="text-2xl font-semibold text-slate-900">{score}</p>
      <p className="text-xs uppercase tracking-wide text-slate-500">/100</p>
    </GaugeChart>
  </Card>
);

/**
 * Smart Recommendations – list + CTA button.
 */
export const SmartRecommendationsCard = ({
  recommendations = [
    {
      title: "Automate manual scheduling",
      description: "Save up to 12 hrs / month",
    },
    {
      title: "Interview‑time optimisation",
      description: "Reduce idle time between stages by 1.5 days",
    },
    {
      title: "Time‑to‑Hire KPI",
      description: "Unlock predictive view to improve ramp‑up",
    },
  ],
  onApply = () => alert("Apply suggestions clicked"),
}) => (
  <Card className="w-full max-w-[230px]">
    <h3 className="text-sm font-medium text-slate-500 mb-3">Smart Recommendations</h3>
    <ul className="space-y-3 text-sm text-slate-700 mb-6">
      {recommendations.map((r) => (
        <li key={r.title} className="leading-snug">
          <span className="font-medium">{r.title}</span>
          <br />
          <span className="text-slate-500">{r.description}</span>
        </li>
      ))}
    </ul>
    <button
      onClick={onApply}
      className="mt-auto w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
    >
      Apply Suggestions
    </button>
  </Card>
);

/**
 * Predictive Hiring Trends – dual line chart through Dec‑24
 */
export const PredictiveHiringTrendsCard = ({
  data = [
    { month: "Jun", engineering: 30, marketing: 25 },
    { month: "Aug", engineering: 32, marketing: 25 },
    { month: "Oct", engineering: 36, marketing: 26 },
    { month: "Dec 2024", engineering: 45, marketing: 26 },
  ],
}) => (
  <Card className="w-full">
    <h2 className="text-lg font-bold mb-3 text-slate-900">Predictive Hiring Trends</h2>
    <p className="text-sm text-slate-500 mb-4">
      Forecasted hiring needs through December 2024
    </p>

    <ResponsiveContainer width="100%" height={240} className="mb-4">
      <LineChart data={data} margin={{ left: -10, right: 30, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend verticalAlign="top" height={36} />
        <Line type="monotone" dataKey="engineering" strokeWidth={2} name="Engineering roles" />
        <Line type="monotone" dataKey="marketing" strokeWidth={2} name="Marketing roles" strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>

    <ul className="space-y-1 text-sm text-slate-700">
      <li>Engineering hiring predicted to increase significantly</li>
      <li>Marketing demand projected to remain steady</li>
    </ul>
  </Card>
);

/**
 * AI Suggested Talent Pools – ranked list + CTA
 */
export const AISuggestedTalentPoolsCard = ({
  pools = [
    { role: "Senior Backend Engineers", location: "London, Remote", match: 92 },
    { role: "Product Managers", location: "New York", match: 86 },
    { role: "UX Designers", location: "Germany", match: 81 },
  ],
  onExplore = () => alert("Explore Talent Pools clicked"),
}) => (
  <Card className="w-full max-w-sm">
    <h2 className="text-lg font-bold mb-3 text-slate-900">AI Suggested Talent Pools</h2>
    <p className="text-sm text-slate-500 mb-4">Curated matches based on your hiring trends</p>

    <ul className="space-y-2 mb-6">
      {pools.map((p) => (
        <li
          key={p.role}
          className="flex items-center justify-between px-4 py-3 border rounded-lg"
        >
          <div>
            <p className="font-medium text-slate-900 leading-none">{p.role}</p>
            <p className="text-xs text-slate-500">{p.location}</p>
          </div>
          <p className="text-sm font-medium text-indigo-600">{p.match}% match</p>
        </li>
      ))}
    </ul>

    <button
      onClick={onExplore}
      className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
    >
      Explore Talent Pools
    </button>
  </Card>
);

/*************************************
 * Example dashboard grid – OPTIONAL
 * You can delete this or adapt it; kept here for convenience so you can see
 * everything in one go. Feeds default props so you get the exact visuals from
 * the reference image.
 *************************************/
export const RecruiterDashboardGrid = () => (
  <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 auto-rows-max">
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
