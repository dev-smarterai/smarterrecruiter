"use client"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { AIVoiceInput } from "@/components/ui/ai-voice-input"
import { RiSendPlaneFill, RiUserLine } from "@remixicon/react"
import { MessageSquare } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Message = {
    id: string
    sender: "ai" | "user"
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

export default function JobInterviewPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            sender: "ai",
            content: "Hello! I'm your AI interviewer today. I'll be asking you some questions about your experience and skills. Are you ready to begin?",
            timestamp: new Date(),
        },
    ])
    const [inputValue, setInputValue] = useState("")
    const [isRecording, setIsRecording] = useState(false)
    const [isThinking, setIsThinking] = useState(false)
    const [recordings, setRecordings] = useState<{ duration: number; timestamp: Date }[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Sample interview questions
    const interviewQuestions = [
        "Can you tell me about your experience with software development?",
        "What are your strongest technical skills?",
        "Can you describe a challenging project you worked on and how you overcame obstacles?",
        "How do you stay updated with the latest technologies?",
        "Where do you see yourself in 5 years?",
        "Do you have any questions about the role or company?",
    ]

    // Autoscroll to bottom of messages
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const handleSendMessage = () => {
        if (inputValue.trim() === "") return

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            content: inputValue,
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInputValue("")
        setIsThinking(true)

        // Simulate AI response after a delay
        setTimeout(() => {
            // Choose a random question or response
            let aiResponse = ""

            if (userMessage.content.toLowerCase().includes("ready") ||
                userMessage.content.toLowerCase().includes("yes")) {
                aiResponse = interviewQuestions[0]
            } else if (userMessage.content.toLowerCase().includes("question")) {
                aiResponse = "We offer competitive salary and benefits, including health insurance, flexible working hours, and professional development opportunities. What aspects of company culture are most important to you?"
            } else {
                // Pick a random follow-up question
                const randomIndex = Math.floor(Math.random() * (interviewQuestions.length - 1)) + 1
                aiResponse = interviewQuestions[randomIndex]
            }

            const aiMessage: Message = {
                id: Date.now().toString(),
                sender: "ai",
                content: aiResponse,
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, aiMessage])
            setIsThinking(false)
        }, 2000)
    }

    const handleRecordingStart = () => {
        setIsRecording(true);
        console.log('Recording started');
    };

    const handleRecordingStop = (duration: number) => {
        setIsRecording(false);
        // Here you would normally implement actual speech recognition
        setInputValue("I have 5 years of experience in full-stack development.");
        setRecordings(prev => [...prev.slice(-4), { duration, timestamp: new Date() }]);
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="mb-6 text-2xl font-bold">AI Job Interview</h1>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* AI Interviewer Visualization */}
                <Card className="flex flex-col items-center justify-center p-6">
                    <AIVoiceInput
                        onStart={handleRecordingStart}
                        onStop={handleRecordingStop}
                        demoMode={false}
                        className="scale-125 my-10"
                    />
                    <p className="text-center text-sm text-gray-500 mt-4">
                        I'm here to interview you for the Software Developer position. Please speak clearly and take your time with responses.
                    </p>
                </Card>

                {/* Chat Interface */}
                <Card className="flex h-[600px] flex-col p-0 overflow-hidden">
                    <div className="border-b border-gray-200 p-4">
                        <h2 className="text-lg font-semibold">Interview Chat</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`flex max-w-[80%] items-start gap-2 rounded-lg p-3 ${message.sender === "user"
                                        ? "bg-indigo-50 text-indigo-900"
                                        : "bg-gray-100 text-gray-900"
                                        }`}
                                >
                                    {message.sender === "ai" ? (
                                        <MessageSquare className="mt-1 h-5 w-5 flex-shrink-0 text-indigo-600" />
                                    ) : (
                                        <RiUserLine className="mt-1 h-5 w-5 flex-shrink-0 text-gray-600" />
                                    )}
                                    <div>
                                        <div className="text-sm">{message.content}</div>
                                        <div className="mt-1 text-right text-xs text-gray-500">
                                            {formatTime(new Date(message.timestamp))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="flex max-w-[80%] items-center gap-2 rounded-lg bg-gray-100 p-3 text-gray-900">
                                    <MessageSquare className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                                    <div className="flex space-x-1">
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-75"></div>
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSendMessage()
                                }}
                                placeholder="Type your response..."
                                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={inputValue.trim() === "" || isThinking}
                                className="flex items-center gap-1"
                            >
                                <RiSendPlaneFill className="h-4 w-4" />
                                Send
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
} 