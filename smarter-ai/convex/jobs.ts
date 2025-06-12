import { query, mutation, internalQuery } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"

// Helper function to generate a random 3-digit meeting code
const generateMeetingCode = (): string => {
  return Math.floor(100 + Math.random() * 900).toString()
}

// Helper function to check if a meeting code already exists
const isMeetingCodeUnique = async (
  ctx: any,
  code: string,
): Promise<boolean> => {
  const existingJobs = await ctx.db
    .query("jobs")
    .filter((q: any) => q.eq(q.field("meetingCode"), code))
    .collect()

  return existingJobs.length === 0
}

// Get all jobs
export const getJobs = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("jobs"),
      _creationTime: v.number(),
      title: v.string(),
      company: v.string(),
      companyLogo: v.string(),
      type: v.string(),
      featured: v.boolean(),
      description: v.object({
        intro: v.string(),
        details: v.string(),
        responsibilities: v.string(),
        closing: v.string(),
      }),
      requirements: v.array(v.string()),
      desirables: v.array(v.string()),
      benefits: v.array(v.string()),
      salary: v.object({
        min: v.number(),
        max: v.number(),
        currency: v.string(),
        period: v.string(),
      }),
      location: v.string(),
      posted: v.string(),
      expiry: v.string(),
      level: v.string(),
      experience: v.string(),
      education: v.string(),
      meetingCode: v.optional(v.string()),
      interviewPrompt: v.optional(v.string()),
      aiInterviewerConfig: v.optional(
        v.object({
          introduction: v.string(),
          questions: v.array(
            v.object({
              id: v.string(),
              text: v.string(),
              importance: v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low"),
              ),
              followUpPrompts: v.optional(v.array(v.string())),
            }),
          ),
          conversationalStyle: v.union(
            v.literal("formal"),
            v.literal("casual"),
            v.literal("friendly"),
          ),
          focusAreas: v.array(v.string()),
          timeLimit: v.float64(),
          systemPrompt: v.optional(v.string()),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const jobs = await ctx.db.query("jobs").collect()
    return jobs
  },
})

// Get a single job by ID
export const getJob = query({
  args: { id: v.id("jobs") },
  returns: v.union(
    v.object({
      _id: v.id("jobs"),
      _creationTime: v.number(),
      title: v.string(),
      company: v.string(),
      companyLogo: v.string(),
      type: v.string(),
      featured: v.boolean(),
      description: v.object({
        intro: v.string(),
        details: v.string(),
        responsibilities: v.string(),
        closing: v.string(),
      }),
      requirements: v.array(v.string()),
      desirables: v.array(v.string()),
      benefits: v.array(v.string()),
      salary: v.object({
        min: v.number(),
        max: v.number(),
        currency: v.string(),
        period: v.string(),
      }),
      location: v.string(),
      posted: v.string(),
      expiry: v.string(),
      level: v.string(),
      experience: v.string(),
      education: v.string(),
      meetingCode: v.optional(v.string()),
      interviewPrompt: v.optional(v.string()),
      aiInterviewerConfig: v.optional(
        v.object({
          introduction: v.string(),
          questions: v.array(
            v.object({
              id: v.string(),
              text: v.string(),
              importance: v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low"),
              ),
              followUpPrompts: v.optional(v.array(v.string())),
            }),
          ),
          conversationalStyle: v.union(
            v.literal("formal"),
            v.literal("casual"),
            v.literal("friendly"),
          ),
          focusAreas: v.array(v.string()),
          timeLimit: v.float64(),
          systemPrompt: v.optional(v.string()),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id)
    return job
  },
})

// Get featured jobs
export const getFeaturedJobs = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("jobs"),
      _creationTime: v.number(),
      title: v.string(),
      company: v.string(),
      companyLogo: v.string(),
      type: v.string(),
      featured: v.boolean(),
      location: v.string(),
      posted: v.string(),
      level: v.string(),
      meetingCode: v.optional(v.string()),
      aiInterviewerConfig: v.optional(
        v.object({
          introduction: v.string(),
          questions: v.array(
            v.object({
              id: v.string(),
              text: v.string(),
              importance: v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low"),
              ),
              followUpPrompts: v.optional(v.array(v.string())),
            }),
          ),
          conversationalStyle: v.union(
            v.literal("formal"),
            v.literal("casual"),
            v.literal("friendly"),
          ),
          focusAreas: v.array(v.string()),
          timeLimit: v.float64(),
          systemPrompt: v.optional(v.string()),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect()

    return jobs.map((job) => ({
      _id: job._id,
      _creationTime: job._creationTime,
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      type: job.type,
      featured: job.featured,
      location: job.location,
      posted: job.posted,
      level: job.level,
      meetingCode: job.meetingCode,
      aiInterviewerConfig: job.aiInterviewerConfig,
    }))
  },
})

// Create a new job
export const createJob = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    companyLogo: v.string(),
    type: v.string(),
    featured: v.boolean(),
    description: v.object({
      intro: v.string(),
      details: v.string(),
      responsibilities: v.string(),
      closing: v.string(),
    }),
    requirements: v.array(v.string()),
    desirables: v.array(v.string()),
    benefits: v.array(v.string()),
    salary: v.object({
      min: v.number(),
      max: v.number(),
      currency: v.string(),
      period: v.string(),
    }),
    location: v.string(),
    posted: v.string(),
    expiry: v.string(),
    level: v.string(),
    experience: v.string(),
    education: v.string(),
    meetingCode: v.optional(v.string()),
    interviewPrompt: v.optional(v.string()),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    // Generate a unique 3-digit meeting code if not provided
    let meetingCode = args.meetingCode
    if (!meetingCode) {
      let isUnique = false
      while (!isUnique) {
        meetingCode = generateMeetingCode()
        isUnique = await isMeetingCodeUnique(ctx, meetingCode)
      }
    }

    // Create the job with the meeting code
    const jobId = await ctx.db.insert("jobs", {
      ...args,
      meetingCode,
    })

    // Initialize job progress entry
    await ctx.db.insert("jobProgress", {
      jobId,
      title: args.title,
      role: args.title,
      summary: {
        totalResumes: 0,
        meetingMinCriteria: 0,
        shortlisted: 0,
        rejected: 0,
        biasScore: 85,
      },
      topCandidate: {
        name: "",
        position: "",
        matchPercentage: 0,
        education: "",
        location: "",
        achievements: [],
        skills: [],
        skillGaps: [],
        linkedin: "",
      },
      skillAnalysis: {
        totalScreened: 0,
        matchingThreshold: 75,
        shortlistedRate: 0,
        averageSkillFit: 0,
      },
      suggestedQuestions: [],
      candidatesPool: {
        topSkills: [],
        missingCriteria: [],
        learningPaths: [],
      },
      candidates: [],
    })

    // Schedule the vector DB update as a background job
    await ctx.scheduler.runAfter(
      0,
      internal.populateVectorDb.populateSingleJobData,
      {
        jobId,
      },
    )

    return jobId
  },
})

// Update an existing job
export const updateJob = mutation({
  args: {
    id: v.id("jobs"),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    companyLogo: v.optional(v.string()),
    type: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    description: v.optional(
      v.object({
        intro: v.string(),
        details: v.string(),
        responsibilities: v.string(),
        closing: v.string(),
      }),
    ),
    requirements: v.optional(v.array(v.string())),
    desirables: v.optional(v.array(v.string())),
    benefits: v.optional(v.array(v.string())),
    salary: v.optional(
      v.object({
        min: v.number(),
        max: v.number(),
        currency: v.string(),
        period: v.string(),
      }),
    ),
    location: v.optional(v.string()),
    expiry: v.optional(v.string()),
    level: v.optional(v.string()),
    experience: v.optional(v.string()),
    education: v.optional(v.string()),
    meetingCode: v.optional(v.string()),
    interviewPrompt: v.optional(v.string()),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // Update the job
    await ctx.db.patch(id, updates)

    // If title is updated, update it in jobProgress as well
    if (updates.title) {
      const jobProgress = await ctx.db
        .query("jobProgress")
        .withIndex("by_job", (q) => q.eq("jobId", id))
        .unique()

      if (jobProgress) {
        await ctx.db.patch(jobProgress._id, {
          title: updates.title,
          role: updates.title,
        })
      }
    }

    // Schedule the vector DB update as a background job
    await ctx.scheduler.runAfter(
      0,
      internal.populateVectorDb.populateSingleJobData,
      {
        jobId: id,
      },
    )

    return id
  },
})

// Delete a job
export const deleteJob = mutation({
  args: { id: v.id("jobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete the job
    await ctx.db.delete(args.id)

    // Delete associated job progress
    const jobProgress = await ctx.db
      .query("jobProgress")
      .withIndex("by_job", (q) => q.eq("jobId", args.id))
      .unique()

    if (jobProgress) {
      await ctx.db.delete(jobProgress._id)
    }

    // Delete associated job applications
    const jobApplications = await ctx.db
      .query("jobApplications")
      .withIndex("by_job", (q) => q.eq("jobId", args.id))
      .collect()

    for (const application of jobApplications) {
      await ctx.db.delete(application._id)
    }

    // Remove entries from vector database
    await ctx.scheduler.runAfter(
      0,
      internal.populateVectorDb.removeVectorDbEntries,
      {
        tableName: "jobs",
        documentId: args.id,
      },
    )

    return null
  },
})

// Get a job by meeting code
export const getJobByMeetingCode = query({
  args: { meetingCode: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("jobs"),
      title: v.string(),
      company: v.string(),
      description: v.object({
        intro: v.string(),
        details: v.string(),
        responsibilities: v.string(),
        closing: v.string(),
      }),
      requirements: v.array(v.string()),
      desirables: v.array(v.string()),
      meetingCode: v.optional(v.string()),
      interviewPrompt: v.optional(v.string()),
      aiInterviewerConfig: v.optional(
        v.object({
          introduction: v.string(),
          questions: v.array(
            v.object({
              id: v.string(),
              text: v.string(),
              importance: v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low"),
              ),
              followUpPrompts: v.optional(v.array(v.string())),
            }),
          ),
          conversationalStyle: v.union(
            v.literal("formal"),
            v.literal("casual"),
            v.literal("friendly"),
          ),
          focusAreas: v.array(v.string()),
          timeLimit: v.float64(),
          systemPrompt: v.optional(v.string()),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("jobs")
      .filter((q) => q.eq(q.field("meetingCode"), args.meetingCode))
      .collect()

    if (jobs.length === 0) {
      return null
    }

    const job = jobs[0]
    return {
      _id: job._id,
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements,
      desirables: job.desirables,
      meetingCode: job.meetingCode,
      interviewPrompt: job.interviewPrompt,
      aiInterviewerConfig: job.aiInterviewerConfig,
    }
  },
})

// Add a getById internal helper for job lookup
export const getById = internalQuery({
  args: {
    id: v.id("jobs"),
  },
  returns: v.union(
    v.object({
      _id: v.id("jobs"),
      title: v.string(),
      company: v.string(),
      companyLogo: v.string(),
      type: v.string(),
      featured: v.boolean(),
      description: v.object({
        intro: v.string(),
        details: v.string(),
        responsibilities: v.string(),
        closing: v.string(),
      }),
      requirements: v.array(v.string()),
      benefits: v.array(v.string()),
      location: v.string(),
      aiInterviewerConfig: v.optional(
        v.object({
          introduction: v.string(),
          questions: v.array(
            v.object({
              id: v.string(),
              text: v.string(),
              importance: v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low"),
              ),
              followUpPrompts: v.optional(v.array(v.string())),
            }),
          ),
          conversationalStyle: v.union(
            v.literal("formal"),
            v.literal("casual"),
            v.literal("friendly"),
          ),
          focusAreas: v.array(v.string()),
          timeLimit: v.float64(),
          systemPrompt: v.optional(v.string()),
        }),
      ),
      // Add other required fields
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// Update just the interview prompt for a job
export const updateJobInterviewPrompt = mutation({
  args: {
    id: v.id("jobs"),
    interviewPrompt: v.string(),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const { id, interviewPrompt } = args

    // Get the job to verify it exists
    const job = await ctx.db.get(id)
    if (!job) {
      throw new Error(`Job with ID ${id} not found`)
    }

    // Update just the interview prompt
    await ctx.db.patch(id, { interviewPrompt })

    return id
  },
})

// Get the interview prompt for a job
export const getJobInterviewPrompt = query({
  args: { id: v.id("jobs") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id)
    if (!job) {
      return null
    }

    return job.interviewPrompt || null
  },
})

// Save AI interviewer configuration for a job
export const saveAiInterviewerConfig = mutation({
  args: {
    jobId: v.id("jobs"),
    config: v.object({
      introduction: v.string(),
      questions: v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          importance: v.union(
            v.literal("high"),
            v.literal("medium"),
            v.literal("low"),
          ),
          followUpPrompts: v.optional(v.array(v.string())),
        }),
      ),
      conversationalStyle: v.union(
        v.literal("formal"),
        v.literal("casual"),
        v.literal("friendly"),
      ),
      focusAreas: v.array(v.string()),
      timeLimit: v.float64(),
      systemPrompt: v.optional(v.string()),
    }),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const { jobId, config } = args

    // Get the job to verify it exists
    const job = await ctx.db.get(jobId)
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    // Update the AI interviewer configuration
    await ctx.db.patch(jobId, { aiInterviewerConfig: config })

    return jobId
  },
})

// Get AI interviewer configuration for a job
export const getAiInterviewerConfig = query({
  args: { jobId: v.id("jobs") },
  returns: v.union(
    v.object({
      introduction: v.string(),
      questions: v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          importance: v.union(
            v.literal("high"),
            v.literal("medium"),
            v.literal("low"),
          ),
          followUpPrompts: v.optional(v.array(v.string())),
        }),
      ),
      conversationalStyle: v.union(
        v.literal("formal"),
        v.literal("casual"),
        v.literal("friendly"),
      ),
      focusAreas: v.array(v.string()),
      timeLimit: v.float64(),
      systemPrompt: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job || !job.aiInterviewerConfig) {
      return null
    }

    return job.aiInterviewerConfig
  },
})

// Generate a complete Eleven Labs prompt by combining the base prompt with the AI interviewer configuration
export const generateElevenLabsPrompt = query({
  args: {
    jobId: v.id("jobs"),
    candidateName: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { jobId, candidateName } = args

    // Get the job to verify it exists
    const job = await ctx.db.get(jobId)
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    // Get the AI interviewer configuration
    const aiConfig = job.aiInterviewerConfig

    // Base Eleven Labs prompt
    let basePrompt = `You are a professional AI voice interviewer for Smarter.ai, tasked with assessing candidates for the ${job.title} position. Your purpose is to conduct a thorough evaluation of technical skills, experience, and cultural fit through natural conversation. Speak in a clear, professional tone that puts candidates at ease while extracting meaningful information about their qualifications.

${job.description.intro}

${job.description.details}

Begin each interview with a brief introduction about Smarter.ai and the ${job.title} position. Then guide the conversation through technical assessment areas including ${job.requirements.join(", ")}.

For this role, candidates need to demonstrate the following responsibilities: ${job.description.responsibilities}

Additionally, we value candidates who have: ${job.desirables.join(", ")}

Assess candidates on their understanding of technical philosophy, not just tools. Listen for indicators of collaboration skills, continuous improvement mindset, and relevant experience. Probe for specific examples from past experience, particularly regarding implementation, scaling, and problem resolution.

Adapt questioning based on candidate responses, following up on vague answers to obtain specific details. Recognize and acknowledge strong technical responses without revealing evaluation criteria. When candidates struggle with a question, provide appropriate context to keep the conversation flowing rather than creating awkwardness.

Throughout the interview, evaluate communication skills and ability to explain complex technical concepts clearly. The ideal candidate demonstrates both technical proficiency and the ability to collaborate effectively with cross-functional teams.

End each interview by asking if ${candidateName || "the candidate"} has questions about the role or company. Provide clear information about next steps in the hiring process. After the interview concludes, generate an assessment report highlighting technical strengths, potential areas for growth, and overall recommendation regarding suitability for the ${job.title} position at Smarter.ai.`

    // If there's no AI configuration, return the base prompt
    if (!aiConfig) {
      return basePrompt
    }

    // Combine the base prompt with the AI interviewer configuration
    let additionalPrompt = "\n\n# AI Interviewer Additional Configuration\n\n"

    // Add conversational style
    additionalPrompt += `Use a ${aiConfig.conversationalStyle} conversational style throughout the interview.\n\n`

    // Add custom introduction if provided
    if (aiConfig.introduction) {
      additionalPrompt += `## Introduction\nStart with this introduction: "${aiConfig.introduction}"\n\n`
    }

    // Add focus areas
    if (aiConfig.focusAreas && aiConfig.focusAreas.length > 0) {
      additionalPrompt += `## Focus Areas\nFocus on evaluating the candidate in these specific areas: ${aiConfig.focusAreas.join(", ")}\n\n`
    }

    // Add time limit
    additionalPrompt += `## Time Limit\nKeep the interview within ${aiConfig.timeLimit} minutes.\n\n`

    // Add specific questions
    if (aiConfig.questions && aiConfig.questions.length > 0) {
      additionalPrompt += "## Specific Questions to Ask\n"

      // Sort questions by importance (high, medium, low)
      const priorityOrder = { high: 1, medium: 2, low: 3 }
      const sortedQuestions = [...aiConfig.questions].sort(
        (a, b) => priorityOrder[a.importance] - priorityOrder[b.importance],
      )

      sortedQuestions.forEach((question, index) => {
        additionalPrompt += `${index + 1}. ${question.text} (${question.importance} priority)\n`

        // Add follow-up prompts if any
        if (question.followUpPrompts && question.followUpPrompts.length > 0) {
          additionalPrompt += "   Follow-up prompts if needed:\n"
          question.followUpPrompts.forEach((prompt) => {
            additionalPrompt += `   - ${prompt}\n`
          })
        }
        additionalPrompt += "\n"
      })
    }

    return basePrompt + additionalPrompt
  },
})

// Apply the AI interviewer configuration to the job's interviewPrompt field
export const applyAiInterviewerConfig = mutation({
  args: {
    jobId: v.id("jobs"),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const { jobId } = args

    // Get the job to verify it exists
    const job = await ctx.db.get(jobId)
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    // Get the AI interviewer configuration
    const aiConfig = job.aiInterviewerConfig as
      | {
          introduction: string
          questions: {
            id: string
            text: string
            importance: "high" | "medium" | "low"
            followUpPrompts?: string[]
          }[]
          conversationalStyle: "formal" | "casual" | "friendly"
          focusAreas: string[]
          timeLimit: number
          systemPrompt?: string
        }
      | undefined

    // If there's no AI configuration, use a default prompt
    if (!aiConfig) {
      // Default base prompt
      const defaultPrompt = `You are a professional AI voice interviewer for Smarter.ai, tasked with assessing candidates for the ${job.title} position. Your purpose is to conduct a thorough evaluation of technical skills, experience, and cultural fit through natural conversation. Speak in a clear, professional tone that puts candidates at ease while extracting meaningful information about their qualifications.

${job.description.intro}

${job.description.details}

Begin each interview with a brief introduction about Smarter.ai and the ${job.title} position. Then guide the conversation through technical assessment areas including ${job.requirements.join(", ")}.

For this role, candidates need to demonstrate the following responsibilities: ${job.description.responsibilities}

Additionally, we value candidates who have: ${job.desirables.join(", ")}

Assess candidates on their understanding of technical philosophy, not just tools. Listen for indicators of collaboration skills, continuous improvement mindset, and relevant experience. Probe for specific examples from past experience, particularly regarding implementation, scaling, and problem resolution.

Adapt questioning based on candidate responses, following up on vague answers to obtain specific details. Recognize and acknowledge strong technical responses without revealing evaluation criteria. When candidates struggle with a question, provide appropriate context to keep the conversation flowing rather than creating awkwardness.

Throughout the interview, evaluate communication skills and ability to explain complex technical concepts clearly. The ideal candidate demonstrates both technical proficiency and the ability to collaborate effectively with cross-functional teams.

End each interview by asking if the candidate has questions about the role or company. Provide clear information about next steps in the hiring process. After the interview concludes, generate an assessment report highlighting technical strengths, potential areas for growth, and overall recommendation regarding suitability for the ${job.title} position at Smarter.ai.`

      // Update the job's interviewPrompt
      await ctx.db.patch(jobId, { interviewPrompt: defaultPrompt })
      return jobId
    }

    // Use the custom system prompt from config if available, or fallback to a default
    let basePrompt = ""

    if (aiConfig.systemPrompt) {
      // Process placeholders in the system prompt
      basePrompt = aiConfig.systemPrompt
        .replace(/\{jobTitle\}/g, job.title)
        .replace(/\{requirements\}/g, job.requirements.join(", "))
        .replace(/\{responsibilities\}/g, job.description.responsibilities)
        .replace(/\{desirables\}/g, job.desirables.join(", "))
    } else {
      // Use the default prompt structure if no system prompt is provided
      basePrompt = `You are a professional AI voice interviewer for Smarter.ai, tasked with assessing candidates for the ${job.title} position. Your purpose is to conduct a thorough evaluation of technical skills, experience, and cultural fit through natural conversation. Speak in a clear, professional tone that puts candidates at ease while extracting meaningful information about their qualifications.

${job.description.intro}

${job.description.details}

Begin each interview with a brief introduction about Smarter.ai and the ${job.title} position. Then guide the conversation through technical assessment areas including ${job.requirements.join(", ")}.

For this role, candidates need to demonstrate the following responsibilities: ${job.description.responsibilities}

Additionally, we value candidates who have: ${job.desirables.join(", ")}

Assess candidates on their understanding of technical philosophy, not just tools. Listen for indicators of collaboration skills, continuous improvement mindset, and relevant experience. Probe for specific examples from past experience, particularly regarding implementation, scaling, and problem resolution.

Adapt questioning based on candidate responses, following up on vague answers to obtain specific details. Recognize and acknowledge strong technical responses without revealing evaluation criteria. When candidates struggle with a question, provide appropriate context to keep the conversation flowing rather than creating awkwardness.

Throughout the interview, evaluate communication skills and ability to explain complex technical concepts clearly. The ideal candidate demonstrates both technical proficiency and the ability to collaborate effectively with cross-functional teams.

End each interview by asking if the candidate has questions about the role or company. Provide clear information about next steps in the hiring process. After the interview concludes, generate an assessment report highlighting technical strengths, potential areas for growth, and overall recommendation regarding suitability for the ${job.title} position at Smarter.ai.`
    }

    // Combine the base prompt with the AI interviewer configuration
    let additionalPrompt = "\n\n# AI Interviewer Additional Configuration\n\n"

    // Add conversational style
    additionalPrompt += `Use a ${aiConfig.conversationalStyle} conversational style throughout the interview.\n\n`

    // Add custom introduction if provided
    if (aiConfig.introduction) {
      additionalPrompt += `## Introduction\nStart with this introduction: "${aiConfig.introduction}"\n\n`
    }

    // Add focus areas
    if (aiConfig.focusAreas && aiConfig.focusAreas.length > 0) {
      additionalPrompt += `## Focus Areas\nFocus on evaluating the candidate in these specific areas: ${aiConfig.focusAreas.join(", ")}\n\n`
    }

    // Add time limit
    additionalPrompt += `## Time Limit\nKeep the interview within ${aiConfig.timeLimit} minutes.\n\n`

    // Add specific questions
    if (aiConfig.questions && aiConfig.questions.length > 0) {
      additionalPrompt += "## Specific Questions to Ask\n"

      // Sort questions by importance (high, medium, low)
      const priorityOrder = { high: 1, medium: 2, low: 3 }
      const sortedQuestions = [...aiConfig.questions].sort(
        (a, b) => priorityOrder[a.importance] - priorityOrder[b.importance],
      )

      sortedQuestions.forEach((question, index) => {
        additionalPrompt += `${index + 1}. ${question.text} (${question.importance} priority)\n`

        // Add follow-up prompts if any
        if (question.followUpPrompts && question.followUpPrompts.length > 0) {
          additionalPrompt += "   Follow-up prompts if needed:\n"
          question.followUpPrompts.forEach((prompt) => {
            additionalPrompt += `   - ${prompt}\n`
          })
        }
        additionalPrompt += "\n"
      })
    }

    // Update the job's interviewPrompt
    await ctx.db.patch(jobId, {
      interviewPrompt: basePrompt + additionalPrompt,
    })

    return jobId
  },
})

// Create a job from AI chat
export const createJobFromAI = mutation({
  args: {
    title: v.string(),
    description: v.object({
      intro: v.string(),
      details: v.string(),
      responsibilities: v.string(),
      closing: v.string(),
    }),
    requirements: v.array(v.string()),
    desirables: v.array(v.string()),
    benefits: v.array(v.string()),
    salary: v.object({
      min: v.number(),
      max: v.number(),
      currency: v.string(),
      period: v.string(),
    }),
    location: v.string(),
    level: v.string(),
    experience: v.string(),
    education: v.string(),
    type: v.string(),
  },
  returns: v.object({
    jobId: v.id("jobs"),
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Generate a unique 3-digit meeting code
      let meetingCode = ""
      let isUnique = false
      while (!isUnique) {
        meetingCode = generateMeetingCode()
        isUnique = await isMeetingCodeUnique(ctx, meetingCode)
      }

      // Create the job with standardized company info and meeting code
      const jobId = await ctx.db.insert("jobs", {
        ...args,
        company: "Your Company", // This would be dynamic in a real app
        companyLogo: "/company-logo.png", // This would be dynamic in a real app
        featured: false,
        meetingCode, // Add the generated meeting code
        posted: new Date().toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        expiry: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }), // Set expiry to 30 days from now
      })

      // Initialize job progress entry
      await ctx.db.insert("jobProgress", {
        jobId,
        title: args.title,
        role: args.title,
        summary: {
          totalResumes: 0,
          meetingMinCriteria: 0,
          shortlisted: 0,
          rejected: 0,
          biasScore: 85,
        },
        topCandidate: {
          name: "",
          position: "",
          matchPercentage: 0,
          education: "",
          location: "",
          achievements: [],
          skills: [],
          skillGaps: [],
          linkedin: "",
        },
        skillAnalysis: {
          totalScreened: 0,
          matchingThreshold: 75,
          shortlistedRate: 0,
          averageSkillFit: 0,
        },
        suggestedQuestions: [],
        candidatesPool: {
          topSkills: [],
          missingCriteria: [],
          learningPaths: [],
        },
        candidates: [],
      })

      // Schedule the vector DB update
      await ctx.scheduler.runAfter(
        0,
        internal.populateVectorDb.populateSingleJobData,
        {
          jobId,
        },
      )

      return {
        jobId,
        success: true,
        message: `Successfully created job listing for ${args.title} with meeting code ${meetingCode}`,
      }
    } catch (error) {
      return {
        jobId: null as any,
        success: false,
        message: `Error creating job: ${error}`,
      }
    }
  },
})

// Delete a job from AI chat with vector search
export const deleteJobFromAI = mutation({
  args: {
    jobTitle: v.string(),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    deletedJobId: v.optional(v.id("jobs")),
  }),
  handler: async (ctx, args) => {
    try {
      // First check for exact matches with title
      let jobResult = await ctx.db
        .query("jobs")
        .filter((q) => q.eq(q.field("title"), args.jobTitle))
        .first()

      // If not found, try to use the vector search for better matching
      if (!jobResult) {
        // Get all jobs to handle fuzzy title matching
        const allJobs = await ctx.db.query("jobs").collect()

        if (allJobs.length === 0) {
          return {
            success: false,
            message: "There are no job listings in the database.",
          }
        }

        // Process search terms
        const titleTerms = args.jobTitle
          .toLowerCase()
          .split(/\s+/)
          .filter(
            (term) =>
              term.length > 2 &&
              !["the", "and", "for", "with", "job", "position"].includes(term),
          )

        // Score each job based on how many terms match
        const jobMatches = allJobs.map((job) => {
          const jobTitle = job.title.toLowerCase()
          const jobCompany = job.company.toLowerCase()
          const jobLocation = job.location.toLowerCase()

          // Score is how many terms match in the title
          let score = titleTerms.filter((term) =>
            jobTitle.includes(term),
          ).length

          // Boost score for exact word matches
          titleTerms.forEach((term) => {
            const wordRegex = new RegExp(`\\b${term}\\b`, "i")
            if (wordRegex.test(jobTitle)) score += 0.5
          })

          // Add smaller boost for company match if company provided
          if (args.company && jobCompany.includes(args.company.toLowerCase())) {
            score += 0.3
          }

          // Add smaller boost for location match if location provided
          if (
            args.location &&
            jobLocation.includes(args.location.toLowerCase())
          ) {
            score += 0.3
          }

          return { job, score }
        })

        // Sort by score (highest first) and take the best match
        jobMatches.sort((a, b) => b.score - a.score)

        // Only consider it a match if it has at least one term match
        if (jobMatches.length > 0 && jobMatches[0].score > 0) {
          jobResult = jobMatches[0].job
        }
      }

      if (!jobResult) {
        return {
          success: false,
          message: `No job found matching "${args.jobTitle}"${args.company ? ` at ${args.company}` : ""}${args.location ? ` in ${args.location}` : ""}`,
        }
      }

      // Delete the job
      await ctx.db.delete(jobResult._id)

      // Also delete associated job progress
      const jobProgress = await ctx.db
        .query("jobProgress")
        .withIndex("by_job", (q) => q.eq("jobId", jobResult._id))
        .unique()

      if (jobProgress) {
        await ctx.db.delete(jobProgress._id)
      }

      return {
        success: true,
        message: `Successfully deleted the job listing for "${jobResult.title}"`,
        deletedJobId: jobResult._id,
      }
    } catch (error) {
      console.error("Error deleting job:", error)
      return {
        success: false,
        message: `Error deleting job: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
})

// Save both AI interviewer configuration and interview prompt in a single operation
export const saveInterviewerConfigAndPrompt = mutation({
  args: {
    jobId: v.id("jobs"),
    config: v.object({
      introduction: v.string(),
      questions: v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          importance: v.union(
            v.literal("high"),
            v.literal("medium"),
            v.literal("low"),
          ),
          followUpPrompts: v.optional(v.array(v.string())),
        }),
      ),
      conversationalStyle: v.union(
        v.literal("formal"),
        v.literal("casual"),
        v.literal("friendly"),
      ),
      focusAreas: v.array(v.string()),
      timeLimit: v.float64(),
      systemPrompt: v.optional(v.string()),
    }),
    interviewPrompt: v.string(),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const { jobId, config, interviewPrompt } = args

    // Get the job to verify it exists
    const job = await ctx.db.get(jobId)
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    // Update both the AI interviewer configuration and interview prompt in one operation
    await ctx.db.patch(jobId, {
      aiInterviewerConfig: config,
      interviewPrompt: interviewPrompt,
    })

    return jobId
  },
})

// Get job details including AI interviewer configuration for the editor
export const getJobWithInterviewerConfig = query({
  args: { id: v.id("jobs") },
  returns: v.union(
    v.object({
      _id: v.id("jobs"),
      title: v.string(),
      company: v.string(),
      requirements: v.array(v.string()),
      desirables: v.array(v.string()),
      description: v.object({
        intro: v.string(),
        details: v.string(),
        responsibilities: v.string(),
        closing: v.string(),
      }),
      interviewPrompt: v.optional(v.string()),
      aiInterviewerConfig: v.optional(
        v.object({
          introduction: v.string(),
          questions: v.array(
            v.object({
              id: v.string(),
              text: v.string(),
              importance: v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low"),
              ),
              followUpPrompts: v.optional(v.array(v.string())),
            }),
          ),
          conversationalStyle: v.union(
            v.literal("formal"),
            v.literal("casual"),
            v.literal("friendly"),
          ),
          focusAreas: v.array(v.string()),
          timeLimit: v.float64(),
          systemPrompt: v.optional(v.string()),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id)
    if (!job) {
      return null
    }

    // Return only the necessary fields for the AI interviewer editor
    return {
      _id: job._id,
      title: job.title,
      company: job.company,
      requirements: job.requirements,
      desirables: job.desirables,
      description: job.description,
      interviewPrompt: job.interviewPrompt,
      aiInterviewerConfig: job.aiInterviewerConfig,
    }
  },
})

// Get job information for applicant chat with all needed fields
export const getJobInformation = query({
  args: { meetingCode: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("jobs"),
      _creationTime: v.number(),
      title: v.string(),
      company: v.string(),
      companyLogo: v.string(),
      type: v.optional(v.string()),
      featured: v.boolean(),
      description: v.object({
        intro: v.string(),
        details: v.string(),
        responsibilities: v.string(),
        closing: v.string(),
      }),
      requirements: v.array(v.string()),
      desirables: v.array(v.string()),
      benefits: v.optional(v.array(v.string())),
      salary: v.optional(
        v.object({
          min: v.float64(),
          max: v.float64(),
          currency: v.string(),
          period: v.string(),
        }),
      ),
      location: v.optional(v.string()),
      posted: v.string(),
      expiry: v.string(),
      level: v.optional(v.string()),
      experience: v.optional(v.string()),
      education: v.optional(v.string()),
      meetingCode: v.optional(v.string()),
      interviewPrompt: v.optional(v.string()),
      aiInterviewerConfig: v.optional(
        v.object({
          introduction: v.string(),
          questions: v.array(
            v.object({
              id: v.string(),
              text: v.string(),
              importance: v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low"),
              ),
              followUpPrompts: v.optional(v.array(v.string())),
            }),
          ),
          conversationalStyle: v.union(
            v.literal("formal"),
            v.literal("casual"),
            v.literal("friendly"),
          ),
          focusAreas: v.array(v.string()),
          timeLimit: v.float64(),
          systemPrompt: v.optional(v.string()),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("jobs")
      .filter((q) => q.eq(q.field("meetingCode"), args.meetingCode))
      .collect()

    if (jobs.length === 0) {
      return null
    }

    // Return the full job information
    return jobs[0]
  },
})

// Bulk delete jobs
export const bulkDeleteJobs = mutation({
  args: {
    ids: v.array(v.id("jobs")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    deletedCount: v.number(),
    failedIds: v.array(v.id("jobs")),
  }),
  handler: async (ctx, args) => {
    const { ids } = args
    const failedIds: Id<"jobs">[] = []
    let deletedCount = 0

    for (const jobId of ids) {
      try {
        // Delete the job
        await ctx.db.delete(jobId)

        // Delete associated job progress
        const jobProgress = await ctx.db
          .query("jobProgress")
          .withIndex("by_job", (q) => q.eq("jobId", jobId))
          .unique()

        if (jobProgress) {
          await ctx.db.delete(jobProgress._id)
        }

        // Delete associated job applications
        const jobApplications = await ctx.db
          .query("jobApplications")
          .withIndex("by_job", (q) => q.eq("jobId", jobId))
          .collect()

        for (const application of jobApplications) {
          await ctx.db.delete(application._id)
        }

        // Remove entries from vector database
        await ctx.scheduler.runAfter(
          0,
          internal.populateVectorDb.removeVectorDbEntries,
          {
            tableName: "jobs",
            documentId: jobId,
          },
        )

        deletedCount++
      } catch (error) {
        console.error(`Error deleting job ${jobId}:`, error)
        failedIds.push(jobId)
      }
    }

    if (failedIds.length === 0) {
      return {
        success: true,
        message: `Successfully deleted ${deletedCount} job${deletedCount !== 1 ? "s" : ""}`,
        deletedCount,
        failedIds,
      }
    } else {
      return {
        success: deletedCount > 0,
        message: `Deleted ${deletedCount} job${deletedCount !== 1 ? "s" : ""}, but failed to delete ${failedIds.length} job${failedIds.length !== 1 ? "s" : ""}`,
        deletedCount,
        failedIds,
      }
    }
  },
})

// ===== JOB TEMPLATES =====

// Get all job templates
export const getJobTemplates = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("jobTemplates"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      template: v.object({
        title: v.string(),
        description: v.string(),
        responsibilities: v.string(),
        requirements: v.string(),
        jobType: v.object({
          remote: v.boolean(),
          fullTime: v.boolean(),
          hybrid: v.boolean(),
        }),
        salaryRange: v.optional(v.string()),
        jobLevel: v.optional(v.string()),
        location: v.optional(v.string()),
        skills: v.array(v.string()),
        benefits: v.optional(v.string()),
        experienceLevel: v.optional(v.string()),
      }),
      isDefault: v.optional(v.boolean()),
      isPublic: v.optional(v.boolean()),
      createdBy: v.optional(v.id("users")),
      createdAt: v.string(),
      updatedAt: v.optional(v.string()),
      usageCount: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const templates = await ctx.db.query("jobTemplates").collect()
    return templates
  },
})



// Save uploaded template as a new job template
export const saveUploadedTemplate = mutation({
  args: {
    name: v.string(),
    parsedTemplate: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      responsibilities: v.optional(v.string()),
      requirements: v.optional(v.string()),
      jobType: v.optional(
        v.object({
          remote: v.optional(v.boolean()),
          fullTime: v.optional(v.boolean()),
          hybrid: v.optional(v.boolean()),
        }),
      ),
      salaryRange: v.optional(v.string()),
      jobLevel: v.optional(v.string()),
      location: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      benefits: v.optional(v.string()),
      experienceLevel: v.optional(v.string()),
    }),
    category: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  returns: v.id("jobTemplates"),
  handler: async (ctx, args) => {
    // Create a complete template object with defaults for missing fields
    const template = {
      title: args.parsedTemplate.title || "Untitled Position",
      description: args.parsedTemplate.description || "",
      responsibilities: args.parsedTemplate.responsibilities || "",
      requirements: args.parsedTemplate.requirements || "",
      jobType: {
        remote: args.parsedTemplate.jobType?.remote || false,
        fullTime: args.parsedTemplate.jobType?.fullTime || true,
        hybrid: args.parsedTemplate.jobType?.hybrid || false,
      },
      salaryRange: args.parsedTemplate.salaryRange,
      jobLevel: args.parsedTemplate.jobLevel,
      location: args.parsedTemplate.location,
      skills: args.parsedTemplate.skills || [],
      benefits: args.parsedTemplate.benefits,
      experienceLevel: args.parsedTemplate.experienceLevel,
    }

    const templateId = await ctx.db.insert("jobTemplates", {
      name: args.name,
      description: `Template created from uploaded file`,
      category: args.category || "Uploaded",
      template,
      isDefault: false,
      isPublic: false,
      createdBy: args.createdBy,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    })

    return templateId
  },
})
