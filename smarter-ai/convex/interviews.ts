import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { internal, api } from "./_generated/api"

// Get all interview requests
export const getInterviewRequests = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("interviewRequests"),
      _creationTime: v.number(),
      candidateId: v.id("candidates"),
      position: v.string(),
      date: v.string(),
      time: v.string(),
      status: v.string(),
      notes: v.optional(v.string()),
      interviewerIds: v.optional(v.array(v.string())),
      location: v.optional(v.string()),
      durationType: v.optional(v.string()),
      meetingLink: v.optional(v.string()),
      meetingCode: v.optional(v.string()),
      createdAt: v.string(),
      updatedAt: v.optional(v.string()),
      rescheduledFrom: v.optional(
        v.object({
          date: v.string(),
          time: v.string(),
        }),
      ),
      round: v.optional(v.number()),
      interviewType: v.optional(v.string()),
      jobId: v.optional(v.id("jobs")),
      // Include additional fields from the candidate for display
      candidateName: v.string(),
      candidateEmail: v.string(),
      candidateInitials: v.string(),
      candidateColor: v.string(),
    }),
  ),
  handler: async (ctx) => {
    // Get all interview requests
    const interviewRequests = await ctx.db.query("interviewRequests").collect()

    // Fetch candidate data for each request
    const requestsWithCandidateData = await Promise.all(
      interviewRequests.map(async (request) => {
        const candidate = await ctx.db.get(request.candidateId)

        if (!candidate) {
          // Provide default values for missing candidates
          return {
            ...request,
            candidateName: "Unknown Candidate",
            candidateEmail: "unknown@example.com",
            candidateInitials: "UC",
            candidateColor: "#808080", // Grey fallback color
          }
        }

        return {
          ...request,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          candidateInitials: candidate.initials,
          candidateColor: candidate.bgColor,
        }
      }),
    )

    return requestsWithCandidateData
  },
})

// Get a single interview request by ID
export const getInterviewRequestById = query({
  args: { id: v.id("interviewRequests") },
  returns: v.union(
    v.object({
      _id: v.id("interviewRequests"),
      _creationTime: v.number(),
      candidateId: v.id("candidates"),
      position: v.string(),
      date: v.string(),
      time: v.string(),
      status: v.string(),
      notes: v.optional(v.string()),
      interviewerIds: v.optional(v.array(v.string())),
      location: v.optional(v.string()),
      durationType: v.optional(v.string()),
      meetingLink: v.optional(v.string()),
      meetingCode: v.optional(v.string()),
      createdAt: v.string(),
      updatedAt: v.optional(v.string()),
      rescheduledFrom: v.optional(
        v.object({
          date: v.string(),
          time: v.string(),
        }),
      ),
      round: v.optional(v.number()),
      interviewType: v.optional(v.string()),
      jobId: v.optional(v.id("jobs")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const interviewRequest = await ctx.db.get(args.id)
    if (!interviewRequest) return null
    return interviewRequest
  },
})

// Get interview requests for a specific candidate
export const getInterviewRequestsByCandidate = query({
  args: { candidateId: v.id("candidates") },
  returns: v.array(
    v.object({
      _id: v.id("interviewRequests"),
      _creationTime: v.number(),
      candidateId: v.id("candidates"),
      position: v.string(),
      date: v.string(),
      time: v.string(),
      status: v.string(),
      notes: v.optional(v.string()),
      interviewerIds: v.optional(v.array(v.string())),
      location: v.optional(v.string()),
      durationType: v.optional(v.string()),
      meetingLink: v.optional(v.string()),
      meetingCode: v.optional(v.string()),
      createdAt: v.string(),
      updatedAt: v.optional(v.string()),
      rescheduledFrom: v.optional(
        v.object({
          date: v.string(),
          time: v.string(),
        }),
      ),
      round: v.optional(v.number()),
      interviewType: v.optional(v.string()),
      jobId: v.optional(v.id("jobs")),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all interview requests for this candidate
    const interviewRequests = await ctx.db
      .query("interviewRequests")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .collect()

    return interviewRequests
  },
})

// Get interview requests by status
export const getInterviewRequestsByStatus = query({
  args: { status: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("interviewRequests"),
      _creationTime: v.number(),
      candidateId: v.id("candidates"),
      position: v.string(),
      date: v.string(),
      time: v.string(),
      status: v.string(),
      candidateName: v.string(),
      candidateEmail: v.string(),
      meetingCode: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all interview requests with the specified status
    const interviewRequests = await ctx.db
      .query("interviewRequests")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect()

    // Fetch candidate data for each request
    const requestsWithCandidateData = await Promise.all(
      interviewRequests.map(async (request) => {
        const candidate = await ctx.db.get(request.candidateId)

        if (!candidate) {
          // Provide default values instead of throwing an error
          return {
            ...request,
            candidateName: "Unknown Candidate",
            candidateEmail: "unknown@example.com",
          }
        }

        return {
          ...request,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
        }
      }),
    )

    return requestsWithCandidateData
  },
})

// Get interview requests for a specific date range
export const getInterviewRequestsByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("interviewRequests"),
      _creationTime: v.number(),
      candidateId: v.id("candidates"),
      position: v.string(),
      date: v.string(),
      time: v.string(),
      status: v.string(),
      candidateName: v.string(),
      meetingCode: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all interview requests within the date range
    const interviewRequests = await ctx.db
      .query("interviewRequests")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate),
        ),
      )
      .collect()

    // Fetch candidate data for each request
    const requestsWithCandidateData = await Promise.all(
      interviewRequests.map(async (request) => {
        const candidate = await ctx.db.get(request.candidateId)

        if (!candidate) {
          // Provide default values instead of throwing an error
          return {
            ...request,
            candidateName: "Unknown Candidate",
          }
        }

        return {
          ...request,
          candidateName: candidate.name,
        }
      }),
    )

    return requestsWithCandidateData
  },
})

// Create a new interview request
export const createInterviewRequest = mutation({
  args: {
    candidateId: v.id("candidates"),
    position: v.string(),
    date: v.string(), // ISO date string
    time: v.string(),
    status: v.string(),
    notes: v.optional(v.string()),
    interviewerIds: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    durationType: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    round: v.optional(v.number()),
    interviewType: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
  },
  returns: v.id("interviewRequests"),
  handler: async (ctx, args) => {
    // Check if the candidate exists
    const candidate = await ctx.db.get(args.candidateId)
    if (!candidate) {
      throw new Error(`Candidate with ID ${args.candidateId} not found`)
    }

    // If jobId is provided, check if the job exists
    if (args.jobId) {
      const job = await ctx.db.get(args.jobId)
      if (!job) {
        throw new Error(`Job with ID ${args.jobId} not found`)
      }
    }

    // Generate a unique meeting code for this interview
    const generateRandomCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let code = ""
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    // Create the interview request with a meeting code
    const now = new Date().toISOString()
    const interviewRequestId = await ctx.db.insert("interviewRequests", {
      ...args,
      meetingCode: generateRandomCode(), // Generate and add a meeting code
      createdAt: now,
      updatedAt: now,
    })

    // Schedule the new interview request for vector indexing immediately after this mutation commits
    await ctx.scheduler.runAfter(
      0,
      internal.populateVectorDb.populateSingleInterviewRequestData,
      { requestId: interviewRequestId },
    )

    return interviewRequestId
  },
})

// Update an interview request status
export const updateInterviewRequestStatus = mutation({
  args: {
    id: v.id("interviewRequests"),
    status: v.string(), // "pending", "accepted", "rejected", "rescheduled"
  },
  returns: v.id("interviewRequests"),
  handler: async (ctx, args) => {
    const { id, status } = args

    // Get the interview request
    const interviewRequest = await ctx.db.get(id)
    if (!interviewRequest) {
      throw new Error(`Interview request with ID ${id} not found`)
    }

    // Update the status and updatedAt fields
    await ctx.db.patch(id, {
      status,
      updatedAt: new Date().toISOString(),
    })

    // Schedule the updated interview request for vector indexing immediately after this mutation commits
    await ctx.scheduler.runAfter(
      0,
      internal.populateVectorDb.populateSingleInterviewRequestData,
      { requestId: id },
    )

    return id
  },
})

// Reschedule an interview request
export const rescheduleInterviewRequest = mutation({
  args: {
    id: v.id("interviewRequests"),
    newDate: v.string(),
    newTime: v.string(),
  },
  returns: v.id("interviewRequests"),
  handler: async (ctx, args) => {
    const { id, newDate, newTime } = args

    // Get the interview request
    const interviewRequest = await ctx.db.get(id)
    if (!interviewRequest) {
      throw new Error(`Interview request with ID ${id} not found`)
    }

    // Update with new date/time and record previous schedule
    await ctx.db.patch(id, {
      date: newDate,
      time: newTime,
      status: "rescheduled",
      updatedAt: new Date().toISOString(),
      rescheduledFrom: {
        date: interviewRequest.date,
        time: interviewRequest.time,
      },
    })

    // Schedule the rescheduled interview request for vector indexing immediately after this mutation commits
    await ctx.scheduler.runAfter(
      0,
      internal.populateVectorDb.populateSingleInterviewRequestData,
      { requestId: id },
    )

    return id
  },
})

// Delete an interview request
export const deleteInterviewRequest = mutation({
  args: { id: v.id("interviewRequests") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return null
  },
})

// Generate calendar data format from interview requests
export const getCalendarData = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      day: v.string(), // ISO date string
      events: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          time: v.string(),
          datetime: v.string(),
          status: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Get interview requests, optionally filtered by date range
    let interviewRequestsQuery = ctx.db.query("interviewRequests")

    if (args.startDate && args.endDate) {
      interviewRequestsQuery = interviewRequestsQuery.filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate as string),
          q.lte(q.field("date"), args.endDate as string),
        ),
      )
    }

    const interviewRequests = await interviewRequestsQuery.collect()

    // Group interview requests by date
    const groupedByDate: Record<string, any[]> = {}

    await Promise.all(
      interviewRequests.map(async (request) => {
        // Get candidate name for display
        const candidate = await ctx.db.get(request.candidateId)
        const candidateName = candidate ? candidate.name : "Unknown Candidate"

        const dateStr = request.date

        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = []
        }

        groupedByDate[dateStr].push({
          id: request._id.toString(),
          name: `${candidateName} - ${request.position}`,
          time: request.time,
          datetime: request.date,
          status: request.status,
        })
      }),
    )

    // Convert to calendar data format
    const calendarData = Object.keys(groupedByDate).map((dateStr) => ({
      day: dateStr,
      events: groupedByDate[dateStr],
    }))

    return calendarData
  },
})

// Schedule an interview with a candidate identified by name
export const scheduleInterviewWithName = mutation({
  args: {
    candidateName: v.string(),
    position: v.string(),
    date: v.string(),
    time: v.string(),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    interviewType: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    interviewId: v.optional(v.id("interviewRequests")),
    candidateId: v.optional(v.id("candidates")),
  }),
  handler: async (ctx, args) => {
    try {
      // Look up candidates with the given name
      const candidateNameToSearch = args.candidateName.toLowerCase().trim()
      const candidates = await ctx.db.query("candidates").collect()

      // Filter candidates whose names match the search term
      const matchingCandidates = candidates.filter((candidate) =>
        candidate.name.toLowerCase().includes(candidateNameToSearch),
      )

      // Handle different result scenarios
      if (matchingCandidates.length === 0) {
        return {
          success: false,
          error: `I couldn't find any candidates named "${args.candidateName}". Please check the spelling or provide the candidate ID directly.`,
        }
      } else if (matchingCandidates.length > 1) {
        // Multiple matches found - ask for clarification
        const candidateOptions = matchingCandidates
          .map(
            (c) =>
              `${c.name}${c.position ? ` (${c.position})` : ""} - ${c.email}`,
          )
          .join("\n")

        return {
          success: false,
          error: `I found multiple candidates with the name "${args.candidateName}". Please specify which one you want to schedule an interview with:\n\n${candidateOptions}`,
        }
      }

      // We have exactly one match, so schedule the interview with this candidate
      const candidateId = matchingCandidates[0]._id

      // Check if the job ID is valid if provided
      if (args.jobId) {
        const job = await ctx.db.get(args.jobId)
        if (!job) {
          return {
            success: false,
            error: `The specified job ID does not exist. Please provide a valid job ID or omit it.`,
          }
        }
      }

      // Create the interview request
      const now = new Date().toISOString()
      const interviewRequestId = await ctx.db.insert("interviewRequests", {
        candidateId,
        position: args.position,
        date: args.date,
        time: args.time,
        status: "Scheduled",
        notes: args.notes,
        location: args.location || "Remote",
        interviewType: args.interviewType || "General",
        meetingLink: args.meetingLink,
        jobId: args.jobId,
        createdAt: now,
        updatedAt: now,
      })

      return {
        success: true,
        interviewId: interviewRequestId,
        candidateId,
      }
    } catch (error) {
      // Handle any errors during the process
      console.error("Error in scheduleInterviewWithName:", error)
      return {
        success: false,
        error:
          "An unexpected error occurred while scheduling the interview. Please try again.",
      }
    }
  },
})

// Automatically generate meeting codes for interview requests that don't have one
export const ensureInterviewRequestHasMeetingCode = mutation({
  args: {
    interviewRequestId: v.id("interviewRequests"),
  },
  returns: v.object({
    meetingCode: v.string(),
  }),
  handler: async (ctx, args) => {
    const { interviewRequestId } = args

    // Check if the interview request exists
    const interviewRequest = await ctx.db.get(interviewRequestId)
    if (!interviewRequest) {
      throw new Error(
        `Interview request with ID ${interviewRequestId} not found`,
      )
    }

    // If the interview request already has a meeting code, just return it
    if (interviewRequest.meetingCode) {
      return { meetingCode: interviewRequest.meetingCode }
    }

    // Generate a unique meeting code (random 6-character alphanumeric)
    const generateRandomCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let code = ""
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    const meetingCode = generateRandomCode()

    // Update the interview request with the new meeting code
    await ctx.db.patch(interviewRequestId, { meetingCode })

    return { meetingCode }
  },
})
