"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth"
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

// Define message types for our application
type Message = {
  id: string
  role: "assistant" | "user" | "system"
  content: string
  timestamp: Date
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

const AskAdam = () => {
  const [chatMode, setChatMode] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const accumulatedChunksRef = useRef<string>("")
  const lastUpdateTimestampRef = useRef<number>(0)
  const scrollToBottomTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get user information
  const { user } = useAuth()
  
  // Get candidate information
  const candidatesData = useQuery(
    api.candidates.getCandidatesByUserId,
    user?._id ? { userId: user._id } : "skip"
  )
  
  // Get the first candidate if available
  const candidateData = candidatesData && candidatesData.length > 0 ? candidatesData[0] : null

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
        scrollToBottom()
        scrollToBottomTimeoutRef.current = null
      }, 100) // Limit to at most once every 100ms
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    // Only scroll to bottom when a new complete message is added (not during streaming)
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && !String(lastMessage.id).includes("_streaming")) {
      scrollToBottom()
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
      ])
      return
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
    setChatMode(true)

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
      ]
      
      // Create streaming ID for the ongoing message
      const streamingId = Date.now().toString() + "_streaming"
      let streamingMessageAdded = false
      
      // Reset accumulated chunks
      accumulatedChunksRef.current = ""
      lastUpdateTimestampRef.current = 0
      
      // Call our job-applicant-chat API with streaming enabled
      const response = await fetch('/api/job-applicant-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: conversation,
          candidateId: candidateData._id,
          jobId: candidateData.meetingCode || undefined,
          stream: true, // Request streaming response
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }
      
      if (!response.body) {
        throw new Error("Response body is null")
      }
      
      // Process the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            break
          }
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(line => line.trim() !== '')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                continue
              }
              
              try {
                const parsed = JSON.parse(data)
                const content = parsed.content || ''
                
                if (content) {
                  // If this is the first chunk, add a streaming message
                  if (!streamingMessageAdded) {
                    const initialStreamingMessage: Message = {
                      id: streamingId,
                      role: "assistant",
                      content: "",
                      timestamp: new Date(),
                    }
                    
                    // Add streaming message
                    setMessages((prev) => {
                      // Filter out any existing streaming messages
                      const filteredMessages = prev.filter(msg => 
                        !String(msg.id).includes("_streaming")
                      )
                      return [...filteredMessages, initialStreamingMessage]
                    })
                    
                    streamingMessageAdded = true
                  }
                  
                  // Add chunk to accumulated text
                  accumulatedChunksRef.current += content
                  // Update total streaming message (for reference)
                  fullResponse += content
                  
                  // Check if it's time to update the UI
                  const now = Date.now()
                  if (now - lastUpdateTimestampRef.current > 50 || content.includes('\n')) {
                    // At least 50ms have passed or newline received - update the UI
                    const batchedChunk = accumulatedChunksRef.current
                    accumulatedChunksRef.current = "" // Reset accumulated text
                    lastUpdateTimestampRef.current = now
                    
                    // Update the streaming message with the new content
                    setMessages((prevMessages) => {
                      return prevMessages.map((msg) => {
                        if (String(msg.id).includes(streamingId)) {
                          return { 
                            ...msg, 
                            content: (msg.content || "") + batchedChunk 
                          }
                        }
                        return msg
                      })
                    })
                    
                    // Scroll to bottom during streaming
                    throttledScrollToBottom()
                  }
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e)
              }
            }
          }
        }
        
        // Add any remaining accumulated chunks to the final response
        if (accumulatedChunksRef.current) {
          fullResponse += accumulatedChunksRef.current
          
          // Update the streaming message with remaining chunks
          setMessages((prevMessages) => {
            return prevMessages.map((msg) => {
              if (String(msg.id).includes(streamingId)) {
                return { 
                  ...msg, 
                  content: (msg.content || "") + accumulatedChunksRef.current 
                }
              }
              return msg
            })
          })
          
          accumulatedChunksRef.current = ""
        }
        
        // Replace streaming message with final message
        setMessages((prevMessages) => {
          // Remove any streaming messages
          const filteredMessages = prevMessages.filter(msg => 
            !String(msg.id).includes("_streaming")
          )
          
          // Add the final message
          const finalMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: fullResponse,
            timestamp: new Date(),
          }
          
          return [...filteredMessages, finalMessage]
        })
        
      } catch (streamError) {
        console.error("Error processing stream:", streamError)
        
        // If we have a partial response, use it instead of a generic error
        if (fullResponse.trim().length > 0) {
          // Replace streaming message with what we have so far
          setMessages((prevMessages) => {
            // Remove any streaming messages
            const filteredMessages = prevMessages.filter(msg => 
              !String(msg.id).includes("_streaming")
            )
            
            // Add what we have as the final message
            const finalMessage: Message = {
              id: Date.now().toString(),
              role: "assistant",
              content: fullResponse,
              timestamp: new Date(),
            }
            
            return [...filteredMessages, finalMessage]
          })
        } else {
          // No usable response, show error message
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
            timestamp: new Date(),
          }
          
          setMessages(prev => {
            // Remove any streaming messages
            const filteredMessages = prev.filter(msg => 
              !String(msg.id).includes("_streaming")
            )
            return [...filteredMessages, errorMessage]
          })
        }
      }
      
    } catch (error) {
      console.error("Error getting AI response:", error)
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }
      
      setMessages(prev => {
        // Remove any streaming messages
        const filteredMessages = prev.filter(msg => 
          !String(msg.id).includes("_streaming")
        )
        return [...filteredMessages, errorMessage]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    handleSubmit()
  }

  return (
    <div className="bg-indigo-50 p-6 rounded-lg shadow-sm h-full flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-6 h-6 text-purple-400 mr-2">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-purple-400 font-sans">Ask Adam</h2>
      </div>

      <div className="flex-grow flex flex-col bg-white rounded-lg p-6 border-2 border-blue-400">
        {messages.length === 0 ? (
          <>
            <div className="flex-grow flex flex-col items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 mb-6 flex items-center justify-center overflow-hidden">
                {/* Orb video */}
                <video
                  src="./orb-fixed.mp4"
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
                onClick={() => handleSuggestionClick("What are the most important soft skills for this role?")}
              >
                What soft skills do I need?
              </Button>
              <Button
                variant="outline"
                className="justify-start text-left h-auto py-3 border-gray-200 rounded-md font-sans"
                onClick={() => handleSuggestionClick("Am I a good fit for this role?")}
              >
                Am I a good fit for this role?
              </Button>
              <Button
                variant="outline"
                className="justify-start text-left h-auto py-3 border-gray-200 rounded-md font-sans overflow-hidden"
                onClick={() => handleSuggestionClick("How closely do my technical skills align with the requirements of this role?")}
              >
                How closely my technical skills align?
              </Button>
              <Button
                variant="outline"
                className="justify-start text-left h-auto py-3 border-gray-200 rounded-md font-sans"
                onClick={() => handleSuggestionClick("Summarize my CV.")}
              >
              <div className="flex items-center space-x-3 p-3 border rounded-md border-gray-200">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>
                
                <div>
              
                  <div className="font-medium font-sans">Candidate Summary</div>
                  
                </div>
               
              </div>
            
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-grow overflow-hidden flex flex-col">
            {/* Fixed height scroll area for messages */}
            <div className="flex-grow overflow-y-auto mb-4 pr-2" style={{ height: '300px' }}>
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
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 flex items-center justify-center overflow-hidden animate-pulse">
                    <video
                      src="./orb-fixed.mp4"
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

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex items-center">
            <Input
              name="message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-grow rounded-md font-sans"
            />
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
}

export default AskAdam
