import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"

// Get all job applications for a specific job
export const getJobApplications = query({
  args: { jobId: v.id("jobs") },
  returns: v.array(
    v.object({
      _id: v.id("jobApplications"),
      candidateId: v.id("candidates"),
      candidateName: v.string(),
      jobId: v.id("jobs"),
      status: v.string(),
      appliedDate: v.string(),
      progress: v.number(),
      matchScore: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all applications for this job
    const applications = await ctx.db
      .query("jobApplications")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect()

    // Fetch candidate names for each application
    const result = []
    for (const app of applications) {
      const candidate = await ctx.db.get(app.candidateId)
      if (candidate) {
        result.push({
          _id: app._id,
          candidateId: app.candidateId,
          candidateName: candidate.name,
          jobId: app.jobId,
          status: app.status,
          appliedDate: app.appliedDate,
          progress: app.progress,
          matchScore: app.matchScore,
        })
      }
    }

    return result
  },
})

// Get job progress by job ID
export const getJobProgress = query({
  args: { jobId: v.id("jobs") },
  returns: v.union(
    v.object({
      _id: v.id("jobProgress"),
      _creationTime: v.number(),
      jobId: v.id("jobs"),
      title: v.string(),
      role: v.string(),
      summary: v.object({
        totalResumes: v.number(),
        meetingMinCriteria: v.number(),
        shortlisted: v.number(),
        rejected: v.number(),
        biasScore: v.number(),
      }),
      topCandidate: v.object({
        name: v.string(),
        position: v.string(),
        matchPercentage: v.number(),
        education: v.string(),
        location: v.string(),
        achievements: v.array(v.string()),
        skills: v.array(v.string()),
        skillGaps: v.array(v.string()),
        linkedin: v.string(),
      }),
      skillAnalysis: v.object({
        totalScreened: v.number(),
        matchingThreshold: v.number(),
        shortlistedRate: v.number(),
        averageSkillFit: v.number(),
      }),
      suggestedQuestions: v.array(v.string()),
      candidatesPool: v.object({
        topSkills: v.array(v.string()),
        missingCriteria: v.array(v.string()),
        learningPaths: v.array(
          v.object({
            title: v.string(),
            provider: v.string(),
          }),
        ),
      }),
      candidates: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          email: v.string(),
          matchScore: v.number(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const jobProgress = await ctx.db
      .query("jobProgress")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .unique()

    return jobProgress
  },
})

// Update job progress
export const updateJobProgress = mutation({
  args: {
    jobId: v.id("jobs"),
    summary: v.optional(
      v.object({
        totalResumes: v.number(),
        meetingMinCriteria: v.number(),
        shortlisted: v.number(),
        rejected: v.number(),
        biasScore: v.number(),
      }),
    ),
    topCandidate: v.optional(
      v.object({
        name: v.string(),
        position: v.string(),
        matchPercentage: v.number(),
        education: v.string(),
        location: v.string(),
        achievements: v.array(v.string()),
        skills: v.array(v.string()),
        skillGaps: v.array(v.string()),
        linkedin: v.string(),
      }),
    ),
    skillAnalysis: v.optional(
      v.object({
        totalScreened: v.number(),
        matchingThreshold: v.number(),
        shortlistedRate: v.number(),
        averageSkillFit: v.number(),
      }),
    ),
    suggestedQuestions: v.optional(v.array(v.string())),
    candidatesPool: v.optional(
      v.object({
        topSkills: v.array(v.string()),
        missingCriteria: v.array(v.string()),
        learningPaths: v.array(
          v.object({
            title: v.string(),
            provider: v.string(),
          }),
        ),
      }),
    ),
    candidates: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          email: v.string(),
          matchScore: v.number(),
        }),
      ),
    ),
  },
  returns: v.id("jobProgress"),
  handler: async (ctx, args) => {
    const { jobId, ...updateFields } = args

    // Find the job progress entry
    const jobProgress = await ctx.db
      .query("jobProgress")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .unique()

    if (!jobProgress) {
      throw new Error(`Job progress not found for job ID: ${jobId}`)
    }

    // Update the job progress
    await ctx.db.patch(jobProgress._id, updateFields)

    return jobProgress._id
  },
})

// Generate random job progress data
export const generateRandomJobProgress = mutation({
  args: { jobId: v.id("jobs") },
  returns: v.id("jobProgress"),
  handler: async (ctx, args) => {
    // Get the job to get its title
    const job = await ctx.db.get(args.jobId)
    if (!job) {
      throw new Error(`Job not found: ${args.jobId}`)
    }

    // Get some candidates for the job
    const candidates = await ctx.db.query("candidates").take(5)

    // Random data generation
    const totalResumes = Math.floor(Math.random() * 300) + 100
    const meetingMinCriteria = Math.floor(
      totalResumes * (Math.random() * 0.3 + 0.2),
    )
    const shortlisted = Math.floor(
      meetingMinCriteria * (Math.random() * 0.3 + 0.1),
    )
    const rejected = totalResumes - meetingMinCriteria

    // Choose a random top candidate from the list
    const randomTopCandidate =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : null

    const topCandidateData = randomTopCandidate
      ? {
          name: randomTopCandidate.name,
          position: job.title,
          matchPercentage: Math.floor(Math.random() * 20) + 80, // 80-100
          education: "MSc in Computer Science",
          location: "Remote",
          achievements: [
            "Led development of key features in previous role",
            "Improved system performance by 30%",
          ],
          skills: ["JavaScript", "React", "TypeScript", "Node.js"],
          skillGaps: ["Cloud Infrastructure", "DevOps", "Team Leadership"],
          linkedin: "https://linkedin.com/in/example",
        }
      : {
          name: "",
          position: "",
          matchPercentage: 0,
          education: "",
          location: "",
          achievements: [],
          skills: [],
          skillGaps: [],
          linkedin: "",
        }

    // Skill analysis
    const skillAnalysis = {
      totalScreened: totalResumes,
      matchingThreshold: 75,
      shortlistedRate: Math.floor((shortlisted / totalResumes) * 100),
      averageSkillFit: Math.floor(Math.random() * 20) + 60, // 60-80
    }

    // Suggested questions based on job title
    let suggestedQuestions = []
    if (
      job.title.toLowerCase().includes("developer") ||
      job.title.toLowerCase().includes("engineer")
    ) {
      suggestedQuestions = [
        "Describe your experience with modern JavaScript frameworks",
        "How do you approach testing in your projects?",
        "Tell me about a complex technical challenge you solved recently",
      ]
    } else if (job.title.toLowerCase().includes("manager")) {
      suggestedQuestions = [
        "How do you handle team conflicts?",
        "Describe your approach to managing project deadlines",
        "How do you measure team performance?",
      ]
    } else if (job.title.toLowerCase().includes("designer")) {
      suggestedQuestions = [
        "Describe your design process from concept to implementation",
        "How do you incorporate user feedback into your designs?",
        "What design tools do you use in your workflow?",
      ]
    } else {
      suggestedQuestions = [
        "Why are you interested in this role?",
        "How do you handle tight deadlines?",
        "Describe your ideal work environment",
      ]
    }

    // Candidates pool data
    const candidatesPool = {
      topSkills: ["JavaScript", "React", "TypeScript", "Node.js", "SQL"],
      missingCriteria: [
        "Cloud Infrastructure",
        "DevOps Experience",
        "Team Leadership",
      ],
      learningPaths: [
        {
          title: "Cloud Certification Path",
          provider: "AWS Training & Certification",
        },
        {
          title: "DevOps Engineer Path",
          provider: "LinkedIn Learning",
        },
      ],
    }

    // Candidate list
    const candidatesList = candidates.map((candidate) => ({
      id: candidate._id.toString(),
      name: candidate.name,
      email: candidate.email,
      matchScore: Math.floor(Math.random() * 50) + 50, // 50-100
    }))

    // Find the job progress entry or create a new one
    const existingJobProgress = await ctx.db
      .query("jobProgress")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .unique()

    if (existingJobProgress) {
      // Update existing entry
      await ctx.db.patch(existingJobProgress._id, {
        summary: {
          totalResumes,
          meetingMinCriteria,
          shortlisted,
          rejected,
          biasScore: Math.floor(Math.random() * 10) + 85, // 85-95
        },
        topCandidate: topCandidateData,
        skillAnalysis,
        suggestedQuestions,
        candidatesPool,
        candidates: candidatesList,
      })

      return existingJobProgress._id
    } else {
      // Create new entry
      const progressId = await ctx.db.insert("jobProgress", {
        jobId: args.jobId,
        title: job.title,
        role: job.title,
        summary: {
          totalResumes,
          meetingMinCriteria,
          shortlisted,
          rejected,
          biasScore: Math.floor(Math.random() * 10) + 85, // 85-95
        },
        topCandidate: topCandidateData,
        skillAnalysis,
        suggestedQuestions,
        candidatesPool,
        candidates: candidatesList,
      })

      return progressId
    }
  },
})

// Apply candidate to job
export const applyCandidate = mutation({
  args: {
    candidateId: v.id("candidates"),
    jobId: v.id("jobs"),
    matchScore: v.number(),
  },
  returns: v.id("jobApplications"),
  handler: async (ctx, args) => {
    const { candidateId, jobId, matchScore } = args

    // Check if candidate and job exist
    const candidate = await ctx.db.get(candidateId)
    const job = await ctx.db.get(jobId)

    if (!candidate) {
      throw new Error(`Candidate not found: ${candidateId}`)
    }

    if (!job) {
      throw new Error(`Job not found: ${jobId}`)
    }

    // Check if application already exists
    const existingApplication = await ctx.db
      .query("jobApplications")
      .withIndex("by_job_and_status", (q) =>
        q.eq("jobId", jobId).eq("status", "applied"),
      )
      .first()

    if (existingApplication) {
      throw new Error(`Candidate has already applied to this job`)
    }

    // Create application
    const today = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    const applicationId = await ctx.db.insert("jobApplications", {
      candidateId,
      jobId,
      status: "applied",
      appliedDate: today,
      progress: 20,
      matchScore,
    })

    // Update job progress with real data
    await ctx.runMutation(
      internal.jobProgress.updateJobProgressFromApplications,
      {
        jobId,
      },
    )

    return applicationId
  },
})

// Update candidate application status
export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { applicationId, status } = args

    // Get the current application
    const application = await ctx.db.get(applicationId)
    if (!application) {
      throw new Error(`Application not found: ${applicationId}`)
    }

    // Determine progress based on status
    let progress = 20 // Default for "applied"

    switch (status) {
      case "screening":
        progress = 40
        break
      case "interview":
        progress = 60
        break
      case "offer":
        progress = 80
        break
      case "hired":
        progress = 100
        break
      case "rejected":
        progress = 100
        break
    }

    // Update the application
    await ctx.db.patch(applicationId, { status, progress })

    // Update job progress with real data
    await ctx.runMutation(
      internal.jobProgress.updateJobProgressFromApplications,
      {
        jobId: application.jobId,
      },
    )

    return null
  },
})

// Get job progress by job ID with real-time data from other tables
export const getJobProgressData = query({
  args: { jobId: v.id("jobs") },
  returns: v.union(
    v.object({
      _id: v.id("jobProgress"),
      _creationTime: v.number(),
      jobId: v.id("jobs"),
      title: v.string(),
      role: v.string(),
      summary: v.object({
        totalResumes: v.number(),
        meetingMinCriteria: v.number(),
        shortlisted: v.number(),
        rejected: v.number(),
        biasScore: v.number(),
      }),
      topCandidate: v.object({
        name: v.string(),
        position: v.string(),
        matchPercentage: v.number(),
        education: v.string(),
        location: v.string(),
        achievements: v.array(v.string()),
        skills: v.array(v.string()),
        skillGaps: v.array(v.string()),
        linkedin: v.string(),
      }),
      skillAnalysis: v.object({
        totalScreened: v.number(),
        matchingThreshold: v.number(),
        shortlistedRate: v.number(),
        averageSkillFit: v.number(),
      }),
      suggestedQuestions: v.array(v.string()),
      hasAiQuestions: v.optional(v.boolean()),
      candidatesPool: v.object({
        topSkills: v.array(v.string()),
        missingCriteria: v.array(v.string()),
        learningPaths: v.array(
          v.object({
            title: v.string(),
            provider: v.string(),
          }),
        ),
      }),
      candidates: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          email: v.string(),
          matchScore: v.number(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const { jobId } = args

    // 1. Get the job data
    const job = await ctx.db.get(jobId)
    if (!job) {
      return null
    }

    // Get the job's meeting code (used for filtering candidates)
    const jobMeetingCode = job.meetingCode || ""

    // 2. Get existing jobProgress or create default structure
    let jobProgress = await ctx.db
      .query("jobProgress")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .unique()

    if (!jobProgress) {
      // We'll create a new jobProgress object with calculated values and return it
      // (without saving to database since this is a query)
      jobProgress = {
        _id: "placeholder_id" as Id<"jobProgress">,
        _creationTime: Date.now(),
        jobId,
        title: job.title,
        role: job.title,
        summary: {
          totalResumes: 0,
          meetingMinCriteria: 0,
          shortlisted: 0,
          rejected: 0,
          biasScore: 85, // Default value
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
          matchingThreshold: 75, // Default threshold
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
      }
    }

    // Create a new result object that we'll return, based on the existing job progress
    const result = {
      ...jobProgress,
      hasAiQuestions: false, // Default value
    }

    // 3. DIRECT QUERY: Get candidates that have the job's meeting code
    // This directly matches candidates to the job without using applications
    let candidates: any[] = []

    // Only proceed if we have a meetingCode to filter by
    if (jobMeetingCode) {
      candidates = await ctx.db
        .query("candidates")
        .filter((q) => q.eq(q.field("meetingCode"), jobMeetingCode))
        .collect()
    }

    // If no candidates found with meetingCode, try to find them through applications as fallback
    if (candidates.length === 0) {
      // Get applications for this job
      const applications = await ctx.db
        .query("jobApplications")
        .withIndex("by_job", (q) => q.eq("jobId", jobId))
        .collect()

      // Get candidates from applications
      for (const app of applications) {
        const candidate = await ctx.db.get(app.candidateId)
        if (candidate) {
          // Create a new object with the needed properties instead of modifying the original
          candidates.push({
            ...candidate,
            matchScore: candidate.aiScore || app.matchScore || 75, // Prioritize aiScore if available
            status: app.status,
          })
        }
      }
    } else {
      // For candidates fetched directly, assign arbitrary match scores
      candidates = candidates.map((candidate) => {
        // Create a new object with the matchScore property
        return {
          ...candidate,
          matchScore:
            candidate.aiScore ||
            candidate.matchScore ||
            Math.floor(Math.random() * 36) + 60, // Prioritize aiScore
          status: candidate.status || "applied", // Default status
        }
      })
    }

    // 4. Update summary based on candidate data
    const totalResumes = candidates.length
    const meetingMinCriteria = candidates.filter(
      (c) => (c.matchScore || 0) >= 50,
    ).length
    const shortlisted = candidates.filter((c) =>
      ["interview", "offer"].includes(c.status || ""),
    ).length
    const rejected = candidates.filter(
      (c) => (c.status || "") === "rejected",
    ).length

    result.summary = {
      ...result.summary,
      totalResumes,
      meetingMinCriteria,
      shortlisted,
      rejected,
    }

    // Calculate skill analysis
    result.skillAnalysis = {
      ...result.skillAnalysis,
      totalScreened: totalResumes,
      shortlistedRate:
        totalResumes > 0 ? Math.round((shortlisted / totalResumes) * 100) : 0,
    }

    // 5. Process candidate details
    if (candidates.length > 0) {
      // Prepare candidate list for the UI
      const candidatesList: Array<{
        id: string
        name: string
        email: string
        matchScore: number
      }> = []
      const candidateSkills = new Map<string, number>()

      // Process each candidate
      for (const candidate of candidates) {
        // Add to candidates list
        candidatesList.push({
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          matchScore: candidate.aiScore || candidate.matchScore || 75, // Prioritize aiScore if available
        })

        // Collect skills for skill analysis
        if (candidate.candidateProfile?.skills) {
          // Extract technical skills
          const technicalSkills =
            candidate.candidateProfile.skills.technical?.skills || []
          for (const skill of technicalSkills) {
            if (!candidateSkills.has(skill.name)) {
              candidateSkills.set(skill.name, 1)
            } else {
              const currentCount = candidateSkills.get(skill.name) || 0
              candidateSkills.set(skill.name, currentCount + 1)
            }
          }
        }
      }

      // Sort candidates by match score (highest first) and limit to top 4
      const sortedCandidatesList = candidatesList
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4)

      // Update candidates list in job progress with only top 4
      result.candidates = sortedCandidatesList

      // 6. Find top candidate (highest match score)
      if (candidatesList.length > 0) {
        // Sort by match score descending
        const sortedCandidates = [...candidatesList].sort(
          (a, b) => b.matchScore - a.matchScore,
        )
        const topCandidateInfo = sortedCandidates[0]

        // Get detailed data for top candidate
        const topCandidateData = await ctx.db.get(
          topCandidateInfo.id as Id<"candidates">,
        )
        if (topCandidateData) {
          // Extract education, location, skills from profile
          const profile = topCandidateData.candidateProfile
          let skills: string[] = []
          let achievements: string[] = []

          if (profile) {
            // Extract technical skills
            if (profile.skills?.technical?.skills) {
              skills = profile.skills.technical.skills
                .map((s: { name: string; score: number }) => s.name)
                .slice(0, 5) // Top 5 skills
            }

            // Extract achievements or highlights
            if (profile.cv?.highlights) {
              achievements = profile.cv.highlights.slice(0, 2) // Top 2 achievements
            } else if (profile.interview?.highlights) {
              // Fallback to interview highlights if CV highlights don't exist
              achievements = profile.interview.highlights
                .map((h: { title: string }) => h.title)
                .slice(0, 2)
            }

            // Extract location
            const location = profile.personal?.location || "Unknown Location"

            // Extract education from career
            const education = profile.career?.experience || "Unknown Education"

            // Determine skill gaps based on job requirements
            const skillGaps: string[] = []
            if (job.requirements) {
              // Simple extraction of keywords from requirements
              const reqKeywords =
                job.requirements
                  .join(" ")
                  .toLowerCase()
                  .match(/\b[a-z]+\b/g) || []

              // Find keywords that might be skills and aren't in candidate skills
              for (const keyword of reqKeywords) {
                if (
                  keyword.length > 3 &&
                  !skills.some((s) => s.toLowerCase().includes(keyword)) &&
                  !skillGaps.includes(keyword) &&
                  skillGaps.length < 3
                ) {
                  // Limit to 3 skill gaps
                  skillGaps.push(keyword)
                }
              }
            }

            // Default LinkedIn URL (the actual field may be stored elsewhere)
            const linkedinUrl = "https://linkedin.com" // Use a default

            // Update top candidate data
            result.topCandidate = {
              name: topCandidateData.name,
              position: topCandidateData.position || "Candidate",
              matchPercentage: topCandidateInfo.matchScore,
              education: education,
              location: location,
              achievements:
                achievements.length > 0
                  ? achievements
                  : ["No specific achievements listed"],
              skills:
                skills.length > 0 ? skills : ["No specific skills listed"],
              skillGaps:
                skillGaps.length > 0
                  ? skillGaps
                  : ["No specific skill gaps identified"],
              linkedin: linkedinUrl,
            }
          }
        }
      }

      // 7. Update candidate pool data
      // Extract top skills
      const topSkills = [...candidateSkills.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry) => entry[0])

      // Identify missing skills from job requirements
      const missingCriteria: string[] = []
      if (job.requirements) {
        // Extract potential skill keywords from requirements
        for (const req of job.requirements) {
          const words = req.split(/\s+/)
          for (const word of words) {
            const cleanWord = word.replace(/[^\w]/g, "")
            if (
              cleanWord.length > 3 &&
              !topSkills.some((s) =>
                s.toLowerCase().includes(cleanWord.toLowerCase()),
              ) &&
              !missingCriteria.includes(cleanWord) &&
              missingCriteria.length < 5
            ) {
              missingCriteria.push(cleanWord)
            }
          }
        }
      }

      // Create learning paths based on missing skills
      const learningPaths = missingCriteria.slice(0, 2).map((skill) => ({
        title: `Learn ${skill}`,
        provider: "LinkedIn Learning",
      }))

      // Update candidate pool data
      result.candidatesPool = {
        topSkills,
        missingCriteria,
        learningPaths:
          learningPaths.length > 0
            ? learningPaths
            : [
                {
                  title: "Technical Skills Upgrade",
                  provider: "LinkedIn Learning",
                },
                {
                  title: "Professional Development",
                  provider: "Coursera",
                },
              ],
      }

      // 8. Generate suggested interview questions from job's AI interviewer config if available
      const suggestedQuestions: string[] = []

      // First priority: Use AI interviewer questions from job configuration (limited to 3)
      if (job.aiInterviewerConfig && job.aiInterviewerConfig.questions) {
        // Flag that we're using AI interview questions
        result.hasAiQuestions = true

        // Get the questions from the job config and sort by importance (high, medium, low)
        const importanceOrder = { high: 1, medium: 2, low: 3 }

        const sortedQuestions = [...job.aiInterviewerConfig.questions].sort(
          (a, b) => {
            const orderA =
              importanceOrder[a.importance as "high" | "medium" | "low"] || 4
            const orderB =
              importanceOrder[b.importance as "high" | "medium" | "low"] || 4
            return orderA - orderB
          },
        )

        // Take top 3 questions
        const topQuestions = sortedQuestions.slice(0, 3)

        // Add them to suggested questions
        for (const question of topQuestions) {
          suggestedQuestions.push(question.text)
        }
      }

      // Fallback: If no AI interviewer questions available, use role-based questions
      if (suggestedQuestions.length === 0) {
        // Flag that we're using fallback questions (explicitly set to false)
        result.hasAiQuestions = false

        const roleQuestions = [
          `Describe your experience with ${job.title.toLowerCase()} responsibilities.`,
          `What projects have you worked on that are relevant to this ${job.title} role?`,
          `How do you stay current with trends in the ${job.title.toLowerCase()} field?`,
        ]

        suggestedQuestions.push(...roleQuestions)

        // Add a question for each top required skill if needed to reach 3 questions
        if (
          job.requirements &&
          job.requirements.length > 0 &&
          suggestedQuestions.length < 3
        ) {
          const skillQuestions = job.requirements
            .slice(0, 3 - suggestedQuestions.length)
            .map((req) => {
              // Extract the first sentence if it's a long requirement
              const firstSentence = req.split(".")[0].trim()
              return `Could you elaborate on your experience with ${firstSentence.toLowerCase()}?`
            })

          suggestedQuestions.push(...skillQuestions)
        }
      }

      // Ensure we never show more than 3 questions
      result.suggestedQuestions = suggestedQuestions.slice(0, 3)
    }

    return result
  },
})

// Internal mutation to calculate and update job progress from applications
export const updateJobProgressFromApplications = internalMutation({
  args: { jobId: v.id("jobs") },
  returns: v.union(v.id("jobProgress"), v.null()),
  handler: async (ctx, args) => {
    const { jobId } = args

    // 1. Get the job data
    const job = await ctx.db.get(jobId)
    if (!job) {
      return null
    }

    // 2. Get existing jobProgress or prepare to create a new one
    let jobProgressId: Id<"jobProgress"> | null = null
    let existingJobProgress = await ctx.db
      .query("jobProgress")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .unique()

    // 3. Get job applications for this job
    const applications = await ctx.db
      .query("jobApplications")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect()

    // 4. Calculate summary statistics
    const totalResumes = applications.length
    const meetingMinCriteria = applications.filter(
      (app) => app.matchScore >= 50,
    ).length
    const shortlisted = applications.filter((app) =>
      ["interview", "offer"].includes(app.status),
    ).length
    const rejected = applications.filter(
      (app) => app.status === "rejected",
    ).length

    // 5. Prepare candidate list and aggregate skills
    const candidatesList: Array<{
      id: string
      name: string
      email: string
      matchScore: number
    }> = []
    const candidateSkills = new Map<string, number>()

    for (const app of applications) {
      const candidate = await ctx.db.get(app.candidateId)
      if (candidate) {
        // Add to candidates list
        candidatesList.push({
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          matchScore: app.matchScore,
        })

        // Collect skills for skill analysis
        if (candidate.candidateProfile?.skills) {
          // Extract technical skills
          const technicalSkills =
            candidate.candidateProfile.skills.technical?.skills || []
          for (const skill of technicalSkills) {
            if (!candidateSkills.has(skill.name)) {
              candidateSkills.set(skill.name, 1)
            } else {
              candidateSkills.set(
                skill.name,
                (candidateSkills.get(skill.name) || 0) + 1,
              )
            }
          }
        }
      }
    }

    // 6. Find top candidate
    let topCandidate = {
      name: "",
      position: job.title,
      matchPercentage: 0,
      education: "",
      location: "",
      achievements: [] as string[],
      skills: [] as string[],
      skillGaps: [] as string[],
      linkedin: "",
    }

    if (candidatesList.length > 0) {
      // Sort by match score descending
      const sortedCandidates = [...candidatesList].sort(
        (a, b) => b.matchScore - a.matchScore,
      )
      const topCandidateInfo = sortedCandidates[0]

      // Get detailed data
      const topCandidateData = await ctx.db.get(
        topCandidateInfo.id as Id<"candidates">,
      )
      if (topCandidateData) {
        // Extract education, location, skills from profile
        const profile = topCandidateData.candidateProfile
        let skills: string[] = []
        let achievements: string[] = []

        if (profile) {
          // Extract technical skills
          if (profile.skills?.technical?.skills) {
            skills = profile.skills.technical.skills
              .map((s: { name: string; score: number }) => s.name)
              .slice(0, 5) // Top 5 skills
          }

          // Extract achievements
          if (profile.cv?.highlights) {
            achievements = profile.cv.highlights.slice(0, 2) // Top 2 achievements
          }

          // Determine skill gaps based on job requirements
          const skillGaps: string[] = []
          if (job.requirements) {
            // Extract keywords from requirements
            const requirementKeywords =
              job.requirements
                .join(" ")
                .toLowerCase()
                .match(/\b[a-z]+\b/g) || []

            // Find keywords that might be skills and aren't in candidate skills
            for (const keyword of requirementKeywords) {
              if (
                keyword.length > 3 &&
                !skills.some((s: string) =>
                  s.toLowerCase().includes(keyword),
                ) &&
                !skillGaps.includes(keyword)
              ) {
                skillGaps.push(keyword)
              }
            }
          }

          topCandidate = {
            name: topCandidateData.name,
            position: job.title,
            matchPercentage: topCandidateInfo.matchScore,
            education: profile.career?.experience || "",
            location: profile.personal?.location || "",
            achievements,
            skills,
            skillGaps: skillGaps.slice(0, 3), // Top 3 skill gaps
            linkedin: "",
          }
        }
      }
    }

    // 7. Calculate skill analysis
    // Convert candidateSkills map to sorted array of top skills
    const topSkills = Array.from(candidateSkills.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0])

    // Calculate missing criteria based on job requirements
    const missingCriteria: string[] = []
    if (job.requirements) {
      const requirementKeywords =
        job.requirements
          .join(" ")
          .toLowerCase()
          .match(/\b[a-z]+(?:script)?\b/g) || []

      // Find skills mentioned in requirements but not common in candidates
      for (const keyword of requirementKeywords) {
        if (
          keyword.length > 3 &&
          !topSkills.some((s) => s.toLowerCase().includes(keyword)) &&
          !missingCriteria.includes(keyword)
        ) {
          missingCriteria.push(keyword)
        }
      }
    }

    // 8. Generate suggested interview questions from job's AI interviewer config if available
    const suggestedQuestions: string[] = []

    // First priority: Use AI interviewer questions from job configuration (limited to 3)
    if (job.aiInterviewerConfig && job.aiInterviewerConfig.questions) {
      // Get the questions from the job config and sort by importance (high, medium, low)
      const importanceOrder = { high: 1, medium: 2, low: 3 }

      const sortedQuestions = [...job.aiInterviewerConfig.questions].sort(
        (a, b) => {
          const orderA =
            importanceOrder[a.importance as "high" | "medium" | "low"] || 4
          const orderB =
            importanceOrder[b.importance as "high" | "medium" | "low"] || 4
          return orderA - orderB
        },
      )

      // Take top 3 questions
      const topQuestions = sortedQuestions.slice(0, 3)

      // Add them to suggested questions
      for (const question of topQuestions) {
        suggestedQuestions.push(question.text)
      }
    }

    // Fallback: If no AI interviewer questions available, use role-based questions
    if (suggestedQuestions.length === 0) {
      if (
        job.title.toLowerCase().includes("developer") ||
        job.title.toLowerCase().includes("engineer")
      ) {
        suggestedQuestions.push(
          "Describe your experience with modern development frameworks",
          "How do you approach testing in your projects?",
          "Tell me about a complex technical challenge you solved recently",
        )
      } else if (job.title.toLowerCase().includes("manager")) {
        suggestedQuestions.push(
          "How do you handle team conflicts?",
          "Describe your approach to managing project deadlines",
          "How do you measure team performance?",
        )
      } else if (job.title.toLowerCase().includes("designer")) {
        suggestedQuestions.push(
          "Describe your design process from concept to implementation",
          "How do you incorporate user feedback into your designs?",
          "What design tools do you use in your workflow?",
        )
      } else {
        suggestedQuestions.push(
          "Why are you interested in this role?",
          "How do you handle tight deadlines?",
          "Describe your ideal work environment",
        )
      }
    }

    // Ensure we never show more than 3 questions
    const finalQuestions = suggestedQuestions.slice(0, 3)

    // 9. Create or update the job progress
    if (existingJobProgress) {
      // Update existing record
      await ctx.db.patch(existingJobProgress._id, {
        summary: {
          totalResumes,
          meetingMinCriteria,
          shortlisted,
          rejected,
          biasScore: existingJobProgress.summary.biasScore || 85,
        },
        topCandidate,
        skillAnalysis: {
          totalScreened: totalResumes,
          matchingThreshold:
            existingJobProgress.skillAnalysis.matchingThreshold || 75,
          shortlistedRate:
            totalResumes > 0
              ? Math.round((shortlisted / totalResumes) * 100)
              : 0,
          averageSkillFit:
            existingJobProgress.skillAnalysis.averageSkillFit || 60,
        },
        suggestedQuestions: finalQuestions,
        candidatesPool: {
          topSkills,
          missingCriteria: missingCriteria.slice(0, 3),
          learningPaths: [
            {
              title: missingCriteria[0]
                ? `Learn ${missingCriteria[0]}`
                : "Technical Skills Upgrade",
              provider: "LinkedIn Learning",
            },
            {
              title: missingCriteria[1]
                ? `${missingCriteria[1]} Certification`
                : "Cloud Certification",
              provider: "Coursera",
            },
          ],
        },
        candidates: candidatesList,
      })
      jobProgressId = existingJobProgress._id
    } else {
      // Create new record
      jobProgressId = await ctx.db.insert("jobProgress", {
        jobId,
        title: job.title,
        role: job.title,
        summary: {
          totalResumes,
          meetingMinCriteria,
          shortlisted,
          rejected,
          biasScore: 85, // Default value
        },
        topCandidate,
        skillAnalysis: {
          totalScreened: totalResumes,
          matchingThreshold: 75, // Default threshold
          shortlistedRate:
            totalResumes > 0
              ? Math.round((shortlisted / totalResumes) * 100)
              : 0,
          averageSkillFit: 60, // Default value
        },
        suggestedQuestions: finalQuestions,
        candidatesPool: {
          topSkills,
          missingCriteria: missingCriteria.slice(0, 3),
          learningPaths: [
            {
              title: missingCriteria[0]
                ? `Learn ${missingCriteria[0]}`
                : "Technical Skills Upgrade",
              provider: "LinkedIn Learning",
            },
            {
              title: missingCriteria[1]
                ? `${missingCriteria[1]} Certification`
                : "Cloud Certification",
              provider: "Coursera",
            },
          ],
        },
        candidates: candidatesList,
      })
    }

    return jobProgressId
  },
})
