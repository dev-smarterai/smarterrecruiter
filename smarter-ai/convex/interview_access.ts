import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"

/**
 * Validates if a user can access an AI interview based on their scheduled interview time
 *
 * This function checks:
 * 1. If the interview exists with the given meeting code
 * 2. If the interview is scheduled for today
 * 3. If the current time is within 15 minutes of the scheduled time (before or after)
 * 4. If the user ID matches the candidate's user ID for security
 */
export const validateInterviewAccess = query({
  args: {
    meetingCode: v.string(),
    userId: v.optional(v.id("users")),
    clientLocalTime: v.optional(
      v.object({
        hours: v.number(),
        minutes: v.number(),
        day: v.number(),
        month: v.number(),
        year: v.number(),
      }),
    ),
  },
  returns: v.object({
    canAccess: v.boolean(),
    message: v.string(),
    interviewData: v.optional(
      v.object({
        interviewId: v.id("interviewRequests"),
        candidateId: v.id("candidates"),
        candidateName: v.string(),
        jobId: v.optional(v.id("jobs")),
        position: v.string(),
        time: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const { meetingCode, userId, clientLocalTime } = args

    // Find the interview request with this meeting code
    const interviewRequests = await ctx.db
      .query("interviewRequests")
      .filter((q) => q.eq(q.field("meetingCode"), meetingCode))
      .collect()

    // If no interview request found with this meeting code, check if it's a job's meeting code
    if (interviewRequests.length === 0) {
      // Try to find a job with this meeting code
      const jobs = await ctx.db
        .query("jobs")
        .filter((q) => q.eq(q.field("meetingCode"), meetingCode))
        .collect()

      if (jobs.length > 0) {
        return {
          canAccess: false,
          message:
            "This code is for a job posting, not a specific scheduled interview. Please contact the recruiter for your personal interview code.",
        }
      }

      // Try to find a candidate with this meeting code
      const candidates = await ctx.db
        .query("candidates")
        .filter((q) => q.eq(q.field("meetingCode"), meetingCode))
        .collect()

      if (candidates.length > 0) {
        return {
          canAccess: false,
          message:
            "This code is for a candidate profile, not a specific scheduled interview. Please use the code provided for your upcoming interview.",
        }
      }

      return {
        canAccess: false,
        message:
          "No scheduled interview found with this code. Please check your interview code and try again.",
      }
    }

    // Get the most recent interview request (in case of multiple/rescheduled)
    const interviewRequest = interviewRequests.sort(
      (a, b) =>
        new Date(b.updatedAt || b._creationTime).getTime() -
        new Date(a.updatedAt || a._creationTime).getTime(),
    )[0]

    // Verify the interview status - only allow if status is "accepted" or "pending"
    if (
      interviewRequest.status !== "accepted" &&
      interviewRequest.status !== "pending" &&
      interviewRequest.status !== "Scheduled"
    ) {
      return {
        canAccess: false,
        message: `This interview has been ${interviewRequest.status}. Please contact the recruiter for assistance.`,
      }
    }

    // Get the candidate info
    const candidate = await ctx.db.get(interviewRequest.candidateId)
    if (!candidate) {
      return {
        canAccess: false,
        message:
          "Candidate information not found. Please contact the recruiter for assistance.",
      }
    }

    // If userId is provided, verify it matches the candidate's userId for security
    if (userId && candidate.userId) {
      if (userId !== candidate.userId) {
        return {
          canAccess: false,
          message:
            "You don't have permission to access this interview. Please use your own interview code.",
        }
      }
    }

    // Parse the scheduled date
    const scheduledDate = new Date(interviewRequest.date)

    // Extract hours and minutes from the time string (assuming format like "14:30" or "2:30 PM")
    let scheduledHours = 0
    let scheduledMinutes = 0

    // Handle different time formats
    if (interviewRequest.time.includes(":")) {
      // Handle 24-hour format "14:30" or 12-hour format "2:30 PM"
      const timeParts = interviewRequest.time.split(":")

      if (timeParts[0]) {
        scheduledHours = parseInt(timeParts[0], 10)

        // Check for AM/PM in the second part
        if (
          timeParts[1] &&
          timeParts[1].toLowerCase().includes("pm") &&
          scheduledHours < 12
        ) {
          scheduledHours += 12
        } else if (
          timeParts[1] &&
          timeParts[1].toLowerCase().includes("am") &&
          scheduledHours === 12
        ) {
          scheduledHours = 0
        }

        // Parse minutes, handling formats like "30" or "30 PM"
        scheduledMinutes = parseInt(timeParts[1].replace(/[^0-9]/g, ""), 10)
      }
    }

    // Set the hours and minutes on the scheduled date
    scheduledDate.setHours(scheduledHours, scheduledMinutes, 0, 0)

    // Simple time formatting function
    const formatTime = (date: Date) => {
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? "PM" : "AM"
      const formattedHours = hours % 12 || 12
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
      return `${formattedHours}:${formattedMinutes} ${ampm}`
    }

    // Use client's local time if provided, otherwise use server time
    let now

    if (clientLocalTime) {
      // Create date object using client's local time
      now = new Date(
        clientLocalTime.year,
        clientLocalTime.month,
        clientLocalTime.day,
        clientLocalTime.hours,
        clientLocalTime.minutes,
      )
    } else {
      now = new Date()
    }

    // Check if today is the scheduled day
    const isToday =
      now.getFullYear() === scheduledDate.getFullYear() &&
      now.getMonth() === scheduledDate.getMonth() &&
      now.getDate() === scheduledDate.getDate()

    if (!isToday) {
      // Format date for better readability
      const formattedDate = scheduledDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })

      if (now < scheduledDate) {
        return {
          canAccess: false,
          message: `Your interview is scheduled for ${formattedDate} at ${formatTime(scheduledDate)}. Please return on your scheduled date.`,
        }
      } else {
        return {
          canAccess: false,
          message: `Your interview was scheduled for ${formattedDate} at ${formatTime(scheduledDate)}. This interview has passed. Please contact the recruiter to reschedule.`,
        }
      }
    }

    // Allow access within a 15-minute window before and 60-minute window after the scheduled time
    const earlyWindowMinutes = 15
    const lateWindowMinutes = 60

    // Format the scheduled time for display
    const formattedScheduledTime = formatTime(scheduledDate)
    const earlyAccessTime = new Date(
      scheduledDate.getTime() - earlyWindowMinutes * 60 * 1000,
    )
    const formattedEarlyAccessTime = formatTime(earlyAccessTime)

    if (
      now.getTime() <
      scheduledDate.getTime() - earlyWindowMinutes * 60 * 1000
    ) {
      // Too early for interview - calculate when they can access
      const minutesToWait =
        Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60)) -
        earlyWindowMinutes

      let timeMessage
      if (minutesToWait > 60) {
        const hours = Math.floor(minutesToWait / 60)
        const minutes = minutesToWait % 60
        timeMessage = `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` and ${minutes} minute${minutes > 1 ? "s" : ""}` : ""}`
      } else {
        timeMessage = `${minutesToWait} minute${minutesToWait > 1 ? "s" : ""}`
      }

      return {
        canAccess: false,
        message: `Your interview is scheduled for ${formattedScheduledTime}. You can access it starting at ${formattedEarlyAccessTime} (in ${timeMessage}).`,
      }
    } else if (
      now.getTime() >
      scheduledDate.getTime() + lateWindowMinutes * 60 * 1000
    ) {
      // Too late for interview
      return {
        canAccess: false,
        message: `Your interview was scheduled for ${formattedScheduledTime} and the access window has expired. Please contact the recruiter to reschedule.`,
      }
    }

    // Interview is within the allowed time window, grant access
    return {
      canAccess: true,
      message: "Access granted. You may now begin your interview.",
      interviewData: {
        interviewId: interviewRequest._id,
        candidateId: candidate._id,
        candidateName: candidate.name,
        jobId: interviewRequest.jobId,
        position: interviewRequest.position,
        time: interviewRequest.time,
      },
    }
  },
})

/**
 * Updates the meeting code for an interview request, generating a new unique code
 */
export const generateMeetingCode = mutation({
  args: {
    interviewRequestId: v.id("interviewRequests"),
  },
  returns: v.object({
    meetingCode: v.string(),
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { interviewRequestId } = args

    // Check if the interview request exists
    const interviewRequest = await ctx.db.get(interviewRequestId)
    if (!interviewRequest) {
      return {
        meetingCode: "",
        success: false,
        message: "Interview request not found",
      }
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

    return {
      meetingCode,
      success: true,
      message: "Meeting code generated successfully",
    }
  },
})
