import { v } from "convex/values"
import {
  action,
  internalMutation,
  internalQuery,
  internalAction,
} from "./_generated/server"
import { api, internal } from "./_generated/api"
import { Id } from "./_generated/dataModel"
import OpenAI from "openai"

// Initialize OpenAI API client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.",
    )
  }
  return new OpenAI({ apiKey })
}
// Type for the population results
interface PopulationResult {
  candidatesProcessed: number
  jobsProcessed: number
  interviewRequestsProcessed: number
  success: boolean
}

// Migration function to populate vector DB with all candidates and jobs
export const migrateDataToVectorDb = action({
  args: {},
  returns: v.object({
    candidatesProcessed: v.number(),
    jobsProcessed: v.number(),
    interviewRequestsProcessed: v.number(),
    success: v.boolean(),
  }),
  handler: async (ctx): Promise<PopulationResult> => {
    try {
      // Get all candidates
      const candidates = await ctx.runQuery(api.candidates.getCandidates)
      let candidatesProcessed = 0

      // Process each candidate in sequence
      for (const candidate of candidates) {
        try {
          await ctx.runAction(
            internal.populateVectorDb.populateSingleCandidateData,
            {
              candidateId: candidate._id,
            },
          )
          candidatesProcessed++
        } catch (error) {
          console.error(`Error processing candidate ${candidate._id}:`, error)
        }
      }

      // Get all jobs
      const jobs = await ctx.runQuery(api.jobs.getJobs)
      let jobsProcessed = 0

      // Process each job in sequence
      for (const job of jobs) {
        try {
          await ctx.runAction(internal.populateVectorDb.populateSingleJobData, {
            jobId: job._id,
          })
          jobsProcessed++
        } catch (error) {
          console.error(`Error processing job ${job._id}:`, error)
        }
      }

      // Get all interview requests
      const interviewRequests = await ctx.runQuery(
        api.interviews.getInterviewRequests,
      )
      let interviewRequestsProcessed = 0

      // Process each interview request in sequence
      for (const request of interviewRequests) {
        try {
          await ctx.runAction(
            internal.populateVectorDb.populateSingleInterviewRequestData,
            {
              requestId: request._id,
            },
          )
          interviewRequestsProcessed++
        } catch (error) {
          console.error(
            `Error processing interview request ${request._id}:`,
            error,
          )
        }
      }

      return {
        candidatesProcessed,
        jobsProcessed,
        interviewRequestsProcessed,
        success: true,
      }
    } catch (error) {
      console.error("Error in migration:", error)
      return {
        candidatesProcessed: 0,
        jobsProcessed: 0,
        interviewRequestsProcessed: 0,
        success: false,
      }
    }
  },
})

// Schedule daily update of vector DB to ensure data consistency
export const scheduleDailyMigration = internalAction({
  args: {},
  returns: v.boolean(),
  handler: async (ctx: any): Promise<boolean> => {
    try {
      // Call the migrateDataToVectorDb action from this file
      await ctx.runAction(api.populateVectorDb.migrateDataToVectorDb)
      return true
    } catch (error) {
      console.error("Error scheduling daily migration:", error)
      return false
    }
  },
})

// Populate vector database with candidates data
export const populateCandidatesData = action({
  args: {},
  returns: v.number(),
  handler: async (ctx): Promise<number> => {
    // Get all candidates
    const candidates = await ctx.runQuery(api.candidates.getCandidates)
    let addedCount = 0

    for (const candidate of candidates) {
      // Create a string representation of candidate data for embedding
      const title = `Candidate: ${candidate.name}`

      // Basic info
      let content = `Name: ${candidate.name}\n`
      content += `Email: ${candidate.email}\n`

      if (candidate.phone) {
        content += `Phone: ${candidate.phone}\n`
      }

      if (candidate.position) {
        content += `Position: ${candidate.position}\n`
      }

      if (candidate.status) {
        content += `Status: ${candidate.status}\n`
      }

      if (candidate.aiScore) {
        content += `AI Score: ${candidate.aiScore}\n`
      }

      if (candidate.appliedDate) {
        content += `Applied Date: ${candidate.appliedDate}\n`
      }

      if (candidate.recruiter) {
        content += `Recruiter: ${candidate.recruiter}\n`
      }

      if (candidate.progress) {
        content += `Progress: ${candidate.progress}\n`
      }

      if (candidate.coverLetter) {
        content += `Cover Letter: ${candidate.coverLetter}\n`
      }

      // Add profile summary if available
      if (candidate.profile?.summary) {
        content += `Profile Summary: ${candidate.profile.summary}\n`
      }

      if (candidate.profile?.portfolio) {
        content += `Portfolio: ${candidate.profile.portfolio}\n`
      }

      if (candidate.profile?.insights) {
        content += `Insights: ${candidate.profile.insights}\n`
      }

      // Add personal details if available
      if (candidate.candidateProfile?.personal) {
        const personal = candidate.candidateProfile.personal
        if (personal.age) content += `Age: ${personal.age}\n`
        if (personal.nationality)
          content += `Nationality: ${personal.nationality}\n`
        if (personal.location) content += `Location: ${personal.location}\n`
        if (personal.dependents)
          content += `Dependents: ${personal.dependents}\n`
        if (personal.visa_status)
          content += `Visa Status: ${personal.visa_status}\n`
      }

      // Add career details if available
      if (candidate.candidateProfile?.career) {
        const career = candidate.candidateProfile.career
        if (career.experience) content += `Experience: ${career.experience}\n`
        if (career.past_roles) content += `Past Roles: ${career.past_roles}\n`
        if (career.progression)
          content += `Career Progression: ${career.progression}\n`
      }

      // Add interview highlights if available
      if (candidate.candidateProfile?.interview?.highlights) {
        content += "Interview Highlights:\n"
        candidate.candidateProfile.interview.highlights.forEach(
          (highlight: any, index: number) => {
            content += `- ${highlight.title}: ${highlight.content}\n`
          },
        )
      }

      // Add interview feedback if available
      if (candidate.candidateProfile?.interview?.overallFeedback) {
        content += "Interview Feedback:\n"
        candidate.candidateProfile.interview.overallFeedback.forEach(
          (feedback: any, index: number) => {
            const feedbackType = feedback.praise
              ? "Positive"
              : "Needs Improvement"
            content += `- ${feedbackType}: ${feedback.text}\n`
          },
        )
      }

      // Add technical skills if available
      if (candidate.candidateProfile?.skills?.technical?.skills) {
        content += `Technical Skills Overall Score: ${candidate.candidateProfile.skills.technical.overallScore}\n`
        content += "Technical Skills:\n"
        const skills = candidate.candidateProfile.skills.technical.skills
          .map((skill: any) => `${skill.name} (${skill.score})`)
          .join(", ")
        content += `${skills}\n`
      }

      // Add soft skills if available
      if (candidate.candidateProfile?.skills?.soft?.skills) {
        content += `Soft Skills Overall Score: ${candidate.candidateProfile.skills.soft.overallScore}\n`
        content += "Soft Skills:\n"
        const skills = candidate.candidateProfile.skills.soft.skills
          .map((skill: any) => `${skill.name} (${skill.score})`)
          .join(", ")
        content += `${skills}\n`
      }

      // Add culture fit skills if available
      if (candidate.candidateProfile?.skills?.culture?.skills) {
        content += `Culture Fit Overall Score: ${candidate.candidateProfile.skills.culture.overallScore}\n`
        content += "Culture Fit Skills:\n"
        const skills = candidate.candidateProfile.skills.culture.skills
          .map((skill: any) => `${skill.name} (${skill.score})`)
          .join(", ")
        content += `${skills}\n`
      }

      // Add CV details if available
      if (candidate.candidateProfile?.cv) {
        if (
          candidate.candidateProfile.cv.highlights &&
          candidate.candidateProfile.cv.highlights.length > 0
        ) {
          content += "CV Highlights:\n"
          candidate.candidateProfile.cv.highlights.forEach(
            (highlight: string) => {
              content += `- ${highlight}\n`
            },
          )
        }

        if (
          candidate.candidateProfile.cv.keyInsights &&
          candidate.candidateProfile.cv.keyInsights.length > 0
        ) {
          content += "CV Key Insights:\n"
          candidate.candidateProfile.cv.keyInsights.forEach(
            (insight: string) => {
              content += `- ${insight}\n`
            },
          )
        }

        if (candidate.candidateProfile.cv.score) {
          content += `CV Score: ${candidate.candidateProfile.cv.score}\n`
        }
      }

      // Add skill insights if available
      if (candidate.candidateProfile?.skillInsights) {
        const skillInsights = candidate.candidateProfile.skillInsights

        if (
          skillInsights.matchedSkills &&
          skillInsights.matchedSkills.length > 0
        ) {
          content += "Matched Skills:\n"
          content += skillInsights.matchedSkills.join(", ") + "\n"
        }

        if (
          skillInsights.missingSkills &&
          skillInsights.missingSkills.length > 0
        ) {
          content += "Missing Skills:\n"
          content += skillInsights.missingSkills.join(", ") + "\n"
        }

        if (skillInsights.skillGaps && skillInsights.skillGaps.length > 0) {
          content += "Skill Gaps:\n"
          skillInsights.skillGaps.forEach((gap: any) => {
            content += `- ${gap.name}: ${gap.percentage}%\n`
          })
        }

        if (
          skillInsights.learningPaths &&
          skillInsights.learningPaths.length > 0
        ) {
          content += "Learning Paths:\n"
          skillInsights.learningPaths.forEach((path: any) => {
            content += `- ${path.title} (${path.provider})\n`
          })
        }
      }

      // Add recommendations if available
      if (candidate.candidateProfile?.recommendation) {
        content += `Recommendation: ${candidate.candidateProfile.recommendation}\n`
      }

      try {
        // Prepare metadata for advanced filtering
        const metadata: any = {
          entityType: "candidate",
          candidateStatus: candidate.status || "unknown",
          candidatePosition: candidate.position || "unknown",
          createdAt: candidate.appliedDate,
          updatedAt: candidate.lastActivity,
        }

        // Add skills to metadata if available
        if (candidate.candidateProfile?.skills?.technical?.skills) {
          metadata.candidateSkills =
            candidate.candidateProfile.skills.technical.skills.map(
              (skill: any) => skill.name,
            )
        }

        // Add to vector database
        // Note: The addDocumentToVectorSearch function doesn't accept metadata directly
        // We'll need to modify the dbSearch.ts file to support this in the future
        await ctx.runAction(
          internal.populateVectorDb.addDocumentToVectorSearch,
          {
            title,
            content,
            tableName: "candidates",
            documentId: candidate._id,
          },
        )

        addedCount++
      } catch (error) {
        console.error(
          `Error adding candidate ${candidate._id} to vector DB:`,
          error,
        )
      }
    }

    return addedCount
  },
})

// Populate vector database with jobs data
export const populateJobsData = action({
  args: {},
  returns: v.number(),
  handler: async (ctx): Promise<number> => {
    // Get all jobs
    const jobs = await ctx.runQuery(api.jobs.getJobs)
    let addedCount = 0

    for (const job of jobs) {
      // Create a string representation of job data for embedding
      const title = `Job: ${job.title}`

      // Basic info
      let content = `Title: ${job.title}\n`
      content += `Company: ${job.company}\n`
      content += `Location: ${job.location}\n`
      content += `Type: ${job.type}\n`
      content += `Level: ${job.level}\n`
      content += `Experience: ${job.experience}\n`
      content += `Education: ${job.education}\n`
      content += `Posted: ${job.posted}\n`
      content += `Expiry: ${job.expiry}\n`

      if (job.featured) {
        content += `Featured: Yes\n`
      }

      // Add salary information
      if (job.salary) {
        content += `Salary: ${job.salary.min} - ${job.salary.max} ${job.salary.currency} per ${job.salary.period}\n`
      }

      // Add description if available
      if (job.description) {
        content += `Introduction: ${job.description.intro}\n`
        content += `Details: ${job.description.details}\n`
        content += `Responsibilities: ${job.description.responsibilities}\n`
        content += `Closing: ${job.description.closing}\n`
      }

      // Add requirements if available
      if (job.requirements && job.requirements.length > 0) {
        content += "Requirements:\n"
        job.requirements.forEach((req: string) => {
          content += `- ${req}\n`
        })
      }

      // Add desirable skills if available
      if (job.desirables && job.desirables.length > 0) {
        content += "Desirable Skills:\n"
        job.desirables.forEach((skill: string) => {
          content += `- ${skill}\n`
        })
      }

      // Add benefits if available
      if (job.benefits && job.benefits.length > 0) {
        content += "Benefits:\n"
        job.benefits.forEach((benefit: string) => {
          content += `- ${benefit}\n`
        })
      }

      // Add AI interviewer config if available
      if (job.aiInterviewerConfig) {
        content += `Interview Introduction: ${job.aiInterviewerConfig.introduction}\n`

        content += "Interview Questions:\n"
        job.aiInterviewerConfig.questions.forEach((question: any) => {
          content += `- (${question.importance}) ${question.text}\n`

          if (question.followUpPrompts && question.followUpPrompts.length > 0) {
            question.followUpPrompts.forEach((followUp: string) => {
              content += `  * ${followUp}\n`
            })
          }
        })

        content += `Conversational Style: ${job.aiInterviewerConfig.conversationalStyle}\n`

        if (
          job.aiInterviewerConfig.focusAreas &&
          job.aiInterviewerConfig.focusAreas.length > 0
        ) {
          content += "Focus Areas:\n"
          job.aiInterviewerConfig.focusAreas.forEach((area: string) => {
            content += `- ${area}\n`
          })
        }

        content += `Time Limit: ${job.aiInterviewerConfig.timeLimit} minutes\n`
      }

      if (job.interviewPrompt) {
        content += `Interview Prompt: ${job.interviewPrompt}\n`
      }

      try {
        // Prepare metadata for advanced filtering
        const metadata: any = {
          entityType: "job",
          jobTitle: job.title,
          jobCompany: job.company,
          jobLevel: job.level,
          createdAt: job.posted,
          updatedAt: job.posted, // Using posted as the update date since there's no specific update field
        }

        // Add to vector database
        // Note: The addDocumentToVectorSearch function doesn't accept metadata directly
        // We'll need to modify the dbSearch.ts file to support this in the future
        await ctx.runAction(
          internal.populateVectorDb.addDocumentToVectorSearch,
          {
            title,
            content,
            tableName: "jobs",
            documentId: job._id,
          },
        )

        addedCount++
      } catch (error) {
        console.error(`Error adding job ${job._id} to vector DB:`, error)
      }
    }

    return addedCount
  },
})

// Populate vector database with interview requests data
export const populateInterviewRequestsData = action({
  args: {},
  returns: v.number(),
  handler: async (ctx): Promise<number> => {
    // Get all interview requests
    const requests = await ctx.runQuery(api.interviews.getInterviewRequests)
    let addedCount = 0

    for (const request of requests) {
      try {
        // Get candidate details for the request
        const candidate = await ctx.runQuery(api.candidates.getCandidate, {
          id: request.candidateId,
        })

        // Create a string representation of the interview request for embedding
        const title = `Interview Request: ${candidate?.name || "Unknown Candidate"}`

        // Basic info
        let content = `Candidate: ${candidate?.name || "Unknown"}\n`
        content += `Position: ${request.position}\n`
        content += `Date: ${request.date}\n`
        content += `Time: ${request.time}\n`
        content += `Status: ${request.status}\n`
        content += `Created At: ${request.createdAt}\n`

        if (request.updatedAt) {
          content += `Updated At: ${request.updatedAt}\n`
        }

        // Add job information if available
        let jobDetails = null
        if (request.jobId) {
          jobDetails = await ctx.runQuery(api.jobs.getJob, {
            id: request.jobId,
          })

          if (jobDetails) {
            content += `Job: ${jobDetails.title}\n`
            content += `Company: ${jobDetails.company}\n`
            content += `Job Type: ${jobDetails.type}\n`
            content += `Job Level: ${jobDetails.level}\n`
          }
        }

        // Add additional information
        if (request.location) {
          content += `Location: ${request.location}\n`
        }

        if (request.interviewType) {
          content += `Interview Type: ${request.interviewType}\n`
        }

        if (request.round) {
          content += `Round: ${request.round}\n`
        }

        if (request.durationType) {
          content += `Duration: ${request.durationType}\n`
        }

        if (request.notes) {
          content += `Notes: ${request.notes}\n`
        }

        if (request.meetingLink) {
          content += `Meeting Link: ${request.meetingLink}\n`
        }

        if (request.meetingCode) {
          content += `Meeting Code: ${request.meetingCode}\n`
        }

        if (request.interviewerIds && request.interviewerIds.length > 0) {
          content += `Interviewers: ${request.interviewerIds.join(", ")}\n`
        }

        // Add rescheduling information if available
        if (request.rescheduledFrom) {
          content += `Rescheduled From: ${request.rescheduledFrom.date} at ${request.rescheduledFrom.time}\n`
        }

        // Get any job application data related to this interview
        if (request.jobId && candidate) {
          // Note: We can't safely access job applications without knowing the correct API reference
          // This section would ideally include job application information, but we'll skip it
          // to avoid TypeScript errors
          content += `Related Job ID: ${request.jobId}\n`
        }

        // Prepare metadata for advanced filtering
        const metadata: any = {
          entityType: "interviewRequest",
          interviewStatus: request.status,
          interviewType: request.interviewType || "standard",
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        }

        if (candidate) {
          metadata.candidateName = candidate.name
          metadata.candidateStatus = candidate.status
        }

        if (jobDetails) {
          metadata.jobTitle = jobDetails.title
          metadata.jobCompany = jobDetails.company
        }

        // Add to vector database
        // Note: The addDocumentToVectorSearch function doesn't accept metadata directly
        // We'll need to modify the dbSearch.ts file to support this in the future
        await ctx.runAction(
          internal.populateVectorDb.addDocumentToVectorSearch,
          {
            title,
            content,
            tableName: "interviewRequests",
            documentId: request._id,
          },
        )

        addedCount++
      } catch (error) {
        console.error(
          `Error adding interview request ${request._id} to vector DB:`,
          error,
        )
      }
    }

    return addedCount
  },
})

// Populate vector database with a single candidate's data
export const populateSingleCandidateData = internalAction({
  args: {
    candidateId: v.id("candidates"),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    try {
      // Get the candidate
      const candidate = await ctx.runQuery(api.candidates.getCandidate, {
        id: args.candidateId,
      })

      if (!candidate) {
        console.error(`Candidate ${args.candidateId} not found`)
        return false
      }

      // Create a string representation of candidate data for embedding
      const title = `Candidate: ${candidate.name}`

      // Basic info
      let content = `Name: ${candidate.name}\n`
      content += `Email: ${candidate.email}\n`

      if (candidate.phone) {
        content += `Phone: ${candidate.phone}\n`
      }

      if (candidate.position) {
        content += `Position: ${candidate.position}\n`
      }

      if (candidate.status) {
        content += `Status: ${candidate.status}\n`
      }

      if (candidate.aiScore) {
        content += `AI Score: ${candidate.aiScore}\n`
      }

      if (candidate.appliedDate) {
        content += `Applied Date: ${candidate.appliedDate}\n`
      }

      if (candidate.recruiter) {
        content += `Recruiter: ${candidate.recruiter}\n`
      }

      if (candidate.progress) {
        content += `Progress: ${candidate.progress}\n`
      }

      if (candidate.coverLetter) {
        content += `Cover Letter: ${candidate.coverLetter}\n`
      }

      // Add profile summary if available
      if (candidate.profile?.summary) {
        content += `Profile Summary: ${candidate.profile.summary}\n`
      }

      if (candidate.profile?.portfolio) {
        content += `Portfolio: ${candidate.profile.portfolio}\n`
      }

      if (candidate.profile?.insights) {
        content += `Insights: ${candidate.profile.insights}\n`
      }

      // Add personal details if available
      if (candidate.candidateProfile?.personal) {
        const personal = candidate.candidateProfile.personal
        if (personal.age) content += `Age: ${personal.age}\n`
        if (personal.nationality)
          content += `Nationality: ${personal.nationality}\n`
        if (personal.location) content += `Location: ${personal.location}\n`
        if (personal.dependents)
          content += `Dependents: ${personal.dependents}\n`
        if (personal.visa_status)
          content += `Visa Status: ${personal.visa_status}\n`
      }

      // Add career details if available
      if (candidate.candidateProfile?.career) {
        const career = candidate.candidateProfile.career
        if (career.experience) content += `Experience: ${career.experience}\n`
        if (career.past_roles) content += `Past Roles: ${career.past_roles}\n`
        if (career.progression)
          content += `Career Progression: ${career.progression}\n`
      }

      // Add interview highlights if available
      if (candidate.candidateProfile?.interview?.highlights) {
        content += "Interview Highlights:\n"
        candidate.candidateProfile.interview.highlights.forEach(
          (highlight: any) => {
            content += `- ${highlight.title}: ${highlight.content}\n`
          },
        )
      }

      // Add interview feedback if available
      if (candidate.candidateProfile?.interview?.overallFeedback) {
        content += "Interview Feedback:\n"
        candidate.candidateProfile.interview.overallFeedback.forEach(
          (feedback: any) => {
            const feedbackType = feedback.praise
              ? "Positive"
              : "Needs Improvement"
            content += `- ${feedbackType}: ${feedback.text}\n`
          },
        )
      }

      // Add technical skills if available
      if (candidate.candidateProfile?.skills?.technical?.skills) {
        content += `Technical Skills Overall Score: ${candidate.candidateProfile.skills.technical.overallScore}\n`
        content += "Technical Skills:\n"
        const skills = candidate.candidateProfile.skills.technical.skills
          .map((skill: any) => `${skill.name} (${skill.score})`)
          .join(", ")
        content += `${skills}\n`
      }

      // Add soft skills if available
      if (candidate.candidateProfile?.skills?.soft?.skills) {
        content += `Soft Skills Overall Score: ${candidate.candidateProfile.skills.soft.overallScore}\n`
        content += "Soft Skills:\n"
        const skills = candidate.candidateProfile.skills.soft.skills
          .map((skill: any) => `${skill.name} (${skill.score})`)
          .join(", ")
        content += `${skills}\n`
      }

      // Add culture fit skills if available
      if (candidate.candidateProfile?.skills?.culture?.skills) {
        content += `Culture Fit Overall Score: ${candidate.candidateProfile.skills.culture.overallScore}\n`
        content += "Culture Fit Skills:\n"
        const skills = candidate.candidateProfile.skills.culture.skills
          .map((skill: any) => `${skill.name} (${skill.score})`)
          .join(", ")
        content += `${skills}\n`
      }

      // Add CV details if available
      if (candidate.candidateProfile?.cv) {
        if (
          candidate.candidateProfile.cv.highlights &&
          candidate.candidateProfile.cv.highlights.length > 0
        ) {
          content += "CV Highlights:\n"
          candidate.candidateProfile.cv.highlights.forEach(
            (highlight: string) => {
              content += `- ${highlight}\n`
            },
          )
        }

        if (
          candidate.candidateProfile.cv.keyInsights &&
          candidate.candidateProfile.cv.keyInsights.length > 0
        ) {
          content += "CV Key Insights:\n"
          candidate.candidateProfile.cv.keyInsights.forEach(
            (insight: string) => {
              content += `- ${insight}\n`
            },
          )
        }

        if (candidate.candidateProfile.cv.score) {
          content += `CV Score: ${candidate.candidateProfile.cv.score}\n`
        }
      }

      // Add skill insights if available
      if (candidate.candidateProfile?.skillInsights) {
        const skillInsights = candidate.candidateProfile.skillInsights

        if (
          skillInsights.matchedSkills &&
          skillInsights.matchedSkills.length > 0
        ) {
          content += "Matched Skills:\n"
          content += skillInsights.matchedSkills.join(", ") + "\n"
        }

        if (
          skillInsights.missingSkills &&
          skillInsights.missingSkills.length > 0
        ) {
          content += "Missing Skills:\n"
          content += skillInsights.missingSkills.join(", ") + "\n"
        }

        if (skillInsights.skillGaps && skillInsights.skillGaps.length > 0) {
          content += "Skill Gaps:\n"
          skillInsights.skillGaps.forEach((gap: any) => {
            content += `- ${gap.name}: ${gap.percentage}%\n`
          })
        }

        if (
          skillInsights.learningPaths &&
          skillInsights.learningPaths.length > 0
        ) {
          content += "Learning Paths:\n"
          skillInsights.learningPaths.forEach((path: any) => {
            content += `- ${path.title} (${path.provider})\n`
          })
        }
      }

      // Add recommendations if available
      if (candidate.candidateProfile?.recommendation) {
        content += `Recommendation: ${candidate.candidateProfile.recommendation}\n`
      }

      // Prepare metadata for advanced filtering
      const metadata: any = {
        entityType: "candidate",
        candidateStatus: candidate.status || "unknown",
        candidatePosition: candidate.position || "unknown",
        createdAt: candidate.appliedDate,
        updatedAt: candidate.lastActivity,
      }

      // Add skills to metadata if available
      if (candidate.candidateProfile?.skills?.technical?.skills) {
        metadata.candidateSkills =
          candidate.candidateProfile.skills.technical.skills.map(
            (skill: any) => skill.name,
          )
      }

      // Add to vector database
      await ctx.runAction(internal.populateVectorDb.addDocumentToVectorSearch, {
        title,
        content,
        tableName: "candidates",
        documentId: candidate._id,
      })

      return true
    } catch (error) {
      console.error(
        `Error adding candidate ${args.candidateId} to vector DB:`,
        error,
      )
      return false
    }
  },
})

// Populate vector database with a single job's data
export const populateSingleJobData = internalAction({
  args: {
    jobId: v.id("jobs"),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    try {
      // Get the job
      const job = await ctx.runQuery(api.jobs.getJob, {
        id: args.jobId,
      })

      if (!job) {
        console.error(`Job ${args.jobId} not found`)
        return false
      }

      // Create a string representation of job data for embedding
      const title = `Job: ${job.title}`

      // Basic info
      let content = `Title: ${job.title}\n`
      content += `Company: ${job.company}\n`
      content += `Location: ${job.location}\n`
      content += `Type: ${job.type}\n`
      content += `Level: ${job.level}\n`
      content += `Experience: ${job.experience}\n`
      content += `Education: ${job.education}\n`
      content += `Posted: ${job.posted}\n`
      content += `Expiry: ${job.expiry}\n`

      if (job.featured) {
        content += `Featured: Yes\n`
      }

      // Add salary information
      if (job.salary) {
        content += `Salary: ${job.salary.min} - ${job.salary.max} ${job.salary.currency} per ${job.salary.period}\n`
      }

      // Add description if available
      if (job.description) {
        content += `Introduction: ${job.description.intro}\n`
        content += `Details: ${job.description.details}\n`
        content += `Responsibilities: ${job.description.responsibilities}\n`
        content += `Closing: ${job.description.closing}\n`
      }

      // Add requirements if available
      if (job.requirements && job.requirements.length > 0) {
        content += "Requirements:\n"
        job.requirements.forEach((req: string) => {
          content += `- ${req}\n`
        })
      }

      // Add desirable skills if available
      if (job.desirables && job.desirables.length > 0) {
        content += "Desirable Skills:\n"
        job.desirables.forEach((skill: string) => {
          content += `- ${skill}\n`
        })
      }

      // Add benefits if available
      if (job.benefits && job.benefits.length > 0) {
        content += "Benefits:\n"
        job.benefits.forEach((benefit: string) => {
          content += `- ${benefit}\n`
        })
      }

      // Add AI interviewer config if available
      if (job.aiInterviewerConfig) {
        content += `Interview Introduction: ${job.aiInterviewerConfig.introduction}\n`

        content += "Interview Questions:\n"
        job.aiInterviewerConfig.questions.forEach((question: any) => {
          content += `- (${question.importance}) ${question.text}\n`

          if (question.followUpPrompts && question.followUpPrompts.length > 0) {
            question.followUpPrompts.forEach((followUp: string) => {
              content += `  * ${followUp}\n`
            })
          }
        })

        content += `Conversational Style: ${job.aiInterviewerConfig.conversationalStyle}\n`

        if (
          job.aiInterviewerConfig.focusAreas &&
          job.aiInterviewerConfig.focusAreas.length > 0
        ) {
          content += "Focus Areas:\n"
          job.aiInterviewerConfig.focusAreas.forEach((area: string) => {
            content += `- ${area}\n`
          })
        }

        content += `Time Limit: ${job.aiInterviewerConfig.timeLimit} minutes\n`
      }

      if (job.interviewPrompt) {
        content += `Interview Prompt: ${job.interviewPrompt}\n`
      }

      // Prepare metadata for advanced filtering
      const metadata: any = {
        entityType: "job",
        jobTitle: job.title,
        jobCompany: job.company,
        jobLevel: job.level,
        createdAt: job.posted,
        updatedAt: job.posted, // Using posted as the update date since there's no specific update field
      }

      // Add to vector database
      await ctx.runAction(internal.populateVectorDb.addDocumentToVectorSearch, {
        title,
        content,
        tableName: "jobs",
        documentId: job._id,
      })

      return true
    } catch (error) {
      console.error(`Error adding job ${args.jobId} to vector DB:`, error)
      return false
    }
  },
})

// Populate vector database with a single interview request's data
export const populateSingleInterviewRequestData = internalAction({
  args: {
    requestId: v.id("interviewRequests"),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    try {
      // Get the interview request
      const request = await ctx.runQuery(
        api.interviews.getInterviewRequestById,
        {
          id: args.requestId,
        },
      )

      if (!request) {
        console.error(`Interview request ${args.requestId} not found`)
        return false
      }

      // Get candidate details for the request
      const candidate = await ctx.runQuery(api.candidates.getCandidate, {
        id: request.candidateId,
      })

      // Create a string representation of the interview request for embedding
      const title = `Interview Request: ${candidate?.name || "Unknown Candidate"}`

      // Basic info
      let content = `Candidate: ${candidate?.name || "Unknown"}\n`
      content += `Position: ${request.position}\n`
      content += `Date: ${request.date}\n`
      content += `Time: ${request.time}\n`
      content += `Status: ${request.status}\n`
      content += `Created At: ${request.createdAt}\n`

      if (request.updatedAt) {
        content += `Updated At: ${request.updatedAt}\n`
      }

      // Add job information if available
      let jobDetails = null
      if (request.jobId) {
        jobDetails = await ctx.runQuery(api.jobs.getJob, {
          id: request.jobId,
        })

        if (jobDetails) {
          content += `Job: ${jobDetails.title}\n`
          content += `Company: ${jobDetails.company}\n`
          content += `Job Type: ${jobDetails.type}\n`
          content += `Job Level: ${jobDetails.level}\n`
        }
      }

      // Add additional information
      if (request.location) {
        content += `Location: ${request.location}\n`
      }

      if (request.interviewType) {
        content += `Interview Type: ${request.interviewType}\n`
      }

      if (request.round) {
        content += `Round: ${request.round}\n`
      }

      if (request.durationType) {
        content += `Duration: ${request.durationType}\n`
      }

      if (request.notes) {
        content += `Notes: ${request.notes}\n`
      }

      if (request.meetingLink) {
        content += `Meeting Link: ${request.meetingLink}\n`
      }

      if (request.meetingCode) {
        content += `Meeting Code: ${request.meetingCode}\n`
      }

      if (request.interviewerIds && request.interviewerIds.length > 0) {
        content += `Interviewers: ${request.interviewerIds.join(", ")}\n`
      }

      // Add rescheduling information if available
      if (request.rescheduledFrom) {
        content += `Rescheduled From: ${request.rescheduledFrom.date} at ${request.rescheduledFrom.time}\n`
      }

      // Get any job application data related to this interview
      if (request.jobId && candidate) {
        content += `Related Job ID: ${request.jobId}\n`
      }

      // Prepare metadata for advanced filtering
      const metadata: any = {
        entityType: "interviewRequest",
        interviewStatus: request.status,
        interviewType: request.interviewType || "standard",
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }

      if (candidate) {
        metadata.candidateName = candidate.name
        metadata.candidateStatus = candidate.status
      }

      if (jobDetails) {
        metadata.jobTitle = jobDetails.title
        metadata.jobCompany = jobDetails.company
      }

      // Add to vector database
      await ctx.runAction(internal.populateVectorDb.addDocumentToVectorSearch, {
        title,
        content,
        tableName: "interviewRequests",
        documentId: request._id,
      })

      return true
    } catch (error) {
      console.error(
        `Error adding interview request ${args.requestId} to vector DB:`,
        error,
      )
      return false
    }
  },
})

export const generateEmbeddings = internalAction({
  args: { text: v.string() },
  returns: v.array(v.number()),
  handler: async (ctx, args) => {
    try {
      console.log(
        `Generating embeddings for text (length: ${args.text.length}): "${args.text.substring(0, 100)}..."`,
      )
      if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY not set in environment")
        throw new Error("OpenAI API key not configured")
      }
      const openai = getOpenAIClient()
      console.log("OpenAI client initialized, calling embeddings API...")
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: args.text,
      })
      if (!response.data || response.data.length === 0) {
        console.error("OpenAI returned empty embedding data")
        return []
      }
      console.log(
        `Successfully generated embedding with ${response.data[0].embedding.length} dimensions`,
      )
      return response.data[0].embedding
    } catch (error) {
      console.error("Error generating embeddings:", error)
      if (error instanceof Error) {
        console.error("Error name:", error.name)
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      return []
    }
  },
})

// Store a document with its embedding in the database
export const storeDocumentWithEmbedding = internalMutation({
  args: {
    title: v.string(),
    content: v.string(),
    tableName: v.string(),
    documentId: v.optional(v.string()),
    embedding: v.array(v.number()),
  },
  returns: v.id("dbDocuments"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("dbDocuments", {
      title: args.title,
      content: args.content,
      tableName: args.tableName,
      documentId: args.documentId,
      embedding: args.embedding,
    })
  },
})

// Helper function to add documents with embeddings
const addDocumentHelper = async (
  ctx: any,
  title: string,
  content: string,
  tableName: string,
  documentId: Id<"candidates"> | Id<"jobs"> | Id<"interviewRequests">,
): Promise<Id<"dbDocuments">> => {
  const embedding: number[] = await ctx.runAction(
    internal.populateVectorDb.generateEmbeddings,
    {
      text: `${title} ${content}`,
    },
  )
  // Check if document already exists
  const existingDocs = await ctx.runQuery(
    internal.populateVectorDb.getDocumentsBySourceId,
    {
      tableName,
      documentId: documentId.toString(),
    },
  )
  // Delete existing documents if found
  if (existingDocs.length > 0) {
    for (const doc of existingDocs) {
      await ctx.runMutation(internal.populateVectorDb.deleteDocument, {
        id: doc._id,
      })
    }
  }
  return await ctx.runMutation(
    internal.populateVectorDb.storeDocumentWithEmbedding,
    {
      title,
      content,
      tableName,
      documentId: documentId.toString(),
      embedding,
    },
  )
}

// Add a document to the vector database
export const addDocumentToVectorSearch = internalAction({
  args: {
    title: v.string(),
    content: v.string(),
    tableName: v.string(),
    documentId: v.union(
      v.id("candidates"),
      v.id("jobs"),
      v.id("interviewRequests"),
    ),
  },
  returns: v.id("dbDocuments"),
  handler: async (ctx, args): Promise<Id<"dbDocuments">> => {
    return addDocumentHelper(
      ctx,
      args.title,
      args.content,
      args.tableName,
      args.documentId,
    )
  },
})

// Remove document from vector database when the source is deleted
export const removeVectorDbEntries = internalAction({
  args: {
    tableName: v.string(),
    documentId: v.union(
      v.id("candidates"),
      v.id("jobs"),
      v.id("interviewRequests"),
    ),
  },
  returns: v.number(),
  handler: async (ctx, args): Promise<number> => {
    // Get all documents associated with this source
    const docs = await ctx.runQuery(
      internal.populateVectorDb.getDocumentsBySourceId,
      {
        tableName: args.tableName,
        documentId: args.documentId.toString(),
      },
    )

    // Delete each document
    let deletedCount = 0
    for (const doc of docs) {
      await ctx.runMutation(internal.populateVectorDb.deleteDocument, {
        id: doc._id,
      })
      deletedCount++
    }

    console.log(
      `Removed ${deletedCount} vector DB entries for ${args.tableName} ${args.documentId}`,
    )
    return deletedCount
  },
})

// Delete a document from the database
export const deleteDocument = internalMutation({
  args: { id: v.id("dbDocuments") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return true
  },
})

export const getDocumentsBySourceId = internalQuery({
  args: {
    tableName: v.string(),
    documentId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("dbDocuments"),
      title: v.string(),
      content: v.string(),
      tableName: v.string(),
      documentId: v.string(),
      embedding: v.array(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("dbDocuments")
      .filter((q) =>
        q.and(
          q.eq(q.field("tableName"), args.tableName),
          q.eq(q.field("documentId"), args.documentId),
        ),
      )
      .collect()

    // Map the results to ensure they match the expected shape
    return docs.map((doc) => ({
      _id: doc._id,
      title: doc.title ?? "",
      content: doc.content ?? "",
      tableName: doc.tableName ?? args.tableName,
      documentId: doc.documentId ?? args.documentId,
      embedding: doc.embedding ?? [],
    }))
  },
})
