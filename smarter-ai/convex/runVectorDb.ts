import { action } from "./_generated/server"
import { v } from "convex/values"
import { api } from "./_generated/api"

// Run single population function - Candidates
export const populateCandidates = action({
  args: {},
  returns: v.string(),
  handler: async (ctx): Promise<string> => {
    console.log("Starting candidate population...")
    try {
      const count: number = await ctx.runAction(
        api.populateVectorDb.populateCandidatesData,
      )
      return `Successfully populated vector DB with ${count} candidates.`
    } catch (error) {
      console.error("Error populating candidates:", error)
      return `Error populating candidates: ${error}`
    }
  },
})

// Run single population function - Jobs
export const populateJobs = action({
  args: {},
  returns: v.string(),
  handler: async (ctx): Promise<string> => {
    console.log("Starting job population...")
    try {
      const count: number = await ctx.runAction(
        api.populateVectorDb.populateJobsData,
      )
      return `Successfully populated vector DB with ${count} jobs.`
    } catch (error) {
      console.error("Error populating jobs:", error)
      return `Error populating jobs: ${error}`
    }
  },
})

// Run single population function - Interview Requests
export const populateInterviews = action({
  args: {},
  returns: v.string(),
  handler: async (ctx): Promise<string> => {
    console.log("Starting interview request population...")
    try {
      const count: number = await ctx.runAction(
        api.populateVectorDb.populateInterviewRequestsData,
      )
      return `Successfully populated vector DB with ${count} interview requests.`
    } catch (error) {
      console.error("Error populating interview requests:", error)
      return `Error populating interview requests: ${error}`
    }
  },
})

// Run all population functions
export const populateAll = action({
  args: {},
  returns: v.object({
    candidatesCount: v.number(),
    jobsCount: v.number(),
    interviewsCount: v.number(),
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (
    ctx,
  ): Promise<{
    candidatesCount: number
    jobsCount: number
    interviewsCount: number
    success: boolean
    message: string
  }> => {
    console.log("Starting full vector DB population...")
    try {
      // Run all three population functions in sequence
      const candidatesCount: number = await ctx.runAction(
        api.populateVectorDb.populateCandidatesData,
      )
      const jobsCount: number = await ctx.runAction(
        api.populateVectorDb.populateJobsData,
      )
      const interviewsCount: number = await ctx.runAction(
        api.populateVectorDb.populateInterviewRequestsData,
      )

      const totalCount = candidatesCount + jobsCount + interviewsCount

      return {
        candidatesCount,
        jobsCount,
        interviewsCount,
        success: true,
        message: `Successfully populated vector DB with ${totalCount} total documents (${candidatesCount} candidates, ${jobsCount} jobs, ${interviewsCount} interview requests).`,
      }
    } catch (error) {
      console.error("Error running full population:", error)
      return {
        candidatesCount: 0,
        jobsCount: 0,
        interviewsCount: 0,
        success: false,
        message: `Error running full population: ${error}`,
      }
    }
  },
})
