"use client"

import React, { useEffect, useState, useRef, Suspense } from "react"
// Import LiveKit components instead of WebRTC
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  AgentState,
  useTracks,
  useTrackTranscription,
  useMultibandTrackVolume,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import { tools } from "@/lib/openai-realtime/tools"
import { BroadcastButton } from "@/components/openai-realtime/broadcast-button"
import { StatusDisplay } from "@/components/openai-realtime/status"
import { MessageControls } from "@/components/openai-realtime/message-controls"
import { TextInput } from "@/components/openai-realtime/text-input"
import { motion } from "framer-motion"
import { useToolsFunctions } from "@/hooks/openai-realtime/use-tools"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TokenUsageDisplay } from "@/components/openai-realtime/token-usage"
import { useTranslations } from "@/components/openai-realtime/translations-context"
import { useAuth } from "@/lib/auth"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useRouter, useSearchParams } from "next/navigation"
import { VideoCamera } from "@/components/VideoCamera"
import VoiceStatus from "@/components/openai-realtime/VoiceStatus"
import { KnowledgeBaseModal } from "@/components/KnowledgeBaseModal"
import { toast } from "react-hot-toast"
import StartIcon from "../../../../public/start.svg"
import RepIcon from "../../../../public/ReportIcon.svg"
import Dots from "../../../../public/dots.svg"
import Cam from "../../../../public/cam.svg"
import Mic from "../../../../public/mic.svg"
import Image from "next/image"
import { TranslationsProvider } from "@/components/openai-realtime/translations-context"

// Define message type for the transcript
interface Message {
  sender: "user" | "ai"
  text: string
  timestamp: Date
  interim?: boolean
}

// Interface for LiveKit connection details
interface ConnectionDetails {
  participantName: string
  participantIdentity: string
  participantToken: string
  serverUrl: string
  roomName: string
}

// Add MicrophoneIcon and MicrophoneOffIcon components
const MicrophoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="22"></line>
  </svg>
)

const MicrophoneOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="1" y1="1" x2="23" y2="23"></line>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"></path>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
    <line x1="12" y1="19" x2="12" y2="22"></line>
  </svg>
)

// Copy of the exact prepareDynamicVariables function from meeting page
const prepareDynamicVariables = (
  jobData: any,
  candidateData: any,
  knowledgeBase: any,
): Record<string, string> => {
  // Debug information for knowledge base
  console.log("prepareDynamicVariables received knowledgeBase:", knowledgeBase)
  console.log("knowledgeBase content:", knowledgeBase?.content)

  // Hardcoded consultant job prompt with McKinsey-style case interview
  const consultantJobPrompt = `You are a professional AI voice interviewer for Smarter.ai, tasked with assessing candidates for the {{jobTitle}} position.

Simulate an authentic McKinsey-style case interview for an MBA consultant position. Adopt the role of a senior interviewer conducting a case. Only respond from the interviewer's perspective - never generate candidate responses or speak as the candidate.

YOU WILL ENSURE THAT YOU END THE INTERVIEW AFTER 15MINS. YOU WILL MAKE YOUR QUESTIONS BRIEF, AND EXPECT BRIEF RESPONSES.

Structure the interview as follows:
1) Brief welcome and outline of the interview format (1 minute)
2) Present a realistic business problem with specific context, challenges, and goals (2 minutes)
3) Allow time for clarifying questions - respond naturally to my queries
4) Framework evaluation - assess the structure and comprehensiveness of my approach 
5) Quantitative analysis - include at least one market sizing question and one data-based problem with specific numbers
6) Provide additional information only when I ask relevant questions
7) Guide me if I'm going off-track with subtle hints (e.g., "That's interesting, but how might we prioritize the most impactful factors?")
8) If I struggle repeatedly (3+ times) on a section, say "Let's move on to the next area" and introduce a new element
9) After case conclusion, ask me to summarize my recommendation in 60 seconds
10) Transition to 2-3 personal experience questions focused on leadership, teamwork, and problem-solving
11) Allow time for my questions about the role/firm
12) End with a warm, professional closing

Case parameters:
•⁠  ⁠Select a challenging but reasonable business scenario (retail, technology, financial services, healthcare, etc.)
•⁠  ⁠Include specific metrics, market conditions, and competitive factors
•⁠  ⁠Incorporate unexpected insights or data that should change my approach mid-case
•⁠  ⁠Present at least one quantitative calculation requiring multi-step analysis
•⁠  ⁠Ensure the case presents multiple viable strategies with tradeoffs to evaluate

Maintain a professional but conversational tone throughout. Provide substantive feedback on my approach but never reveal full solutions. Act as though we're having a real-time interview with appropriate pacing.


Begin each interview with a brief introduction about Smarter.ai and the {{jobTitle}} position. Greet the candidate by name: "{{candidateName}}". Then guide the conversation through technical assessment areas including {{requirements}}.

For this role, candidates need to demonstrate the following responsibilities: {{responsibilities}}

Additionally, we value candidates who have: {{desirables}}

About the candidate:
Name: {{candidateName}}
{{cv}}

Assess candidates on their understanding of technical philosophy, not just tools. Listen for indicators of collaboration skills, continuous improvement mindset, and relevant experience. Probe for specific examples from past experience, particularly regarding implementation, scaling, and problem resolution.

Adapt questioning based on candidate responses, following up on vague answers to obtain specific details. Recognize and acknowledge strong technical responses without revealing evaluation criteria. When candidates struggle with a question, provide appropriate context to keep the conversation flowing rather than creating awkwardness.

Throughout the interview, evaluate communication skills and ability to explain complex technical concepts clearly. The ideal candidate demonstrates both technical proficiency and the ability to collaborate effectively with cross-functional teams.

End each interview by asking if the candidate has questions about the role or company. Provide clear information about next steps in the hiring process.
{{knowledgeBase}}`;

  // Create knowledge base content with appropriate fallback
  const knowledgeBaseContent = knowledgeBase?.content || "No company knowledge base available";
  console.log(
    "Using knowledge base content:",
    knowledgeBaseContent.substring(0, 50) + "...",
  );

  return {
    system_prompt: consultantJobPrompt,
    knowledgeBase: knowledgeBaseContent,
  };
};

// SimpleVoiceAssistant Component for LiveKit integration
function SimpleVoiceAssistant(props: {
  onStateChange: (state: AgentState) => void
  onSpeakingChange: (isSpeaking: boolean) => void
  locale: string
  jobData?: any
  candidateData?: any
}) {
  const { state, audioTrack } = useVoiceAssistant()

  // Get volume data for speaking detection
  const volumes = useMultibandTrackVolume(audioTrack, { bands: 1 })

  // Forward the agent state to parent components
  useEffect(() => {
    props.onStateChange(state)
    // AI is speaking when state is "speaking" - also helps with visualization
    props.onSpeakingChange(state === "speaking")
  }, [props, state])


  // Additional speaking detection based on volume
  useEffect(() => {
    if (volumes && volumes.length > 0) {
      // Higher threshold to determine if AI is actually speaking
      const speakingThreshold = 0.07

      if (volumes[0] > speakingThreshold) {
        props.onSpeakingChange(true)
      } else if (state !== "speaking") {
        // Only set to false if state isn't explicitly speaking
        props.onSpeakingChange(false)
      }
    }
  }, [volumes, props, state])

  // Attempt to send system prompt to the agent if it exists in window object
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).systemPromptForAIMeeting
    ) {
      try {
        console.log("System prompt available for LiveKit agent")
        // Note: In LiveKit the agent typically manages its own system prompt through the connection details
      } catch (error) {
        console.error("Error with agent system prompt:", error)
      }
    }
  }, [state, props.jobData, props.candidateData])

  return null // No visual component needed
}

// TranscriptionCollector Component to handle transcriptions
function TranscriptionCollector({
  userIdentity,
  onMessagesUpdate,
  silenceDurationMs = 2500,
  prefixPaddingMs = 800,
  isMuted = false,
}: {
  userIdentity: string
  onMessagesUpdate: (messages: Message[]) => void
  silenceDurationMs?: number
  prefixPaddingMs?: number
  isMuted?: boolean
}) {
  // Store the latest complete messages for proper ordering
  const [processedMessages, setProcessedMessages] = useState<Message[]>([])

  // Keep track of interim messages to avoid flickering
  const interimMessagesRef = useRef<Map<string, Message>>(new Map())

  // Get user microphone track
  const userTracks = useTracks([
    { source: Track.Source.Microphone, withPlaceholder: false },
  ])
  const micTrackRef = userTracks.find(
    (trackRef) =>
      trackRef.publication.kind === Track.Kind.Audio &&
      trackRef.source === Track.Source.Microphone,
  )

  // Get agent audio track
  const { audioTrack: agentAudioTrack, state: agentState } = useVoiceAssistant()

  // Get transcriptions
  const { segments: userSegmentsRaw } = useTrackTranscription(micTrackRef)
  const { segments: agentSegmentsRaw } = useTrackTranscription(agentAudioTrack)

  // Process and update messages with improved handling of interim transcripts
  useEffect(() => {
    if (!userSegmentsRaw && !agentSegmentsRaw) return

    // Update interim messages
    const currentInterimMessages = new Map(interimMessagesRef.current)

    // Process user segments (only if not muted)
    
      ;(userSegmentsRaw || []).forEach((segment) => {
        const messageId = segment.id
        const isInterim = !segment.isFinal

        // Create or update message
        const message: Message = {
          sender: "user",
          text: segment.text || "",
          timestamp: new Date(segment.startTime || Date.now()),
          interim: isInterim,
        }

        if (isInterim) {
          // Store interim message
          currentInterimMessages.set(messageId, message)
        } else {
          // Remove from interim if it's now final
          currentInterimMessages.delete(messageId)

          // Add to processed messages if it's final
          setProcessedMessages((prev) => {
            // Check if this message already exists (avoid duplicates)
            const existingIndex = prev.findIndex(
              (m) =>
                m.sender === "user" &&
                m.timestamp.getTime() === message.timestamp.getTime() &&
                !m.interim,
            )

            if (existingIndex >= 0) {
              // Update existing message
              const updated = [...prev]
              updated[existingIndex] = message
              return updated
            } else {
              // Add new message
              return [...prev, message]
            }
          })
        }
      })
    

    // Process agent segments - similar logic
    ;(agentSegmentsRaw || []).forEach((segment) => {
      const messageId = segment.id
      const isInterim = !segment.isFinal

      const message: Message = {
        sender: "ai",
        text: segment.text || "",
        timestamp: new Date(segment.startTime || Date.now()),
        interim: isInterim,
      }

      if (isInterim) {
        currentInterimMessages.set(messageId, message)
      } else {
        currentInterimMessages.delete(messageId)

        setProcessedMessages((prev) => {
          const existingIndex = prev.findIndex(
            (m) =>
              m.sender === "ai" &&
              m.timestamp.getTime() === message.timestamp.getTime() &&
              !m.interim,
          )

          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = message
            return updated
          } else {
            return [...prev, message]
          }
        })
      }
    })

    // Update the ref
    interimMessagesRef.current = currentInterimMessages

    // Combine processed and interim messages for display
    const allMessages = [
      ...processedMessages,
      ...Array.from(currentInterimMessages.values()),
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Update parent component
    onMessagesUpdate(allMessages)
  }, [userSegmentsRaw, agentSegmentsRaw, onMessagesUpdate, processedMessages, isMuted])

  // Reset messages when agent disconnects to prepare for a new session
  useEffect(() => {
    if (agentState === "disconnected") {
      setProcessedMessages([])
      interimMessagesRef.current.clear()
    }
  }, [agentState])

  return null // No visual output
}

// Extracted main content into a separate component
const AiMeetingContent: React.FC<{ meetingId: string }> = ({ meetingId }) => {
  const router = useRouter()

  // Add a ref to hold the AI audio element
  const aiAudioElementRef = useRef<HTMLAudioElement | null>(null)

  // Handle missing meeting ID gracefully with a soft redirect
  useEffect(() => {
    if (!meetingId) {
      console.log("No meeting ID provided, redirecting to meeting page")
      // Use a small timeout to prevent immediate redirect flashing
      const redirectTimer = setTimeout(() => {
        router.replace("/meeting")
      }, 100)

      return () => clearTimeout(redirectTimer)
    }
  }, [meetingId, router])

  // State for LiveKit connection
  const [connectionDetails, setConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined)
  const [agentState, setAgentState] = useState<AgentState>("disconnected")

  // Set default voice to "ash"
  const voice = "ash"
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [currentMessage, setCurrentMessage] = useState("")
  const { t, locale, setLocale } = useTranslations()

  // State for tracking if AI is speaking
  const [isAISpeaking, setIsAISpeaking] = useState(false)

  // State for tracking status
  const [status, setStatus] = useState("")

  // Get user information from auth context
  const { user } = useAuth()

  // State for muting
  const [isMuted, setIsMuted] = useState(false)

  // Add state for camera
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  // Toggle camera state
  const toggleCamera = () => {
    setIsCameraEnabled(prev => {
      const newState = !prev;
      toast.success(`Camera ${newState ? 'turned on' : 'turned off'}`, {
        duration: 2000,
        position: 'bottom-center',
      });
      return newState;
    });
  };

  // Toggle microphone mute state
  const toggleMute = () => {
    setIsMuted(prev => {
      const newState = !prev;
      if (newState) {
        toast.success(`Microphone muted - AI will not hear you`, {
          duration: 3000,
          position: 'bottom-center',
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #ef4444',
          },
        });
      } else {
        toast.success(`Microphone unmuted - AI can hear you now`, {
          duration: 2000,
          position: 'bottom-center',
        });
      }
      return newState;
    });
  };

  // Track the current volume
  const [currentVolume, setCurrentVolume] = useState(0)

  // Get all candidates for the current user
  const userCandidates = useQuery(
    api.candidates.getCandidatesByUserId,
    user ? { userId: user._id } : "skip",
  )

  // Get the first candidate for the current user
  const currentUserCandidate =
    userCandidates && userCandidates.length > 0 ? userCandidates[0] : null

  // Add debug logging for candidate selection
  useEffect(() => {
    console.log("DEBUG: Candidate Selection", {
      meetingId,
      totalCandidates: userCandidates?.length || 0,
      allCandidates: userCandidates,
      selectedCandidate: currentUserCandidate,
    })
  }, [userCandidates, currentUserCandidate, meetingId])

  // Use candidate's meetingCode instead of URL parameter to fetch job
  const candidateMeetingCode = currentUserCandidate?.meetingCode
  console.log("Using candidate's meeting code:", candidateMeetingCode)

  // Fetch job details based on candidate's meetingCode - not from URL parameter
  const jobData = useQuery(
    api.jobs.getJobByMeetingCode,
    candidateMeetingCode ? { meetingCode: candidateMeetingCode } : "skip",
  )

  // Add debug logging for meetingId and jobData
  useEffect(() => {
    console.log("DEBUGGING AI-MEETING:")
    console.log("Current meetingId:", meetingId, "Length:", meetingId?.length)
    if (meetingId) {
      console.log("First 5 chars:", meetingId.substring(0, 5))
      console.log("Last 5 chars:", meetingId.substring(meetingId.length - 5))
      console.log(
        "Trimmed meetingId:",
        meetingId.trim(),
        "Length:",
        meetingId.trim().length,
      )
    }
    console.log(
      "jobData state:",
      jobData === undefined
        ? "loading"
        : jobData === null
          ? "not found"
          : "found",
    )
    if (jobData) {
      console.log("Job found:", jobData)
      console.log("Job title:", jobData.title)
      console.log("Job company:", jobData.company)
    } else if (jobData === null) {
      console.log(
        "Job with meetingCode",
        meetingId,
        "was not found in database",
      )
    }
  }, [meetingId, jobData])

  // Fallback: Try to find a candidate who applied to this job
  const jobApplications = useQuery(
    api.jobProgress.getJobApplications,
    jobData?._id ? { jobId: jobData._id } : "skip",
  )

  // Get the first candidate from job applications if available
  const candidateFromJobApplication =
    jobApplications && jobApplications.length > 0
      ? {
          _id: jobApplications[0].candidateId,
          name: jobApplications[0].candidateName,
        }
      : null

  // Use the current user's candidate if available, otherwise fall back to job application
  const candidateData = currentUserCandidate || candidateFromJobApplication

  // Add logic to fetch candidate CV information
  const candidateResume = useQuery(
    api.files.getResumeByCandidateId,
    candidateData?._id
      ? { candidateId: candidateData._id as Id<"candidates"> }
      : "skip",
  )

  // State to store CV information
  const [cvInfo, setCvInfo] = useState<{
    fileName?: string
    url?: string
    summary?: string
  }>({})

  // Update CV info when data is available
  useEffect(() => {
    if (candidateResume) {
      setCvInfo({
        fileName: candidateResume.fileName,
        url: candidateResume.url,
        summary: candidateResume.cvSummary,
      })
    }
  }, [candidateResume])

  // Add state for tracking conversation messages for backend saving
  const [messages, setMessages] = useState<Message[]>([])

  // Add auto-scrolling effect for the transcript (moved here after messages state declaration)
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      // Scroll to the bottom whenever messages are updated
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Add mutations for interview session management
  const saveInterview = useMutation(api.interview_sessions.saveInterview)

  // Add state to track if interview has been saved
  const [interviewSaved, setInterviewSaved] = useState(false)
  const [isSavingInterview, setIsSavingInterview] = useState(false)

  // Add state for storing formatted job description
  const [jobDescription, setJobDescription] = useState<string>("")

  // Add state for knowledge base modal
  const [isKnowledgeBaseModalOpen, setIsKnowledgeBaseModalOpen] =
    useState(false)

  // Add state for settings modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  // Fetch knowledge base data
  const knowledgeBase = useQuery(api.knowledgeBase.getDefaultKnowledgeBase)

  // Log knowledge base content when it changes
  useEffect(() => {
    console.log("Knowledge Base Content:", knowledgeBase)
    if (knowledgeBase) {
      console.log("Knowledge Base ID:", knowledgeBase._id)
      console.log("Knowledge Base Name:", knowledgeBase.name)
      console.log(
        "Knowledge Base Content:",
        knowledgeBase.content?.substring(0, 200) + "...",
      )
      console.log("Knowledge Base Last Updated:", knowledgeBase.lastUpdated)
    } else {
      console.log("Knowledge Base is null or undefined")
    }
  }, [knowledgeBase])

  // Prepare job description for ElevenLabs (just like in meeting page)
  useEffect(() => {
    if (jobData) {
      let description = ""
      description += `Job Title: ${jobData.title}\n`
      description += `Company: ${jobData.company}\n\n`
      description += `Job Description:\n${jobData.description.intro}\n\n`
      description += `Details:\n${jobData.description.details}\n\n`
      description += `Responsibilities:\n${jobData.description.responsibilities}\n\n`

      description += "Requirements:\n"
      jobData.requirements.forEach((req, index) => {
        description += `${index + 1}. ${req}\n`
      })

      description += "\nDesired Skills:\n"
      jobData.desirables.forEach((skill, index) => {
        description += `${index + 1}. ${skill}\n`
      })

      setJobDescription(description)
    }
  }, [jobData])

  // Set English as default
  useEffect(() => {
    setLocale("en")
  }, [setLocale])

  // Define isSessionActive based on agentState
  const isSessionActive = agentState !== "disconnected"

  // Tool functions implementation
  const toolsFunctions = useToolsFunctions()

  // Add state for model selection
  const [selectedModel, setSelectedModel] = useState<string>("openai-realtime")

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value

    // Parse the locale and model from the selected value (format: 'locale:model')

    setSelectedModel(value)

    // Restart session if active to apply new language/model
    if (isSessionActive) {
      // First stop the session
      handleStartStopClick()

      // Then set a timeout before starting a new session to ensure resources are properly cleaned up
      setTimeout(() => {
        handleStartStopClick()
      }, 2000)
    }
  }

  // Function to handle media device failure
  const onDeviceFailure = (error?: any) => {
    console.error(error)
    setStatus("Error: Could not access microphone")
    alert(
      "Error accessing camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab",
    )
  }

  // Add state for storing the video ID
  const [videoId, setVideoId] = useState<string>("")

  // Add state for connecting
  const [isConnecting, setIsConnecting] = useState(false)
  const hasFirstMessageRef = useRef(false)

  // Add effect to watch for first message
  useEffect(() => {
    if (messages.length > 0 && isConnecting && !hasFirstMessageRef.current) {
      hasFirstMessageRef.current = true
      setIsConnecting(false)
    }
  }, [messages, isConnecting])

  // Reset hasFirstMessage when session ends
  useEffect(() => {
    if (!isSessionActive) {
      hasFirstMessageRef.current = false
    }
  }, [isSessionActive])

  // Modified start/stop handler to include dynamic variables and auto-save
  const handleStartStopClick = async () => {
    if (isSessionActive) {
      // If we're stopping and have messages to save, save the interview first
      if (messages.length > 0 && !interviewSaved) {
        try {
          console.log("Auto-saving interview before ending session...")
          setIsSavingInterview(true)

          if (candidateData && jobData) {
            await saveInterview({
              candidateId: candidateData._id as Id<"candidates">,
              jobId: jobData._id,
              transcript: messages.map((msg) => ({
                sender: msg.sender,
                text: msg.text,
                timestamp: msg.timestamp.toISOString(),
              })),
              interviewType: "ai-voice",
              video_id: videoId,
            })
            setInterviewSaved(true)
            console.log(
              "Interview auto-saved successfully with video_id:",
              videoId,
            )
          }
        } catch (error) {
          console.error("Failed to auto-save interview:", error)
        } finally {
          setIsSavingInterview(false)
        }
      }

      // Disconnect from LiveKit
      setConnectionDetails(undefined)
      setAgentState("disconnected")
      setStatus("")
      hasFirstMessageRef.current = false
    } else {
      try {
        setIsConnecting(true)
        
        // For demo mode, we'll use fake data regardless of the real data state
        console.log("DEMO MODE: Using fake data for AI interviewer demo")

        // Prepare dynamic variables using the helper function
        // This will now use demo data if real data isn't available
        const dynamicVariables = prepareDynamicVariables(
          jobData,
          candidateData,
          knowledgeBase,
        )

        if (
          !dynamicVariables.system_prompt ||
          dynamicVariables.system_prompt.trim() === ""
        ) {
          const errorMsg =
            "No system prompt available from job data. Cannot start interview."
          console.error(errorMsg)
          alert(errorMsg)
          setIsConnecting(false)
          hasFirstMessageRef.current = false
          return
        }

        // Demo data for template replacement
        const demoData = {
          jobTitle: "Consultant",
          companyName: "Your Company",
          responsibilities: "As a Consultant, you will be responsible for working with our clients to identify problems, analyze various strategies, and provide solutions to ensure the company's growth and success. You will collaborate with team members to deliver comprehensive consulting services, ranging from strategic planning to operational efficiency improvements.",
          candidateName: candidateData?.name || "Andreessen Horowitz",
          requirements: "The ideal candidate will have a Bachelor's degree in Business, Management, or a related field. Required skills include excellent analytical thinking, strong communication skills, and the ability to work well under pressure. A minimum of 3 years of experience in consulting or a related industry is preferred.",
          desirables: "Strategic thinking, problem-solving ability, excellent communication skills, and industry knowledge",
          combinedCvContent: candidateResume?.cvSummary || "Experienced professional with strong analytical and problem-solving skills"
        }

        // Apply variable replacements to the system prompt
        let systemPrompt = dynamicVariables.system_prompt

        // Replace only the variables we need for the consultant prompt
        systemPrompt = systemPrompt.replace(/\{\{jobTitle\}\}/g, demoData.jobTitle)
        systemPrompt = systemPrompt.replace(/\{\{candidateName\}\}/g, demoData.candidateName)
        systemPrompt = systemPrompt.replace(/\{\{requirements\}\}/g, demoData.requirements)
        systemPrompt = systemPrompt.replace(/\{\{responsibilities\}\}/g, demoData.responsibilities)
        systemPrompt = systemPrompt.replace(/\{\{desirables\}\}/g, demoData.desirables)
        systemPrompt = systemPrompt.replace(/\{\{cv\}\}/g, demoData.combinedCvContent)
        systemPrompt = systemPrompt.replace(/\{\{knowledgeBase\}\}/g, dynamicVariables.knowledgeBase)

        console.log("After variable replacement:", systemPrompt)

        // Set the system prompt on the window object so LiveKit can access it
        if (typeof window !== "undefined") {
          // Set our job-specific prompt on the window object
          ;(window as any).systemPromptForAIMeeting = systemPrompt

          // IMPORTANT: Disable the languagePrompt from translations to prevent override
          ;(window as any).languagePrompt = undefined
        }

        // Reset interview saved state for new session
        setInterviewSaved(false)

        // Connect to LiveKit with the system prompt
        setStatus("Connecting to LiveKit...")
        await fetchConnectionDetails(systemPrompt)
      } catch (error) {
        const errorMsg = `Error preparing for session start: ${error instanceof Error ? error.message : String(error)}`
        console.error(errorMsg)
        alert(errorMsg)
        setIsConnecting(false)
        hasFirstMessageRef.current = false
      }
    }
  }

  // Add LiveKit connection handling
  const fetchConnectionDetails = async (systemPrompt: string) => {
    try {
      const url = new URL(
        "/api/livekit/connection-details",
        window.location.origin,
      )
      const video_id = `video-${Math.floor(Math.random() * 1000000)}`

      // Prepare context data to send to the server
      const contextData: any = {
        systemPrompt,
        language: locale,
        model: selectedModel, // Pass the selected model to the API
        recordingEnabled: false, // Enable auto-recording
        recordingDestination: "s3", // Prefer S3 storage if credentials exist
        recordingFormat: "mp4", // Use MP4 format
        video_id: video_id,
        isDemo: true, // Flag to indicate this is a demo request
        isYCPage: true, // Explicitly flag this as coming from the YC page
      }

      // Store video_id in state so we can use it when saving the interview
      // @ts-ignore - Add this line to store video_id for later use
      setVideoId(video_id)

      // Add job information if available
      if (jobData) {
        contextData.jobTitle = jobData.title
        contextData.jobCompany = jobData.company || "Smarter.ai"
      }

      // Add candidate information if available
      if (candidateData) {
        contextData.candidateName = candidateData.name || "Demo User"
      }

      console.log(
        "Sending connection request with auto-recording enabled:",
        contextData,
      )

      // Send the context data to the server
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": window.location.href, // Explicitly include the referer
          "X-From-YC-Page": "true", // Add a custom header to help with identification
        },
        body: JSON.stringify(contextData),
        credentials: "include", // Include cookies in the request
      })

      // Log the response status and headers for debugging
      console.log("LiveKit API Response status:", response.status);
      console.log("LiveKit API Response headers:", [...response.headers.entries()]);

      // If response is not JSON, log the text instead
      if (!response.ok) {
        const text = await response.text();
        console.error("Error response from LiveKit API:", text);
        throw new Error(`Error fetching connection details: ${response.status} - ${text.substring(0, 100)}...`);
      }

      const connectionDetailsData = await response.json()
      setConnectionDetails(connectionDetailsData)
      setStatus(`Connected to LiveKit (${selectedModel}) - Recording enabled`)
    } catch (error) {
      console.error("Error fetching connection details:", error)
      setStatus(
        `Error connecting to LiveKit server: ${error instanceof Error ? error.message : String(error)}`,
      )
      
      // Show a more user-friendly error message
      toast.error("Unable to connect to the interview service. This is a demo so some features may be limited.", {
        duration: 5000,
        position: "bottom-center",
      })
      
      setIsConnecting(false)
      hasFirstMessageRef.current = false
    }
  }

  const [isBugModalOpen, setIsBugModalOpen] = useState(false)
  const [bugDescription, setBugDescription] = useState("")

  const handleRaiseBug = () => {
    setIsBugModalOpen(true)
  }

  // Update the interview query near the top of the file where other queries are defined
  const currentInterview = useQuery(
    api.interview_sessions.getInterviewByMeetingCode,
    meetingId ? { meetingCode: meetingId } : "skip",
  )

  // Add a useEffect to log interview data for debugging
  useEffect(() => {
    console.log("Current interview data:", currentInterview)
  }, [currentInterview])

  // Add debug logging in handleBugSubmit
  const handleBugSubmit = async () => {
    if (!bugDescription) {
      toast.error("Please enter a bug description")
      return
    }

    if (!currentUserCandidate?._id) {
      toast.error("No candidate found")
      return
    }

    try {
      await flagError({
        candidateId: currentUserCandidate._id,
        description: bugDescription,
      })

      toast.success("Bug reported successfully")
      toast.error(`Bug encountered: ${bugDescription}`, {
        position: "bottom-center",
        duration: 5000,
        style: {
          background: "#fee2e2",
          color: "#dc2626",
          border: "1px solid #dc2626",
        },
      })

      setBugDescription("")
      setIsBugModalOpen(false)
    } catch (error) {
      console.error("Error submitting bug:", error)
      toast.error("Failed to submit bug report")
    }
  }

  // Add mutation
  const flagError = useMutation(api.interview_sessions.flagInterviewError)

  // Update BugList component to work with candidate bugs
  const BugList = ({
    bugs,
  }: {
    bugs?: Array<{
      description: string
      timestamp: string
      status: string
      resolution?: string
      resolvedAt?: string
    }>
  }) => {
    if (!bugs || bugs.length === 0) return null

    return (
      <div className="mt-4 rounded-lg bg-gray-50 p-4">
        <h3 className="mb-3 text-lg font-semibold">Reported Issues</h3>
        <div className="space-y-2">
          {bugs.map((bug, index) => (
            <div
              key={index}
              className="rounded border border-gray-200 bg-white p-3"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-700">{bug.description}</p>
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    bug.status === "open"
                      ? "bg-red-100 text-red-800"
                      : bug.status === "resolved"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {bug.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(bug.timestamp).toLocaleString()}
              </p>
              {bug.resolution && (
                <p className="mt-1 text-xs italic text-gray-600">
                  Resolution: {bug.resolution}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Add useEffect to show bug toast
  useEffect(() => {
    if (currentUserCandidate?.bugs && currentUserCandidate.bugs.length > 0) {
      // Get the most recent bug
      const latestBug =
        currentUserCandidate.bugs[currentUserCandidate.bugs.length - 1]

      // Show the bug in a persistent toast
      toast.error(`Latest Bug Report: ${latestBug.description}`, {
        duration: Infinity, // Make the toast persistent
        position: "bottom-center",
        style: {
          background: "#fee2e2", // Light red background
          color: "#991b1b", // Dark red text
          border: "1px solid #ef4444", // Red border
          padding: "16px",
          marginBottom: "16px",
          width: "100%",
          maxWidth: "600px",
          textAlign: "center",
        },
      })
    }
  }, [currentUserCandidate?.bugs])

  // Add loading state for job data
  // For demo, we'll proceed even if real data isn't available
  // Removed the condition that causes infinite loading
  return (
    <div className="flex h-full w-full justify-center pt-6">
      {/*     <h1 className="text-3xl font-bold mb-4 text-center">AI Interview: {jobData?.title || 'Loading...'}</h1> */}

      <div className="grid w-full grid-cols-1 md:grid-cols-12 gap-6 px-4 max-w-[1400px]">
        {/* Middle panel - Camera with LiveKit integration */}
        <div className="flex h-[740px] flex-col md:col-span-9 md:col-start-1 order-1">
          <div className="flex h-full flex-grow flex-col">
            <div className="relative flex-grow overflow-hidden rounded-lg border-4 border-blue-300">
              {/* LiveKit Room wrapper */}
              {connectionDetails ? (
                <LiveKitRoom
                  token={connectionDetails.participantToken}
                  serverUrl={connectionDetails.serverUrl}
                  connect={true}
                  audio={!isMuted}
                  video={isCameraEnabled}
                  onMediaDeviceFailure={onDeviceFailure}
                  onDisconnected={() => {
                    setConnectionDetails(undefined)
                    setAgentState("disconnected")
                    setStatus("")
                  }}
                  // Enhanced audio settings
                  options={{
                    audioCaptureDefaults: {
                      echoCancellation: true,
                      noiseSuppression: true,
                      autoGainControl: true,
                    },
                    rtcConfig: {
                      sdpSemantics: "unified-plan",
                      bundlePolicy: "max-bundle",
                      iceTransportPolicy: "all",
                    },
                    adaptiveStream: {
                      pixelDensity: "screen",
                    },
                    dynacast: true,
                    codecPreferences: {
                      audio: ["opus"],
                    },
                  }}
                  data-lk-theme="default"
                  data-lk-audio-mode="voice"
                  className="h-full w-full"
                >
                  {/* VideoCamera component maintains same UI */}
                  <VideoCamera
                    isActive={isSessionActive}
                    className="h-full w-full"
                    recordingEnabled={true}
                    meetingId={meetingId}
                    candidateId={candidateData?._id}
                    aiAudioElement={aiAudioElementRef.current}
                    isCameraEnabled={isCameraEnabled}
                    isAISpeaking={isAISpeaking}
                    isMuted={isMuted}
                    toggleMute={toggleMute}
                    toggleCamera={toggleCamera}
                    openSettings={() => setIsSettingsModalOpen(true)}
                    micIcon={Mic}
                    camIcon={Cam}
                    settingsIcon={Dots}
                  />

                  {/* Voice Assistant integration */}
                  <SimpleVoiceAssistant
                    onStateChange={setAgentState}
                    onSpeakingChange={setIsAISpeaking}
                    locale={locale}
                    jobData={jobData}
                    candidateData={candidateData}
                  />

                  {/* Hidden audio renderer for LiveKit audio */}
                  <div style={{ display: "none" }}>
                    <RoomAudioRenderer />
                  </div>

                  {/* Hidden transcription component that updates the messages state */}
                  <TranscriptionCollector
                    userIdentity={connectionDetails.participantIdentity}
                    onMessagesUpdate={setMessages}
                    silenceDurationMs={2500}
                    prefixPaddingMs={800}
                    isMuted={isMuted}
                  />
                </LiveKitRoom>
              ) : (
                <VideoCamera
                  isActive={false}
                  className="h-full w-full"
                  meetingId={meetingId}
                  candidateId={candidateData?._id}
                  isCameraEnabled={isCameraEnabled}
                  isAISpeaking={isAISpeaking}
                  isMuted={isMuted}
                  toggleMute={toggleMute}
                  toggleCamera={toggleCamera}
                  openSettings={() => setIsSettingsModalOpen(true)}
                  micIcon={Mic}
                  camIcon={Cam}
                  settingsIcon={Dots}
                />
              )}
            </div>

            <div className="flex items-center justify-center mt-2 px-4">
              <VoiceStatus
                currentVolume={currentVolume}
                isSessionActive={isSessionActive}
                handleStartStopClick={handleStartStopClick}
                isAISpeaking={isAISpeaking}
                isConnecting={isConnecting}
              />
              
              <button 
                onClick={handleRaiseBug}
                className="flex items-center gap-2 border py-5 px-5 ml-2 bg-custom-gradientt rounded-md hover:opacity-90 transition-opacity">
                <Image src={RepIcon} alt="report" width={20} height={20} />
                report issues
              </button>
            </div>
          </div>
        </div>

        {/* Right panel - Conversation transcript */}
        <Card className="flex h-[720px] flex-col md:col-span-3 order-2">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-center text-xl font-semibold">
              Live Transcript
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col overflow-hidden p-4">
            {/* Messages area */}
            <div
              ref={scrollAreaRef}
              className="mb-3 flex-grow overflow-y-auto pr-1"
              style={{
                direction: locale === "ar" ? "rtl" : "ltr",
                maxHeight: "calc(100% - 1rem)",
                scrollBehavior: "smooth",
                overflowY: "auto",
              }}
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <h3 className="mb-2 text-base font-medium">
                    Start a conversation
                  </h3>
                  <p className="text-xs text-gray-500">
                    Click the "Start Interview" button to begin talking with our
                    AI interviewer.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col"
                    >
                      <div className="font-medium text-gray-800 ml-2 mb-1">
                        {msg.sender === "user" ? candidateData?.name || "You" : "Interviewer"}
                      </div>
                      <div
                        className={`max-w-[95%] rounded-xl px-3 py-2 text-sm ${
                          msg.sender === "user"
                            ? "rounded-tl-none bg-gray-100 text-gray-800 self-start"
                            : "rounded-tr-none bg-blue-100 text-gray-800 self-end"
                        }`}
                      >
                        <p className={locale === "ar" ? "text-right" : ""}>
                          {msg.text}
                        </p>
                        <div className="mt-1 text-[10px] opacity-70">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Modal - Using simple conditional rendering instead of Dialog component */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Assistant Settings</h2>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="flex items-center justify-center my-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-semibold">A</span>
              </div>
            </div>
            
            <div className="mt-3 mb-3 p-2 border rounded-md bg-gray-50 text-sm">
              <h3 className="font-medium">Interview for: </h3>
              <p className="text-blue-600 font-semibold">Software engineer</p>
              <p className="text-xs text-gray-600">A16Z</p>
            </div>
            
            <div className="mt-3">
              <label htmlFor="language-select" className="block text-sm font-medium mb-1">Language Mode</label>
              <select
                id="language-select"
                className="w-full px-2 py-1 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedModel}
                onChange={handleLanguageChange}
              >
                <option value="openai-realtime">🇺🇸 Middle-Aged American Woman</option>
                <option value="cartesia">🇺🇸 Young American Woman</option>
                <option value="groq-arabic">🇸🇦 Arabic</option>
                <option value="google">🇺🇸 Young American Woman (Mellow)</option>
              </select>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element to let the browser play AI responses and help with media capture */}
      <audio
        ref={aiAudioElementRef}
        id="ai-audio-output"
        style={{ display: "none" }}
      />

      {/* Bug Reporting Modal */}
      {isBugModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Report a Bug</h2>

            {/* Debug info */}
            {process.env.NODE_ENV === "development" && (
              <div className="mb-4 rounded bg-gray-100 p-2 text-xs">
                <p>Meeting Code: {candidateMeetingCode}</p>
                <p>Current Bugs: {currentUserCandidate?.bugs?.length || 0}</p>
              </div>
            )}

            {/* Show existing bugs */}
            {currentUserCandidate?.bugs && (
              <BugList bugs={currentUserCandidate.bugs} />
            )}

            <textarea
              className="mb-4 mt-4 w-full rounded-md border p-2"
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="Describe the bug you encountered during this interview..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  console.log("Cancel clicked")
                  setBugDescription("")
                  setIsBugModalOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  console.log("Submit button clicked", { candidateMeetingCode })
                  handleBugSubmit()
                }}
                disabled={!bugDescription.trim() || !currentUserCandidate?._id}
                variant="destructive"
              >
                Submit Bug Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// The main page component that uses Suspense
const WrappedOpenaiRealtimePage: React.FC = () => {
  return (
    <TranslationsProvider>
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center py-8">
            <div className="w-full max-w-md">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-center">Loading Voice AI</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="my-6 flex justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500"></div>
                  </div>
                  <p>Please wait...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        }
      >
        <AiMeetingLoader />
      </Suspense>
    </TranslationsProvider>
  )
}

// Helper component to read searchParams inside Suspense boundary
const AiMeetingLoader: React.FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Extract meetingId from URL, ensure it's trimmed
  const meetingIdParam = searchParams.get("meetingId") || ""
  const rawMeetingId = meetingIdParam.trim()
  
  // Use a dummy meetingId if none is provided for demo purposes
  const meetingId = rawMeetingId || "DEMO123"

  return <AiMeetingContent meetingId={meetingId} />
}

export default WrappedOpenaiRealtimePage
