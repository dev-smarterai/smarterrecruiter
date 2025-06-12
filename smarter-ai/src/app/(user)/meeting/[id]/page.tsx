"use client";

import { ConvAI } from "@/components/ConvAI";
import { VideoCamera } from "@/components/VideoCamera";
import { BackgroundWave } from "@/components/BackgroundWave";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useAuth } from "@/lib/auth";

// Define message type
interface Message {
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
    interim?: boolean;
}

// Simple Avatar component
const Avatar = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
    <div className={`flex items-center justify-center rounded-full ${className}`}>
        {children}
    </div>
);

// Simple ScrollArea component
const ScrollArea = ({ className, children, ref }: { className?: string, children?: React.ReactNode, ref?: React.RefObject<HTMLDivElement> }) => (
    <div className={`overflow-auto ${className || ''}`} ref={ref}>
        {children}
    </div>
);

async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (err) {
    console.error("Microphone permission denied:", err);
    return false;
  }
}

async function getSignedUrl(): Promise<string> {
  try {
    const response = await fetch("/api/signed-url");
    if (!response.ok) {
      console.warn("Failed to get signed URL from server, falling back to mock URL");
      return "mock-signed-url";
    }
    const data = await response.json();
    console.log("Received signed URL response:", data);

    // If it's our mock URL, log for debugging
    if (data.isMock) {
      console.log("Using mock signed URL for development");
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error fetching signed URL:", error);
    console.warn("Falling back to mock URL due to error");
    return "mock-signed-url";
  }
}

// Add prepareDynamicVariables function to format job data
const prepareDynamicVariables = (jobData: any, candidateData: any): Record<string, string> => {
    if (!jobData) return {
        system_prompt: "You are a professional AI voice interviewer. Your purpose is to conduct an interview with the candidate. Speak in a clear, professional tone that puts candidates at ease while extracting meaningful information about their qualifications."
    };

    // Format job requirements as a comma-separated list
    const requirementsList = jobData.requirements?.join(", ") || "";

    // Format job desirables as a comma-separated list
    const desirablesList = jobData.desirables?.join(", ") || "";

    // Create a single system prompt
    let systemPrompt = "";

    // If there's a custom interview prompt from AI Interviewer configuration, use it
    if (jobData.interviewPrompt) {
        // Use the pre-generated prompt that combines the base prompt with AI interviewer config
        systemPrompt = jobData.interviewPrompt;
    } else {
        // Otherwise, use the default template with job variables
        systemPrompt = `You are a professional AI voice interviewer for Smarter.ai, tasked with assessing candidates for the ${jobData.title} position. Your purpose is to conduct a thorough evaluation of technical skills, experience, and cultural fit through natural conversation. Speak in a clear, professional tone that puts candidates at ease while extracting meaningful information about their qualifications.

${jobData.description?.intro || ""}

${jobData.description?.details || ""}

Begin each interview with a brief introduction about Smarter.ai and the ${jobData.title} position. Then guide the conversation through technical assessment areas including ${requirementsList}.

For this role, candidates need to demonstrate the following responsibilities: ${jobData.description?.responsibilities || ""}

Additionally, we value candidates who have: ${desirablesList}

Assess candidates on their understanding of technical philosophy, not just tools. Listen for indicators of collaboration skills, continuous improvement mindset, and relevant experience. Probe for specific examples from past experience, particularly regarding implementation, scaling, and problem resolution.

Adapt questioning based on candidate responses, following up on vague answers to obtain specific details. Recognize and acknowledge strong technical responses without revealing evaluation criteria. When candidates struggle with a question, provide appropriate context to keep the conversation flowing rather than creating awkwardness.

Throughout the interview, evaluate communication skills and ability to explain complex technical concepts clearly. The ideal candidate demonstrates both technical proficiency and the ability to collaborate effectively with cross-functional teams.

End each interview by asking if ${candidateData?.name || "the candidate"} has questions about the role or company. Provide clear information about next steps in the hiring process. After the interview concludes, generate an assessment report highlighting technical strengths, potential areas for growth, and overall recommendation regarding suitability for the ${jobData.title} position at Smarter.ai.`;
    }

    // Just return the single system_prompt variable
    return {
        system_prompt: systemPrompt
    };
};

export default function MeetingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const meetingId = params?.id as string;

    // Get user information from auth context
    const { user } = useAuth();

    // Fetch job details based on meeting code
    const jobData = useQuery(api.jobs.getJobByMeetingCode, {
        meetingCode: meetingId
    });

    // Get the current user's candidate profile
    const userCandidates = useQuery(
        api.candidates.getCandidatesByUserId,
        user ? { userId: user._id } : "skip"
    );

    // Get the most recent candidate for the current user
    const currentUserCandidate = userCandidates && userCandidates.length > 0 ?
        userCandidates[0] : null;

    // Fallback: Try to find a candidate who applied to this job
    const jobApplications = useQuery(
        api.jobProgress.getJobApplications,
        jobData?._id ? { jobId: jobData._id } : "skip"
    );

    // Get the first candidate from job applications if available
    const candidateFromJobApplication = jobApplications && jobApplications.length > 0 ?
        { _id: jobApplications[0].candidateId, name: jobApplications[0].candidateName } : null;

    // Use the current user's candidate if available, otherwise fall back to job application
    const candidateData = currentUserCandidate || candidateFromJobApplication;

    // Log candidate information for debugging
    useEffect(() => {
        if (currentUserCandidate) {
            console.log("Using current user's candidate profile:", currentUserCandidate);
        } else if (candidateFromJobApplication) {
            console.log("Using candidate from job application:", candidateFromJobApplication);
        } else {
            console.log("No candidate found for user or job");
        }
    }, [currentUserCandidate, candidateFromJobApplication]);

    // Add mutations for interview session management
    const completeInterviewSession = useMutation(api.interview_sessions.completeInterviewSession);
    const createInterviewSession = useMutation(api.interview_sessions.createInterviewSession);
    const saveInterview = useMutation(api.interview_sessions.saveInterview);

    // Add state to track if interview has been saved
    const [interviewSaved, setInterviewSaved] = useState(false);
    const [isSavingInterview, setIsSavingInterview] = useState(false);

    // Add state for storing formatted job description
    const [jobDescription, setJobDescription] = useState<string>("");

    // Prepare job description for ElevenLabs
    useEffect(() => {
        if (jobData) {
            let description = "";
            description += `Job Title: ${jobData.title}\n`;
            description += `Company: ${jobData.company}\n\n`;
            description += `Job Description:\n${jobData.description.intro}\n\n`;
            description += `Details:\n${jobData.description.details}\n\n`;
            description += `Responsibilities:\n${jobData.description.responsibilities}\n\n`;

            description += "Requirements:\n";
            jobData.requirements.forEach((req, index) => {
                description += `${index + 1}. ${req}\n`;
            });

            description += "\nDesired Skills:\n";
            jobData.desirables.forEach((skill, index) => {
                description += `${index + 1}. ${skill}\n`;
            });

            setJobDescription(description);
        }
    }, [jobData]);

    const [isConversationActive, setIsConversationActive] = useState(false);
    const conversationRef = useRef<any>(null);
    const [cameraReady, setCameraReady] = useState(false);

    // Add state for conversation messages
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // State for interview saving is defined above

    // Add refs for speech recognition
    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);
    const [currentUserText, setCurrentUserText] = useState("");

    // Add state for speech recognition debugging
    const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState<boolean | null>(null);
    const [debugMessage, setDebugMessage] = useState<string>("");
    const [debugTimestamp, setDebugTimestamp] = useState<Date | null>(null);

    // Add retry counter to prevent infinite loops with speech recognition
    const [recognitionRetryCount, setRecognitionRetryCount] = useState(0);
    const MAX_RETRY_ATTEMPTS = 3;

    // Add a flag for explicitly falling back to text input
    const [usingTextInput, setUsingTextInput] = useState(false);

    // Helper function to update debug message (console only - no UI)
    const updateDebugMessage = useCallback((message: string) => {
        console.log(`DEBUG: ${message}`);
        // No longer updating state with debug messages
    }, []);

    // Add manual speech input as a fallback
    const [manualInput, setManualInput] = useState("");
    const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setManualInput(e.target.value);
    };

    const submitManualInput = () => {
        if (manualInput.trim() && isConversationActive) {
            handleUserSpeech(manualInput.trim());
            setManualInput("");
        }
    };

    // Handle Enter key for manual input
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && manualInput.trim() && isConversationActive) {
            submitManualInput();
        }
    };

    // Redirect if no meeting ID is provided
    useEffect(() => {
        if (!meetingId) {
            router.push('/meeting');
        }
    }, [meetingId, router]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current;
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [messages]);

    // Setup browser's speech recognition
    useEffect(() => {
        // Only run in browser environment
        if (typeof window === 'undefined') return;

        // Don't initialize if we already have it
        if (recognitionRef.current) return;

        try {
            updateDebugMessage("Initializing speech recognition...");
            // Create speech recognition instance using any to bypass type checking
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                updateDebugMessage("Speech recognition not supported in this browser");
                setSpeechRecognitionSupported(false);
                return;
            }

            // Mark speech recognition as supported since we got this far
            setSpeechRecognitionSupported(true);

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            // Handle results
            recognition.onresult = (event: any) => {
                try {
                    updateDebugMessage("Speech recognition result received");

                    const transcript = Array.from(event.results)
                        .map((result: any) => result[0])
                        .map((result: any) => result.transcript)
                        .join('');

                    const isFinal = event.results[event.results.length - 1].isFinal;

                    console.log(`Speech recognition transcript: "${transcript}" (final: ${isFinal})`);

                    // Update current text for interim results
                    setCurrentUserText(transcript);

                    // Add as message if final
                    if (isFinal && isConversationActive) {
                        handleUserSpeech(transcript);
                    }
                } catch (e) {
                    console.error("Error processing speech recognition result:", e);
                    updateDebugMessage("Error processing speech: " + (e as Error).message);
                }
            };

            // Handle errors and end events
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event);
                const errorType = event.error || 'unknown';
                updateDebugMessage(`Speech recognition error: ${errorType}`);
                setIsListening(false);

                // Increment retry counter on network errors, but only if we haven't already hit max
                if (errorType === 'network' && recognitionRetryCount < MAX_RETRY_ATTEMPTS) {
                    setRecognitionRetryCount(prev => prev + 1);
                } else if (errorType === 'network' && recognitionRetryCount >= MAX_RETRY_ATTEMPTS) {
                    // If we're already at max retries, don't try to restart
                    updateDebugMessage(`Max retries (${MAX_RETRY_ATTEMPTS}) already reached. Using text input only.`);
                    setUsingTextInput(true);

                    // Fully stop and clear the speech recognition to prevent more errors
                    try {
                        recognition.abort();
                    } catch (e) {
                        // Ignore abort errors
                    }

                    // Adding this message to make it clear to the user
                    setMessages(prev => {
                        // Only add if it doesn't already exist
                        if (!prev.some(msg => msg.sender === 'ai' && msg.text.includes('Speech recognition is not working'))) {
                            return [...prev, {
                                sender: 'ai',
                                text: 'Speech recognition is not working. Please use the text input below to communicate.',
                                timestamp: new Date()
                            }];
                        }
                        return prev;
                    });
                }
            };

            recognition.onend = () => {
                updateDebugMessage('Speech recognition ended, checking if restart is needed');
                setIsListening(false);

                // Only restart if we're still under max retry attempts and not using text input mode
                if (isConversationActive && recognitionRetryCount < MAX_RETRY_ATTEMPTS && !usingTextInput) {
                    try {
                        updateDebugMessage(`Restarting speech recognition (attempt ${recognitionRetryCount + 1}/${MAX_RETRY_ATTEMPTS})...`);
                        recognition.start();
                        setIsListening(true);
                    } catch (e) {
                        console.error("Error restarting speech recognition:", e);
                        updateDebugMessage("Error restarting: " + (e as Error).message);
                        setRecognitionRetryCount(prev => prev + 1);
                    }
                } else if (recognitionRetryCount >= MAX_RETRY_ATTEMPTS) {
                    updateDebugMessage(`Max retries (${MAX_RETRY_ATTEMPTS}) reached. Using text input instead.`);
                    setUsingTextInput(true);

                    // Ensure we don't try to use this recognition instance again
                    try {
                        // First try to abort which is cleaner than just stop
                        if ('abort' in recognition) {
                            recognition.abort();
                        }
                    } catch (e) {
                        console.error("Error aborting recognition:", e);
                    }
                }
            };

            // Store reference
            recognitionRef.current = recognition;
            updateDebugMessage("Speech recognition initialized successfully");
        } catch (e) {
            console.error("Error setting up speech recognition:", e);
            updateDebugMessage("Error setting up speech: " + (e as Error).message);
            setSpeechRecognitionSupported(false);
        }
    }, [updateDebugMessage]); // Add updateDebugMessage as dependency

    // Start/stop speech recognition based on conversation state
    useEffect(() => {
        console.log(`Conversation state changed: active=${isConversationActive}, listening=${isListening}, retryCount=${recognitionRetryCount}, usingTextInput=${usingTextInput}`);

        // Don't proceed if any of these conditions are true
        if (!recognitionRef.current || recognitionRetryCount >= MAX_RETRY_ATTEMPTS || usingTextInput) {
            if (!recognitionRef.current) {
                updateDebugMessage("Speech recognition not initialized yet");
            }
            if (recognitionRetryCount >= MAX_RETRY_ATTEMPTS || usingTextInput) {
                updateDebugMessage("Using text input mode, speech recognition disabled");
            }
            return;
        }

        if (isConversationActive && !isListening) {
            // Start speech recognition when conversation becomes active
            try {
                updateDebugMessage("Starting speech recognition...");
                recognitionRef.current.start();
                setIsListening(true);
                updateDebugMessage("Speech recognition started successfully");
            } catch (e) {
                console.error("Error starting speech recognition:", e);
                updateDebugMessage("Error starting speech: " + (e as Error).message);

                // Only try to reinitialize if we haven't hit max retries yet
                if (recognitionRetryCount < MAX_RETRY_ATTEMPTS) {
                    // If it fails, try reinitializing it
                    try {
                        updateDebugMessage("Recreating speech recognition instance...");
                        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                        if (!SpeechRecognition) {
                            updateDebugMessage("Speech recognition not supported");
                            setSpeechRecognitionSupported(false);
                            return;
                        }

                        recognitionRef.current = new SpeechRecognition();
                        recognitionRef.current.continuous = true;
                        recognitionRef.current.interimResults = true;
                        recognitionRef.current.lang = 'en-US';
                        recognitionRef.current.start();
                        setIsListening(true);
                        updateDebugMessage("Speech recognition recreated and started");
                    } catch (err) {
                        console.error("Failed to reinitialize speech recognition:", err);
                        updateDebugMessage("Failed to recreate speech: " + (err as Error).message);
                        setSpeechRecognitionSupported(false);
                        setRecognitionRetryCount(MAX_RETRY_ATTEMPTS); // Force it to exceed max retries
                    }
                } else {
                    updateDebugMessage("Max retries already reached, won't attempt to recreate");
                }
            }
        } else if (!isConversationActive && isListening) {
            // Stop speech recognition when conversation becomes inactive
            try {
                updateDebugMessage("Stopping speech recognition...");
                // Try abort first, then fall back to stop
                if ('abort' in recognitionRef.current) {
                    recognitionRef.current.abort();
                } else {
                    recognitionRef.current.stop();
                }
                setIsListening(false);
                updateDebugMessage("Speech recognition stopped successfully");
            } catch (e) {
                console.error("Error stopping speech recognition:", e);
                updateDebugMessage("Error stopping speech: " + (e as Error).message);
                setIsListening(false);
            }
        }
    }, [isConversationActive, isListening, updateDebugMessage, recognitionRetryCount, MAX_RETRY_ATTEMPTS, usingTextInput]);

    // Handler for speech transcription from any source
    const handleTranscription = useCallback((text: string, isUserSpeaking: boolean) => {
        if (!text.trim()) return;

        console.log(`Transcription (${isUserSpeaking ? 'user' : 'AI'}): ${text}`);

        // For AI messages, we don't want to add a new message each time we get a partial transcript
        // Instead, we'll update the last AI message if it exists
        if (!isUserSpeaking) {
            setMessages(prev => {
                const lastMessage = prev[prev.length - 1];

                // If the last message is from the AI, update it
                if (lastMessage && lastMessage.sender === 'ai') {
                    const updatedMessages = [...prev];
                    updatedMessages[prev.length - 1] = {
                        ...lastMessage,
                        text
                    };
                    return updatedMessages;
                }

                // Otherwise, add a new message
                return [...prev, {
                    sender: 'ai',
                    text,
                    timestamp: new Date()
                }];
            });
        } else {
            // For user messages, always add a new message
            setMessages(prev => [...prev, {
                sender: 'user',
                text,
                timestamp: new Date()
            }]);
        }
    }, []);

    // Direct handler for user speech from browser's speech recognition
    const handleUserSpeech = useCallback((text: string) => {
        if (!text.trim()) return;

        console.log(`User speech: "${text}"`);

        // Always add as a new user message
        setMessages(prev => [...prev, {
            sender: 'user',
            text,
            timestamp: new Date()
        }]);

        // Clear current text
        setCurrentUserText("");
    }, []);

    // Handler for status change
    const handleStatusChange = useCallback((status: boolean) => {
        console.log("Conversation status changed:", status);
        setIsConversationActive(status);

        // If the conversation has ended and we have messages, automatically save the interview
        if (!status && messages.length > 0 && !interviewSaved && !isSavingInterview) {
            console.log("Conversation ended, automatically saving interview...");
            saveInterviewDirectly();
        }
    }, [messages, interviewSaved, isSavingInterview]);

    // Request camera permission on page load
    useEffect(() => {
        // Don't run this in SSR
        if (typeof navigator === 'undefined') return;

        const checkCameraPermission = async () => {
            try {
                console.log("Pre-checking camera permissions from page component...");
                // Specifically request camera without audio to avoid confusion with mic permission
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });

                console.log("Camera permission granted from page component");
                setCameraReady(true);

                // Clean up this initial stream
                stream.getTracks().forEach(track => {
                    track.stop();
                });
            } catch (err) {
                console.error("Camera permission error on page load:", err);
                setCameraReady(false);
            }
        };

        // Add a small delay to ensure DOM is fully loaded
        const timer = setTimeout(() => {
            checkCameraPermission();
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const handleConversationInstance = useCallback((instance: any) => {
        console.log("Got conversation instance:", instance);
        conversationRef.current = instance;
    }, []);

    // Add a function that can be called from the ConvAI component to handle messages
    const handleMessage = useCallback((message: any) => {
        // More comprehensive logging to see the exact message structure
        console.log("Message received:", JSON.stringify(message, null, 2));

        try {
            // ElevenLabs specific message formats
            if (message && typeof message === 'object') {
                // Direct message formats from ElevenLabs
                if (message.source && message.message) {
                    if (message.source === 'user') {
                        // This is the user's message captured by ElevenLabs
                        console.log('ElevenLabs user message detected:', message.message);
                        // Add user message to the chat - use this instead of local speech recognition
                        // since our Web Speech API is having network errors
                        handleUserSpeech(message.message);
                        return;
                    } else if (message.source === 'ai') {
                        // This is the AI's response
                        console.log('ElevenLabs AI message detected:', message.message);
                        handleTranscription(message.message, false);
                        return;
                    }
                }

                // Handle AI response messages
                if (message.type === 'agent_message') {
                    console.log('AI message detected:', message);
                    handleTranscription(message.text || "", false);
                    return;
                }

                // Handle user transcripts
                if (message.type === 'transcript') {
                    console.log('ElevenLabs transcript detected:', message);
                    // Since Web Speech API is failing, let's use ElevenLabs transcripts
                    if (message.text) {
                        // Only use final transcripts to avoid duplicate messages
                        if (message.is_final) {
                            handleTranscription(message.text, true);
                        } else {
                            // For interim results, just update the current user text
                            setCurrentUserText(message.text);
                        }
                    }
                    return;
                }

                // All other message types that might contain agent (AI) responses
                if (message.content && typeof message.content === 'string' && message.role === 'assistant') {
                    console.log('AI content detected:', message.content);
                    handleTranscription(message.content, false);
                    return;
                }

                if (message.text && (message.role === 'assistant' || message.speaker === 'ai')) {
                    console.log('AI text detected:', message.text);
                    handleTranscription(message.text, false);
                    return;
                }
            }
            // Handle direct string messages (likely from AI)
            else if (typeof message === 'string' && message.trim()) {
                console.log('AI string message detected:', message);
                handleTranscription(message, false);
                return;
            }
        } catch (error) {
            console.error("Error processing message:", error);
        }
    }, [handleTranscription, handleUserSpeech, setCurrentUserText]);

    const startConversation = async () => {
        if (!conversationRef.current) {
            console.error("Conversation instance not available");
            updateDebugMessage("Conversation instance not available");
            return;
        }

        // Reset the retry counter and text input mode when starting a new conversation
        setRecognitionRetryCount(0);
        setUsingTextInput(false);

        updateDebugMessage("Requesting microphone permission...");
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert("Microphone permission is required for the conversation");
            updateDebugMessage("Microphone permission denied");
            return;
        }
        updateDebugMessage("Microphone permission granted");

        try {
            // Clear previous messages
            setMessages([]);
            setCurrentUserText("");

            updateDebugMessage("Getting signed URL...");
            const signedUrl = await getSignedUrl();
            updateDebugMessage("Starting conversation session...");

            // Prepare dynamic variables for ElevenLabs
            console.log("Job data:", jobData);
            const dynamicVariables = prepareDynamicVariables(jobData, candidateData);

            console.log("Starting conversation with dynamic variables:", dynamicVariables);

            // Pass dynamic variables to ElevenLabs
            await conversationRef.current.startSession({
                signedUrl,
                dynamicVariables: dynamicVariables  // Pass job info as dynamic variables
            });

            updateDebugMessage("Conversation session started successfully");

            // Manually set the active state in case the callback doesn't fire
            setIsConversationActive(true);

            // Try manually starting speech recognition again
            if (recognitionRef.current && !isListening) {
                try {
                    updateDebugMessage("Manually starting speech recognition");
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (e) {
                    console.error("Error manually starting speech recognition:", e);
                    updateDebugMessage("Error starting speech: " + (e as Error).message);

                    // If speech recognition fails to start, show a helpful message
                    if (speechRecognitionSupported === false) {
                        updateDebugMessage("Speech recognition not available. Please use the text input below.");
                        // Add a special message to indicate the fallback method
                        setMessages(prev => [...prev, {
                            sender: 'ai',
                            text: 'Speech recognition is not working. Please use the text input below to communicate.',
                            timestamp: new Date()
                        }]);
                    } else {
                        // Try one more time with a new instance
                        try {
                            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                            if (SpeechRecognition) {
                                updateDebugMessage("Creating new speech recognition instance...");
                                const newRecognition = new SpeechRecognition();
                                newRecognition.continuous = true;
                                newRecognition.interimResults = true;
                                newRecognition.lang = 'en-US';

                                // Copy the event handlers from the existing recognition
                                if (recognitionRef.current) {
                                    newRecognition.onresult = recognitionRef.current.onresult;
                                    newRecognition.onerror = recognitionRef.current.onerror;
                                    newRecognition.onend = recognitionRef.current.onend;
                                }

                                recognitionRef.current = newRecognition;
                                newRecognition.start();
                                setIsListening(true);
                                updateDebugMessage("New speech recognition started");
                            }
                        } catch (err) {
                            updateDebugMessage("Speech recognition unavailable: " + (err as Error).message);
                            setSpeechRecognitionSupported(false);

                            // Add a special message to indicate the fallback method
                            setMessages(prev => [...prev, {
                                sender: 'ai',
                                text: 'Speech recognition is not working. Please use the text input below to communicate.',
                                timestamp: new Date()
                            }]);
                        }
                    }
                }
            }

            // Add customized welcome message with job info
            const welcomeMessage = jobData
                ? `Hello${candidateData ? ` ${candidateData.name}` : ''}! I'm your AI interviewer for the ${jobData.title} position at ${jobData.company}. How can I help you prepare for your interview today?`
                : 'Hello! I\'m your AI assistant. How can I help you today?';

            setMessages([{
                sender: 'ai',
                text: welcomeMessage,
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error("Failed to start conversation:", error);
            updateDebugMessage("Failed to start conversation: " + (error as Error).message);
            alert("Failed to start conversation. Please check console for details.");
        }
    };

    // Function to directly save the interview
    const saveInterviewDirectly = async () => {
        if (interviewSaved) {
            console.log("Interview already saved, skipping");
            return;
        }

        setIsSavingInterview(true);

        try {
            // Format messages for the transcript with candidate name
            const candidateName = candidateData?.name || "Unknown Candidate";
            const transcript = messages.map(msg => ({
                sender: msg.sender === 'user' ? candidateName : msg.sender,
                text: msg.text,
                timestamp: msg.timestamp.toISOString()
            }));

            // Check if we have a valid candidate ID
            if (!candidateData?._id) {
                console.error("No candidate ID found for direct save");
                updateDebugMessage("Error: No candidate found. Please ensure you're logged in with the correct account.");

                // Add an error message to the conversation
                setMessages(prev => [...prev, {
                    sender: 'ai',
                    text: 'Error: Unable to save the interview. No candidate profile was found. Please ensure you\'re logged in with the correct account.',
                    timestamp: new Date()
                }]);
                setIsSavingInterview(false);
                return;
            }

            // Log the interview data we're about to save
            console.log("Directly saving interview with data:", {
                candidateId: candidateData._id,
                candidateName: candidateData.name,
                jobId: jobData?._id,
                transcriptLength: transcript.length,
                firstMessage: transcript.length > 0 ? transcript[0].text.substring(0, 50) + '...' : 'No messages'
            });

            // Use the direct save function
            const result = await saveInterview({
                candidateId: candidateData._id,
                jobId: jobData?._id,
                transcript: transcript
            });

            console.log("Interview saved directly with ID:", result.interviewId);
            setInterviewSaved(true);

            // Add a success message to the conversation
            setMessages(prev => [...prev, {
                sender: 'ai',
                text: 'Interview saved successfully! You can view it on your candidate profile.',
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error("Error directly saving interview:", error);
            updateDebugMessage("Error saving interview: " + (error as Error).message);

            // Add an error message to the conversation
            setMessages(prev => [...prev, {
                sender: 'ai',
                text: 'Error: Unable to save the interview. Please try again or contact support.',
                timestamp: new Date()
            }]);
        } finally {
            setIsSavingInterview(false);
        }
    };

    const stopConversation = async () => {
        if (conversationRef.current) {
            try {
                updateDebugMessage("Ending conversation session...");
                await conversationRef.current.endSession();
                updateDebugMessage("Conversation ended successfully");

                // Try to save the interview after ending the conversation
                await saveInterviewDirectly();
            } catch (error) {
                console.error("Error ending conversation:", error);
                updateDebugMessage("Error ending conversation: " + (error as Error).message);

                // Still try to save the interview even if ending the conversation fails
                try {
                    await saveInterviewDirectly();
                } catch (saveError) {
                    console.error("Error saving interview after conversation end error:", saveError);
                }
            }

            // Manually set the active state in case the callback doesn't fire
            setIsConversationActive(false);

            // Make sure speech recognition is stopped
            if (recognitionRef.current && isListening) {
                try {
                    // First try to abort which is more immediate
                    if ('abort' in recognitionRef.current) {
                        recognitionRef.current.abort();
                    } else {
                        recognitionRef.current.stop();
                    }
                } catch (e) {
                    console.error("Error stopping speech recognition on conversation end:", e);
                }
                setIsListening(false);
            }

            // Add ending message
            setMessages(prev => [...prev, {
                sender: 'ai',
                text: 'The conversation has ended. Thank you for chatting!',
                timestamp: new Date()
            }]);

            // Clear any lingering user text
            setCurrentUserText("");
        }
    };

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            // Stop speech recognition if it's running
            if (recognitionRef.current) {
                try {
                    // First try abort, then fall back to stop
                    if ('abort' in recognitionRef.current) {
                        recognitionRef.current.abort();
                    } else {
                        recognitionRef.current.stop();
                    }
                } catch (e) {
                    // Ignore errors when stopping
                }
            }

            // End conversation if it's active
            if (conversationRef.current && isConversationActive) {
                try {
                    conversationRef.current.endSession();
                } catch (e) {
                    // Ignore errors when ending session
                }
            }
        };
    }, [isConversationActive]);

    // Special handling to try again if speech recognition fails to initialize
    useEffect(() => {
        if (isConversationActive && speechRecognitionSupported === null) {
            // If conversation is active but speech recognition hasn't been initialized yet, try again
            const checkSpeechRecognition = () => {
                if (!recognitionRef.current) {
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (SpeechRecognition) {
                        setSpeechRecognitionSupported(true);
                        updateDebugMessage("Delayed speech recognition check - supported");
                    } else {
                        setSpeechRecognitionSupported(false);
                        updateDebugMessage("Delayed speech recognition check - not supported");
                    }
                }
            };

            // Wait a moment and check
            const timer = setTimeout(checkSpeechRecognition, 1000);
            return () => clearTimeout(timer);
        }
    }, [isConversationActive, speechRecognitionSupported, updateDebugMessage]);

    return (
        <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-bold">Meeting: {meetingId}</h1>

            <div className="w-full max-w-[1400px] flex flex-col md:flex-row gap-6">
                {/* Left side - Main content (camera, AI, buttons) */}
                <div className="w-full md:w-2/3 flex flex-col gap-6">
                    {/* Camera and Agent cards side by side */}
                    <div className="flex flex-col sm:flex-row gap-6 w-full">
                        {/* Camera */}
                        <div className="w-full sm:w-1/2">
                            <Card className="h-full bg-white">
                                <CardContent className="p-4 h-full">
                                    <VideoCamera isActive={isConversationActive} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Conversational Agent */}
                        <div className="w-full sm:w-1/2">
                            <Card className="h-full bg-white">
                                <CardContent className="p-4 h-full">
                                    <ConvAI
                                        onStatusChange={handleStatusChange}
                                        onConversationInstance={handleConversationInstance}
                                        onMessage={handleMessage}
                                        dynamicVariables={prepareDynamicVariables(jobData, candidateData)}
                                    />
                                    {!cameraReady && (
                                        <p className="text-amber-600 text-sm text-center mt-2">
                                            Camera access is needed for this feature. Please allow camera permissions.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Control buttons below */}
                    <Card className="bg-white">
                        <CardContent className="flex flex-col items-center gap-4 p-4">
                            <div className="flex justify-center gap-4">
                                <Button
                                    variant={"outline"}
                                    className="rounded-full"
                                    size={"lg"}
                                    disabled={isConversationActive || isSavingInterview}
                                    onClick={startConversation}
                                >
                                    Start conversation
                                </Button>
                                <Button
                                    variant={"outline"}
                                    className="rounded-full"
                                    size={"lg"}
                                    disabled={!isConversationActive || isSavingInterview}
                                    onClick={stopConversation}
                                >
                                    End conversation
                                </Button>
                            </div>

                            {/* Show saving status */}
                            {isSavingInterview && (
                                <div className="flex items-center gap-2 text-blue-600 mt-2">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                    <span>Saving interview...</span>
                                </div>
                            )}

                            {/* Show saved confirmation */}
                            {interviewSaved && !isSavingInterview && (
                                <div className="flex items-center gap-2 text-green-600 mt-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Interview saved successfully!</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right side - Conversation Transcript sidebar */}
                <div className="w-full md:w-1/3">
                    <Card className="h-[600px] bg-white flex flex-col">
                        <CardContent className="p-4 flex flex-col h-full">
                            <h3 className="font-semibold text-lg mb-2">Conversation Transcript</h3>
                            <div className="overflow-auto flex-1 pr-4" ref={scrollAreaRef}>
                                <div className="space-y-4">
                                    {messages.length === 0 ? (
                                        <p className="text-center text-gray-500 my-8">
                                            {isConversationActive
                                                ? "Conversation in progress. Start speaking..."
                                                : "Start a conversation to see the transcript."}
                                        </p>
                                    ) : (
                                        <>
                                            {messages.map((message, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    {message.sender === 'ai' && (
                                                        <Avatar className="h-8 w-8 bg-blue-500">
                                                            <span className="text-white text-xs">AI</span>
                                                        </Avatar>
                                                    )}
                                                    <div
                                                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                                            message.sender === 'user'
                                                                ? 'bg-blue-100 text-blue-900'
                                                                : 'bg-gray-100 text-gray-900'
                                                        }`}
                                                    >
                                                        <p className="text-sm">{message.text}</p>
                                                        <span className="text-xs text-gray-500">
                                                            {message.timestamp.toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    {message.sender === 'user' && (
                                                        <Avatar className="h-8 w-8 bg-green-500">
                                                            <span className="text-white text-xs">You</span>
                                                        </Avatar>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Show current user speech as it happens */}
                                            {currentUserText && isConversationActive && (
                                                <div className="flex gap-3 justify-end opacity-70">
                                                    <div className="rounded-lg px-4 py-2 max-w-[80%] bg-blue-50 text-blue-800 border border-blue-100">
                                                        <p className="text-sm">{currentUserText}</p>
                                                        <span className="text-xs text-blue-400">
                                                            Listening...
                                                        </span>
                                                    </div>
                                                    <Avatar className="h-8 w-8 bg-green-500 opacity-70">
                                                        <span className="text-white text-xs">You</span>
                                                    </Avatar>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Type to speak fallback input */}
                            {isConversationActive && (
                                <div className={`mt-3 pt-3 border-t ${usingTextInput ? 'bg-amber-50 p-2 rounded-md border border-amber-200' : ''}`}>
                                    <div className="flex flex-col space-y-2">
                                        {usingTextInput && (
                                            <p className="text-sm text-amber-600 font-medium">
                                                Speech recognition is having issues. Please use this text input instead:
                                            </p>
                                        )}
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={manualInput}
                                                onChange={handleManualInput}
                                                onKeyDown={handleKeyDown}
                                                placeholder={usingTextInput
                                                    ? "Type your message here and press Enter..."
                                                    : "Type here if speech recognition isn't working..."}
                                                className={`flex-1 px-3 py-2 border rounded-md text-sm ${
                                                    usingTextInput
                                                        ? 'border-amber-300 focus:ring-2 focus:ring-amber-300 focus:border-amber-300'
                                                        : 'border-gray-300'
                                                }`}
                                                disabled={!isConversationActive}
                                                autoFocus={usingTextInput}
                                            />
                                            <Button
                                                onClick={submitManualInput}
                                                disabled={!manualInput.trim() || !isConversationActive}
                                                size="sm"
                                                className={usingTextInput ? 'bg-amber-500 hover:bg-amber-600' : ''}
                                            >
                                                Send
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 border-t mt-2">
                                <p className="text-xs text-gray-500">
                                    {isConversationActive
                                        ? usingTextInput
                                            ? "Speech recognition failed. Please use the text input above."
                                            : isListening
                                                ? "Listening... Speak clearly into your microphone."
                                                : "Starting speech recognition..."
                                        : "Press Start Conversation to begin"}
                                </p>

                                {/* Only show the error message when we're using text input */}
                                {usingTextInput && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Speech recognition failed in this browser. Please use the text input instead.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* <BackgroundWave /> */}
        </div>
    );
}