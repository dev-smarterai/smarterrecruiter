"use client"

interface SkillDetail {
  title: string
  description: string
}

interface SkillSection {
  title: string
  score: number
  color: string
  details: SkillDetail[]
}

interface ScreeningScoreProps {
  score: number
  recommendation: string
  sections: SkillSection[]
}

export default function ScreeningScoreCard({
  score = 60,
  recommendation = "Invite to Next Round",
  sections = [
    {
      title: "Soft Skills",
      score: 25,
      color: "#FFD699",
      details: [
        {
          title: "Communication",
          description: "Conveys ideas clearly and adapts to audience effectively",
        },
        {
          title: "Problem Solving",
          description: "Analyzes issues critically and provides actionable solutions",
        },
        {
          title: "Team Leadership",
          description: "Fosters collaboration and drives team success",
        },
      ],
    },
    {
      title: "Technical Skills",
      score: 75,
      color: "#6B9AE8",
      details: [
        {
          title: "Python",
          description: "Writing readable components, managing version control",
        },
        {
          title: "Meteor",
          description: "Utilized server-side JavaScript MongoDB integration, and teamwork",
        },
        {
          title: "React",
          description: "Proficient in building dynamic",
        },
      ],
    },
    {
      title: "Culture Fit",
      score: 75,
      color: "#4DD0C9",
      details: [
        {
          title: "Commitment to organizational goals",
          description: "and values",
        },
        {
          title: "Adaptability to team norms",
          description: "",
        },
      ],
    },
  ],
}: ScreeningScoreProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
      {/* Main score card with compact padding */}
      <div className="p-4 bg-white rounded-3xl mb-3 flex items-center justify-between relative">
        {/* Neon glow effect using pseudo-element */}
        <div className="absolute inset-0 rounded-3xl shadow-[0_0_15px_5px_rgba(79,70,229,0.4)] z-0"></div>

        {/* Content with higher z-index to appear above the glow */}
        <div className="z-10">
          <h2 className="text-lg font-bold text-[#1A365D]">Screening Score</h2>
          <p className="text-xs text-gray-600">Recommendation: {recommendation}</p>
        </div>
        <div className="relative flex items-center justify-center z-10">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="25" fill="none" stroke="#E2E8F0" strokeWidth="6" />
            <circle
              cx="30"
              cy="30"
              r="25"
              fill="none"
              stroke="#6B9AE8"
              strokeWidth="6"
              strokeDasharray="157"
              strokeDashoffset={157 - (157 * score) / 100}
              transform="rotate(-90 30 30)"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-xl font-bold text-[#1A365D]">{score}</span>
        </div>
      </div>

      {/* Skills sections with reduced spacing */}
      <div className="px-4 pb-4 space-y-3">
        {sections.map((section, index) => (
          <div key={index} className="flex items-start justify-between">
            <div className="flex-1 overflow-hidden pr-2">
              <h3 className="text-sm font-bold text-[#1A365D] mb-1">{section.title}</h3>

              {section.details.slice(0, 2).map((detail, detailIndex) => (
                <div key={detailIndex} className="text-xs mt-0.5">
                  <span className="font-medium">{detail.title}:</span>{" "}
                  <span className="text-gray-600 break-words line-clamp-1">
                    {detail.description.length > 30 
                      ? detail.description.substring(0, 30) + '...' 
                      : detail.description}
                  </span>
                </div>
              ))}
            </div>

            {/* Smaller semi-circular progress indicator */}
            <div className="relative flex items-center ml-2">
              <div className="relative w-12 h-12">
                <svg width="48" height="48" viewBox="0 0 48 48">
                  {/* Background semi-circle (right half only) */}
                  <path
                    d="M24,4 A20,20 0 0,1 44,24 A20,20 0 0,1 24,44"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Foreground semi-circle that shows the percentage */}
                  <path
                    d={`M24,4 A20,20 0 0,1 ${
                      24 + 20 * Math.sin((Math.PI * section.score) / 100)
                    },${24 - 20 * Math.cos((Math.PI * section.score) / 100)}`}
                    fill="none"
                    stroke={section.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {section.score}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
