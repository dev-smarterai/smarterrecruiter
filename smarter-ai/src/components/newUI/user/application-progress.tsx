"use client"

import { Card } from "@/components/ui/card"

interface Stage {
  name: string
  subtext: string
  completed: boolean
}

interface Metric {
  value: string
  unit: string
  label: string
  color?: string
}

interface ApplicationProgressProps {
  title: string
  subtitle: string
  currentStage: number
  stages: Stage[]
  metrics: Metric[]
}

const ApplicationProgress = ({ title, subtitle, currentStage, stages, metrics }: ApplicationProgressProps) => {
  // Calculate progress percentage based on current stage
  const progressPercentage = ((currentStage + 1) / stages.length) * 100

  return (
    <Card className="p-6 bg-white rounded-lg shadow-sm border-2 border-blue-400">
      <h2 className="text-xl font-bold text-gray-900 mb-1 font-sans">{title}</h2>
      <p className="text-sm text-gray-500 mb-6 font-sans">{subtitle}</p>

      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="h-1 w-full bg-gray-200 rounded-full">
          <div className="h-1 bg-purple-400 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-between absolute w-full -top-2">
          {stages.map((stage, index) => (
            <div key={index} className="relative">
              <div
                className={`w-5 h-5 rounded-full ${
                  stage.completed ? "bg-purple-400" : "bg-gray-200"
                } flex items-center justify-center`}
              >
                {stage.completed && <div className="text-white text-xs">✓</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Labels */}
      <div className="flex justify-between mb-8">
        {stages.map((stage, index) => (
          <div key={index} className="text-center">
            <div className="text-xs font-medium font-sans">{stage.name}</div>
            <div className="text-xs text-gray-500 font-sans">{stage.subtext}</div>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold mt-6 mb-4 font-sans">Profile Matching</h3>

      <div className="flex justify-between items-center">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className={`${index === 2 ? 'text-xl' : 'text-2xl'} font-bold ${metric.color || ""} font-sans`}>
              {metric.value}
              {metric.unit && <span className="text-lg">{metric.unit}</span>}
            </div>
            <div className="text-xs text-gray-500 font-sans">{metric.label}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default ApplicationProgress
