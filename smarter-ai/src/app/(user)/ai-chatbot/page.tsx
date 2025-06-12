"use client"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import { RiSendPlaneFill } from "@remixicon/react"
import { Bot } from "lucide-react"
import { useState, useRef, useEffect, Suspense } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth"
import { useSearchParams, useRouter } from "next/navigation"
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

// Define message types for our application
type Message = {
    id: string
    role: "assistant" | "user" | "system"
    content: string
    timestamp: Date
}

// Custom time formatter to ensure consistent formatting between server and client
const formatTime = (date: Date) => {
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
};

// Add the formatMarkdown function similar to the one in v0-ai-chat.tsx
const formatMarkdown = (text: string): string => {
  try {
    // Configure marked for our specific needs
    marked.setOptions({
      gfm: true,
      breaks: true
    });
    
    // Convert markdown to HTML
    const html = marked.parse(text);
    const htmlString = typeof html === 'string' ? html : String(html);
    
    // Sanitize the HTML to prevent XSS
    const sanitized = DOMPurify.sanitize(htmlString, {
      ADD_ATTR: ['class'], // Allow class attributes for styling
    });
    
    return sanitized;
  } catch (error) {
    console.error('Error formatting markdown:', error);
    return text;
  }
};

// Main component with the chat functionality
const ChatbotContent: React.FC<{ urlJobId?: string | null }> = ({ urlJobId }) => {
    const router = useRouter();
    
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hello! I'm here to help with any questions about the job you applied for. What would you like to know?",
            timestamp: new Date(),
        },
    ])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [streamingMessage, setStreamingMessage] = useState<string>("")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    
    // Add a ref to the ChatInput for focusing
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    // Reference to track accumulated chunks between UI updates
    const accumulatedChunksRef = useRef<string>("")
    // Last UI update timestamp to throttle updates
    const lastUpdateTimestampRef = useRef<number>(0)
    // Reference to track scroll timeout
    const scrollToBottomTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    
    // Get user information
    const { user } = useAuth()
    
    // Get candidate information
    const candidatesData = useQuery(
        api.candidates.getCandidatesByUserId,
        user?._id ? { userId: user._id } : "skip"
    )
    
    // Get the first candidate if available (most users will have only one candidate profile)
    const candidateData = candidatesData && candidatesData.length > 0 ? candidatesData[0] : null;
    
    // Get job ID from candidate meetingCode
    const jobId = candidateData?.meetingCode || urlJobId;
    
    // Function to scroll to bottom of messages
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            // Use requestAnimationFrame to ensure scrolling happens after DOM updates
            requestAnimationFrame(() => {
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
            });
        }
    };

    // Throttled version of scrollToBottom to prevent too many scroll events during streaming
    const throttledScrollToBottom = () => {
        if (!scrollToBottomTimeoutRef.current) {
            scrollToBottomTimeoutRef.current = setTimeout(() => {
                scrollToBottom();
                scrollToBottomTimeoutRef.current = null;
            }, 100); // Limit to at most once every 100ms
        }
    };
    
    // Scroll to bottom of messages when they change
    useEffect(() => {
        // Only scroll to bottom when a new complete message is added (not during streaming)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && !String(lastMessage.id).includes("_streaming")) {
            scrollToBottom();
        }
    }, [messages]);

    // Clean up any pending scroll timeout when component unmounts
    useEffect(() => {
        return () => {
            if (scrollToBottomTimeoutRef.current) {
                clearTimeout(scrollToBottomTimeoutRef.current);
            }
        };
    }, []);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (inputValue.trim() === "") return
        
        // Make sure we have a candidate ID
        if (!candidateData || !candidateData._id) {
            setMessages(prev => [
                ...prev, 
                {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: "Sorry, I can't find your candidate profile. Please try again later or contact support.",
                    timestamp: new Date(),
                }
            ]);
            return;
        }

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

        try {
            // Prepare conversation history
            const conversation = [
                // Add previous messages (excluding system messages)
                ...messages
                    .filter(msg => msg.role !== "system")
                    .map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                
                // Add the new user message
                { role: userMessage.role, content: userMessage.content }
            ];
            
            console.log("Sending chat request with jobId:", jobId);
            
            // Create streaming ID for the ongoing message
            const streamingId = Date.now().toString() + "_streaming";
            let streamingMessageAdded = false;
            
            // Reset accumulated chunks
            accumulatedChunksRef.current = "";
            lastUpdateTimestampRef.current = 0;
            
            // Call our job-applicant-chat API with streaming enabled
            const response = await fetch('/api/job-applicant-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    messages: conversation,
                    candidateId: candidateData._id,
                    jobId: jobId || undefined,
                    stream: true, // Request streaming response
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            
            if (!response.body) {
                throw new Error("Response body is null");
            }
            
            // Process the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = "";
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        break;
                    }
                    
                    // Decode the chunk
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            
                            if (data === '[DONE]') {
                                continue;
                            }
                            
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.content || '';
                                
                                if (content) {
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
                                        
                                        streamingMessageAdded = true;
                                    }
                                    
                                    // Add chunk to accumulated text
                                    accumulatedChunksRef.current += content;
                                    // Update total streaming message (for reference)
                                    fullResponse += content;
                                    
                                    // Check if it's time to update the UI
                                    const now = Date.now();
                                    if (now - lastUpdateTimestampRef.current > 50 || content.includes('\n')) {
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
                                }
                            } catch (e) {
                                console.error('Error parsing streaming data:', e);
                            }
                        }
                    }
                }
                
                // Add any remaining accumulated chunks to the final response
                if (accumulatedChunksRef.current) {
                    fullResponse += accumulatedChunksRef.current;
                    
                    // Update the streaming message with remaining chunks
                    setMessages((prevMessages) => {
                        return prevMessages.map((msg) => {
                            if (String(msg.id).includes(streamingId)) {
                                return { 
                                    ...msg, 
                                    content: (msg.content || "") + accumulatedChunksRef.current 
                                };
                            }
                            return msg;
                        });
                    });
                    
                    accumulatedChunksRef.current = "";
                }
                
                // Replace streaming message with final message
                setMessages((prevMessages) => {
                    // Remove any streaming messages
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
                
                setStreamingMessage("");
                
            } catch (streamError) {
                console.error("Error processing stream:", streamError);
                
                // If we have a partial response, use it instead of a generic error
                if (fullResponse.trim().length > 0) {
                    // Replace streaming message with what we have so far
                    setMessages((prevMessages) => {
                        // Remove any streaming messages
                        const filteredMessages = prevMessages.filter(msg => 
                            !String(msg.id).includes("_streaming")
                        );
                        
                        // Add what we have as the final message
                        const finalMessage: Message = {
                            id: Date.now().toString(),
                            role: "assistant",
                            content: fullResponse,
                            timestamp: new Date(),
                        };
                        
                        return [...filteredMessages, finalMessage];
                    });
                } else {
                    // No usable response, show error message
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
        } finally {
            setIsLoading(false);
        }
    };

    // Add loading state for candidate data
    if (candidatesData === undefined) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Loading user profile...</p>
            </div>
        );
    }

    // Handle case where user isn't logged in or has no candidate profile
    if (!user) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 bg-white">
                <Card className="p-8 text-center">
                    <h2 className="text-lg font-semibold mb-2">Please log in</h2>
                    <p className="text-gray-600">You need to be logged in to chat about your job application.</p>
                </Card>
            </div>
        );
    }

    if (user && !candidateData) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 bg-white">
                <Card className="p-8 text-center">
                    <h2 className="text-lg font-semibold mb-2">No candidate profile found</h2>
                    <p className="text-gray-600">You need to complete your candidate profile before chatting about applications.</p>
                </Card>
            </div>
        );
    }


    return (
        <div className="mx-auto max-w-4xl px-2 md:px-4 py-4 md:py-8 min-h-screen">
            {/* <h1 className="mb-2 text-2xl font-bold">Job Application Assistant</h1>
            <p className="mb-6 text-sm text-gray-600">
                Ask me any questions about the job you've applied for, including responsibilities, requirements, 
                or application status.
            </p> */}

            {/* Responsive layout: stack on mobile, grid on md+ */}
            <div className="flex flex-col md:grid md:grid-cols-7 md:gap-6 md:h-[600px]">
                {/* Suggested Prompts (2/7) */}
                <div className="hidden md:flex col-span-2 bg-white rounded-2xl p-6 flex-col items-center justify-start">
                    <div className="mb-4 w-20 h-20 rounded-full overflow-hidden">
                        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                            <source src="./orb-fixed.mp4" type="video/mp4" />
                        </video>
                    </div>
                    <h2 className="text-xl font-bold mb-4 text-gray-900 text-center">Adam Suggested prompts</h2>
                    <ul className="space-y-3 w-full flex flex-col items-center">
                        {[
                            "What are the key responsibilities?",
                            "Can you describe the team structure?",
                            "How is performance typically measured?",
                            "What growth opportunities, are available?",
                            "Is prior experience required for the role ?",
                            "What are the company's goals for this role?",
                        ].map((prompt, idx) => (
                            <li key={idx} className="w-full flex justify-center">
                                <button
                                    type="button"
                                    className="w-full max-w-xs text-center px-4 py-2 rounded-lg text-sm bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-medium transition shadow-sm"
                                    onClick={() => {
                                        setInputValue(prompt);
                                        // Focus the input after setting value
                                        setTimeout(() => {
                                            if (inputRef.current) inputRef.current.focus();
                                        }, 0);
                                    }}
                                >
                                    {prompt}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Chat (5/7) */}
                <div className="flex-1 md:col-span-5 h-full flex flex-col">
                    <Card className="flex flex-1 flex-col p-0 overflow-hidden h-full bg-indigo-50 rounded-3xl shadow-lg">
                        <div className="border-b border-gray-200 p-4">
                            <div className="flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full overflow-hidden">
                                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                        <source src="./orb-fixed.mp4" type="video/mp4" />
                                    </video>
                                </div>
                            </div>
                        </div>

                        {/* Fixed height chat container with scroll */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto"
                            style={{ height: '480px', minHeight: '480px', maxHeight: '480px' }}
                        >
                            <ChatMessageList>
                                {messages.map((message) => (
                                    <ChatBubble
                                        key={message.id}
                                        variant={message.role === "user" ? "sent" : "received"}
                                    >
                                        {message.role === "user" ? (
                                            <ChatBubbleAvatar
                                                className="h-8 w-8 shrink-0 bg-indigo-800 text-blue-600"
                                                fallback=""
                                            />
                                        ) : (
                                            <ChatBubbleAvatar
                                                className="h-8 w-8 shrink-0 bg-indigo-100 text-indigo-600"
                                                fallback=""
                                                videoSrc="./orb-fixed.mp4"
                                            >
                                                {/* Bot icon as fallback if video fails */}
                                                <Bot size={16} />
                                            </ChatBubbleAvatar>
                                        )}
                                        <ChatBubbleMessage
                                            variant={message.role === "user" ? "sent" : "received"}
                                        >
                                            <div>
                                                {message.role === "user" ? (
                                                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                                ) : (
                                                    <div 
                                                        className="prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-4 
                                                                   prose-p:mb-2 prose-p:mt-0 prose-hr:my-4 prose-hr:border-gray-200
                                                                   prose-strong:text-indigo-700 prose-li:mb-1
                                                                   prose-h2:text-lg prose-h2:font-bold prose-h2:text-indigo-800 
                                                                   prose-h2:pb-1 prose-h2:border-b prose-h2:border-indigo-100
                                                                   prose-h3:text-base prose-h3:font-semibold prose-h3:text-indigo-600"
                                                        dangerouslySetInnerHTML={{ 
                                                            __html: formatMarkdown(message.content) 
                                                        }} 
                                                    />
                                                )}
                                                <div className="mt-1 text-right text-xs text-gray-500">
                                                    {formatTime(new Date(message.timestamp))}
                                                </div>
                                            </div>
                                        </ChatBubbleMessage>
                                    </ChatBubble>
                                ))}

                                {isLoading && !messages.some(msg => String(msg.id).includes("_streaming")) && (
                                    <ChatBubble variant="received">
                                        <ChatBubbleAvatar
                                            className="h-8 w-8 shrink-0 bg-indigo-100 text-indigo-600"
                                            fallback=""
                                            videoSrc="./orb-fixed.mp4"
                                        >
                                            <Bot size={16} />
                                        </ChatBubbleAvatar>
                                        <ChatBubbleMessage isLoading />
                                    </ChatBubble>
                                )}
                                <div ref={messagesEndRef} />
                            </ChatMessageList>
                        </div>

                        <div className="border-t border-gray-200 p-4">
                            <form
                                onSubmit={handleSendMessage}
                                className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
                            >
                                <ChatInput
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Ask about job requirements, responsibilities, or your application status..."
                                    className="min-h-12  resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <div className="flex items-center p-3 pt-0 justify-end">
                                    <Button
                                        type="submit"
                                        disabled={inputValue.trim() === "" || isLoading}
                                        className="flex items-center gap-1"
                                    >
                                        <RiSendPlaneFill className="h-4 w-4" />
                                        {isLoading ? "Thinking..." : "Send"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            </div>
            {/* TODO: Update chat theme to match Figma design */}
        </div>
    );
}

// Helper component to read searchParams inside Suspense boundary
const ChatbotLoader: React.FC = () => {
    const searchParams = useSearchParams();
    // Get jobId from URL, but we'll prioritize the candidate's meetingCode
    const urlJobId = searchParams.get("jobId");
    
    return <ChatbotContent urlJobId={urlJobId} />;
}

// Main page component with Suspense boundary
export default function AIChatbotPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full py-8">
                <div className="w-full max-w-md">
                    <Card className="bg-white">
                        <div className="p-6 text-center">
                            <div className="flex justify-center my-6">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                            </div>
                            <h2 className="text-lg font-semibold mb-2">Loading Application Assistant</h2>
                            <p className="text-gray-600">Please wait...</p>
                        </div>
                    </Card>
                </div>
            </div>
        }>
            <ChatbotLoader />
        </Suspense>
    );
} 