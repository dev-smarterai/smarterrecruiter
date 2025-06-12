"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { ConvexError, GenericId } from "convex/values"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Divider } from "@/components/Divider"
import { ProgressCircle } from "@/components/ProgressCircle"
import { ProgressBar } from "@/components/ProgressBar"
import { Badge } from "@/components/Badge"
import { cx } from "@/lib/utils"
import { RiExternalLinkLine, RiZoomInLine, RiZoomOutLine, RiDownloadLine } from "@remixicon/react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// Import react-player dynamically to avoid SSR issues
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

// Define types for structured data
interface SkillItem {
    name: string;
    score: number;
}

interface SkillGap {
    name: string;
    percentage: number;
}

interface LearningPath {
    title: string;
    provider: string;
}

interface InterviewHighlight {
    title: string;
    content: string;
    timestamp: string;
    mediaUrl?: string;
}

interface CvData {
    highlights: string[];
    keyInsights: string[];
    score: number;
}

interface CandidateProfileData {
    personal: {
        age: string;
        nationality: string;
        location: string;
        dependents: string;
        visa_status: string;
    };
    career: {
        experience: string;
        past_roles: string;
        progression: string;
    };
    interview: {
        duration: string;
        work_eligibility: string;
        id_check: string;
        highlights?: InterviewHighlight[];
        overallFeedback?: Array<{
            text: string;
            praise: boolean;
        }>;
    };
    skills: {
        technical: {
            overallScore: number;
            skills: SkillItem[];
        };
        soft: {
            overallScore: number;
            skills: SkillItem[];
        };
        culture: {
            overallScore: number;
            skills: SkillItem[];
        };
    };
    cv: CvData;
    skillInsights: {
        matchedSkills: string[];
        missingSkills: string[];
        skillGaps: SkillGap[];
        learningPaths: LearningPath[];
    };
    recommendation: string;
}

// Add this interface for interview data
interface InterviewSession {
    _id: Id<"interviews">;
    _creationTime: number;
    title: string;
    startedAt: string;
    endedAt?: string;
    duration?: number;
    status: string;
    interviewType?: string;
    transcript: Array<{
        sender: string;
        text: string;
        timestamp: string;
    }>;
    scores?: {
        technical?: number;
        communication?: number;
        problemSolving?: number;
        overall?: number;
    };
    feedback?: string;
    summary?: string;
    keyPoints?: string[];
    highlights?: Array<{
        title: string;
        content: string;
        timestamp: string;
        mediaUrl?: string;
    }>;
    video_id?: string; // Add video_id property
    hasError?: boolean;
    errorDetails?: string;
}

// Add this near the other interview types
interface RecordingFile {
    _id: Id<"files">;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedAt: number;
    url?: string;
}

// Custom PDF Viewer component with zoom controls
const PDFViewer = ({ url }: { url: string }) => {
    const [scale, setScale] = useState(1.0);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const zoomIn = () => {
        setScale(prev => Math.min(prev + 0.2, 2.5));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(prev - 0.2, 0.5));
    };

    const resetZoom = () => {
        setScale(1.0);
    };

    return (
        <div className="relative">
            {/* Controls overlay */}
            <div className="absolute top-2 right-2 z-10 flex items-center bg-gray-800 bg-opacity-70 rounded-md shadow-md p-1">
                <button
                    onClick={zoomOut}
                    className="text-white p-1 hover:bg-gray-700 rounded"
                    aria-label="Zoom Out"
                    title="Zoom Out"
                >
                    <RiZoomOutLine className="size-5" />
                </button>
                <button
                    onClick={resetZoom}
                    className="text-white p-1 hover:bg-gray-700 rounded mx-1"
                    aria-label="Reset Zoom"
                    title="Reset Zoom"
                >
                    <span className="text-xs font-medium">{Math.round(scale * 100)}%</span>
                </button>
                <button
                    onClick={zoomIn}
                    className="text-white p-1 hover:bg-gray-700 rounded"
                    aria-label="Zoom In"
                    title="Zoom In"
                >
                    <RiZoomInLine className="size-5" />
                </button>
            </div>

            {/* PDF Viewer */}
            <div className="overflow-auto h-[400px] border border-gray-200 dark:border-gray-800 rounded-md">
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', height: `${100 / scale}%`, width: `${100 / scale}%` }}>
                    <iframe
                        ref={iframeRef}
                        src={url}
                        className="w-full h-full"
                        title="CV Preview"
                    />
                </div>
            </div>
        </div>
    );
};

// Modal component for document preview
const DocumentPreviewModal = ({
    isOpen,
    onClose,
    fileUrl,
    fileName
}: {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{fileName}</h3>
                    <div className="flex items-center space-x-2">
                        <a
                            href={fileUrl}
                            download={fileName}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Download file"
                        >
                            <RiDownloadLine className="size-5" />
                        </a>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Close preview"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 p-0 overflow-hidden">
                    <PDFViewer url={fileUrl} />
                </div>
            </div>
        </div>
    );
};

// Add this helper function near the other formatting functions
const formatInterviewTitle = (title: string) => {
    // Remove the date pattern that appears in parentheses at the end
    return title.replace(/\s*\([^)]*\)\s*$/, '');
};

// Function to format duration
const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
};

// Function to format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

import { analyzeInterviewTranscript } from "@/lib/analyzeInterviewHelper";

// Function to analyze interview transcript
const analyzeInterview = async (
    interviewId: Id<"interviews">,
    transcript: Array<{ sender: string, text: string, timestamp: string }>,
    candidateId: Id<"candidates">,
    updateInterviewMutation: any
) => {
    try {
        // Use the shared helper function to analyze the transcript
        const analysisData = await analyzeInterviewTranscript(transcript);
        console.log("Analysis data:", analysisData);
        // Update the interview with analysis data
        await updateInterviewMutation({
            interviewId,
            summary: analysisData.interviewAnalysis.summary,
            keyPoints: analysisData.interviewAnalysis.keyPoints,
            scores: analysisData.interviewAnalysis.scores,
            feedback: analysisData.interviewAnalysis.feedback
        });

        // Return the candidateProfile section to be used for updating the candidate
        return {
            interviewId,
            candidateId,
            candidateProfile: analysisData.candidateProfile
        };
    } catch (error: any) {
        console.error("Error analyzing interview:", error);
        throw new Error(`Failed to analyze interview: ${error.message}`);
    }
};

// Error flag modal for interviews
const ErrorFlagModal = ({
    isOpen,
    onClose,
    interviewId,
    onFlagComplete
}: {
    isOpen: boolean;
    onClose: () => void;
    interviewId: Id<"interviews">;
    onFlagComplete?: () => void;
}) => {
    const [errorDetails, setErrorDetails] = useState("");
    const flagError = useMutation(api.interview_sessions.flagInterviewError);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!errorDetails.trim()) return;

        setIsSubmitting(true);
        try {
            await flagError({ interviewId, errorDetails });
            toast.success("Interview flagged successfully");
            setErrorDetails("");
            onClose();
            if (onFlagComplete) onFlagComplete();
        } catch (error) {
            console.error("Error flagging interview:", error);
            toast.error("Failed to flag interview");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Flag Interview Error</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-4">
                    <div className="mb-4">
                        <label htmlFor="errorDetails" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Error Details
                        </label>
                        <textarea
                            id="errorDetails"
                            value={errorDetails}
                            onChange={(e) => setErrorDetails(e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Describe the issue with this interview"
                            rows={4}
                        ></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !errorDetails.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isSubmitting ? "Submitting..." : "Flag Error"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Add interview preview modal component
const InterviewPreviewModal = ({
    isOpen,
    onClose,
    interview,
    onAnalyze,
    recordings
}: {
    isOpen: boolean;
    onClose: () => void;
    interview: InterviewSession | null;
    onAnalyze: (interview: InterviewSession) => Promise<void>;
    recordings: RecordingFile[];
}) => {
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    if (!isOpen || !interview) return null;

    // Filter recordings related to this interview by matching meeting ID in filename
    const interviewRecordings = recordings.filter(rec =>
        rec.fileName.includes(interview._id.toString()) ||
        // Also match by date if we can extract it from startedAt
        (interview.startedAt && rec.fileName.includes(new Date(interview.startedAt).toISOString().split('T')[0]))
    );

    const openErrorModal = () => setShowErrorModal(true);
    const closeErrorModal = () => setShowErrorModal(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4  overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col my-2">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 flex items-center justify-center">
                            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{formatInterviewTitle(interview.title)}</h3>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-2 mt-0.5">
                                <span>{formatDate(interview.startedAt)}</span>
                                <span>•</span>
                                <span className="capitalize">{interview.status}</span>
                        {interview.hasError && (
                                    <>
                                        <span>•</span>
                                        <span className="text-red-600 dark:text-red-400 flex items-center">
                                            <svg className="size-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Error Flagged
                            </span>
                                    </>
                        )}
                            </div>
                        </div>
                    </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-800">
                    <div className="flex overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`px-4 py-3 font-medium text-sm relative ${
                                activeTab === "overview" 
                                    ? "text-purple-600 dark:text-purple-400" 
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            Overview
                            {activeTab === "overview" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"></div>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("transcript")}
                            className={`px-4 py-3 font-medium text-sm relative ${
                                activeTab === "transcript" 
                                    ? "text-purple-600 dark:text-purple-400" 
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            Transcript
                            {activeTab === "transcript" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"></div>
                            )}
                        </button>
                    {interviewRecordings.length > 0 && (
                            <button
                                onClick={() => setActiveTab("recording")}
                                className={`px-4 py-3 font-medium text-sm relative ${
                                    activeTab === "recording" 
                                        ? "text-purple-600 dark:text-purple-400" 
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                Recording
                                {activeTab === "recording" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"></div>
                                )}
                            </button>
                        )}
                        {interview.hasError && (
                            <button
                                onClick={() => setActiveTab("error")}
                                className={`px-4 py-3 font-medium text-sm relative ${
                                    activeTab === "error" 
                                        ? "text-red-600 dark:text-red-400" 
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                Error Report
                                {activeTab === "error" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400"></div>
                                )}
                            </button>
                        )}
                                </div>
                            </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-auto p-5">
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            {/* Interview Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-6">
                                    {/* Interview Details Card */}
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                                        <h4 className="text-lg font-medium mb-4">Interview Details</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400 mb-1">Date</p>
                                                <p className="font-medium">{formatDate(interview.startedAt)}</p>
                        </div>
                            <div>
                                                <p className="text-gray-500 dark:text-gray-400 mb-1">Duration</p>
                                                <p className="font-medium">{formatDuration(interview.duration)}</p>
                            </div>
                            <div>
                                                <p className="text-gray-500 dark:text-gray-400 mb-1">Type</p>
                                                <p className="font-medium">{interview.interviewType || "Standard"}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400 mb-1">Status</p>
                                                <p className="font-medium capitalize">{interview.status}</p>
                                            </div>
                                {interview.scores?.overall && (
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Overall Score</p>
                                                    <p className="font-medium">{interview.scores.overall}%</p>
                                                </div>
                                )}
                        </div>
                    </div>

                                    {/* Summary if available */}
                    {interview.summary && (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                                            <h4 className="text-lg font-medium mb-3">Summary</h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{interview.summary}</p>
                        </div>
                    )}

                                    {/* Key Points if available */}
                    {interview.keyPoints && interview.keyPoints.length > 0 && (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                                            <h4 className="text-lg font-medium mb-3">Key Points</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                {interview.keyPoints.map((point: string, index: number) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                                </div>

                                {/* Scores Card */}
                                <div className="md:col-span-1">
                                    {interview.scores && Object.keys(interview.scores).length > 0 ? (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 h-full">
                                            <h4 className="text-lg font-medium mb-4">Scores</h4>
                                            <div className="space-y-4">
                                {Object.entries(interview.scores)
                                    .filter(([key]) => key !== 'overall')
                                    .map(([key, value]) => (
                                                        <div key={key}>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-sm capitalize">{key}</span>
                                                                <span className="text-sm font-medium">{value}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                <div 
                                                                    className={`h-2 rounded-full ${
                                                                        Number(value) > 80 ? "bg-green-500" : 
                                                                        Number(value) > 60 ? "bg-blue-500" : 
                                                                        "bg-yellow-500"
                                                                    }`}
                                                                    style={{ width: `${value}%` }}
                                                                ></div>
                                                            </div>
                                        </div>
                                    ))
                                }
                                                
                                                {/* Overall Score */}
                                                {interview.scores.overall && (
                                                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm font-medium">Overall Score</span>
                                                            <span className="text-sm font-medium">{interview.scores.overall}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                            <div 
                                                                className={`h-3 rounded-full ${
                                                                    Number(interview.scores.overall) > 80 ? "bg-green-500" : 
                                                                    Number(interview.scores.overall) > 60 ? "bg-blue-500" : 
                                                                    "bg-yellow-500"
                                                                }`}
                                                                style={{ width: `${interview.scores.overall}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 h-full flex flex-col items-center justify-center text-center">
                                            <svg className="size-16 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No Scores Available</p>
                                            {interview.status === "completed" && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">Use the Analyze Interview button to generate scores</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transcript Tab */}
                    {activeTab === "transcript" && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                            <h4 className="text-lg font-medium mb-4">Full Transcript</h4>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {interview.transcript.map((entry, index) => (
                                    <div key={index} className="py-4">
                                        <div className="flex items-start">
                                            <div className="shrink-0 mr-3">
                                                <span className={`inline-block size-10 rounded-full text-sm flex items-center justify-center font-medium ${
                                                    entry.sender.toLowerCase() === 'ai' || entry.sender.toLowerCase() === 'interviewer'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                }`}>
                                                    {entry.sender.substring(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-1">
                                                    <span className="text-sm font-medium">{
                                                        entry.sender.toLowerCase() === 'ai'
                                                            ? 'AI Interviewer'
                                                            : entry.sender.toLowerCase() === 'interviewer'
                                                                ? 'Interviewer'
                                                                : 'Candidate'
                                                    }</span>
                                                    <span className="text-xs text-gray-500">{entry.timestamp}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-words">{entry.text}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recording Tab */}
                    {activeTab === "recording" && interviewRecordings.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                            <h4 className="text-lg font-medium mb-4">Interview Recording</h4>
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <video
                                    src={interviewRecordings[0].url}
                                    controls
                                    className="w-full h-auto"
                                    preload="metadata"
                                />
                                <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-full sm:max-w-xs">
                                        {interviewRecordings[0].fileName} • {Math.round(interviewRecordings[0].fileSize / (1024 * 1024) * 10) / 10} MB
                    </div>
                                    <a
                                        href={interviewRecordings[0].url}
                                        download={interviewRecordings[0].fileName}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 w-full sm:w-auto justify-center sm:justify-start"
                                    >
                                        <RiDownloadLine className="size-4" />
                                        <span>Download</span>
                                    </a>
                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Tab */}
                    {activeTab === "error" && interview.hasError && interview.errorDetails && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
                            <h4 className="text-lg font-medium mb-4 text-red-700 dark:text-red-400 flex items-center">
                                <svg className="mr-1.5 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Error Report
                            </h4>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-4 whitespace-pre-line">{interview.errorDetails}</p>
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                                <p className="font-medium mb-1">What happens next?</p>
                                <p>This error has been reported to our team and will be reviewed. If you need immediate assistance, please contact support with the interview ID: {interview._id.toString()}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with actions */}
                <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row justify-end gap-2">
                    {/* Flag Error button */}
                    <Button
                        onClick={openErrorModal}
                        variant="destructive"
                        className="w-full sm:w-auto order-1 sm:order-none"
                    >
                        <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Flag Error
                    </Button>

                    {interview.status === "completed" && !interview.scores && (
                        <Button
                            onClick={() => {
                                onClose();
                                setTimeout(() => onAnalyze(interview), 100);
                            }}
                            className="w-full sm:w-auto"
                        >
                            Analyze Interview
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">Close</Button>
                </div>
            </div>

            {/* Error Flag Modal */}
            {showErrorModal && (
                <ErrorFlagModal
                    isOpen={showErrorModal}
                    onClose={closeErrorModal}
                    interviewId={interview._id}
                    onFlagComplete={onClose}
                />
            )}
        </div>
    );
};

// Add VideoPlayerModal component
const VideoPlayerModal = ({
    isOpen,
    onClose,
    videoUrl,
    title
}: {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    title: string;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0  z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-medium">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
                    <div className="w-full aspect-video">
                        <ReactPlayer
                            url={videoUrl}
                            width="100%"
                            height="100%"
                            controls
                            playing
                            config={{
                                file: {
                                    attributes: {
                                        controlsList: 'nodownload'
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Add import for ScreeningScoreCard component
import ScreeningScoreCard from "@/components/newUI/admin/candidates/screeningScoreCard";

// Add import for CandidateTranscript component
import CandidateTranscript from "@/components/newUI/admin/candidates/candidateTranscript";

// Component
export default function CandidateProfile() {
    const { id } = useParams();
    const router = useRouter();
    const candidateId = typeof id === 'string' ? id : (Array.isArray(id) ? id[0] : "1");
    const [activeTab, setActiveTab] = useState("overview");
    const [previewModal, setPreviewModal] = useState({ isOpen: false, fileUrl: "", fileName: "" });
    const [interviewModal, setInterviewModal] = useState({ isOpen: false, interview: null as InterviewSession | null });
    const [isVideoModalOpen, setVideoModalOpen] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState("");
    const [currentVideoTitle, setCurrentVideoTitle] = useState("");
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    const [bugDescription, setBugDescription] = useState('');
    const [bugs, setBugs] = useState<{ description: string; timestamp: string; status: string }[]>([]);
    const [isBugPanelExpanded, setIsBugPanelExpanded] = useState(false);

    // Add the necessary hooks
    const interviews = useQuery(api.interview_sessions.getInterviewsByCandidate, {
        candidateId: candidateId as Id<"candidates">
    });
    const flagError = useMutation(api.interview_sessions.flagInterviewError);

    // Convert string ID to Convex ID
    let convexId: Id<"candidates"> | null = null;
    try {
        convexId = candidateId as Id<"candidates">;
    } catch (e) {
        console.error("Invalid ID format", e);
    }

    // Fetch candidate from Convex
    const candidate = useQuery(api.candidates.getCandidate,
        convexId ? { id: convexId } : "skip");

    // Generate default profile mutation
    const generateProfile = useMutation(api.candidates.generateDefaultCandidateProfile);

    const openPreview = (url: string, name: string) => {
        setPreviewModal({
            isOpen: true,
            fileUrl: url,
            fileName: name
        });
    };

    const closePreview = () => {
        setPreviewModal({
            isOpen: false,
            fileUrl: "",
            fileName: ""
        });
    };

    const openInterviewModal = (interview: InterviewSession) => {
        setInterviewModal({
            isOpen: true,
            interview
        });
    };

    const closeInterviewModal = () => {
        setInterviewModal({
            isOpen: false,
            interview: null
        });
    };

    const openVideoModal = (videoId: string, title: string) => {
        const videoUrl = `https://smarterai.s3.us-east-1.amazonaws.com/recordings/${videoId}/recording.mp4`;
        setCurrentVideoUrl(videoUrl);
        setCurrentVideoTitle(title);
        setVideoModalOpen(true);
    };

    const closeVideoModal = () => {
        setVideoModalOpen(false);
        setCurrentVideoUrl("");
    };

    // Debug logging for bugs
    useEffect(() => {
        if (candidate) {
            console.log("DEBUG: Candidate Bugs", {
                candidateId: candidate._id,
                candidateName: candidate.name,
                totalBugs: candidate.bugs?.length || 0,
                bugs: candidate.bugs || [],
                hasBugs: Boolean(candidate.bugs?.length),
                latestBug: candidate.bugs?.[candidate.bugs.length - 1]
            });
        }
    }, [candidate]);

    // Bug toast effect
    useEffect(() => {
        if (candidate?.bugs && candidate.bugs.length > 0) {
            const bugList = candidate.bugs
                .slice(-3)
                .map(bug => {
                    const date = new Date(bug.timestamp).toLocaleDateString();
                    return `• ${bug.description} (${date}) - ${bug.status}`;
                })
                .join('\n');

            toast.error(
                <div className="space-y-2">
                    <div className="font-semibold border-b border-red-200 pb-1 mb-2">
                        Latest Bug Reports
                    </div>
                    <div className="text-sm whitespace-pre-line">
                        {bugList}
                    </div>
                </div>,
                {
                    duration: Infinity,
                    position: 'bottom-center',
                    style: {
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #ef4444',
                        padding: '16px',
                        marginBottom: '16px',
                        width: '100%',
                        maxWidth: '600px',
                    }
                }
            );
        }
    }, [candidate?.bugs]);

    // Fetch the file info and URLs for this candidate
    const candidateFiles = useQuery(api.files.getCandidateFileUrls,
        convexId ? { candidateId: convexId } : "skip");

    // Fetch meeting recordings for this candidate
    const meetingRecordings = useQuery(
        api.files.getMeetingRecordings,
        convexId ? { candidateId: convexId } : "skip"
    );

    console.log("Interviews:", interviews);
    console.log("Meeting recordings:", meetingRecordings);

    // Helper function to check if an interview has a recording
    const hasRecording = (interview: InterviewSession) => {
        return Boolean(interview.video_id);
    };

    // For debugging
    useEffect(() => {
        if (candidate) {
            console.log("Candidate data:", candidate);
            console.log("Candidate cvFileId:", candidate.cvFileId);
            if (candidate.candidateProfile) {
                console.log("Candidate recommendation:", candidate.candidateProfile.recommendation);
            }
        }
        if (candidateFiles) {
            console.log("Candidate files:", candidateFiles);
        }
    }, [candidate, candidateFiles]);

    // Get the CV file directly using the cvFileId
    const [cvFileUrl, setCvFileUrl] = useState<string | null>(null);

    useEffect(() => {
        // If candidate has a cvFileId, get the URL
        if (candidate?.cvFileId) {
            // Use Convex getUrl to get a download URL
            const fetchUrl = async () => {
                try {
                    // Check if candidateFiles is available
                    if (candidateFiles && candidateFiles.length > 0) {
                        // First try to find the exact file matching the cvFileId
                        const fileInfo = candidateFiles.find(file =>
                            file._id === candidate.cvFileId
                        );

                        if (fileInfo?.url) {
                            setCvFileUrl(fileInfo.url);
                            console.log("CV file URL found by ID match:", fileInfo.url);
                            return;
                        }

                        // If no exact match found, use the first file as fallback
                        // This helps when cvFileId points to the files record but we need the actual storage URL
                        if (candidateFiles[0]?.url) {
                            setCvFileUrl(candidateFiles[0].url);
                            console.log("Using first available file as fallback:", candidateFiles[0].url);
                            return;
                        }
                    }

                    console.log("No matching file found for cvFileId:", candidate.cvFileId);
                } catch (e) {
                    console.error("Error getting file URL:", e);
                }
            };

            fetchUrl();
        } else if (candidateFiles && candidateFiles.length > 0 && candidateFiles[0]?.url) {
            // If candidate doesn't have cvFileId but has files, use the first file
            setCvFileUrl(candidateFiles[0].url);
            console.log("No cvFileId, using first file found:", candidateFiles[0].url);
        }
    }, [candidate, candidateFiles]);

    // Add these mutations
    const updateInterviewAnalysis = useMutation(api.interview_sessions.updateInterviewAnalysis);
    const updateCandidateProfileSection = useMutation(api.candidates.updateCandidateProfileSection);

    // Add loading state for analysis
    const [analyzingInterview, setAnalyzingInterview] = useState<Id<"interviews"> | null>(null);

    // Function to handle analyze button click
    const handleAnalyzeInterview = async (interview: InterviewSession) => {
        if (!convexId) return;

        setAnalyzingInterview(interview._id);

        try {
            // Process the analysis
            const result = await analyzeInterview(
                interview._id,
                interview.transcript,
                convexId,
                updateInterviewAnalysis
            );

            // Update candidate profile with the analysis results
            if (result.candidateProfile) {
                // Update interview section
                await updateCandidateProfileSection({
                    id: convexId,
                    section: "interview",
                    data: result.candidateProfile.interview
                });

                // Update skills section
                await updateCandidateProfileSection({
                    id: convexId,
                    section: "skills",
                    data: result.candidateProfile.skills
                });

                // Update skillInsights section
                await updateCandidateProfileSection({
                    id: convexId,
                    section: "skillInsights",
                    data: result.candidateProfile.skillInsights
                });

                // Update recommendation if provided
                if (result.candidateProfile.recommendation) {
                    await updateCandidateProfileSection({
                        id: convexId,
                        section: "recommendation",
                        data: result.candidateProfile.recommendation
                    });
                }

                toast.success("Interview analyzed successfully");
            }
        } catch (error: any) {
            console.error("Error in interview analysis:", error);
            toast.error(error.message || "Failed to analyze interview");
        } finally {
            setAnalyzingInterview(null);
        }
    };

    useEffect(() => {
        // Fetch interviews with bugs for the candidate
        const fetchBugs = async () => {
            try {
                // Get all interviews for this candidate
                const interviews = await api.interview_sessions.getInterviewsByCandidate({
                    candidateId: candidateId
                });

                // Filter interviews with errors and map to bug format
                const realBugs = interviews
                    .filter(interview => interview.hasError && interview.errorDetails)
                    .map(interview => ({
                        description: interview.errorDetails || "Unknown error",
                        timestamp: interview.endedAt || interview.startedAt,
                        status: 'active' // Add status for UI consistency
                    }));

                setBugs(realBugs);
            } catch (error) {
                console.error("Error fetching bugs:", error);
                setBugs([]);
            }
        };

        if (candidateId) {
            fetchBugs();
        }
    }, [candidateId]);

    const handleRaiseBug = () => {
        setIsBugModalOpen(true);
    };

    const handleBugSubmit = async () => {
        if (bugDescription.trim()) {
            try {
                // Flag the error using the mutation with only the parameters in its type definition
                await flagError({
                    description: bugDescription,
                    candidateId: convexId || undefined
                });

                // Update local state - store only the properties we need for UI display
                const newBug = {
                    description: bugDescription,
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    status: 'active' // Add status for UI consistency
                };
                setBugs([...bugs, newBug]);
                setBugDescription('');
                setIsBugModalOpen(false);

                toast.success("Bug report submitted successfully");
            } catch (error) {
                console.error("Error submitting bug report:", error);
                toast.error("Failed to submit bug report");
            }
        }
    };

    // Loading state
    if (candidate === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-4 text-gray-600">Loading candidate data...</p>
                </div>
            </div>
        );
    }

    // Not found state
    if (candidate === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-xl font-medium mb-2">Candidate not found</h2>
                <p className="text-gray-500 mb-4">The candidate you're looking for doesn't exist or has been removed.</p>
                <Link href="/candidates">
                    <Button>Back to Candidates</Button>
                </Link>
            </div>
        );
    }

    // Make sure we get the aiScore from the right place
    const aiScore = candidate.aiScore || (candidate.profile?.aiScore ?? 0);

    // Access candidateProfile or fallback to empty objects for each section
    const { candidateProfile = {} } = candidate || {};

    // For logging the original value
    console.log("Original recommendation:", candidateProfile.recommendation);

    const {
        personal = { age: '', nationality: '', location: '', dependents: '', visa_status: '' },
        career = { experience: '', past_roles: '', progression: '' },
        interview = { duration: '', work_eligibility: '', id_check: '' },
        skills = {
            technical: { overallScore: 0, skills: [] },
            soft: { overallScore: 0, skills: [] },
            culture: { overallScore: 0, skills: [] }
        },
        cv = { highlights: [], keyInsights: [], score: aiScore || 0 },
        skillInsights = {
            matchedSkills: [],
            missingSkills: [],
            skillGaps: [],
            learningPaths: []
        },
        recommendation = "No recommendation available"
    } = candidateProfile as CandidateProfileData;

    // Use actual recommendation from candidateProfile, fallback to calculated value based on AI score if not available
    const finalRecommendation = candidateProfile.recommendation ||
        (aiScore > 85 ? "Strongly Recommend" :
            aiScore > 70 ? "Recommend" : "Consider");

    return (
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            {/* Candidate Snapshot - Clean Modern Design */}
          

            {/* Tabs Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="analysis">Analysis & Interview</TabsTrigger>
                    <TabsTrigger value="overview">Overview & Actions</TabsTrigger>
                </TabsList>

                {/* Tab 1: Analysis & Interview */}
                <TabsContent value="analysis" className="space-y-6 mt-6">
                    {/* CV Analysis Content */}
                    <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">CV Analysis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Highlights Box */}
                            <div>
                                <h4 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">Highlights</h4>
                                <ul className="space-y-2 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                    {cv.highlights.map((highlight: string, index: number) => (
                                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                            • {highlight}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Key Insights Box */}
                            <div>
                                <h4 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">Key Insights</h4>
                                <ul className="space-y-2 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                    {cv.keyInsights.map((insight: string, index: number) => (
                                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                            • {insight}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* CV Preview */}
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">CV Preview</h4>
                                {cvFileUrl && (
                                    <a
                                        href={cvFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                    >
                                        <span>Download CV</span>
                                        <RiDownloadLine className="ml-1 size-3" />
                                    </a>
                                )}
                            </div>
                            <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                                {cvFileUrl ? (
                                    <PDFViewer url={cvFileUrl} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[250px] bg-gray-50 dark:bg-gray-900">
                                        <div className="w-16 h-16 mb-3 text-gray-300 dark:text-gray-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-500">CV preview not available</p>
                                        <p className="text-xs text-gray-400 mt-1">Upload a CV in the application form to view it here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Interview Sessions Section */}
                    <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Interview Sessions</h2>
                        
                        {interviews === undefined ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="inline-block size-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                            </div>
                        ) : interviews.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                <h4 className="text-base font-medium mb-2">No Interviews Yet</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    This candidate hasn't completed any interviews yet.
                                </p>
                                <Button variant="secondary" onClick={() => router.push('/interview-schedule')}>
                                    Schedule First Interview
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">Recent Interviews</h3>
                                <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: "440px" }}>
                                    {interviews.map((interview) => (
                                        <div 
                                            key={interview._id} 
                                            className={`p-4 border dark:border-gray-700 rounded-xl flex flex-col gap-3 shadow-sm transition-all hover:shadow-md ${
                                                interview.status === "analyzed" ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-700" :
                                                interview.status === "completed" ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-700" :
                                                "bg-gray-50 dark:bg-gray-900/20"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">{formatInterviewTitle(interview.title)}</h4>
                                                        <span className={cx(
                                                            "px-1.5 py-0.5 text-xs rounded-full",
                                                            interview.status === "completed" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" :
                                                            interview.status === "analyzed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                                                            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                                        )}>
                                                            {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1.5 gap-1.5">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>{formatDate(interview.startedAt)}</span>
                                                        <span>•</span>
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>{formatDuration(interview.duration)}</span>
                                                    </div>
                                                </div>
                                                
                                                {interview.scores?.overall && (
                                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full size-10 flex items-center justify-center">
                                                        <span className="text-sm font-medium">{interview.scores.overall}%</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2 mt-1 w-full">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => openInterviewModal(interview)}
                                                    className="text-xs px-3 py-1 h-auto"
                                                >
                                                    View Details
                                                </Button>
                                                {interview.status === "completed" && !interview.scores && (
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => handleAnalyzeInterview(interview)}
                                                        className="text-xs px-3 py-1 h-auto"
                                                        disabled={analyzingInterview === interview._id}
                                                    >
                                                        {analyzingInterview === interview._id ? (
                                                            <>
                                                                <span className="size-3 mr-1.5 rounded-full border-2 border-current border-r-transparent animate-spin"></span>
                                                                Analyzing...
                                                            </>
                                                        ) : (
                                                            "Analyze Interview"
                                                        )}
                                                    </Button>
                                                )}
                                                {hasRecording(interview) && (
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => openVideoModal(interview.video_id!, interview.title)}
                                                        className="text-xs px-3 py-1 h-auto flex items-center gap-1"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Playback
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Skill Insights section */}
                    {skillInsights && (skillInsights.matchedSkills.length > 0 || skillInsights.missingSkills.length > 0) && (
                        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Skill Insights</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Matched Skills */}
                                <div>
                                    <h3 className="text-lg font-medium mb-4 text-green-600 dark:text-green-400">Matched Skills</h3>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                        {skillInsights.matchedSkills.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {skillInsights.matchedSkills.map((skill, index) => (
                                                    <span 
                                                        key={index} 
                                                        className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/50 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No matched skills found</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Missing Skills */}
                                <div>
                                    <h3 className="text-lg font-medium mb-4 text-amber-600 dark:text-amber-400">Missing Skills</h3>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                        {skillInsights.missingSkills.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {skillInsights.missingSkills.map((skill, index) => (
                                                    <span 
                                                        key={index} 
                                                        className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No missing skills identified</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Skill Gaps Analysis */}
                            {skillInsights.skillGaps && skillInsights.skillGaps.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-medium mb-4">Skill Gaps Analysis</h3>
                                    <div className="space-y-3">
                                        {skillInsights.skillGaps.map((gap, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700 dark:text-gray-300">{gap.name}</span>
                                                    <span className="text-gray-500">{gap.percentage}% gap</span>
                                                </div>
                                                <ProgressBar
                                                    value={100 - gap.percentage}
                                                    variant={gap.percentage < 20 ? "success" : gap.percentage < 40 ? "default" : "warning"}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Learning Recommendations */}
                            {skillInsights.learningPaths && skillInsights.learningPaths.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-medium mb-4">Learning Recommendations</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {skillInsights.learningPaths.map((path, index) => (
                                            <div 
                                                key={index} 
                                                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3"
                                            >
                                                <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-1">{path.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Provider: {path.provider}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </TabsContent>

                {/* Tab 2: Overview & Actions */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid grid-cols-12 gap-6">

                        
                        {/* Left column - 10/12 width */}
                        <div className="col-span-12 lg:col-span-12 space-y-6">
                        <div className="grid grid-cols-12 gap-6">
                            {/* Candidate Snapshot - takes 8 columns */}
                            <div className="col-span-12 lg:col-span-7">
                                <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {/* Blue Header */}
                                    <div className="bg-indigo-300 px-6 py-4">
                                        <h1 className="text-xl font-semibold ">Candidate Snapshot</h1>
                                    </div>
                                    
                                    <div className="p-6">
                                        <div className="grid grid-cols-12 gap-6">
                                            {/* Left: Profile Photo and Basic Info */}
                                            <div className="col-span-12 md:col-span-3">
                                                <div className="flex flex-col items-center md:items-start">
                                                    {/* Profile Photo */}
                                                    <div className="w-32 h-32 rounded-lg overflow-hidden mb-4 shadow-md">
                                                        <img 
                                                            src="/api/placeholder/128/128" 
                                                            alt="Candidate Profile" 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                // Fallback to initials if image fails to load
                                                                e.currentTarget.style.display = 'none';
                                                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                                            }}
                                                        />
                                                        <div 
                                                            className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold"
                                                            style={{ display: 'none' }}
                                                        >
                                                            {candidate.initials || candidate.name?.substring(0, 2).toUpperCase() || 'SA'}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Name and Basic Info */}
                                                    <div className="text-center md:text-left">
                                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                                            {candidate.name || "Saud"}
                                                        </h2>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                            <p><span className="font-medium">Age:</span> {personal.age || '27'}</p>
                                                            <p><span className="font-medium">Nationality:</span> {personal.nationality || 'Saudi, KSA'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Center: Career Highlights */}
                                            <div className="col-span-12 md:col-span-5">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Career Highlights</h3>
                                                <div className="space-y-4">
                                                    <div className="flex items-start">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-300"></div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Role:</span> {career.experience || 'Developer Team Lead'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-start">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-300"></div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Skills:</span> {
                                                                    skills?.technical?.skills?.length > 0 
                                                                        ? skills.technical.skills.slice(0, 2).map(s => s.name).join(', ')
                                                                        : 'Python'
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-start">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-300"></div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Past roles:</span> {career.past_roles || 'Developer analyst (Google), Developer intern (AWS)'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-start">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-300"></div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Career Progression Score:</span> 
                                                                <span className="ml-1 text-green-600 dark:text-green-400 font-semibold">{career.progression || 'Fast'}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Right: Interview Details */}
                                            <div className="col-span-12 md:col-span-4">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interview Details</h3>
                                                
                                                {interviews && interviews.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Interview Date:</span> {interviews[0]?.startedAt ? formatDate(interviews[0].startedAt) : 'Mar 5, 2024'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Duration:</span> {interviews[0]?.duration ? formatDuration(interviews[0].duration) : '25min'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Attendance:</span> {interviews[0]?.status === 'completed' || interviews[0]?.status === 'analyzed' ? 'Arrived on time' : 'Arrived on time'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Notes:</span> {interview?.id_check || 'No signs of ID irregularities detected'}
                                                            </p>
                                                        </div>
                                                        <div className="mt-6">
                                                            <span className="inline-flex items-center px-3 py-1.5 rounded-sm text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                                                Cheat detection: passed
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Interview Date:</span> Mar 5, 2024
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Duration:</span> 25min
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Attendance:</span> Arrived on time
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                <span className="text-gray-500 dark:text-gray-400">Notes:</span> No signs of ID irregularities detected
                                                            </p>
                                                        </div>
                                                        <div className="mt-6">
                                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                                                Cheat detection: passed
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Screening Score Card - takes 4 columns, positioned at same level */}
                            <div className="col-span-12 lg:col-span-3">
                                <div className="max-w-sm">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 sr-only">Screening Score</h2>
                                    
                                    <ScreeningScoreCard 
                                        score={interviews?.find(interview => interview.status === "analyzed" && interview.scores?.overall)?.scores?.overall || aiScore}
                                        recommendation={finalRecommendation}
                                        sections={[
                                            {
                                                title: "Technical Skills",
                                                score: skills?.technical?.overallScore || 0,
                                                color: "#6B9AE8",
                                                details: (skills?.technical?.skills || []).slice(0, 3).map(skill => ({
                                                    title: skill.name,
                                                    description: `${skill.score}% proficiency`
                                                }))
                                            },
                                            {
                                                title: "Soft Skills",
                                                score: skills?.soft?.overallScore || 0,
                                                color: "#FFD699",
                                                details: (skills?.soft?.skills || []).slice(0, 3).map(skill => ({
                                                    title: skill.name,
                                                    description: `${skill.score}% proficiency`
                                                }))
                                            },
                                            {
                                                title: "Culture Fit",
                                                score: skills?.culture?.overallScore || 0,
                                                color: "#4DD0C9",
                                                details: (skills?.culture?.skills || []).slice(0, 3).map(skill => ({
                                                    title: skill.name,
                                                    description: `${skill.score}% alignment`
                                                }))
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                               {/* Interaction Log - Constrained width */}
                               <div className="col-span-12 lg:col-span-2">
                               <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Interaction Log</h2>
                                <div className="space-y-2">
                                    {/* Chat */}
                                    <div className="flex items-start space-x-2">
                                        <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">Chatbot Conversation</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Sent company information</p>
                                        </div>
                                    </div>
                                    
                                    {/* Application */}
                                    <div className="flex items-start space-x-2">
                                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">Applied</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{career.experience || 'Software Engineer'}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">Yesterday</p>
                                        </div>
                                    </div>
                                    
                                    {/* Interview Scheduled */}
                                    <div className="flex items-start space-x-2">
                                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">Interview Scheduled</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Dec 10 at 2:00 PM</p>
                                        </div>
                                    </div>
                                    
                                    {/* Interview Completed */}
                                    <div className="flex items-start space-x-2">
                                        <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">Interview Completed</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Pending feedback</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">Dec 1</p>
                                        </div>
                                    </div>
                                    
                                    {/* AI suggests */}
                                    <div className="flex items-start space-x-2">
                                        <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">AI suggests</h3>
                                            <button className="mt-1 px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-medium rounded-md transition-colors">
                                                Invite to next round
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            </div>
                        </div>

                            {/* Overall Feedback section - Only show if interviews have been analyzed */}
                            {interviews && interviews.some(interview => interview.status === "analyzed") && (
                                <div className="grid grid-cols-12 gap-3">
                                    {/* Overall Feedback - Wide section */}
                                    <div className="col-span-12 lg:col-span-5">
                                        <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                                            {/* Green Header */}
                                            <div className="bg-indigo-100 px-6 py-4">
                                                <h2 className="text-xl font-semibold text-gray-900">Overall Feedback</h2>
                                            </div>
                                            
                                            <div className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {/* Pros - Green background */}
                                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                                                        <h3 className="text-lg font-medium text-green-700 dark:text-green-400 flex items-center mb-3">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            Pros
                                                        </h3>
                                                        <ul className="space-y-2">
                                                            {(candidateProfile.interview?.overallFeedback || [])
                                                                .filter((feedback: { text: string, praise: boolean }) => feedback.praise)
                                                                .map((feedback: { text: string, praise: boolean }, index: number) => (
                                                                    <li key={index} className="text-sm text-green-800 dark:text-green-300">
                                                                        • {feedback.text}
                                                                    </li>
                                                                ))}
                                                        </ul>
                                                    </div>

                                                    {/* Cons - Red background */}
                                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                                                        <h3 className="text-lg font-medium text-red-700 dark:text-red-400 flex items-center mb-3">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                            Cons
                                                        </h3>
                                                        <ul className="space-y-2">
                                                            {(candidateProfile.interview?.overallFeedback || [])
                                                                .filter((feedback: { text: string, praise: boolean }) => !feedback.praise)
                                                                .map((feedback: { text: string, praise: boolean }, index: number) => (
                                                                    <li key={index} className="text-sm text-red-800 dark:text-red-300">
                                                                        • {feedback.text}
                                                                    </li>
                                                                ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Key Moments and Next Steps - Stacked */}
                                    <div className="col-span-12 lg:col-span-4 space-y-6">
                                        {/* Key Moments */}
                                        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Key Moments</h2>
                                            
                                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                                {interviews
                                                    .filter(interview => interview.status === "analyzed")
                                                    .flatMap((interview: InterviewSession) => {
                                                        // Get candidate's responses from transcript
                                                        const candidateResponses = interview.transcript
                                                            .filter(entry =>
                                                                entry.sender.toLowerCase() !== 'ai' &&
                                                                entry.sender.toLowerCase() !== 'interviewer'
                                                            )
                                                            // Filter out very short responses (likely yes/no answers)
                                                            .filter(entry => entry.text.length > 50)
                                                            // Take top 2 longest responses for this smaller space
                                                            .sort((a, b) => b.text.length - a.text.length)
                                                            .slice(0, 2)
                                                            .map(entry => ({
                                                                title: "Candidate Response",
                                                                content: entry.text,
                                                                timestamp: entry.timestamp,
                                                                interviewId: interview._id,
                                                                interviewTitle: interview.title
                                                            }));

                                                        if (candidateResponses.length === 0) return [];
                                                        return candidateResponses;
                                                    })
                                                    .slice(0, 2) // Limit to 2 total for this compact view
                                                    .map((highlight, index) => (
                                                        <div key={index} className="rounded-xl p-3 flex gap-3 border border-gray-200 dark:border-gray-600">
                                                            {/* Picture placeholder */}
                                                            <img 
                                                                src="/api/placeholder/150/150" 
                                                                alt="Candidate moment"
                                                                className="w-1/2 h-full bg-gray-200 dark:bg-gray-600 rounded-lg border-2 border-gray-300 dark:border-gray-500 flex-shrink-0 object-cover"
                                                                onError={(e) => {
                                                                    // Fallback to placeholder div if image fails to load
                                                                    e.currentTarget.style.display = 'none';
                                                                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                                                }}
                                                            />
                                                            {/* Fallback placeholder */}
                                                            <div className="w-1/2 h-full bg-gray-200 dark:bg-gray-600 rounded-lg border-2 border-gray-300 dark:border-gray-500 flex-shrink-0 flex items-center justify-center" style={{ display: 'none' }}>
                                                                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                                </svg>
                                                            </div>
                                                            
                                                            {/* Text content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                        Key Moment [{index + 1}]
                                                                    </h4>
                                                                </div>
                                                                <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                                                                    "{highlight.content.length > 100
                                                                        ? highlight.content.substring(0, 100) + '...'
                                                                        : highlight.content}"
                                                                </p>
                                                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                                    <span>{highlight.timestamp}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </section>

                                        {/* Next Steps */}
                                        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Next Steps</h2>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Recommended actions based on candidate analysis.</p>
                                            
                                            <div className="space-y-2">
                                                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm">
                                                    Invite to Interview 
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-1 inline" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                
                                                <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                                                    Save for Later
                                                </button>
                                                
                                                <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                                                    Send Feedback
                                                </button>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Transcript */}
                                    <div className="col-span-12 lg:col-span-3">
                                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 "></h2>
                                            
                                            {interviews && interviews.length > 0 && interviews.some(i => i.transcript?.length > 0) ? (
                                                <div className="h-full">
                                                    <CandidateTranscript 
                                                        transcript={interviews.find(i => i.transcript?.length > 0)?.transcript.slice(0, 5).map((entry, index) => ({
                                                            id: index.toString(),
                                                            sender: entry.sender.toLowerCase() === 'ai' 
                                                                ? 'AI Interviewer' 
                                                                : entry.sender.toLowerCase() === 'interviewer' 
                                                                    ? 'Interviewer' 
                                                                    : 'Candidate',
                                                            avatar: '',
                                                            content: entry.text.length > 150 ? entry.text.substring(0, 150) + '...' : entry.text,
                                                            timestamp: entry.timestamp
                                                        })) || []}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center h-[300px]">
                                                    <div className="w-16 h-16 mb-3 text-gray-300 dark:text-gray-700">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No transcript available yet</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Complete an interview to view transcript</p>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                       
                    </div>
                </TabsContent>
            </Tabs>

            {/* Keep modals and other UI elements */}
            <InterviewPreviewModal
                isOpen={interviewModal.isOpen}
                onClose={closeInterviewModal}
                interview={interviewModal.interview}
                onAnalyze={handleAnalyzeInterview}
                recordings={meetingRecordings || []}
            />

            <DocumentPreviewModal
                isOpen={previewModal.isOpen}
                onClose={closePreview}
                fileUrl={previewModal.fileUrl}
                fileName={previewModal.fileName}
            />

            <VideoPlayerModal
                isOpen={isVideoModalOpen}
                onClose={closeVideoModal}
                videoUrl={currentVideoUrl}
                title={currentVideoTitle}
            />

            {/* Bug Reporting Modal - Fix the button variant */}
            {isBugModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Report a Bug</h2>
                        <textarea
                            className="w-full p-2 border rounded-md mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            value={bugDescription}
                            onChange={(e) => setBugDescription(e.target.value)}
                            placeholder="Describe the bug you encountered with this candidate's profile or interview..."
                            rows={4}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setIsBugModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleBugSubmit} disabled={!bugDescription.trim()}>Submit</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preserve existing bug panel */}
            {candidate?.bugs && candidate.bugs.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-red-50 border-t border-red-200 transition-all duration-300 z-50"
                    style={{
                        height: isBugPanelExpanded ? 'auto' : '48px',
                        maxHeight: isBugPanelExpanded ? '70vh' : '48px',
                        overflow: 'hidden'
                    }}
                >
                    <div className="max-w-7xl mx-auto">
                        <div
                            className="text-sm font-semibold text-red-800 p-3 flex justify-end items-center cursor-pointer hover:bg-red-100/50 transition-colors"
                            onClick={() => setIsBugPanelExpanded(!isBugPanelExpanded)}
                        >
                            <div className="flex items-center gap-2">
                                {!isBugPanelExpanded && candidate.bugs.length > 0 && (
                                    <span className="text-xs bg-red-100 px-2 py-1 rounded">
                                        {candidate.bugs.filter(bug => bug.status !== 'resolved').length} active
                                    </span>
                                )}
                                <span>Bug Reports ({candidate.bugs.length})</span>
                                <svg
                                    className={`w-5 h-5 transform transition-transform ${isBugPanelExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {candidate.bugs.map((bug, index) => (
                                    <div
                                        key={index}
                                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border ${
                                            bug.status === 'resolved'
                                                ? 'border-green-100 dark:border-green-800'
                                                : 'border-red-100 dark:border-red-800'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm text-red-800 dark:text-red-300">{bug.description}</p>
                                            <span className={`text-xs px-2 py-1 rounded ml-2 ${
                                                bug.status === 'resolved' 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                }`}>
                                                {bug.status === 'resolved' ? 'resolved' : 'active'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {new Date(bug.timestamp).toLocaleString()}
                                        </div>
                                        {bug.resolution && (
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                                                Resolution: {bug.resolution}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}