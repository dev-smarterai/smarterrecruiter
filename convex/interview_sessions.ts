import { mutation } from "./generated/server";
import { v } from "convex/values";

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
      })
    ),
    room_name: v.optional(v.string()),
  },
  returns: v.object({
    interviewId: v.id("interviews"),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const { meetingCode, candidateId: providedCandidateId, jobId: providedJobId,
            interviewType, title: providedTitle, transcript, room_name } = args;

    // Find candidate and job information from the meeting code if not provided
    let candidateId = providedCandidateId;
    let jobId = providedJobId;
    let title = providedTitle;

    // Calculate timestamps and duration from the transcript
    let startedAt: Date;
    let endedAt: Date;
    let duration: number;

    if (transcript.length > 0) {
      // Use the first and last message timestamps to determine start and end times
      const firstMessageTime = new Date(transcript[0].timestamp);
      const lastMessageTime = new Date(transcript[transcript.length - 1].timestamp);

      startedAt = firstMessageTime;
      endedAt = lastMessageTime;

      // Calculate duration in seconds
      duration = Math.floor((lastMessageTime.getTime() - firstMessageTime.getTime()) / 1000);
    } else {
      // Fallback if no messages (unlikely but handle it anyway)
      startedAt = new Date(new Date().getTime() - 60000); // 1 minute ago as fallback
      endedAt = new Date();
      duration = 60; // Default 60 seconds
    }

    // Create a new completed interview record with transcript
    const interviewData: any = {
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
    };
    
    // Only add room_name if provided
    if (room_name) {
      interviewData.room_name = room_name;
    }
    
    const interviewId = await ctx.db.insert("interviews", interviewData);

    // Note: We're not using auto-analysis for now due to TypeScript issues
    // Instead, we'll rely on manual analysis from the candidate profile page
    console.log("Interview created, manual analysis will be required");

    return {
      interviewId,
      status: "completed",
    };
  },
});

export const saveInterview = mutation({
  args: {
    candidateId: v.id("candidates"),
    jobId: v.id("jobs"),
    transcript: v.string(),
    interviewType: v.optional(v.string()),
    room_name: v.optional(v.string()),
    title: v.string(),
  },
  returns: v.object({
    interviewId: v.id("interviews"),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const { candidateId, jobId, transcript, interviewType, room_name, title } = args;

    // Calculate timestamps and duration (simplified since transcript is now a string)
    const startedAt = new Date(new Date().getTime() - 60000); // 1 minute ago as fallback
    const endedAt = new Date();
    const duration = 60; // Default 60 seconds

    // Get the meeting code from the job or generate a unique one
    let meetingCode = "meeting_" + Date.now();
    if (jobId) {
      const job = await ctx.db.get(jobId);
      if (job?.meetingCode) {
        meetingCode = job.meetingCode;
      }
    }

    // Create interview data object with required fields
    const interviewData: any = {
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
    };
    
    // Add room_name only if provided
    if (room_name) {
      interviewData.room_name = room_name;
    }
    
    // Create a new completed interview record
    const interviewId = await ctx.db.insert("interviews", interviewData);

    console.log("Interview saved directly, manual analysis will be required");
    if (room_name) {
      console.log(`Associated with LiveKit room: ${room_name}`);
    }

    return {
      interviewId,
      status: "completed",
    };
  },
}); 