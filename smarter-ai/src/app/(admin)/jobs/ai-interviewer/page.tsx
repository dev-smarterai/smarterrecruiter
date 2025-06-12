"use client"
import { Button } from "@/components/Button"
import type React from "react"

import { Card } from "@/components/Card"
import { Input } from "@/components/Input"
import { cx } from "@/lib/utils"
import {
  RiAddLine,
  RiArrowLeftLine,
  RiDeleteBinLine,
  RiMagicLine,
  RiQuestionLine,
  RiBookOpenLine,
  RiInformationLine,
  RiSaveLine,
  RiEyeLine,
  RiRefreshLine,
  RiClipboardLine,
} from "@remixicon/react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { KnowledgeBaseModal } from "@/components/KnowledgeBaseModal"
import { AIPageWrapper } from "@/lib/ai-navigation"
import { AIContentBlock, AIGrid } from "@/components/ui/ai-navigation/AIContentBuilder"

// Define message type for the transcript
interface AiInterviewerQuestion {
  id: string
  text: string
  importance: "high" | "medium" | "low"
  followUpPrompts?: string[]
}

interface AiInterviewerConfig {
  introduction: string
  questions: AiInterviewerQuestion[]
  systemPrompt?: string
  timeLimit: number // in minutes
  conversationalStyle: "formal" | "casual" | "friendly"
  focusAreas: string[]
}

interface JobDetails {
  title: string
  requirements: string[]
  description: {
    intro: string
    details: string
    responsibilities: string
    closing: string
  }
  desirables: string[]
}

export default function AiInterviewerPage() {
  // Get jobs data from Convex
  const jobs = useQuery(api.jobs.getJobs) || []
  // Use the new combined mutation
  const saveConfigAndPromptMutation = useMutation(api.jobs.saveInterviewerConfigAndPrompt)

  const [selectedJobId, setSelectedJobId] = useState<Id<"jobs"> | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedJob, setSelectedJob] = useState<JobDetails | null>(null)
  const [activeTab, setActiveTab] = useState<"prompt" | "questions" | "style" | "preview">("prompt")

  // Get selected job details with the new combined query
  const jobWithConfig = useQuery(api.jobs.getJobWithInterviewerConfig, selectedJobId ? { id: selectedJobId } : "skip")

  // Default system prompt template
  const defaultSystemPrompt = `You are a professional AI voice interviewer for Smarter.ai, tasked with assessing candidates for the {{jobTitle}} position. Your purpose is to conduct a thorough evaluation of technical skills, experience, and cultural fit through natural conversation. Speak in a clear, professional tone that puts candidates at ease while extracting meaningful information about their qualifications.

Begin each interview with a brief introduction about {{companyName}} and the {{jobTitle}} position. Greet the candidate by name: "{{candidateName}}". Then guide the conversation through technical assessment areas including {{requirements}}.

For this role, candidates need to demonstrate the following responsibilities: {{responsibilities}}

Additionally, we value candidates who have: {{desirables}}

About the candidate:
Name: {{candidateName}}
{{cv}}

Assess candidates on their understanding of technical philosophy, not just tools. Listen for indicators of collaboration skills, continuous improvement mindset, and relevant experience. Probe for specific examples from past experience, particularly regarding implementation, scaling, and problem resolution.

Adapt questioning based on candidate responses, following up on vague answers to obtain specific details. Recognize and acknowledge strong technical responses without revealing evaluation criteria. When candidates struggle with a question, provide appropriate context to keep the conversation flowing rather than creating awkwardness.

Throughout the interview, evaluate communication skills and ability to explain complex technical concepts clearly. The ideal candidate demonstrates both technical proficiency and the ability to collaborate effectively with cross-functional teams.

End each interview by asking if the candidate has questions about the role or company. Provide clear information about next steps in the hiring process.`

  // Initialize the config state
  const [config, setConfig] = useState<AiInterviewerConfig>({
    introduction:
      "Hello! I'm your AI interviewer today. I'll be asking you some questions about your experience and skills for this role.",
    questions: [
      {
        id: "1",
        text: "Can you tell me about your experience with relevant technologies?",
        importance: "high",
        followUpPrompts: ["What specific projects have you worked on?", "How did you overcome challenges?"],
      },
      {
        id: "2",
        text: "How do you approach problem-solving in your work?",
        importance: "medium",
        followUpPrompts: [],
      },
    ],
    systemPrompt: defaultSystemPrompt,
    timeLimit: 30, // default 30 minutes
    conversationalStyle: "friendly", // default friendly style
    focusAreas: ["Technical Skills", "Problem Solving", "Communication"],
  })

  // Add state for knowledge base modal
  const [isKnowledgeBaseModalOpen, setIsKnowledgeBaseModalOpen] = useState(false)

  // Update job details when jobWithConfig changes
  useEffect(() => {
    if (jobWithConfig) {
      // Extract job details from the combined response
      setSelectedJob({
        title: jobWithConfig.title,
        requirements: jobWithConfig.requirements,
        description: jobWithConfig.description,
        desirables: jobWithConfig.desirables,
      })

      // Set config if available
      if (jobWithConfig.aiInterviewerConfig) {
        setConfig(jobWithConfig.aiInterviewerConfig)
      } else {
        // Reset to default with job-specific values if no config exists
        setConfig((prev) => ({
          ...prev,
          systemPrompt: defaultSystemPrompt,
        }))
      }
    }
  }, [jobWithConfig])

  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedJobId(value ? (value as Id<"jobs">) : null)
  }

  // Process placeholders in prompt text with actual job data
  const processPlaceholders = (text: string): string => {
    if (!selectedJob) return text

    let processedText = text

    // First handle double curly braces
    processedText = processedText
      .replace(/\{\{jobTitle\}\}/g, selectedJob.title)
      .replace(/\{\{requirements\}\}/g, selectedJob.requirements.join(", "))
      .replace(/\{\{responsibilities\}\}/g, selectedJob.description.responsibilities)
      .replace(/\{\{desirables\}\}/g, selectedJob.desirables.join(", "))
      .replace(/\{\{companyName\}\}/g, jobWithConfig?.company || "our company")
      .replace(/\{\{jobDescription\}\}/g, `${selectedJob.description.intro}\n${selectedJob.description.details}`)
      .replace(/\{\{candidateName\}\}/g, "the candidate")
      .replace(/\{\{cvSummary\}\}/g, "CV summary not available")
      .replace(/\{\{cvHighlights\}\}/g, "CV highlights not available")
      .replace(/\{\{cvKeyInsights\}\}/g, "CV key insights not available")
      .replace(/\{\{cv\}\}/g, "CV information not available")
      .replace(/\{\{knowledgeBase\}\}/g, "Knowledge base information will be included during the interview")

    // Then handle single curly braces for backward compatibility
    processedText = processedText
      .replace(/\{jobTitle\}/g, selectedJob.title)
      .replace(/\{requirements\}/g, selectedJob.requirements.join(", "))
      .replace(/\{responsibilities\}/g, selectedJob.description.responsibilities)
      .replace(/\{desirables\}/g, selectedJob.desirables.join(", "))
      .replace(/\{companyName\}/g, jobWithConfig?.company || "our company")
      .replace(/\{jobDescription\}/g, `${selectedJob.description.intro}\n${selectedJob.description.details}`)
      .replace(/\{candidateName\}/g, "the candidate")
      .replace(/\{cvSummary\}/g, "CV summary not available")
      .replace(/\{cvHighlights\}/g, "CV highlights not available")
      .replace(/\{cvKeyInsights\}/g, "CV key insights not available")
      .replace(/\{cv\}/g, "CV information not available")
      .replace(/\{knowledgeBase\}/g, "Knowledge base information will be included during the interview")

    return processedText
  }

  // Function to update system prompt based on config changes
  const updateSystemPromptFromConfig = (updatedConfig: AiInterviewerConfig): AiInterviewerConfig => {
    // Get the base system prompt (either the existing one or default)
    const basePrompt = updatedConfig.systemPrompt || defaultSystemPrompt

    // Return the updated config with the new system prompt
    return {
      ...updatedConfig,
      systemPrompt: basePrompt,
    }
  }

  const handleIntroductionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newIntroduction = e.target.value
    setConfig((prev) => {
      const updatedConfig = { ...prev, introduction: newIntroduction }
      return updatedConfig
    })
  }

  const handleQuestionChange = (id: string, text: string) => {
    setConfig((prev) => {
      const updatedConfig = {
        ...prev,
        questions: prev.questions.map((q) => (q.id === id ? { ...q, text } : q)),
      }
      return updatedConfig
    })
  }

  const handleQuestionImportanceChange = (id: string, importance: "high" | "medium" | "low") => {
    setConfig((prev) => {
      const updatedConfig = {
        ...prev,
        questions: prev.questions.map((q) => (q.id === id ? { ...q, importance } : q)),
      }
      return updatedConfig
    })
  }

  const addQuestion = () => {
    const newId = (config.questions.length + 1).toString()
    setConfig((prev) => {
      const updatedConfig = {
        ...prev,
        questions: [
          ...prev.questions,
          {
            id: newId,
            text: "",
            importance: "medium" as const,
            followUpPrompts: [],
          },
        ],
      }
      return updatedConfig
    })
  }

  const removeQuestion = (id: string) => {
    setConfig((prev) => {
      const updatedConfig = {
        ...prev,
        questions: prev.questions.filter((q) => q.id !== id),
      }
      return updatedConfig
    })
  }

  const addFollowUpPrompt = (questionId: string) => {
    setConfig((prev) => {
      const updatedConfig = {
        ...prev,
        questions: prev.questions.map((q) => {
          if (q.id === questionId) {
            return { ...q, followUpPrompts: [...(q.followUpPrompts || []), ""] }
          }
          return q
        }),
      }
      return updatedConfig
    })
  }

  const handleFollowUpPromptChange = (questionId: string, index: number, text: string) => {
    setConfig((prev) => {
      const updatedConfig = {
        ...prev,
        questions: prev.questions.map((q) => {
          if (q.id === questionId && q.followUpPrompts) {
            const newPrompts = [...q.followUpPrompts]
            newPrompts[index] = text
            return { ...q, followUpPrompts: newPrompts }
          }
          return q
        }),
      }
      return updatedConfig
    })
  }

  const removeFollowUpPrompt = (questionId: string, index: number) => {
    setConfig((prev) => {
      const updatedConfig = {
        ...prev,
        questions: prev.questions.map((q) => {
          if (q.id === questionId && q.followUpPrompts) {
            return { ...q, followUpPrompts: q.followUpPrompts.filter((_, i) => i !== index) }
          }
          return q
        }),
      }
      return updatedConfig
    })
  }

  const handleFocusAreaChange = (index: number, text: string) => {
    setConfig(prev => {
      const newFocusAreas = [...prev.focusAreas];
      newFocusAreas[index] = text;
      const updatedConfig = { ...prev, focusAreas: newFocusAreas };
      return updatedConfig;
    });
  };

  const addFocusArea = () => {
    setConfig(prev => {
      const updatedConfig = { ...prev, focusAreas: [...prev.focusAreas, ""] };
      return updatedConfig;
    });
  };

  const removeFocusArea = (index: number) => {
    setConfig(prev => {
      const updatedConfig = {
        ...prev,
        focusAreas: prev.focusAreas.filter((_, i) => i !== index)
      };
      return updatedConfig;
    });
  };

  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setConfig(prev => {
        const updatedConfig = { ...prev, timeLimit: value };
        return updatedConfig;
      });
    }
  };

  const handleConversationalStyleChange = (style: "formal" | "casual" | "friendly") => {
    setConfig(prev => {
      const updatedConfig = { ...prev, conversationalStyle: style };
      return updatedConfig;
    });
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // When directly editing the system prompt, just update it without processing
    setConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))
  }

  const resetSystemPrompt = () => {
    if (selectedJob) {
      // Reset with job-specific values already filled in
      const processedDefault = processPlaceholders(defaultSystemPrompt)

      setConfig((prev) => ({
        ...prev,
        systemPrompt: processedDefault,
      }))
    } else {
      // Just reset to the template with placeholders
      setConfig((prev) => ({
        ...prev,
        systemPrompt: defaultSystemPrompt,
      }))
    }
  }

  // Generate a preview of the full formatted system prompt
  const getFormattedSystemPrompt = (): string => {
    // Start with the base prompt
    let prompt = config.systemPrompt || defaultSystemPrompt

    // Do NOT replace variables here - keep them as {{variable}} format for the database
    // This will allow them to be dynamically replaced when the interview actually runs

    // Add introduction section if it's not already in the prompt
    if (config.introduction && !prompt.includes(`## Introduction`)) {
      prompt += `\n\n## Introduction\n"${config.introduction}"\n`
    }

    // Add specific questions section
    if (config.questions && config.questions.length > 0) {
      prompt += "\n\n## Specific Questions to Ask\n"

      // Sort questions by importance
      const priorityMap: Record<"high" | "medium" | "low", number> = {
        high: 1,
        medium: 2,
        low: 3,
      }

      const sortedQuestions = [...config.questions].sort(
        (a, b) => priorityMap[a.importance] - priorityMap[b.importance],
      )

      sortedQuestions.forEach((question, index) => {
        prompt += `${index + 1}. ${question.text} (${question.importance} priority)\n`

        // Add follow-up prompts if any
        if (question.followUpPrompts && question.followUpPrompts.length > 0) {
          prompt += "   Follow-up prompts if needed:\n"
          question.followUpPrompts.forEach((p) => {
            if (p.trim()) prompt += `   - ${p}\n`
          })
        }
        prompt += "\n"
      })
    }

    return prompt
  }

  // Preview-only function to show variables replaced in the UI without affecting saved data
  const getFormattedPreviewPrompt = (): string => {
    // Get the prompt without replacing variables
    const prompt = getFormattedSystemPrompt()

    // Only replace variables for display preview
    if (selectedJob) {
      return processPlaceholders(prompt)
    }

    return prompt
  }

  // Combined save and apply function
  const saveAndApplyConfiguration = async () => {
    if (!selectedJobId) {
      alert("Please select a job first")
      return
    }

    try {
      setLoading(true)

      // Generate the final formatted prompt
      const finalPrompt = getFormattedSystemPrompt()

      // Save both config and prompt in a single API call
      await saveConfigAndPromptMutation({
        jobId: selectedJobId,
        config: config,
        interviewPrompt: finalPrompt,
      })

      alert("Configuration saved and applied successfully!")
    } catch (error) {
      console.error("Error saving configuration:", error)
      alert("Failed to save configuration. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AIPageWrapper>
      <div className="min-h-screen ">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <AIContentBlock delay={0} blockType="header">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div className="flex items-center">
                <Link
                  href="/jobs"
                  className="mr-4 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm hover:shadow-md transition-all"
                >
                  <RiArrowLeftLine className="h-5 w-5 text-purple-600" />
                </Link>
                <h1 className="text-2xl font-semibold text-gray-800">AI Interviewer Settings</h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setIsKnowledgeBaseModalOpen(true)}
                  className="flex items-center gap-2 bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 shadow-sm"
                >
                  <RiBookOpenLine className="h-4 w-4" />
                  Knowledge Base
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => selectedJobId && (window.location.href = `/jobs/ai-interviewer/preview/${selectedJobId}`)}
                  disabled={!selectedJobId}
                  className="flex items-center gap-2 bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 shadow-sm disabled:opacity-50"
                >
                  <RiEyeLine className="h-4 w-4" />
                  Preview Interview
                </Button>
                <Button
                  onClick={saveAndApplyConfiguration}
                  disabled={!selectedJobId || loading}
                  className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 shadow-sm disabled:opacity-50"
                >
                  <RiSaveLine className="h-4 w-4" />
                  {loading ? "Saving..." : "Save & Apply"}
                </Button>
              </div>
            </div>
          </AIContentBlock>

          {/* Job Selection Card */}
          <AIContentBlock delay={1} blockType="card">
            <Card className="p-6 border-0 rounded-xl mb-6 shadow-md bg-white">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <RiMagicLine className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Select Job Position</h2>
              </div>

              <div className="mb-4">
                <select
                  id="job-select"
                  className="block w-full px-4 py-3 border border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white text-gray-700"
                  value={selectedJobId ? selectedJobId.toString() : ""}
                  onChange={handleJobChange}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238b5cf6'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 1rem center",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "3rem",
                  }}
                >
                  <option value="" disabled>
                    Select a job position
                  </option>
                  {jobs.map((job) => (
                    <option key={job._id.toString()} value={job._id.toString()}>
                      {job.title} - {job.company}
                    </option>
                  ))}
                </select>
              </div>

              {selectedJob && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <h3 className="font-medium text-purple-800 mb-2">Selected Job Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">Title</p>
                      <p className="font-medium text-gray-800">{selectedJob.title}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">Requirements</p>
                      <p className="font-medium text-gray-800">{selectedJob.requirements.length} requirements</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">Desirable Skills</p>
                      <p className="font-medium text-gray-800">{selectedJob.desirables.length} skills</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Interview Duration Section */}
              <div className="mt-4">
                <label htmlFor="interview-length" className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Duration (minutes)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    id="interview-length"
                    min="15"
                    max="120"
                    step="5"
                    className="block w-32 px-3 py-2 border border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
                    value={config.timeLimit}
                    onChange={handleTimeLimitChange}
                  />
                  <span className="text-sm text-gray-500">The AI will try to keep the interview within this time frame.</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Recommended: 30-45 minutes for technical roles, 15-30 minutes for other positions
                </p>
              </div>
            </Card>
          </AIContentBlock>

          {/* Tabs */}
          <AIContentBlock delay={2} blockType="header">
            <div className="flex border-b border-purple-200 mb-6">
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "prompt"
                    ? "text-purple-700 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-purple-600"
                }`}
                onClick={() => setActiveTab("prompt")}
              >
                System Prompt
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "questions"
                    ? "text-purple-700 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-purple-600"
                }`}
                onClick={() => setActiveTab("questions")}
              >
                Interview Questions
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "style"
                    ? "text-purple-700 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-purple-600"
                }`}
                onClick={() => setActiveTab("style")}
              >
                Interview Style
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "preview"
                    ? "text-purple-700 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-purple-600"
                }`}
                onClick={() => setActiveTab("preview")}
              >
                Preview
              </button>
            </div>
          </AIContentBlock>

          {/* Tab Content */}
          <div className="mb-6">
            {/* System Prompt Tab */}
            {activeTab === "prompt" && (
              <AIContentBlock delay={3} blockType="card">
                <Card className="p-6 border-0 rounded-xl shadow-md bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <RiMagicLine className="h-5 w-5 text-purple-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">System Prompt</h2>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="text-sm py-2 px-3 h-auto flex items-center gap-1 text-purple-700 hover:bg-purple-50"
                        onClick={() => {
                          const formattedPrompt = getFormattedPreviewPrompt()
                          navigator.clipboard.writeText(formattedPrompt)
                          alert("Full system prompt copied to clipboard!")
                        }}
                      >
                        <RiClipboardLine className="h-4 w-4" />
                        Copy Full Prompt
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-sm py-2 px-3 h-auto flex items-center gap-1 text-purple-700 hover:bg-purple-50"
                        onClick={resetSystemPrompt}
                      >
                        <RiRefreshLine className="h-4 w-4" />
                        Reset to Default
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div
                      className={cx(
                        "rounded-lg p-4 mb-4",
                        selectedJob ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200",
                      )}
                    >
                      <div className="flex items-start">
                        <RiInformationLine
                          className={cx("h-5 w-5 mr-2 mt-0.5", selectedJob ? "text-green-600" : "text-amber-600")}
                        />
                        <p className={cx("text-sm", selectedJob ? "text-green-800" : "text-amber-800")}>
                          {selectedJob
                            ? "Job details have been loaded. Placeholders will be automatically replaced when you save."
                            : "Select a job to automatically replace placeholders like {{jobTitle}}, {{requirements}}, etc. with job-specific data."}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Introduction Script</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-3 border border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
                        placeholder="How the AI should introduce itself to the candidate"
                        value={config.introduction}
                        onChange={handleIntroductionChange}
                      ></textarea>
                      <p className="mt-1 text-xs text-gray-500">
                        Make sure to introduce the AI, explain its role, and set expectations for the interview.
                      </p>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt Template</label>
                    <textarea
                      rows={15}
                      className="w-full px-4 py-3 border border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm text-gray-700"
                      value={config.systemPrompt}
                      onChange={handleSystemPromptChange}
                    ></textarea>

                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="flex items-center">
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-purple-700">
                            jobTitle
                          </code>
                          <span className="text-xs text-gray-600 ml-2">Position title</span>
                        </div>
                        <div className="flex items-center">
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-purple-700">
                            companyName
                          </code>
                          <span className="text-xs text-gray-600 ml-2">Company name</span>
                        </div>
                        <div className="flex items-center">
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-purple-700">
                            requirements
                          </code>
                          <span className="text-xs text-gray-600 ml-2">Required skills</span>
                        </div>
                        <div className="flex items-center">
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-purple-700">
                            responsibilities
                          </code>
                          <span className="text-xs text-gray-600 ml-2">Job responsibilities</span>
                        </div>
                        <div className="flex items-center">
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-purple-700">
                            desirables
                          </code>
                          <span className="text-xs text-gray-600 ml-2">Desired skills</span>
                        </div>
                        <div className="flex items-center">
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-purple-700">
                            candidateName
                          </code>
                          <span className="text-xs text-gray-600 ml-2">Candidate's name</span>
                        </div>
                        <div className="flex items-center">
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-purple-700">
                            cv
                          </code>
                          <span className="text-xs text-gray-600 ml-2">Resume content</span>
                        </div>
                        <div className="flex items-center">
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-purple-700">
                            knowledgeBase
                          </code>
                          <span className="text-xs text-gray-600 ml-2">Knowledge base</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </AIContentBlock>
            )}

            {/* Questions Tab */}
            {activeTab === "questions" && (
              <AIContentBlock delay={4} blockType="card">
                <Card className="p-6 border-0 rounded-xl shadow-md bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <RiQuestionLine className="h-5 w-5 text-purple-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">Interview Questions</h2>
                    </div>
                    <Button
                      className="flex items-center gap-1 bg-purple-600 text-white hover:bg-purple-700"
                      onClick={addQuestion}
                    >
                      <RiAddLine className="h-4 w-4" />
                      Add Question
                    </Button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-gray-600">Create questions for the AI to ask during the interview</div>
                      <div className="text-sm font-medium text-purple-700">
                        {config.questions.length} question{config.questions.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {config.questions.length === 0 ? (
                      <div className="border-2 border-dashed border-purple-200 rounded-lg p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
                          <RiQuestionLine className="h-8 w-8 text-purple-400" />
                        </div>
                        <p className="text-gray-600 mb-3">No interview questions added yet.</p>
                        <Button className="mx-auto bg-purple-600 text-white hover:bg-purple-700" onClick={addQuestion}>
                          <RiAddLine className="h-4 w-4 mr-2" />
                          Add Your First Question
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {config.questions.map((question, index) => (
                          <div
                            key={question.id}
                            className={cx(
                              "rounded-lg p-4 transition-all shadow-sm",
                              question.importance === "high"
                                ? "bg-gradient-to-r from-red-50 to-red-100 border border-red-200"
                                : question.importance === "medium"
                                  ? "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200"
                                  : "bg-gradient-to-r from-green-50 to-green-100 border border-green-200",
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-sm font-medium text-gray-700 border shadow-sm mr-3">
                                  {index + 1}
                                </div>
                                <h3 className="font-medium text-gray-800">Question {index + 1}</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  className={cx(
                                    "text-sm border rounded-lg px-3 py-1.5 shadow-sm",
                                    question.importance === "high"
                                      ? "border-red-300 text-red-700 bg-white"
                                      : question.importance === "medium"
                                        ? "border-amber-300 text-amber-700 bg-white"
                                        : "border-green-300 text-green-700 bg-white",
                                  )}
                                  value={question.importance}
                                  onChange={(e) =>
                                    handleQuestionImportanceChange(question.id, e.target.value as "high" | "medium" | "low")
                                  }
                                >
                                  <option value="high">High Priority</option>
                                  <option value="medium">Medium Priority</option>
                                  <option value="low">Low Priority</option>
                                </select>
                                <button
                                  type="button"
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-red-500 hover:text-red-700 border border-red-200 shadow-sm hover:shadow transition-all"
                                  onClick={() => removeQuestion(question.id)}
                                >
                                  <RiDeleteBinLine className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <textarea
                              rows={2}
                              className="w-full px-4 py-3 border border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3 bg-white text-gray-700"
                              placeholder="Enter interview question"
                              value={question.text}
                              onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                            ></textarea>

                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Follow-up prompts</span>
                                <Button
                                  variant="ghost"
                                  className="text-xs py-1 px-2 h-auto flex items-center gap-1 text-purple-700 hover:bg-purple-50"
                                  onClick={() => addFollowUpPrompt(question.id)}
                                >
                                  <RiAddLine className="h-3 w-3" />
                                  Add
                                </Button>
                              </div>

                              {question.followUpPrompts && question.followUpPrompts.length > 0 ? (
                                <div className="space-y-2">
                                  {question.followUpPrompts.map((prompt, promptIndex) => (
                                    <div key={promptIndex} className="flex items-center gap-2">
                                      <Input
                                        className="text-sm py-2 border-purple-200 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Enter follow-up prompt"
                                        value={prompt}
                                        onChange={(e) =>
                                          handleFollowUpPromptChange(question.id, promptIndex, e.target.value)
                                        }
                                      />
                                      <button
                                        type="button"
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-red-500 hover:text-red-700 border border-red-200 shadow-sm hover:shadow transition-all flex-shrink-0"
                                        onClick={() => removeFollowUpPrompt(question.id, promptIndex)}
                                      >
                                        <RiDeleteBinLine className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No follow-up prompts added</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </AIContentBlock>
            )}

            {/* Interview Style Tab */}
            {activeTab === "style" && (
              <AIContentBlock delay={5} blockType="card">
                <Card className="p-6 border-0 rounded-xl shadow-md bg-white">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Interview Style Settings</h2>
                  </div>

                  {/* Interview Style Selection */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Interview Style</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Formal Style */}
                      <div
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          config.conversationalStyle === "formal"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25"
                        }`}
                        onClick={() => handleConversationalStyleChange("formal")}
                      >
                        <div className="flex items-center justify-center mb-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            config.conversationalStyle === "formal" ? "bg-purple-100" : "bg-gray-100"
                          }`}>
                            <svg className={`h-6 w-6 ${
                              config.conversationalStyle === "formal" ? "text-purple-600" : "text-gray-600"
                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m0 0h2M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                          </div>
                        </div>
                        <h4 className={`text-center font-semibold mb-2 ${
                          config.conversationalStyle === "formal" ? "text-purple-700" : "text-gray-800"
                        }`}>
                          Formal
                        </h4>
                        <p className="text-sm text-gray-600 text-center">
                          Professional, structured, conversational
                        </p>
                      </div>

                      {/* Casual Style */}
                      <div
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          config.conversationalStyle === "casual"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25"
                        }`}
                        onClick={() => handleConversationalStyleChange("casual")}
                      >
                        <div className="flex items-center justify-center mb-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            config.conversationalStyle === "casual" ? "bg-purple-100" : "bg-gray-100"
                          }`}>
                            <svg className={`h-6 w-6 ${
                              config.conversationalStyle === "casual" ? "text-purple-600" : "text-gray-600"
                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                          </div>
                        </div>
                        <h4 className={`text-center font-semibold mb-2 ${
                          config.conversationalStyle === "casual" ? "text-purple-700" : "text-gray-800"
                        }`}>
                          Casual
                        </h4>
                        <p className="text-sm text-gray-600 text-center">
                          Relaxed, conversational
                        </p>
                      </div>

                      {/* Friendly Style */}
                      <div
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          config.conversationalStyle === "friendly"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25"
                        }`}
                        onClick={() => handleConversationalStyleChange("friendly")}
                      >
                        <div className="flex items-center justify-center mb-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            config.conversationalStyle === "friendly" ? "bg-purple-100" : "bg-gray-100"
                          }`}>
                            <svg className={`h-6 w-6 ${
                              config.conversationalStyle === "friendly" ? "text-purple-600" : "text-gray-600"
                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <h4 className={`text-center font-semibold mb-2 ${
                          config.conversationalStyle === "friendly" ? "text-purple-700" : "text-gray-800"
                        }`}>
                          Friendly
                        </h4>
                        <p className="text-sm text-gray-600 text-center">
                          Warm, encouraging
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Focus Areas</h3>
                      <Button
                        variant="ghost"
                        className="text-xs py-1 px-2 h-auto flex items-center gap-1 text-purple-700 hover:bg-purple-50"
                        onClick={addFocusArea}
                      >
                        <RiAddLine className="h-3 w-3" />
                        Add Area
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Add key areas the AI should focus on during the interview
                    </p>

                    {config.focusAreas.length === 0 ? (
                      <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-50 flex items-center justify-center">
                          <RiAddLine className="h-6 w-6 text-purple-400" />
                        </div>
                        <p className="text-gray-600 mb-3">No focus areas added yet.</p>
                        <Button className="mx-auto bg-purple-600 text-white hover:bg-purple-700" onClick={addFocusArea}>
                          <RiAddLine className="h-4 w-4 mr-2" />
                          Add Your First Focus Area
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {config.focusAreas.map((area, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <Input
                                className="border-purple-200 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter focus area (e.g., Technical Skills, Leadership, Problem Solving)"
                                value={area}
                                onChange={(e) => handleFocusAreaChange(index, e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-red-500 hover:text-red-700 border border-red-200 shadow-sm hover:shadow transition-all flex-shrink-0"
                              onClick={() => removeFocusArea(index)}
                            >
                              <RiDeleteBinLine className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Style Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">How this affects the interview:</h3>
                    <div className="text-sm text-gray-600">
                      {config.conversationalStyle === "formal" && (
                        <p>The AI will use professional language, maintain a structured conversation flow, and focus on detailed technical assessment.</p>
                      )}
                      {config.conversationalStyle === "casual" && (
                        <p>The AI will use relaxed language, create a conversational atmosphere, and ask questions in a more informal way.</p>
                      )}
                      {config.conversationalStyle === "friendly" && (
                        <p>The AI will use warm, encouraging language, help candidates feel comfortable, and create a supportive interview environment.</p>
                      )}
                    </div>
                  </div>
                </Card>
              </AIContentBlock>
            )}

            {/* Preview Tab */}
            {activeTab === "preview" && (
              <AIContentBlock delay={6} blockType="card">
                <Card className="p-6 border-0 rounded-xl shadow-md bg-white">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <RiEyeLine className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Final System Prompt Preview</h2>
                  </div>

                  {!selectedJob && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <RiInformationLine className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          Select a job to see the actual prompt with job-specific details.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 overflow-auto max-h-[600px] shadow-inner">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{getFormattedPreviewPrompt()}</pre>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      This is the complete system prompt that will be saved when you click "Save & Apply Configuration".
                    </p>
                    <Button
                      variant="ghost"
                      className="text-sm py-2 px-3 h-auto flex items-center gap-1 text-purple-700 hover:bg-purple-50"
                      onClick={() => {
                        const formattedPrompt = getFormattedPreviewPrompt()
                        navigator.clipboard.writeText(formattedPrompt)
                        alert("Full system prompt copied to clipboard!")
                      }}
                    >
                      <RiClipboardLine className="h-4 w-4" />
                      Copy to Clipboard
                    </Button>
                  </div>
                </Card>
              </AIContentBlock>
            )}
          </div>

          {/* Save Button (Fixed at Bottom)
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-purple-100 p-4 shadow-lg z-10">
            <div className="max-w-7xl mx-auto flex justify-end">
              <Button
                onClick={saveAndApplyConfiguration}
                disabled={!selectedJobId || loading}
                className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 shadow-sm disabled:opacity-50 px-6 py-2.5"
              >
                <RiSaveLine className="h-4 w-4" />
                {loading ? "Saving..." : "Save & Apply Configuration"}
              </Button>
            </div>
          </div> */}
        </div>

        {/* Knowledge Base Modal */}
        <KnowledgeBaseModal isOpen={isKnowledgeBaseModalOpen} onClose={() => setIsKnowledgeBaseModalOpen(false)} />
      </div>
    </AIPageWrapper>
  )
}
