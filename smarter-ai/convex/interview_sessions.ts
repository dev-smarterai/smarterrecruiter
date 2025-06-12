import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { internal, api } from "./_generated/api"

// This function has been replaced by the saveInterview function at the end of the file

// Start a new interview session - called when the conversation begins
export const startInterviewSession = mutation({
  args: {
    meetingCode: v.string(),
    candidateId: v.optional(v.id("candidates")),
    jobId: v.optional(v.id("jobs")),
    interviewType: v.optional(v.string()),
    title: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  returns: v.object({
    interviewId: v.id("interviews"),
    status: v.string(),
    accessError: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    interviewId: Id<"interviews">
    status: string
    accessError?: string
  }> => {
    // Check if access is allowed for this meeting code first
    const accessCheck: {
      canAccess: boolean
      message: string
      interviewData?: {
        interviewId: Id<"interviewRequests">
        candidateId: Id<"candidates">
        candidateName: string
        jobId?: Id<"jobs">
        position: string
        time: string
      }
    } = await ctx.runQuery(api.interview_access.validateInterviewAccess, {
      meetingCode: args.meetingCode,
      userId: args.userId,
    })

    // If access is denied, return with error message
    if (!accessCheck.canAccess) {
      return {
        interviewId: "" as Id<"interviews">, // Empty ID
        status: "access_denied",
        accessError: accessCheck.message,
      }
    }

    // Use the validated candidate ID or the provided one
    let useableCandidateId = args.candidateId
    let useableJobId = args.jobId

    // Override with data from access check if available
    if (accessCheck.interviewData) {
      useableCandidateId = accessCheck.interviewData.candidateId
      useableJobId = accessCheck.interviewData.jobId
    }

    let title = args.title

    if (!useableCandidateId) {
      // Try to find candidate by meeting code
      const candidates = await ctx.db
        .query("candidates")
        .filter((q) => q.eq(q.field("meetingCode"), args.meetingCode))
        .collect()

      if (candidates.length > 0) {
        useableCandidateId = candidates[0]._id
      } else {
        throw new Error(
          `No candidate found with meeting code: ${args.meetingCode}`,
        )
      }
    }

    // Get candidate details for title if needed
    const candidate = await ctx.db.get(useableCandidateId)
    if (!candidate) {
      throw new Error(`Candidate with ID ${useableCandidateId} not found`)
    }

    if (!useableJobId) {
      // Try to find job by meeting code
      const jobs = await ctx.db
        .query("jobs")
        .filter((q) => q.eq(q.field("meetingCode"), args.meetingCode))
        .collect()

      if (jobs.length > 0) {
        useableJobId = jobs[0]._id
      }
    }

    // Get job details for title if a job ID is available
    let jobTitle = ""
    if (useableJobId) {
      const job = await ctx.db.get(useableJobId)
      if (job && "title" in job) {
        jobTitle = job.title as string
      }
    }

    // Generate a title if not provided
    if (!title) {
      // Add timestamp to ensure unique titles
      const timestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })

      // Safely access candidate name, with fallback
      const candidateName =
        candidate && "name" in candidate
          ? (candidate.name as string)
          : "Candidate"

      title = jobTitle
        ? `${candidateName} - ${jobTitle} Interview (${timestamp})`
        : `Interview with ${candidateName} (${timestamp})`
    }

    // Check if there's an existing in-progress interview for this meeting code
    // But now we will always create a new one for proper history
    const existingInterviews = await ctx.db
      .query("interviews")
      .withIndex("by_meeting_code", (q) =>
        q.eq("meetingCode", args.meetingCode),
      )
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect()

    if (existingInterviews.length > 0) {
      // Now we mark any existing "in_progress" interviews as "interrupted" to avoid conflicts
      for (const interview of existingInterviews) {
        await ctx.db.patch(interview._id, {
          status: "interrupted",
          endedAt: new Date().toISOString(),
        })
      }
    }

    // Create a new interview record
    const now = new Date().toISOString()
    const interviewId = await ctx.db.insert("interviews", {
      candidateId: useableCandidateId,
      jobId: useableJobId,
      meetingCode: args.meetingCode,
      title,
      interviewType: args.interviewType || "ai",
      startedAt: now,
      status: "in_progress",
      transcript: [], // Start with empty transcript
    })

    return {
      interviewId,
      status: "created",
    }
  },
})

// Get the current interview by meeting code
export const getInterviewByMeetingCode = query({
  args: {
    meetingCode: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("interviews"),
      _creationTime: v.float64(),
      candidateId: v.id("candidates"),
      jobId: v.optional(v.id("jobs")),
      meetingCode: v.string(),
      title: v.string(),
      startedAt: v.string(),
      endedAt: v.optional(v.string()),
      status: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Find the most recent interview for this meeting code
    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_meeting_code", (q) =>
        q.eq("meetingCode", args.meetingCode),
      )
      .order("desc")
      .first()

    return interviews
  },
})

// Complete an interview session and save the transcript
export const completeInterviewSession = mutation({
  args: {
    interviewId: v.id("interviews"),
    transcript: v.array(
      v.object({
        sender: v.string(),
        text: v.string(),
        timestamp: v.string(),
      }),
    ),
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
  },
  returns: v.union(
    v.object({
      status: v.string(),
      interviewId: v.id("interviews"),
    }),
    v.id("interviews"),
  ),
  handler: async (ctx, args) => {
    const { interviewId, transcript, summary, keyPoints } = args

    // Verify the interview exists
    const interview = await ctx.db.get(interviewId)
    if (!interview) {
      throw new Error(`Interview with ID ${interviewId} not found`)
    }

    // If the interview is already completed, just return success
    if (interview.status !== "in_progress") {
      return {
        status: interview.status,
        interviewId,
      }
    }

    // Calculate duration if possible
    let duration
    if (interview.startedAt) {
      const startTime = new Date(interview.startedAt).getTime()
      const endTime = new Date().getTime()
      duration = Math.floor((endTime - startTime) / 1000) // Duration in seconds
    }

    // Update the interview with transcript and mark as completed
    await ctx.db.patch(interviewId, {
      transcript,
      summary,
      keyPoints,
      endedAt: new Date().toISOString(),
      duration,
      status: "completed",
    })

    // Note: We're not using auto-analysis for now due to TypeScript issues
    // Instead, we'll rely on manual analysis from the candidate profile page
    console.log("Interview completed, manual analysis will be required")

    return {
      status: "completed",
      interviewId,
    }
  },
})

// Get all interviews for a specific candidate
export const getInterviewsByCandidate = query({
  args: {
    candidateId: v.id("candidates"),
  },
  returns: v.array(
    v.object({
      _id: v.id("interviews"),
      _creationTime: v.float64(),
      title: v.string(),
      startedAt: v.string(),
      endedAt: v.optional(v.string()),
      duration: v.optional(v.number()),
      status: v.string(),
      interviewType: v.optional(v.string()),
      keyPoints: v.optional(v.array(v.string())),
      summary: v.optional(v.string()),
      transcript: v.array(
        v.object({
          sender: v.string(),
          text: v.string(),
          timestamp: v.string(),
        }),
      ),
      scores: v.optional(
        v.object({
          technical: v.optional(v.number()),
          communication: v.optional(v.number()),
          problemSolving: v.optional(v.number()),
          overall: v.optional(v.number()),
        }),
      ),
      feedback: v.optional(v.string()),
      video_id: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all interviews for this candidate
    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .order("desc")
      .collect()

    // Return only the fields we specified in the return type
    return interviews.map((interview) => ({
      _id: interview._id,
      _creationTime: interview._creationTime,
      title: interview.title,
      startedAt: interview.startedAt,
      endedAt: interview.endedAt,
      duration: interview.duration,
      status: interview.status,
      interviewType: interview.interviewType,
      transcript: interview.transcript,
      scores: interview.scores,
      feedback: interview.feedback,
      keyPoints: interview.keyPoints,
      video_id: interview.video_id,
    }))
  },
})

// Get interview details with full transcript
export const getInterviewDetails = query({
  args: {
    interviewId: v.id("interviews"),
  },
  returns: v.union(
    v.object({
      _id: v.id("interviews"),
      _creationTime: v.float64(),
      candidateId: v.id("candidates"),
      jobId: v.optional(v.id("jobs")),
      title: v.string(),
      meetingCode: v.string(),
      interviewType: v.optional(v.string()),
      startedAt: v.string(),
      endedAt: v.optional(v.string()),
      duration: v.optional(v.number()),
      transcript: v.array(
        v.object({
          sender: v.string(),
          text: v.string(),
          timestamp: v.string(),
        }),
      ),
      summary: v.optional(v.string()),
      keyPoints: v.optional(v.array(v.string())),
      status: v.string(),
      candidateName: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      video_id: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Get the interview
    const interview = await ctx.db.get(args.interviewId)
    if (!interview) {
      return null
    }

    // Get candidate and job information
    const candidate = await ctx.db.get(interview.candidateId)
    const candidateName = candidate?.name || "Unknown Candidate"

    let jobTitle
    if (interview.jobId) {
      const job = await ctx.db.get(interview.jobId)
      jobTitle = job?.title || "Unknown Position"
    }

    return {
      ...interview,
      candidateName,
      jobTitle,
    }
  },
})

// Update interview analysis (after it's completed)
export const updateInterviewAnalysis = mutation({
  args: {
    interviewId: v.id("interviews"),
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
    scores: v.optional(
      v.object({
        technical: v.optional(v.number()),
        communication: v.optional(v.number()),
        problemSolving: v.optional(v.number()),
        overall: v.optional(v.number()),
      }),
    ),
    feedback: v.optional(v.string()),
  },
  returns: v.id("interviews"),
  handler: async (ctx, args) => {
    const { interviewId, ...updates } = args

    // Verify the interview exists
    const interview = await ctx.db.get(interviewId)
    if (!interview) {
      throw new Error(`Interview with ID ${interviewId} not found`)
    }

    if (interview.status === "in_progress") {
      throw new Error("Cannot update analysis for an in-progress interview")
    }

    try {
      // Validate scores
      if (updates.scores) {
        const { technical, communication, problemSolving, overall } =
          updates.scores
        if (
          (technical && (technical < 0 || technical > 100)) ||
          (communication && (communication < 0 || communication > 100)) ||
          (problemSolving && (problemSolving < 0 || problemSolving > 100)) ||
          (overall && (overall < 0 || overall > 100))
        ) {
          throw new Error("Score values must be between 0 and 100")
        }

        // Update the candidate's aiScore with the overall score if provided
        if (overall && interview.candidateId) {
          await ctx.db.patch(interview.candidateId, {
            aiScore: overall,
            lastActivity: `Interview Analysis (${new Date().toISOString()})`,
          })
        }
      }

      // Update the interview with analysis data
      await ctx.db.patch(interviewId, {
        ...updates,
        status: "analyzed", // Update status to indicate analysis is complete
      })

      return interviewId
    } catch (error: any) {
      // Update status to indicate analysis failed
      await ctx.db.patch(interviewId, {
        status: "analysis_failed",
      })

      throw error
    }
  },
})

// Delete an interview and its transcript
export const deleteInterview = mutation({
  args: {
    interviewId: v.id("interviews"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.interviewId)
    return null
  },
})

// Create an interview session in one go (instead of separate start and complete)
export const createInterviewSession = mutation({
  args: {
    meetingCode: v.string(),
    candidateId: v.optional(v.id("candidates")),
    jobId: v.optional(v.id("jobs")),
    interviewType: v.optional(v.string()),
    title: v.optional(v.string()),
    transcript: v.array(
      v.object({
        sender: v.string(),
        text: v.string(),
        timestamp: v.string(),
      }),
    ),
    video_id: v.optional(v.string()),
  },
  returns: v.object({
    interviewId: v.id("interviews"),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const {
      meetingCode,
      candidateId: providedCandidateId,
      jobId: providedJobId,
      interviewType,
      title: providedTitle,
      transcript,
      video_id,
    } = args

    // Find candidate and job information from the meeting code if not provided
    let candidateId = providedCandidateId
    let jobId = providedJobId
    let title = providedTitle

    if (!candidateId) {
      // First, try to find job by meeting code (since meeting code is actually a job code)
      const jobs = await ctx.db
        .query("jobs")
        .filter((q) => q.eq(q.field("meetingCode"), meetingCode))
        .collect()

      if (jobs.length > 0) {
        // We found a job with this code, now try to find the most recent candidate
        // who applied to this job
        const jobId = jobs[0]._id

        // Get applications for this job
        const applications = await ctx.db
          .query("jobApplications")
          .withIndex("by_job", (q) => q.eq("jobId", jobId))
          .order("desc")
          .collect()

        if (applications.length > 0) {
          // Use the most recent candidate who applied to this job
          candidateId = applications[0].candidateId
          console.log(
            `Found candidate ${candidateId} from job application for job code ${meetingCode}`,
          )
        } else {
          // Fallback: Try to find any candidate with this meeting code
          const candidates = await ctx.db
            .query("candidates")
            .filter((q) => q.eq(q.field("meetingCode"), meetingCode))
            .collect()

          if (candidates.length > 0) {
            candidateId = candidates[0]._id
            console.log(
              `Found candidate ${candidateId} with meeting code ${meetingCode}`,
            )
          } else {
            throw new Error(
              `No candidate found for job code: ${meetingCode}. Please ensure a candidate has applied to this job.`,
            )
          }
        }
      } else {
        // Fallback: Try to find any candidate with this meeting code
        const candidates = await ctx.db
          .query("candidates")
          .filter((q) => q.eq(q.field("meetingCode"), meetingCode))
          .collect()

        if (candidates.length > 0) {
          candidateId = candidates[0]._id
          console.log(
            `Found candidate ${candidateId} with meeting code ${meetingCode}`,
          )
        } else {
          throw new Error(`No job or candidate found with code: ${meetingCode}`)
        }
      }
    }

    // Get candidate details for title if needed
    const candidate = await ctx.db.get(candidateId)
    if (!candidate) {
      throw new Error(`Candidate with ID ${candidateId} not found`)
    }

    if (!jobId) {
      // Try to find job by meeting code
      const jobs = await ctx.db
        .query("jobs")
        .filter((q) => q.eq(q.field("meetingCode"), meetingCode))
        .collect()

      if (jobs.length > 0) {
        jobId = jobs[0]._id
        console.log(`Found job ${jobId} with job code ${meetingCode}`)
      } else {
        console.log(`No job found with job code ${meetingCode}`)
      }
    }

    // Get job details for title if a job ID is available
    let jobTitle = ""
    if (jobId) {
      const job = await ctx.db.get(jobId)
      if (job) {
        jobTitle = job.title
      }
    }

    // Generate a title if not provided
    if (!title) {
      // Add timestamp to ensure unique titles
      const timestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })

      title = jobTitle
        ? `${candidate.name} - ${jobTitle} Interview (${timestamp})`
        : `Interview with ${candidate.name} (${timestamp})`
    }

    // Mark any existing in-progress interviews as interrupted
    const existingInterviews = await ctx.db
      .query("interviews")
      .withIndex("by_meeting_code", (q) => q.eq("meetingCode", meetingCode))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect()

    if (existingInterviews.length > 0) {
      for (const interview of existingInterviews) {
        await ctx.db.patch(interview._id, {
          status: "interrupted",
          endedAt: new Date().toISOString(),
        })
      }
    }

    // Calculate timestamps and duration from the transcript
    let startedAt: Date
    let endedAt: Date
    let duration: number

    if (transcript.length > 0) {
      // Use the first and last message timestamps to determine start and end times
      const firstMessageTime = new Date(transcript[0].timestamp)
      const lastMessageTime = new Date(
        transcript[transcript.length - 1].timestamp,
      )

      startedAt = firstMessageTime
      endedAt = lastMessageTime

      // Calculate duration in seconds
      duration = Math.floor(
        (lastMessageTime.getTime() - firstMessageTime.getTime()) / 1000,
      )
    } else {
      // Fallback if no messages (unlikely but handle it anyway)
      startedAt = new Date(new Date().getTime() - 60000) // 1 minute ago as fallback
      endedAt = new Date()
      duration = 60 // Default 60 seconds
    }

    // Create a new completed interview record with transcript
    const interviewId = await ctx.db.insert("interviews", {
      candidateId,
      jobId,
      meetingCode,
      title,
      interviewType: interviewType || "ai",
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      duration,
      status: "completed",
      transcript,
      video_id,
    })

    // Note: We're not using auto-analysis for now due to TypeScript issues
    // Instead, we'll rely on manual analysis from the candidate profile page
    console.log("Interview created, manual analysis will be required")

    return {
      interviewId,
      status: "completed",
    }
  },
})

// Save an interview directly (used by the meeting page)
export const saveInterview = mutation({
  args: {
    candidateId: v.id("candidates"),
    jobId: v.optional(v.id("jobs")),
    transcript: v.array(
      v.object({
        sender: v.string(),
        text: v.string(),
        timestamp: v.string(),
      }),
    ),
    interviewType: v.optional(v.string()),
    video_id: v.optional(v.string()),
  },
  returns: v.object({
    interviewId: v.id("interviews"),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const { candidateId, jobId, transcript, interviewType, video_id } = args

    // Verify the candidate exists
    const candidate = await ctx.db.get(candidateId)
    if (!candidate) {
      throw new Error(`Candidate with ID ${candidateId} not found`)
    }

    // Verify the job exists if provided
    if (jobId) {
      const job = await ctx.db.get(jobId)
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found`)
      }
    }

    // Generate a title with timestamp
    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })

    let title = ""
    if (jobId) {
      const job = await ctx.db.get(jobId)
      if (job) {
        title = `${candidate.name} - ${job.title} Interview (${timestamp})`
      }
    }

    if (!title) {
      title = `Interview with ${candidate.name} (${timestamp})`
    }

    // Calculate timestamps and duration from the transcript
    let startedAt: Date
    let endedAt: Date
    let duration: number

    if (transcript.length > 0) {
      // Use the first and last message timestamps to determine start and end times
      const firstMessageTime = new Date(transcript[0].timestamp)
      const lastMessageTime = new Date(
        transcript[transcript.length - 1].timestamp,
      )

      startedAt = firstMessageTime
      endedAt = lastMessageTime

      // Calculate duration in seconds
      duration = Math.floor(
        (lastMessageTime.getTime() - firstMessageTime.getTime()) / 1000,
      )
    } else {
      // Fallback if no messages (unlikely but handle it anyway)
      startedAt = new Date(new Date().getTime() - 60000) // 1 minute ago as fallback
      endedAt = new Date()
      duration = 60 // Default 60 seconds
    }

    // Get the meeting code from the job or generate a unique one
    let meetingCode = "meeting_" + Date.now()
    if (jobId) {
      const job = await ctx.db.get(jobId)
      if (job?.meetingCode) {
        meetingCode = job.meetingCode
      }
    }

    // Create a new completed interview record with transcript
    const interviewId = await ctx.db.insert("interviews", {
      candidateId,
      jobId,
      meetingCode,
      title,
      interviewType: interviewType || "ai",
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      duration,
      status: "completed",
      transcript,
      video_id,
    })

    console.log("Interview saved directly, manual analysis will be required")

    return {
      interviewId,
      status: "completed",
    }
  },
})

// Update the flagInterviewError mutation to be simpler
export const flagInterviewError = mutation({
  args: {
    candidateId: v.optional(v.id("candidates")),
    meetingCode: v.optional(v.string()),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const { candidateId, meetingCode, description } = args

    let candidate

    if (candidateId) {
      // If candidateId is provided, use it directly
      candidate = await ctx.db.get(candidateId)
      if (!candidate) {
        throw new Error(`Candidate with ID ${candidateId} not found`)
      }
    } else if (meetingCode) {
      // Try to find the candidate by meeting code first
      candidate = await ctx.db
        .query("candidates")
        .filter((q) => q.eq(q.field("meetingCode"), meetingCode))
        .first()

      if (!candidate) {
        // If no candidate found by meeting code, try to find through job applications
        const job = await ctx.db
          .query("jobs")
          .filter((q) => q.eq(q.field("meetingCode"), meetingCode))
          .first()

        if (job) {
          // Get the most recent application for this job
          const application = await ctx.db
            .query("jobApplications")
            .withIndex("by_job", (q) => q.eq("jobId", job._id))
            .order("desc")
            .first()

          if (application) {
            candidate = await ctx.db.get(application.candidateId)
          }
        }
      }
    }

    if (!candidate) {
      throw new Error(
        `No candidate found${meetingCode ? ` for meeting code: ${meetingCode}` : ""}`,
      )
    }

    // Get existing bugs or create new array
    const existingBugs = candidate.bugs || []

    // Add new bug report
    const newBug = {
      description: description,
      timestamp: new Date().toISOString(),
      status: "open",
    }

    // Update the candidate record with the new bug
    await ctx.db.patch(candidate._id, {
      bugs: [...existingBugs, newBug],
      lastActivity: `Bug Report Added (${new Date().toISOString()})`,
    })

    return {
      success: true,
      message: "Bug report has been added successfully",
      candidateId: candidate._id,
    }
  },
})

export const flagError = mutation({
  args: {
    candidateId: v.id("candidates"),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const { candidateId, description } = args

    // Get the candidate
    const candidate = await ctx.db.get(candidateId)
    if (!candidate) {
      throw new Error("Candidate not found")
    }

    // Get existing bugs or initialize new array
    const existingBugs = candidate.bugs || []

    // Create new bug report with ISO string timestamps
    const newBug = {
      description,
      timestamp: new Date().toISOString(),
      status: "open",
    }

    // Update candidate with new bug and last activity
    await ctx.db.patch(candidateId, {
      bugs: [...existingBugs, newBug],
      lastActivity: new Date().toISOString(),
    })

    return { success: true }
  },
})
