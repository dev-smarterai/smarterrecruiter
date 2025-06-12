"use client"

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, X, Mic } from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth"
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { cn } from "@/lib/utils"
import { useRecordVoice } from "@/hooks/use-voice-recording"
import { CustomMicIcon } from "@/components/ui/custom-mic-icon"
import { formatResponse, sendChatRequest, ChatMessage as AIChatMessage } from "@/lib/ai-utils"
import { useRouter } from "next/navigation"
import { useAINavigation } from "@/hooks/use-ai-navigation"
import { findRouteFromQuery } from "@/lib/ai-navigation"

// Define message types for our application
type Message = {
  id: string
  role: "assistant" | "user" | "system"
  content: string
  timestamp: Date
}

// Define component props
interface AskAdamAdminProps {
  onClose?: () => void
  initialInputValue?: string
  hideInitialSuggestions?: boolean
  onNavigate?: (route: string) => void
}

// Route mappings are now imported from @/lib/ai-navigation

// Add proper typing for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort?(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

// Add proper Window interface extension for SpeechRecognition
interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

// Add markdown formatter
const formatMarkdown = (text: string): string => {
  try {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
    
    const html = marked.parse(text);
    
    return DOMPurify.sanitize(html.toString(), {
      ADD_ATTR: ['class'],
    });
  } catch (error) {
    console.error('Error formatting markdown:', error);
    return text;
  }
};

// Convert to forwardRef
const AskAdamAdmin = forwardRef<
  { 
    handleSuggestionClick: (suggestion: string) => void,
    setInputValueOnly: (value: string) => void
  },
  AskAdamAdminProps
>(({ onClose, initialInputValue, hideInitialSuggestions = false, onNavigate }, ref) => {
  const [chatMode, setChatMode] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState(initialInputValue || "")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const accumulatedChunksRef = useRef<string>("")
  const lastUpdateTimestampRef = useRef<number>(0)
  const scrollToBottomTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isSpeechSupported, setIsSpeechSupported] = useState(true)
  const [voiceRecordingWarning, setVoiceRecordingWarning] = useState<string | null>(null)

  // Add Convex mutations for function calling
  const createJob = useMutation(api.jobs.createJobFromAI)
  const deleteJob = useMutation(api.jobs.deleteJobFromAI)
  const scheduleInterview = useMutation(api.interviews.createInterviewRequest)
  const scheduleInterviewWithName = useMutation(api.interviews.scheduleInterviewWithName)

  // Get user information
  const { user } = useAuth()
  const router = useRouter()
  const { navigateWithAI } = useAINavigation()
  
  // Enhanced navigation function with AI animations
  const navigateToPage = useCallback(async (route: string) => {
    try {
      // Use the new AI navigation system
      await navigateWithAI(route);
      
      // Call the onNavigate callback if provided
      if (onNavigate) {
        onNavigate(route);
      }
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to simple navigation
      router.push(route);
      if (onNavigate) {
        onNavigate(route);
      }
    }
  }, [navigateWithAI, onNavigate])
  
  // AI function to detect navigation intent and route
  const processNavigation = async (args: any): Promise<Message | null> => {
    try {
      const { intent, route, query } = args
      
      // Find the best matching route using the new utility
      let targetRoute = route || findRouteFromQuery(query || intent || '')
      
      if (targetRoute) {
        // Navigate to the route
        navigateToPage(targetRoute)
        
        // Return null to indicate successful navigation without adding a message
        return null
      } else {
        const errorMessage = `I couldn't find a matching page for "${query || intent}". Available pages include: dashboard, jobs, candidates, pipeline, interview schedule, analytics, and settings.`
        const formattedContent = await formatResponse(errorMessage)
        
        return {
          id: Date.now().toString(),
          content: formattedContent,
          role: "assistant",
          timestamp: new Date(),
        }
      }
    } catch (error) {
      console.error("Error processing navigation:", error)
      const errorMessage = "I'm sorry, there was an error navigating to that page. Please try again."
      const formattedContent = await formatResponse(errorMessage)
      
      return {
        id: Date.now().toString(),
        content: formattedContent,
        role: "assistant",
        timestamp: new Date(),
      }
    }
  }
  
  // Handle transcript received from voice recording
  const handleTranscriptReceived = useCallback((transcript: string) => {
    setInputValue(transcript);
  }, []);
  
  // Use the voice recording hook
  const { 
    recording: isRecording, 
    startRecording, 
    stopRecording, 
    permissionDenied: isMicPermissionDenied,
    interimTranscript: voiceInterimTranscript
  } = useRecordVoice({
    onTranscriptReceived: handleTranscriptReceived
  });
  
  // Update interim transcript from the hook
  useEffect(() => {
    setInterimTranscript(voiceInterimTranscript || "");
  }, [voiceInterimTranscript]);
  
  // Check for speech recognition support on mount
  useEffect(() => {
    const checkSpeechSupport = () => {
      const win = window as unknown as SpeechRecognitionWindow;
      
      // Check for Speech Recognition API support AND microphone access capability
      const isBrowserSupported = !!(
        win.SpeechRecognition || 
        win.webkitSpeechRecognition
      ) && 
      typeof navigator !== "undefined" && 
      navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia === "function";
          
      setIsSpeechSupported(isBrowserSupported);
      
      if (!isBrowserSupported) {
        console.warn("Speech recognition is not supported in this browser");
        setVoiceRecordingWarning("Voice recording is not supported in this browser. Try Chrome or Edge for best results.");
      }
    };
    
    // Run the check immediately
    checkSpeechSupport();
  }, []);

  // Update warning message when mic permission changes
  useEffect(() => {
    if (isMicPermissionDenied) {
      setVoiceRecordingWarning("Microphone access was denied. Check your browser permissions.");
    } else if (!isSpeechSupported) {
      setVoiceRecordingWarning("Voice recording is not supported in this browser. Try Chrome or Edge for best results.");
    } else {
      setVoiceRecordingWarning(null);
    }
  }, [isMicPermissionDenied, isSpeechSupported]);

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame to ensure scrolling happens after DOM updates
      requestAnimationFrame(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
      })
    }
  }

  // Throttled version of scrollToBottom to prevent too many scroll events during streaming
  const throttledScrollToBottom = () => {
    if (!scrollToBottomTimeoutRef.current) {
      scrollToBottomTimeoutRef.current = setTimeout(() => {
        if (messagesEndRef.current) {
          // Prevent page scrolling by using scrollIntoView within the container only
          const container = messagesEndRef.current.parentElement;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }
        scrollToBottomTimeoutRef.current = null
      }, 100) // Limit to at most once every 100ms
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    // Only scroll to bottom when a new complete message is added (not during streaming)
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && !String(lastMessage.id).includes("_streaming")) {
      if (messagesEndRef.current) {
        // Prevent page scrolling by using scrollIntoView within the container only
        const container = messagesEndRef.current.parentElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }
  }, [messages])

  // Clean up any pending scroll timeout when component unmounts
  useEffect(() => {
    return () => {
      if (scrollToBottomTimeoutRef.current) {
        clearTimeout(scrollToBottomTimeoutRef.current)
      }
    }
  }, [])

  // Add effect to update inputValue when initialInputValue changes
  useEffect(() => {
    if (initialInputValue) {
      setInputValue(initialInputValue)
    }
  }, [initialInputValue])

  // Method to update input value without submitting
  const setInputValueOnly = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  // Add function processing handlers
  const processCreateJob = async (args: any): Promise<Message> => { 
    try {
      let salaryRange = args.salary || "90000-120000";
      let [min, max] = salaryRange.replace(/[^0-9\-]/g, "").split("-").map(Number);

      const jobResult = await createJob({
        title: args.title,
        description: {
          intro: `We are looking for a talented ${args.title} to join our team.`,
          details: args.description,
          responsibilities: args.description,
          closing: "If you're passionate about this opportunity, we'd love to hear from you!",
        },
        requirements: args.requirements.split("\n").filter(Boolean),
        desirables: [],
        benefits: [],
        salary: {
          min,
          max,
          currency: "USD",
          period: "yearly",
        },
        location: args.location,
        level: args.title.toLowerCase().includes("senior") ? "Senior" : "Mid-Level",
        experience: args.requirements.includes("years")
          ? args.requirements.match(/\d+\+?\s*years?/)?.[0] || "3+ years"
          : "3+ years",
        education: args.requirements.includes("degree")
          ? args.requirements.match(/[A-Za-z]+(\s+[A-Za-z]+)*\s+degree/)?.[0] || "Bachelor's degree"
          : "Bachelor's degree",
        type: args.employmentType || "Full-time",
      });

      const successMessage = `Great! I've created the job listing for ${args.title}. The job has been added to the system with ID ${jobResult.jobId}.`;
      const formattedContent = await formatResponse(successMessage);

      return {
        id: Date.now().toString(),
        content: formattedContent,
        role: "assistant",
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error creating job:", error);
      const errorMessage = "I'm sorry, there was an error creating the job listing. Please try again with more specific information.";
      const formattedContent = await formatResponse(errorMessage);
      return {
        id: Date.now().toString(),
        content: formattedContent,
        role: "assistant",
        timestamp: new Date(),
      };
    }
  };

  const processDeleteJob = async (args: any): Promise<Message> => { 
    try {
      const deleteResult = await deleteJob({
        jobTitle: args.title,
        company: args.company,
        location: args.location,
      });

      const formattedContent = await formatResponse(deleteResult.message);
      return {
        id: Date.now().toString(),
        content: formattedContent,
        role: "assistant",
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error deleting job:", error);
      const errorMessage = "I'm sorry, there was an error deleting the job listing. Please try again with more specific information about the job title.";
      const formattedContent = await formatResponse(errorMessage);
      return {
        id: Date.now().toString(),
        content: formattedContent,
        role: "assistant",
        timestamp: new Date(),
      };
    }
  };

  const processScheduleInterview = async (args: any): Promise<Message> => { 
    try {
      let dateStr = args.date;
      if (dateStr && !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          dateStr = parsedDate.toISOString().split("T")[0];
        }
      }

      let candidateId = args.candidateId;
      if (!candidateId && args.candidateName) {
        try {
          const result = await scheduleInterviewWithName({
            candidateName: args.candidateName,
            position: args.position,
            date: dateStr,
            time: args.time,
            notes: args.notes || "",
            location: args.location || "Remote",
            interviewType: args.interviewType || "General",
            meetingLink: args.meetingLink || "",
            jobId: args.jobId,
          });

          if (!result.success) {
            return {
              id: Date.now().toString(),
              content: await formatResponse(result.error || "An unknown error occurred scheduling the interview."),
              role: "assistant",
              timestamp: new Date(),
            };
          }

          const successMessage = `The interview with ${args.candidateName} for the ${args.position} position has been scheduled for ${dateStr} at ${args.time}. ${
            args.location ? `Location: ${args.location}.` : ""
          } ${args.notes ? `Notes: ${args.notes}` : ""}`;
          const formattedContent = await formatResponse(successMessage);

          return {
            id: Date.now().toString(),
            content: formattedContent,
            role: "assistant",
            timestamp: new Date(),
          };
        } catch (error) {
          console.error("Error scheduling interview with name:", error);
          return {
            id: Date.now().toString(),
            content: await formatResponse(
              `I encountered an error while scheduling an interview for "${args.candidateName}". Please ensure the name and other details are correct.`
            ),
            role: "assistant",
            timestamp: new Date(),
          };
        }
      } else if (candidateId) {
        try {
          const interviewResult = await scheduleInterview({
            candidateId: candidateId,
            position: args.position,
            date: dateStr,
            time: args.time,
            status: "Scheduled",
            notes: args.notes || "",
            location: args.location || "Remote",
            interviewType: args.interviewType || "General",
            meetingLink: args.meetingLink || "",
            jobId: args.jobId || undefined,
          });

          const successMessage = `The interview for the ${args.position} position has been scheduled for ${dateStr} at ${args.time}. ${
            args.location ? `Location: ${args.location}.` : ""
          } ${args.notes ? `Notes: ${args.notes}` : ""}`;
          const formattedContent = await formatResponse(successMessage);

          return {
            id: Date.now().toString(),
            content: formattedContent,
            role: "assistant",
            timestamp: new Date(),
          };
        } catch (error) {
          console.error("Error scheduling interview with ID:", error);
          return {
            id: Date.now().toString(),
            content: await formatResponse(
              "I encountered an error while scheduling the interview. Please make sure the candidate ID is valid and try again."
            ),
            role: "assistant",
            timestamp: new Date(),
          };
        }
      } else {
        return {
          id: Date.now().toString(),
          content: await formatResponse(
            "I need either a valid candidate ID or a candidate name to schedule the interview. Please provide one and try again."
          ),
          role: "assistant",
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error("Error in interview scheduling process:", error);
      const errorMessage = "I'm sorry, there was an unexpected error scheduling the interview. Please check the details provided and try again.";
      const formattedContent = await formatResponse(errorMessage);
      return {
        id: Date.now().toString(),
        content: formattedContent,
        role: "assistant",
        timestamp: new Date(),
      };
    }
  };

  // Add function call handler
  const handleFunctionCall = async (functionCall: { name: string; arguments: string }) => {
    try {
      const args = JSON.parse(functionCall.arguments);
      let resultMessage: Message | null = null;

      if (functionCall.name === "createJob") {
        resultMessage = await processCreateJob(args);
      } else if (functionCall.name === "deleteJob") {
        resultMessage = await processDeleteJob(args);
      } else if (functionCall.name === "scheduleInterview") {
        resultMessage = await processScheduleInterview(args);
      } else if (functionCall.name === "navigateToPage") {
        resultMessage = await processNavigation(args);
      } else {
        const errorContent = await formatResponse(`Sorry, I received an unknown function request: ${functionCall.name}.`);
        resultMessage = {
          id: Date.now().toString(),
          content: errorContent,
          role: "assistant",
          timestamp: new Date(),
        };
      }

      if (resultMessage) {
        setMessages((prev) => {
          const filteredMessages = prev.filter(msg => 
            !String(msg.id).includes("_streaming") && 
            !String(msg.id).includes("_loading")
          );
          return [...filteredMessages, resultMessage];
        });
      }
    } catch (error) {
      console.error("Error processing function:", functionCall.name, error);
      const errorContent = await formatResponse(
        `I'm sorry, there was an error executing the ${functionCall.name} request. Please check the details or try again.`
      );
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: errorContent,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Toggle voice recording
  const handleMicrophoneClick = async () => {
    if (!isSpeechSupported) {
      alert("Sorry, speech recognition is not supported in your browser. Try using Chrome, Edge, or Safari.");
      return;
    }
  
    try {
      if (isRecording) {
        // If already recording, await the stop so that the state resets properly
        await stopRecording();
        setInterimTranscript("");
      } else {
        // Clear input and interim transcript before starting
        setInputValue("");
        setInterimTranscript("");
        
        // Start recording
        await startRecording();
      }
    } catch (error) {
      console.error("Error toggling voice recording:", error);
      
      // More helpful error messaging based on error type
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setVoiceRecordingWarning("Microphone access was denied. Check your browser permissions.");
        alert("Microphone access was denied. Please check your browser permissions and try again.");
      } else {
        setVoiceRecordingWarning("Voice recording failed. Try reloading the page.");
        alert("There was a problem with voice recording. Please try again later.");
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (inputValue.trim() === "") return
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setChatMode(true)

    try {
      // Convert our messages to the format expected by sendChatRequest
      const aiMessages: AIChatMessage[] = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role === "user" ? "user" : "ai",
        timestamp: msg.timestamp?.toLocaleTimeString()
      }));
      
      // Add the new user message
      aiMessages.push({
        id: userMessage.id,
        content: userMessage.content,
        sender: "user",
        timestamp: userMessage.timestamp.toLocaleTimeString()
      });
      
      // Create streaming ID for ongoing message
      const streamingId = Date.now().toString() + "_streaming";
      let streamingMessageAdded = false;
      let functionCallHandled = false; // Track if a function call was handled
      let pendingFunctionCall: { name: string; arguments: string } | null = null;
      
      // Reset accumulated chunks
      accumulatedChunksRef.current = "";
      lastUpdateTimestampRef.current = 0;
      
      const result = await sendChatRequest(aiMessages, {
        stream: true,
        includeDatabase: true,
        onChunk: (chunk) => {
          // Check for function call markers in the chunk
          if (chunk.includes('[FUNCTION:')) {
            try {
              const functionCallMatch = chunk.match(/\[FUNCTION:(.*?)\]/);
              if (functionCallMatch) {
                const functionCallData = JSON.parse(functionCallMatch[1]);
                console.log("Function call detected in stream:", functionCallData);
                
                // For navigation, execute immediately for instant response
                if (functionCallData.name === "navigateToPage") {
                  console.log("Immediate navigation detected, executing now...");
                  
                  // Execute navigation immediately
                  (async () => {
                    try {
                      const args = JSON.parse(functionCallData.arguments);
                      const resultMessage = await processNavigation(args);
                      
                      // Only add a message if there was an error (resultMessage is not null)
                      if (resultMessage) {
                        setMessages((prev) => {
                          const filteredMessages = prev.filter(msg => 
                            !String(msg.id).includes("_streaming") && 
                            !String(msg.id).includes("_loading")
                          );
                          return [...filteredMessages, resultMessage];
                        });
                      }
                    } catch (error) {
                      console.error("Error in immediate navigation:", error);
                    }
                  })();
                  
                  // Mark that function call was handled
                  functionCallHandled = true;
                  streamingMessageAdded = false;
                  return;
                }
                
                // For other function calls, handle them normally after streaming
                pendingFunctionCall = functionCallData;
              }
              
              // Mark that function call was handled
              functionCallHandled = true;
              streamingMessageAdded = false;
              return;
            } catch (parseError) {
              console.error("Error parsing function call marker:", parseError);
            }
          }
          
          // If this is the first chunk, add a streaming message
          if (!streamingMessageAdded) {
            const initialStreamingMessage: Message = {
              id: streamingId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
            };
            
            // Add streaming message
            setMessages((prev) => {
              // Filter out any existing streaming messages
              const filteredMessages = prev.filter(msg => 
                !String(msg.id).includes("_streaming")
              );
              return [...filteredMessages, initialStreamingMessage];
            });
            
            setIsLoading(false);
            streamingMessageAdded = true;
          }
          
          // Add chunk to accumulated text
          accumulatedChunksRef.current += chunk;
          
          // Check if it's time to update the UI
          const now = Date.now();
          if (now - lastUpdateTimestampRef.current > 50 || chunk.includes('\n')) {
            // At least 50ms have passed or newline received - update the UI
            const batchedChunk = accumulatedChunksRef.current;
            accumulatedChunksRef.current = ""; // Reset accumulated text
            lastUpdateTimestampRef.current = now;
            
            // Update the streaming message with the new content
            setMessages((prevMessages) => {
              return prevMessages.map((msg) => {
                if (String(msg.id).includes(streamingId)) {
                  return { 
                    ...msg, 
                    content: (msg.content || "") + batchedChunk 
                  };
                }
                return msg;
              });
            });
            
            // Scroll to bottom during streaming
            throttledScrollToBottom();
          }
        },
        onComplete: (fullResponse) => {
          // Handle pending function calls for non-navigation functions
          if (pendingFunctionCall && pendingFunctionCall.name !== "navigateToPage") {
            handleFunctionCall(pendingFunctionCall);
            pendingFunctionCall = null;
            functionCallHandled = true;
          }
          
          // Only add a final message if no function call was handled
          if (!functionCallHandled) {
            // Replace streaming message with final message
            setMessages((prevMessages) => {
              // Remove any streaming messages first
              const filteredMessages = prevMessages.filter(msg => 
                !String(msg.id).includes("_streaming")
              );
              
              // Add the final message only if there's actual content
              if (fullResponse && fullResponse.trim()) {
                const finalMessage: Message = {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: fullResponse,
                  timestamp: new Date(),
                };
                
                return [...filteredMessages, finalMessage];
              }
              
              return filteredMessages;
            });
          } else {
            // Just clean up any remaining streaming messages
            setMessages((prevMessages) => 
              prevMessages.filter(msg => !String(msg.id).includes("_streaming"))
            );
          }
          
          setIsLoading(false);
        },
        onError: async (error) => {
          console.error("Streaming Error:", error);
          setIsLoading(false);
          
          // Remove incomplete streaming message
          setMessages((prevMessages) => prevMessages.filter(msg => !String(msg.id).includes(streamingId)));
          
          const errorContent = await formatResponse(
            "Sorry, there was an error processing your request. Please try again."
          );
          const errorResponse: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: errorContent,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorResponse]);
        }
      });
      
      // Handle non-streaming path or function call
      if (!result.streaming) {
        setIsLoading(false);
        
        if (result.success) {
          // Check if there was a function call
          if (result.functionCall) {
            await handleFunctionCall(result.functionCall);
          } else if (result.message) {
            const formattedContent = await formatResponse(result.message);
            
            setMessages((prev) => {
              // Remove any streaming messages first
              const filteredMessages = prev.filter(msg => 
                !String(msg.id).includes("_streaming")
              );
              
              const aiResponse: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: formattedContent,
                timestamp: new Date(),
              };
              
              return [...filteredMessages, aiResponse];
            });
          }
        } else {
          // Handle error
          const errorContent = await formatResponse(
            result.error || "Sorry, I encountered an error processing your request. Please try again later."
          );
          const errorResponse: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: errorContent,
            timestamp: new Date(),
          };
          setMessages((prev) => {
            // Remove any streaming messages first
            const filteredMessages = prev.filter(msg => 
              !String(msg.id).includes("_streaming")
            );
            return [...filteredMessages, errorResponse];
          });
        }
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      
      setMessages(prev => {
        // Remove any streaming messages
        const filteredMessages = prev.filter(msg => 
          !String(msg.id).includes("_streaming")
        );
        return [...filteredMessages, errorMessage];
      });
      
      setIsLoading(false);
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    handleSubmit()
  }

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    handleSuggestionClick,
    setInputValueOnly
  }));

  return (
    <div className="rounded-lg shadow-sm w-full flex flex-col">
      <div className={cn(
        "flex flex-col bg-white rounded-lg p-4 sm:p-6 bg-gradient-to-br from-white to-purple-200 w-full",
        hideInitialSuggestions && messages.length > 0 
          ? "min-h-[250px] sm:min-h-[300px] lg:min-h-[280px] max-h-[45vh] sm:max-h-[38vh] lg:max-h-[30vh]" 
          : hideInitialSuggestions && messages.length === 0
            ? "h-auto"
            : "flex-grow h-full max-h-[800px]"
      )}>
      {onClose && (
          <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0 self-end">
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {/* Display voice recording warning if applicable */}
        {voiceRecordingWarning && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-2 text-xs flex items-center gap-2 mx-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{voiceRecordingWarning}</span>
          </div>
        )}
        
        {messages.length === 0 ? (
          <>
            {!hideInitialSuggestions ? (
              <>
                <div className="flex-grow flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 mb-6 flex items-center justify-center overflow-hidden">
                    {/* Orb video */}
                    <video
                      src="/orb.webm"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <h3 className="text-2xl font-medium text-gray-800 mb-6 text-center font-sans">
                    How can I help you today?
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start text-left h-auto py-3 border-gray-200 rounded-md font-sans"
                    onClick={() => handleSuggestionClick("Show me top candidates for open positions")}
                  >
                    <span className="truncate w-full">Show me top candidates for open positions</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start text-left h-auto py-3 border-gray-200 rounded-md font-sans"
                    onClick={() => handleSuggestionClick("Take me to the jobs page")}
                  >
                    <span className="truncate w-full">Take me to the jobs page</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start text-left h-auto py-3 border-gray-200 rounded-md font-sans"
                    onClick={() => handleSuggestionClick("Go to interview schedule")}
                  >
                    <span className="truncate w-full">Go to interview schedule</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start text-left h-auto py-3 border-gray-200 rounded-md font-sans"
                    onClick={() => handleSuggestionClick("Create a new job listing for Senior Developer")}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="truncate">
                        <div className="font-medium font-sans">Create new job listing</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </>
            ) : null}
          </>
        ) : (
          <div className="flex-grow overflow-hidden flex flex-col min-h-0">
            {/* Messages container with custom scrollbar */}
            <div 
              className={cn(
                "flex-grow overflow-y-auto mb-2 sm:mb-4 pr-2 sm:pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0",
                hideInitialSuggestions ? "" : "h-[500px]"
              )}
              style={{ 
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(203, 213, 225, 0.5) transparent'
              }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg mb-3 ${
                    message.role === "user" ? "bg-blue-100 ml-auto max-w-[80%]" : "bg-gray-100 mr-auto max-w-[80%]"
                  } font-sans`}
                >
                  {message.role === "assistant" ? (
                    <div 
                      className="prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-4 
                               prose-p:mb-2 prose-p:mt-0 prose-hr:my-4 
                               prose-strong:text-indigo-700 prose-li:mb-1"
                      dangerouslySetInnerHTML={{ 
                        __html: formatMarkdown(message.content) 
                      }} 
                    />
                  ) : (
                    message.content
                  )}
                  {isLoading && String(message.id).includes("_streaming") && (
                    <span className="" 
                          style={{ animationDuration: "800ms" }}></span>
                  )}
                </div>
              ))}
              
              {/* Display loading indicator if waiting for response */}
              {isLoading && !messages.some(msg => String(msg.id).includes("_streaming")) && (
                <div className="flex justify-start mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 flex items-center justify-center overflow-hidden animate-pulse">
                    <video
                      src="/orb.webm"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-2 sm:mt-4">
          <div className="relative flex items-center">
            {interimTranscript && (
              <div className="absolute -top-10 left-0 right-0 px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-t-xl border border-blue-100">
                {interimTranscript}
              </div>
            )}
            <div className="relative flex-grow">
              <Input
                name="message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isRecording ? "Listening..." : "Ask me anything..."}
                className={cn(
                  "flex-grow rounded-md font-sans pr-10",
                  interimTranscript ? "rounded-b-md rounded-t-none" : "rounded-md"
                )}
              />
              <button
                type="button"
                onClick={handleMicrophoneClick}
                disabled={!isSpeechSupported || isMicPermissionDenied}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors",
                  isRecording
                    ? "text-red-500 bg-red-50"
                    : isMicPermissionDenied
                        ? "text-red-400 bg-red-50"
                        : isSpeechSupported 
                            ? "text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                            : "text-gray-300 cursor-not-allowed"
                )}
                title={!isSpeechSupported 
                  ? "Speech recognition not supported in this browser" 
                  : isMicPermissionDenied
                      ? "Microphone access denied. Check browser permissions."
                      : isRecording 
                          ? "Stop recording" 
                          : "Start voice input"}
              >
                <CustomMicIcon 
                  isRecording={isRecording} 
                  size={16}
                />
                {isMicPermissionDenied && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>
            </div>
            <Button 
              type="submit" 
              className="ml-2 bg-black text-white rounded-md font-sans" 
              disabled={isLoading || inputValue.trim() === ""}
            >
              {isLoading ? "Thinking..." : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
})

export default AskAdamAdmin
