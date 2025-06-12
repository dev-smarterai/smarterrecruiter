"use client"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { cx } from "@/lib/utils"
import { RiArrowLeftLine, RiMagicLine, RiSendPlaneLine, RiFileCopyLine, RiCheckLine } from "@remixicon/react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../../convex/_generated/api"
import { Id } from "../../../../../../../convex/_generated/dataModel"

// Sample data structures
interface Message {
    id: string;
    sender: "ai" | "user";
    text: string;
    timestamp: Date;
}

export default function InterviewPreviewPage() {
    const params = useParams();
    const jobId = params.id as string;
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch job data from Convex
    const job = useQuery(api.jobs.getJob, jobId ? { id: jobId as Id<"jobs"> } : "skip");
    
    // Fetch AI interviewer configuration from Convex
    const aiConfig = useQuery(api.jobs.getAiInterviewerConfig, 
        jobId ? { jobId: jobId as Id<"jobs"> } : "skip"
    );

    // Generate the Eleven Labs prompt
    const elevenLabsPrompt = useQuery(api.jobs.generateElevenLabsPrompt, 
        jobId ? { jobId: jobId as Id<"jobs"> } : "skip"
    );

    // Initialize with AI introduction message when job data is loaded
    useEffect(() => {
        if (job && aiConfig) {
            setTimeout(() => {
                setMessages([
                    {
                        id: "1",
                        sender: "ai",
                        text: aiConfig.introduction || `Hello! I'm your AI interviewer for the ${job.title} position at ${job.company}. I'll be asking you some questions to learn about your experience and skills. When you're ready to begin, just say hello or introduce yourself.`,
                        timestamp: new Date()
                    }
                ]);
            }, 1000);
        }
    }, [job, aiConfig]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");

        // Simulate AI thinking
        setIsTyping(true);

        // Simulate AI response with a question from the aiConfig if available
        setTimeout(() => {
            let aiResponseText = "Thank you for your response.";
            
            // Use questions from the AI interviewer configuration if available
            if (aiConfig && aiConfig.questions && aiConfig.questions.length > 0) {
                const questionIndex = Math.min(Math.floor(messages.length / 2), aiConfig.questions.length - 1);
                aiResponseText = aiConfig.questions[questionIndex].text;
            } else {
                // Fallback to some generic questions
                const aiResponses = [
                    "Great! Let's start with your background. Can you tell me about your experience with technologies relevant to this role?",
                    "That's helpful to know. How would you describe your approach to problem-solving in your work?",
                    "Interesting. Can you share an example of a challenging project you worked on and how you overcame obstacles?",
                    "Thank you for sharing that. What would you say are your top three strengths that make you a good fit for this position?",
                    "Let's talk about your career goals. Where do you see yourself professionally in the next 3-5 years?",
                    "That concludes our interview questions. Do you have any questions for me about the role or the company?"
                ];
                const responseIndex = Math.min(Math.floor(messages.length / 2), aiResponses.length - 1);
                aiResponseText = aiResponses[responseIndex];
            }

            const aiMessage: Message = {
                id: Date.now().toString(),
                sender: "ai",
                text: aiResponseText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);
        }, 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const copyToClipboard = () => {
        if (elevenLabsPrompt) {
            navigator.clipboard.writeText(elevenLabsPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!job) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Loading interview...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                    <div className="flex items-center">
                        <Link
                            href="/jobs/ai-interviewer"
                            className="mr-4 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm hover:shadow-md transition-all"
                        >
                            <RiArrowLeftLine className="h-5 w-5 text-purple-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
                                <RiMagicLine className="h-5 w-5 text-purple-600 mr-2" />
                                AI Interview Simulation
                            </h1>
                            <p className="text-sm text-gray-500">
                                {job.title} at {job.company}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant={showPrompt ? "primary" : "secondary"} 
                            onClick={() => setShowPrompt(!showPrompt)}
                            className={showPrompt 
                                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-sm" 
                                : "bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 shadow-sm"}
                        >
                            {showPrompt ? "Hide Prompt" : "View Eleven Labs Prompt"}
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={() => window.location.href = "/jobs/ai-interviewer"}
                            className="bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 shadow-sm"
                        >
                            Exit Interview
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col h-[calc(100vh-10rem)]">
                    {showPrompt && elevenLabsPrompt && (
                        <div className="mb-6">
                            <Card className="p-6 border-0 rounded-xl shadow-md bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                                            <RiFileCopyLine className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-800">Eleven Labs Prompt</h2>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        className="text-sm py-2 px-3 h-auto flex items-center gap-1 text-purple-700 hover:bg-purple-50" 
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? <RiCheckLine className="h-4 w-4 text-purple-600" /> : <RiFileCopyLine className="h-4 w-4" />}
                                        {copied ? "Copied!" : "Copy to Clipboard"}
                                    </Button>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 overflow-auto max-h-[200px] shadow-inner">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{elevenLabsPrompt}</pre>
                                </div>
                            </Card>
                        </div>
                    )}

                    <Card className="mb-4 p-4 bg-purple-50 border-purple-200 shadow-md">
                        <h3 className="font-medium text-purple-800 mb-2 flex items-center">
                            <RiMagicLine className="h-5 w-5 mr-2" />
                            Interview Simulation
                        </h3>
                        <p className="text-sm text-purple-700">
                            This is a preview of how the AI interviewer would interact with candidates.
                            You can test the interview flow by responding to the AI's questions.
                        </p>
                    </Card>

                    <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-6 mb-6 shadow-md">
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cx(
                                        "flex",
                                        message.sender === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cx(
                                            "max-w-[80%] rounded-lg p-3",
                                            message.sender === "user"
                                                ? "bg-purple-600 text-white"
                                                : "bg-white border border-gray-200"
                                        )}
                                    >
                                        <p className="text-sm">{message.text}</p>
                                        <p
                                            className={cx(
                                                "text-xs mt-1",
                                                message.sender === "user" ? "text-purple-200" : "text-gray-400"
                                            )}
                                        >
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] rounded-lg p-3 bg-white border border-gray-200">
                                        <div className="flex space-x-1">
                                            <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                            <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                            <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    <Card className="p-4 border-0 rounded-xl shadow-md bg-white">
                        <div className="flex items-end space-x-2">
                            <div className="flex-1">
                                <textarea
                                    className="w-full px-4 py-3 resize-none border border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Type your response..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <Button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isTyping}
                                className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 shadow-sm disabled:opacity-50"
                            >
                                <RiSendPlaneLine className="h-5 w-5" />
                                Send
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
} 