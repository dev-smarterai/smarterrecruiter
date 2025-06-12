"use client"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { ChangeEvent, FormEvent, useState, useEffect, useCallback } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cx } from "@/lib/utils"
import { Id } from "../../../../convex/_generated/dataModel"
import { useAuth } from "@/lib/auth"
import { v4 as uuidv4 } from 'uuid';

// Helper function to generate initials from a name
const generateInitials = (name: string): string => {
    return name
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

type FormData = {
    fullName: string
    email: string
    phone: string
    resume: File | null
    coverLetter: string
    position: string
    experience: string
    skills: string
    meetingCode: string
}

export default function ApplicationFormPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [formData, setFormData] = useState<FormData>({
        fullName: user?.name || "",
        email: user?.email || "",
        phone: "",
        resume: null,
        coverLetter: "",
        position: "Software Developer",
        experience: "",
        skills: "",
        meetingCode: ""
    })
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'complete' | 'error'>('idle')
    const [candidateId, setCandidateId] = useState<string | null>(null)
    const [error, setError] = useState("")
    const [currentStep, setCurrentStep] = useState<'meeting-code' | 'application-form'>('meeting-code')
    const [meetingCode, setMeetingCode] = useState("")
    const [isValidating, setIsValidating] = useState(false)
    const [existingCandidate, setExistingCandidate] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [queryError, setQueryError] = useState<string | null>(null)
    const [hasResume, setHasResume] = useState(false)
    const [resumeFileName, setResumeFileName] = useState<string | null>(null)
    const [resumeUrl, setResumeUrl] = useState<string | null>(null)
    const [countdown, setCountdown] = useState(30)
    const [isCountingDown, setIsCountingDown] = useState(false)

    // Get Convex mutations
    const createCandidate = useMutation(api.candidates.createCandidate)
    const updateCandidate = useMutation(api.candidates.updateCandidate)
    const updateProfile = useMutation(api.users.updateProfile)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const uploadAndAnalyze = useMutation(api.files.uploadAndAnalyze)

    // Effect for countdown
    useEffect(() => {
        if (isSubmitted && countdown > 0) {
            setIsCountingDown(true)
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        setIsCountingDown(false)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [isSubmitted, countdown])

    // Reset all state when user changes
    useEffect(() => {
        if (!user) {
            setIsLoading(true);
            setQueryError(null);
            // Reset the current step to prevent flash of meeting code form
            setCurrentStep('meeting-code');
            // Clear meeting code and existing candidate data
            setMeetingCode("");
            setExistingCandidate(null);
        }
    }, [user]);

    // Query to get candidate by user ID
    const userCandidatesQuery = useQuery(
        api.candidates.getCandidatesByUserId,
        user?._id ? { userId: user._id as Id<"users"> } : "skip"
    );

    // Queries to validate meeting code and get candidate data
    const jobByMeetingCode = useQuery(
        api.jobs.getJobByMeetingCode,
        meetingCode && currentStep === 'meeting-code' ? { meetingCode } : "skip"
    );

    // Get candidate by user ID and meeting code
    const userCandidate = useQuery(
        api.candidates.getCandidateByUserAndMeetingCode,
        user?._id && meetingCode ? {
            userId: user._id as Id<"users">,
            meetingCode
        } : "skip"
    );

    // Get candidate experience and skills if we have an existing candidate
    const candidateExperienceAndSkills = useQuery(
        api.candidates.getCandidateExperienceAndSkills,
        existingCandidate?._id ? { candidateId: existingCandidate._id as Id<"candidates"> } : "skip"
    );

    // Get resume file if we have an existing candidate
    const candidateResume = useQuery(
        api.files.getResumeByCandidateId,
        existingCandidate?._id ? { candidateId: existingCandidate._id as Id<"candidates"> } : "skip"
    );

    // Check if user has a candidate profile with a meeting code
    useEffect(() => {
        try {
            // Skip processing if the query hasn't loaded yet
            if (userCandidatesQuery === undefined) {
                return; // keep isLoading true until query loads
            }

            if (userCandidatesQuery && userCandidatesQuery.length > 0) {
                const candidate = userCandidatesQuery[0];

                if (candidate && candidate.meetingCode) {
                    // User already has a meeting code, set it and skip to application form
                    setMeetingCode(candidate.meetingCode);
                    setCurrentStep('application-form');

                    // Pre-fill form with basic candidate data
                    setFormData(prev => ({
                        ...prev,
                        fullName: candidate.name || prev.fullName,
                        email: candidate.email || prev.email,
                        phone: candidate.phone || prev.phone,
                        position: candidate.position || prev.position,
                        meetingCode: candidate.meetingCode || "" // Ensure it's always a string
                    }));

                    setExistingCandidate(candidate);
                }
            }

            // Only set loading to false after we've determined which step to show
            setIsLoading(false);
        } catch (error) {
            console.error("Error checking candidate profile:", error);
            setIsLoading(false);
        }
    }, [userCandidatesQuery]);

    // If we found an existing candidate for this user and meeting code, populate the form with their data
    useEffect(() => {
        try {
            if (userCandidate) {
                setExistingCandidate(userCandidate);
                // Pre-fill form with existing data
                setFormData(prev => ({
                    ...prev,
                    fullName: userCandidate.name || prev.fullName,
                    email: userCandidate.email || prev.email,
                    phone: userCandidate.phone || prev.phone,
                    position: userCandidate.position || prev.position,
                    coverLetter: userCandidate.coverLetter || prev.coverLetter,
                    meetingCode: meetingCode || ""
                    // Note: We can't restore the resume File object, but we'll indicate we have one
                }));
            }
        } catch (error) {
            console.error("Error setting candidate data:", error);
        }
    }, [userCandidate, meetingCode]);

    // Effect to load experience and skills from the candidate profile
    useEffect(() => {
        if (candidateExperienceAndSkills) {
            setFormData(prev => ({
                ...prev,
                experience: candidateExperienceAndSkills.experience || prev.experience,
                skills: candidateExperienceAndSkills.skills ?
                    candidateExperienceAndSkills.skills.join(', ') :
                    prev.skills
            }));
        }
    }, [candidateExperienceAndSkills]);

    // Effect to load resume information
    useEffect(() => {
        if (candidateResume) {
            if (candidateResume.fileName && candidateResume.url) {
                setHasResume(true);
                setResumeFileName(candidateResume.fileName);
                setResumeUrl(candidateResume.url);
            }
        }
    }, [candidateResume]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target
        if (files && files.length > 0) {
            setFormData((prev) => ({
                ...prev,
                [name]: files[0],
            }))
        }
    }

    const handleMeetingCodeSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!meetingCode.trim()) {
            setError("Please enter a valid meeting code")
            return
        }

        setIsValidating(true)

        try {
            // Check if the meeting code is valid by checking jobs table
            const isValidJob = !!jobByMeetingCode

            if (!isValidJob) {
                setError("Invalid meeting code. Please check and try again.")
                setIsValidating(false)
                return
            }

            // Set the meeting code in the form data
            setFormData(prev => ({
                ...prev,
                meetingCode
            }))

            // Move to the application form step
            setCurrentStep('application-form')
        } catch (err) {
            console.error("Error validating meeting code:", err)
            setError("Error validating meeting code. Please try again.")
        } finally {
            setIsValidating(false)
        }
    }

    // Implement the simplified file upload function
    const uploadResumeToConvex = async (file: File, candidateId: string) => {
        try {
            setUploadStatus('uploading');

            // Get upload URL from Convex
            const uploadUrl = await generateUploadUrl();

            // Upload the file
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) {
                throw new Error(`Upload failed: ${result.statusText}`);
            }

            // Get the storageId from the response
            const { storageId } = await result.json();

            // Call uploadAndAnalyze with the storageId and candidateId
            await uploadAndAnalyze({
                storageId,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                analysisId: uuidv4(), // Generate a new analysis ID
                candidateId
            });

            setUploadStatus('complete');
            return storageId;
        } catch (error) {
            console.error("Error uploading file:", error);
            setUploadStatus('error');
            throw error;
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            // Generate random colors for the candidate avatar
            const colorOptions = [
                { bg: "bg-red-100", text: "text-red-800" },
                { bg: "bg-green-100", text: "text-green-800" },
                { bg: "bg-blue-100", text: "text-blue-800" },
                { bg: "bg-yellow-100", text: "text-yellow-800" },
                { bg: "bg-purple-100", text: "text-purple-800" },
                { bg: "bg-pink-100", text: "text-pink-800" },
            ];
            const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];

            // Get today's date for the applied date
            const today = new Date();
            const formattedDate = today.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Create the candidate first
            const newCandidateId = await createCandidate({
                name: formData.fullName,
                initials: generateInitials(formData.fullName),
                email: formData.email,
                phone: formData.phone,
                textColor: randomColor.text,
                bgColor: randomColor.bg,
                status: "applied",
                appliedDate: formattedDate,
                position: formData.position,
                recruiter: "AI Recruiter",
                progress: 25,
                lastActivity: `Applied on ${formattedDate}`,
                aiScore: 0,
                userId: user?._id,
                meetingCode: formData.meetingCode,
                coverLetter: formData.coverLetter
            });

            setCandidateId(newCandidateId);

            // Mark the user as having completed onboarding
            if (user) {
                await updateProfile({
                    completedOnboarding: true
                });
            }

            // Upload CV if available - analysis will be triggered automatically
            if (formData.resume) {
                await uploadResumeToConvex(formData.resume, newCandidateId);
            }

            setIsSubmitted(true);
        } catch (error) {
            console.error("Error submitting application:", error);
            setError("There was an error submitting your application. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // If the page is still loading, show a loading indicator
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full py-8">
                <div className="w-full max-w-md">
                    <Card className="p-6 text-center">
                        <div className="flex justify-center my-6">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                        <p>Loading your profile information...</p>
                        {queryError && (
                            <p className="mt-4 text-red-500 text-sm">{queryError}</p>
                        )}
                    </Card>
                </div>
            </div>
        );
    }

    if (isSubmitting) {
        return (
            <div className="flex items-center justify-center h-full py-8">
                <div className="w-full max-w-md">
                    <Card className="p-6 text-center">
                        <div className="flex justify-center my-6">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                        <p>Submitting your application...</p>
                        {queryError && (
                            <p className="mt-4 text-red-500 text-sm">{queryError}</p>
                        )}
                    </Card>
                </div>
            </div>
        );
    }

    // If form is already submitted, show success message
    if (isSubmitted) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-8">
                <Card className="p-8 text-center">
                    <div className="mb-6">
                        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold">Application Submitted Successfully!</h1>
                        <p className="mt-2 text-gray-600">
                            Thank you for your application. Your information has been received and is being processed.
                        </p>
                    </div>
                    <div className="text-center mb-4">
                        <p className="text-sm text-gray-500">
                            {uploadStatus === 'uploading' && (
                                <>
                                    <span className="inline-block animate-spin mr-2">⏳</span>
                                    Uploading and analyzing your CV...
                                </>
                            )}
                            {uploadStatus === 'error' && (
                                <>
                                    <span className="text-amber-500">⚠️</span> There was an issue processing your CV, but your application was still submitted.
                                </>
                            )}
                            {uploadStatus === 'complete' && (
                                <>
                                    <span className="text-green-500">✓</span> CV uploaded and being analyzed.
                                </>
                            )}
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setIsLoading(true);
                            setTimeout(() => {
                                router.push('/schedule-interview');
                            }, 100);
                        }}
                        className={`px-6 py-2 ${isCountingDown ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
                        disabled={isCountingDown}
                    >
                        {isCountingDown ? `Schedule Interview (${countdown}s)` : 'Schedule Interview'}
                    </Button>
                </Card>
            </div>
        )
    }

    // Step 1: Meeting Code Entry
    if (currentStep === 'meeting-code') {
        return (
            <div className="flex items-center justify-center h-full py-8">
                <div className="w-full max-w-md">
                    <Card className="p-6">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold">Enter Job Code</h1>
                            <p className="text-gray-600 mt-2">
                                Please enter the job code to start your application
                            </p>
                        </div>
                        <form onSubmit={handleMeetingCodeSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="meetingCode" className="text-sm font-medium">
                                    Job Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="meetingCode"
                                    name="meetingCode"
                                    type="text"
                                    required
                                    placeholder="Enter job code for your interview"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={meetingCode}
                                    onChange={(e) => {
                                        setMeetingCode(e.target.value);
                                        setError("");
                                    }}
                                    disabled={isValidating}
                                />
                                {error && <p className="text-sm text-red-500">{error}</p>}
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isValidating}
                            >
                                {isValidating ? "Validating..." : "Continue to Application"}
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        );
    }

    // Step 2: Application Form (possibly read-only if profile exists)
    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Job Application Form</h1>
                {existingCandidate && (
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded text-sm">
                        You have already applied for this position
                    </div>
                )}
            </div>

            <Card className="p-6">
                <form onSubmit={handleSubmit}>
                    <div className="mb-8">
                        <h2 className="mb-4 text-lg font-semibold">Personal Information</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="text-sm font-medium">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    disabled={isSubmitting || !!existingCandidate}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isSubmitting || !!existingCandidate}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-medium">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={isSubmitting || !!existingCandidate}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="mb-4 text-lg font-semibold">Professional Information</h2>
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <label htmlFor="resume" className="text-sm font-medium">
                                    Resume (PDF) <span className="text-red-500">*</span>
                                </label>

                                {hasResume && resumeFileName ? (
                                    <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                                        <div className="flex-1 flex items-center">
                                            <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="text-sm truncate">{resumeFileName}</span>
                                        </div>
                                        {resumeUrl && (
                                            <a
                                                href={resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                            >
                                                View PDF
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            id="resume"
                                            name="resume"
                                            type="file"
                                            accept=".pdf"
                                            required={!existingCandidate}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 focus:outline-none"
                                            onChange={handleFileChange}
                                            disabled={isSubmitting || !!existingCandidate}
                                        />
                                    </>
                                )}

                                {hasResume && resumeFileName && (
                                    <p className="text-xs text-green-600">Your CV has been uploaded and analyzed</p>
                                )}
                                {!existingCandidate && !hasResume && (
                                    <div className="mt-1">
                                        <p className="text-xs text-gray-500">Your CV will be saved and analyzed by our AI to create your candidate profile.</p>
                                        <div className="mt-1 bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                                            <strong>Important:</strong> Please upload a text-based, searchable PDF file. Scanned or image-based PDFs cannot be processed correctly.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="experience" className="text-sm font-medium">
                                    Years of Experience <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="experience"
                                    name="experience"
                                    type="text"
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    disabled={isSubmitting || !!existingCandidate}
                                />
                                {existingCandidate && formData.experience && (
                                    <p className="text-xs text-green-600">Information retrieved from your CV</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="skills" className="text-sm font-medium">
                                    Key Skills <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="skills"
                                    name="skills"
                                    type="text"
                                    required
                                    placeholder="e.g., JavaScript, React, Node.js"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    disabled={isSubmitting || !!existingCandidate}
                                />
                                {existingCandidate && formData.skills && (
                                    <p className="text-xs text-green-600">Skills extracted from your CV and profile</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="coverLetter" className="text-sm font-medium">
                                    Cover Letter
                                </label>
                                <textarea
                                    id="coverLetter"
                                    name="coverLetter"
                                    rows={5}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={formData.coverLetter}
                                    onChange={handleChange}
                                    disabled={isSubmitting || !!existingCandidate}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-4">
                        <Button
                            type="button"
                            className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800"
                            onClick={() => setCurrentStep('meeting-code')}
                        >
                            Back
                        </Button>

                        {existingCandidate ? (
                            <Button
                                type="button"
                                onClick={() => {
                                    // Add small transition delay to avoid flash
                                    setIsLoading(true);
                                    setTimeout(() => {
                                        router.push('/schedule-interview');
                                    }, 100);
                                }}
                                className="px-6"
                            >
                                Submit Details
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="px-6"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Application"}
                            </Button>
                        )}
                    </div>
                </form>
            </Card>
        </div>
    )
} 