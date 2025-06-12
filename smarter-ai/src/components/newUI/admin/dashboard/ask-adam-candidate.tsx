"use client"

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Mic } from "lucide-react"
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
import { motion, AnimatePresence } from "framer-motion"

// Define message types for our application
type Message = {
  id: string
  role: "assistant" | "user" | "system"
  content: string
  timestamp: Date
}

// Define component props
interface AskAdamCandidateProps {
  onClose?: () => void
  initialInputValue?: string
  candidateId?: string
  candidateName?: string
  onNavigate?: (route: string) => void
  jobCreationMode?: boolean
  currentJobData?: any
  onJobDataUpdate?: (updates: any) => void
}

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

// Animated Orb Component for Job Generation
const AnimatedJobOrb = ({ message }: { message?: string }) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center mb-4"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="relative w-16 h-16 rounded-full overflow-hidden"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 360]
        }}
        transition={{ 
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 8, repeat: Infinity, ease: "linear" }
        }}
      >
        {/* Outer glow ring */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-blue-500 to-indigo-600"
          animate={{ 
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        
        {/* Inner orb with video */}
        <motion.div 
          className="absolute inset-1 rounded-full overflow-hidden bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300"
          animate={{ 
            scale: [0.95, 1.05, 0.95]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <video
            src="/orb.webm"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Floating particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, Math.cos(i * 120 * Math.PI / 180) * 30],
              y: [0, Math.sin(i * 120 * Math.PI / 180) * 30],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
      
      {/* Animated message text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          className="mt-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <motion.p 
            className="text-sm text-gray-600 font-medium"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {message || "Generating your job posting..."}
          </motion.p>
          
          {/* Typing dots */}
          <div className="flex justify-center space-x-1 mt-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-purple-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// Convert to forwardRef
const AskAdamCandidate = forwardRef<
  { 
    handleSuggestionClick: (suggestion: string) => void,
    setInputValueOnly: (value: string) => void
  },
  AskAdamCandidateProps
>(({ onClose, initialInputValue, onNavigate, jobCreationMode = false, currentJobData = {}, onJobDataUpdate }, ref) => {
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
  const [jobGenerationMessage, setJobGenerationMessage] = useState<string>("")

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
      // Use interactive job creation API if in job creation mode
      if (jobCreationMode) {
        // Convert our messages to the format expected by the interactive job creation API
        const chatMessages = [...messages, userMessage].map(msg => ({
          role: msg.role === "user" ? "user" : "assistant" as const,
          content: msg.content
        }));
        
        // Create streaming ID for ongoing message
        const streamingId = Date.now().toString() + "_streaming";
        let streamingMessageAdded = false;
        let accumulatedContent = "";
        let lastJobDataUpdate = {};
        
        // Set initial generation message
        setJobGenerationMessage("Analyzing your request...");
        
        // Call the interactive job creation API
        console.log('Calling interactive job creation API with:', { chatMessages, currentJobData });
        const response = await fetch('/api/interactiveJobCreation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: chatMessages,
            currentJobData: currentJobData
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`Failed to get job creation response: ${response.status} ${errorText}`);
        }
        
        // Process the streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response reader');
        }
        
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
          while (true) {
            const { value, done } = await reader.read();
            
            if (done) break;
            
            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              
              try {
                const jobResponse = JSON.parse(line);
                console.log('Parsed job response:', jobResponse);
                
                // If this is the first response with content, add streaming message
                if (!streamingMessageAdded && jobResponse.conversationalResponse) {
                  const initialStreamingMessage: Message = {
                    id: streamingId,
                    role: "assistant",
                    content: "",
                    timestamp: new Date(),
                  };
                  
                  setMessages((prev) => {
                    const filteredMessages = prev.filter(msg => 
                      !String(msg.id).includes("_streaming")
                    );
                    return [...filteredMessages, initialStreamingMessage];
                  });
                  
                  setIsLoading(false);
                  streamingMessageAdded = true;
                  setJobGenerationMessage(jobResponse.conversationalResponse);
                }
                
                // Update accumulated content
                if (jobResponse.conversationalResponse) {
                  accumulatedContent = jobResponse.conversationalResponse;
                  
                  // Update the generation message with the conversational response
                  setJobGenerationMessage(jobResponse.conversationalResponse);
                  
                  // Update the streaming message
                  setMessages((prevMessages) => {
                    return prevMessages.map((msg) => {
                      if (String(msg.id).includes(streamingId)) {
                        return { 
                          ...msg, 
                          content: accumulatedContent 
                        };
                      }
                      return msg;
                    });
                  });
                }
                
                // Update job data if provided
                if (jobResponse.jobDataUpdates && Object.keys(jobResponse.jobDataUpdates).length > 0) {
                  lastJobDataUpdate = { ...lastJobDataUpdate, ...jobResponse.jobDataUpdates };
                  if (onJobDataUpdate) {
                    onJobDataUpdate(jobResponse.jobDataUpdates);
                  }
                }
                
                // If streaming is complete, finalize the message
                if (jobResponse._incomplete === false) {
                  setMessages((prevMessages) => {
                    const filteredMessages = prevMessages.filter(msg => 
                      !String(msg.id).includes("_streaming")
                    );
                    
                    const finalMessage: Message = {
                      id: Date.now().toString(),
                      role: "assistant",
                      content: accumulatedContent || "I've updated the job posting based on our conversation.",
                      timestamp: new Date(),
                    };
                    
                    return [...filteredMessages, finalMessage];
                  });
                  
                  setIsLoading(false);
                  setJobGenerationMessage(""); // Clear the generation message
                  return; // Exit the function
                }
                
                // Scroll to bottom during streaming
                throttledScrollToBottom();
                
              } catch (error) {
                console.error("Error parsing job creation response line:", line, error);
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        setIsLoading(false);
        setJobGenerationMessage(""); // Clear the generation message
        return;
      }
      
      // Original chat logic for non-job creation mode
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
      
      // Reset accumulated chunks
      accumulatedChunksRef.current = "";
      lastUpdateTimestampRef.current = 0;
      
      const result = await sendChatRequest(aiMessages, {
        stream: true,
        includeDatabase: true,
        onChunk: (chunk) => {
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
          // Replace streaming message with final message
          setMessages((prevMessages) => {
            // Remove any streaming messages first
            const filteredMessages = prevMessages.filter(msg => 
              !String(msg.id).includes("_streaming")
            );
            
            // Add the final message
            const finalMessage: Message = {
              id: Date.now().toString(),
              role: "assistant",
              content: fullResponse,
              timestamp: new Date(),
            };
            
            return [...filteredMessages, finalMessage];
          });
          
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
      
      // Handle non-streaming path
      if (!result.streaming) {
        setIsLoading(false);
        
        if (result.success && result.message) {
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
      setJobGenerationMessage(""); // Clear the generation message on error
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    // Don't auto-submit, just populate the input field
  }

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    handleSuggestionClick,
    setInputValueOnly
  }));

  return (
    <div className="w-full h-full max-w-md max-h-[400px] bg-white rounded-3xl flex flex-col items-center justify-center p-8 relative">
      {onClose && (
        <Button variant="ghost" onClick={onClose} className="absolute top-4 right-4 h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      )}
      
      {/* Display voice recording warning if applicable */}
      {voiceRecordingWarning && (
        <div className="absolute top-4 left-4 right-16 bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-2 text-xs flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{voiceRecordingWarning}</span>
        </div>
      )}
      
      {messages.length === 0 ? (
        <>
          {/* Orb */}
          <div className="w-32 h-32 rounded-full bg-white">
            <video
              src="/orb.webm"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          
          {/* Main Question */}
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-6 max-w-md">
            How can I help you today?
          </h2>
          
          {/* Suggestion Buttons */}
          <div className="space-y-3 w-full max-w-md mb-6">
            {jobCreationMode ? (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-center text-center h-auto py-3 bg-gray-50 border-gray-200 rounded-2xl font-medium text-gray-700 hover:bg-gray-100 hover:shadow-md transition-all duration-200 text-xs leading-tight px-4 overflow-hidden"
                  onClick={() => handleSuggestionClick("Create a Senior Software Engineer job posting for a remote position, $120k-150k, requiring React and Node.js")}
                >
                  Senior Software Engineer job
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-center text-center h-auto py-3 bg-gray-50 border-gray-200 rounded-2xl font-medium text-gray-700 hover:bg-gray-100 hover:shadow-md transition-all duration-200 text-xs leading-tight px-4 overflow-hidden"
                  onClick={() => handleSuggestionClick("I need to hire a Digital Marketing Manager, mid-level, remote work")}
                >
                  Mid-level Marketing Manager
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-center text-center h-auto py-3 bg-gray-50 border-gray-200 rounded-2xl font-medium text-gray-700 hover:bg-gray-100 hover:shadow-md transition-all duration-200 text-xs leading-tight px-4 overflow-hidden"
                  onClick={() => handleSuggestionClick("Help me create a Sales Consultant job posting with B2B experience requirements")}
                >
                  Sales Consultant
                </Button>
              </>
            ) : (
              <>
            
                <Button
                  variant="outline"
                  className="w-full justify-center text-center h-auto py-4 bg-gray-50 border-gray-200 rounded-2xl font-medium text-gray-700 hover:bg-gray-100 hover:shadow-md transition-all duration-200 text-sm leading-tight px-6 overflow-hidden"
                  onClick={() => handleSuggestionClick("Tell me about my top candidate")}
                >
                  Tell me about my top candidate
                </Button>
              </>
            )}
          </div>
          
          {/* Input Section */}
          <div className="w-full max-w-md mt-4">
            
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative">
              {interimTranscript && (
                <div className="absolute -top-12 left-0 right-0 px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-t-xl border border-blue-100">
                  {interimTranscript}
                </div>
              )}
              <div className="relative flex items-center">
                <Input
                  name="message"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isRecording ? "Listening..." : "Ask me anything..."}
                  className={cn(
                    "flex-grow rounded-2xl bg-gray-50 border-gray-200 pr-12 py-3 text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    interimTranscript ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"
                  )}
                />
                <button
                  type="button"
                  onClick={handleMicrophoneClick}
                  disabled={!isSpeechSupported || isMicPermissionDenied}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors",
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
            </form>
          </div>
        </>
      ) : (
        <div className="flex-grow overflow-hidden flex flex-col min-h-0 w-full">
          {/* Messages container with custom scrollbar */}
          <div 
            className="flex-grow overflow-y-auto mb-4 pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0"
            style={{ 
              overflowX: 'hidden',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(203, 213, 225, 0.5) transparent'
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-2xl mb-4 ${
                  message.role === "user" 
                    ? "bg-blue-500 text-white ml-auto max-w-[80%]" 
                    : "bg-gray-50 text-gray-800 mr-auto max-w-[80%] shadow-sm"
                }`}
                style={{
                  display: jobCreationMode && String(message.id).includes("_streaming") ? "none" : "block"
                }}
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
                  <span className="animate-pulse">●</span>
                )}
              </div>
            ))}
            
            {/* Display loading indicator if waiting for response */}
            {isLoading && !messages.some(msg => String(msg.id).includes("_streaming")) && (
              <div className="flex justify-start mb-4">
                {jobCreationMode ? (
                  <AnimatedJobOrb message={jobGenerationMessage} />
                ) : (
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
                )}
              </div>
            )}
            
            {/* Display animated orb during job creation streaming */}
            {jobCreationMode && messages.some(msg => String(msg.id).includes("_streaming")) && (
              <div className="flex justify-start mb-4">
                <AnimatedJobOrb message={jobGenerationMessage} />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input form for chat mode */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative flex items-center">
              {interimTranscript && (
                <div className="absolute -top-12 left-0 right-0 px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-t-xl border border-blue-100">
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
                    "flex-grow rounded-2xl bg-gray-50 border-gray-200 pr-12 py-3",
                    interimTranscript ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"
                  )}
                />
                <button
                  type="button"
                  onClick={handleMicrophoneClick}
                  disabled={!isSpeechSupported || isMicPermissionDenied}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors",
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
                className="ml-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-6 py-3" 
                disabled={isLoading || inputValue.trim() === ""}
              >
                {isLoading ? "Thinking..." : "Send"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
})

AskAdamCandidate.displayName = "AskAdamCandidate"

export default AskAdamCandidate 