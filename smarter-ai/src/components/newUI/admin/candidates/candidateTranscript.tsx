"use client"

import { useState, useRef } from "react"
import { ArrowUpRight, X } from "lucide-react"

interface Message {
  id: string
  sender: string
  avatar: string
  content: string
  timestamp: string
}

interface TranscriptProps {
  transcript: Message[]
}

// Helper function to format an ISO date to a more readable format if needed
const formatTimestamp = (timestamp: string): string => {
  try {
    // Just return the original timestamp for now
    return timestamp;
  } catch (e) {
    return timestamp;
  }
}

export default function TranscriptViewer({ transcript }: TranscriptProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  
  // Generate sequential timestamps based on transcript length
  //const timestamps = createSequentialTimestamps(transcript.length)

  return (
    <>
      {/* Main transcript card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm w-full h-[500px] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Transcript</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-8 w-8 rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/50 flex items-center justify-center transition-colors"
          >
            <ArrowUpRight className="h-4 w-4 text-purple-700 dark:text-purple-300" />
          </button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto p-4">
          {transcript.length > 0 ? (
            transcript.map((message, index) => (
              <div key={message.id} className="flex relative">
                {/* Avatar - special case for AI/Adam */}
                <div className="z-10">
                  {message.sender === 'Adam' || message.sender === 'AI Interviewer' ? (
                    <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                      <video 
                        ref={el => videoRefs.current[message.id] = el}
                        className="h-full w-full object-cover"
                        src="/orb.webm"
                        muted
                        loop
                        playsInline
                        autoPlay
                        onLoadedData={(e) => e.currentTarget.play().catch(err => console.log("Autoplay prevented:", err))}
                      />
                    </div>
                  ) : (
                    <div className={`h-10 w-10 rounded-full overflow-hidden flex items-center justify-center 
                      bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`}>
                      {message.avatar ? (
                        <img
                          src={message.avatar}
                          alt={`${message.sender}'s avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {message.sender.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Timeline connector */}
                {index < transcript.length - 1 && (
                  <div className="absolute left-5 top-10 w-[1px] h-[calc(100%+1.5rem)] bg-gray-200 dark:bg-gray-700" />
                )}

                {/* Message content */}
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {message.sender === 'AI Interviewer' ? 'Adam' : message.sender}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {/* {message.timestamp} */}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 mb-3 text-gray-300 dark:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No transcript available</p>
            </div>
          )}
        </div>
      </div>

      {/* Custom modal for full transcript */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Full Transcript</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              <div className="space-y-8">
                {transcript.map((message, index) => (
                  <div key={message.id} className="flex relative">
                    {/* Avatar - special case for AI/Adam */}
                    <div className="z-10">
                      {message.sender === 'Adam' || message.sender === 'AI Interviewer' ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                          <video 
                            className="h-full w-full object-cover"
                            src="/orb.webm"
                            muted
                            loop
                            autoPlay
                            playsInline
                            onLoadedData={(e) => e.currentTarget.play().catch(err => console.log("Autoplay prevented:", err))}
                          />
                        </div>
                      ) : (
                        <div className={`h-10 w-10 rounded-full overflow-hidden flex items-center justify-center 
                          bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`}>
                          {message.avatar ? (
                            <img
                              src={message.avatar}
                              alt={`${message.sender}'s avatar`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {message.sender.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timeline connector */}
                    {index < transcript.length - 1 && (
                      <div className="absolute left-5 top-10 w-[1px] h-[calc(100%+2rem)] bg-gray-200 dark:bg-gray-700" />
                    )}

                    {/* Message content */}
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {message.sender === 'AI Interviewer' ? 'Adam' : message.sender}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {/* {message.timestamp} */}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
