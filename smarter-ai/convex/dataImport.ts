import { mutation } from "./_generated/server"
import { v } from "convex/values"

// Import jobs data from existing JSON
export const importJobs = mutation({
  args: {
    jobs: v.array(
      v.object({
        id: v.string(),
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
      }),
    ),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let importedCount = 0

    for (const job of args.jobs) {
      await ctx.db.insert("jobs", {
        title: job.title,
        company: job.company,
        companyLogo: job.companyLogo,
        type: job.type,
        featured: job.featured,
        description: job.description,
        requirements: job.requirements,
        desirables: job.desirables,
        benefits: job.benefits,
        salary: job.salary,
        location: job.location,
        posted: job.posted,
        expiry: job.expiry,
        level: job.level,
        experience: job.experience,
        education: job.education,
      })

      importedCount++
    }

    return importedCount
  },
})

// Import candidates data from existing JSON
export const importCandidates = mutation({
  args: {
    candidates: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        initials: v.string(),
        email: v.string(),
        textColor: v.string(),
        bgColor: v.string(),
        profile: v.optional(
          v.object({
            summary: v.string(),
            portfolio: v.string(),
            aiScore: v.number(),
            documents: v.array(
              v.object({
                name: v.string(),
                link: v.string(),
              }),
            ),
            insights: v.string(),
            timestamps: v.array(
              v.object({
                label: v.string(),
                date: v.string(),
              }),
            ),
          }),
        ),
        aiScore: v.optional(v.number()),
        status: v.optional(v.string()),
        appliedDate: v.optional(v.string()),
        position: v.optional(v.string()),
        recruiter: v.optional(v.string()),
        progress: v.optional(v.number()),
        lastActivity: v.optional(v.string()),
      }),
    ),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let importedCount = 0

    for (const candidate of args.candidates) {
      // Skip if candidate with this email already exists
      const existing = await ctx.db
        .query("candidates")
        .withIndex("by_email", (q) => q.eq("email", candidate.email))
        .first()

      if (existing) {
        continue
      }

      await ctx.db.insert("candidates", {
        name: candidate.name,
        initials: candidate.initials,
        email: candidate.email,
        textColor: candidate.textColor,
        bgColor: candidate.bgColor,
        profile: candidate.profile,
        aiScore: candidate.aiScore,
        status: candidate.status,
        appliedDate: candidate.appliedDate,
        position: candidate.position,
        recruiter: candidate.recruiter,
        progress: candidate.progress,
        lastActivity: candidate.lastActivity,
      })

      importedCount++
    }

    return importedCount
  },
})

// Import job progress data from existing JSON
export const importJobProgress = mutation({
  args: {
    jobsProgress: v.array(
      v.object({
        jobId: v.string(),
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
    ),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let importedCount = 0

    for (const progress of args.jobsProgress) {
      // Find the job in the database by title
      const job = await ctx.db
        .query("jobs")
        .filter((q) => q.eq(q.field("title"), progress.title))
        .first()

      if (!job) {
        continue // Skip if job not found
      }

      // Check if job progress already exists
      const existingProgress = await ctx.db
        .query("jobProgress")
        .withIndex("by_job", (q) => q.eq("jobId", job._id))
        .first()

      if (existingProgress) {
        continue // Skip if progress already exists
      }

      // Create the job progress entry
      await ctx.db.insert("jobProgress", {
        jobId: job._id,
        title: progress.title,
        role: progress.role,
        summary: progress.summary,
        topCandidate: progress.topCandidate,
        skillAnalysis: progress.skillAnalysis,
        suggestedQuestions: progress.suggestedQuestions,
        candidatesPool: progress.candidatesPool,
        candidates: progress.candidates,
      })

      // Create applications for each candidate
      for (const candidateInfo of progress.candidates) {
        // Find candidate by email
        const candidate = await ctx.db
          .query("candidates")
          .withIndex("by_email", (q) => q.eq("email", candidateInfo.email))
          .first()

        if (candidate) {
          // Check if application already exists
          const existingApplication = await ctx.db
            .query("jobApplications")
            .filter((q) =>
              q.and(
                q.eq(q.field("jobId"), job._id),
                q.eq(q.field("candidateId"), candidate._id),
              ),
            )
            .first()

          if (!existingApplication) {
            // Create application
            await ctx.db.insert("jobApplications", {
              jobId: job._id,
              candidateId: candidate._id,
              status: candidate.status || "applied",
              appliedDate:
                candidate.appliedDate ||
                new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }),
              progress: candidate.progress || 20,
              matchScore: candidateInfo.matchScore,
            })
          }
        }
      }

      importedCount++
    }

    return importedCount
  },
})

// Link candidates to jobs based on candidatesByJob mapping
export const linkCandidatesToJobs = mutation({
  args: {
    candidatesByJob: v.record(v.string(), v.array(v.string())),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let createdLinks = 0

    for (const [jobId, candidateIds] of Object.entries(args.candidatesByJob)) {
      // Find job by legacy ID (stored in title or as separate field)
      const job = await ctx.db
        .query("jobs")
        .filter((q) => q.eq(q.field("title"), `Job ${jobId}`))
        .first()

      if (!job) {
        continue
      }

      for (const candidateId of candidateIds) {
        // Find candidate
        const candidate = await ctx.db
          .query("candidates")
          .filter((q) => q.eq(q.field("name"), `Candidate ${candidateId}`))
          .first()

        if (!candidate) {
          continue
        }

        // Check if application already exists
        const existingApplication = await ctx.db
          .query("jobApplications")
          .filter((q) =>
            q.and(
              q.eq(q.field("jobId"), job._id),
              q.eq(q.field("candidateId"), candidate._id),
            ),
          )
          .first()

        if (!existingApplication) {
          // Create application with random match score
          const matchScore = Math.floor(Math.random() * 30) + 70 // 70-100

          await ctx.db.insert("jobApplications", {
            jobId: job._id,
            candidateId: candidate._id,
            status: "applied",
            appliedDate: new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            progress: 20,
            matchScore,
          })

          createdLinks++
        }
      }
    }

    return createdLinks
  },
})

// Add a function to populate all candidate profiles
export const populateCandidateProfiles = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // Get all candidates
    const candidates = await ctx.db.query("candidates").collect()

    let count = 0

    // For each candidate, generate a default profile if it doesn't have one
    for (const candidate of candidates) {
      if (!candidate.candidateProfile) {
        await ctx.db.patch(candidate._id, {
          candidateProfile: {
            personal: {
              age: "28",
              nationality: "Not specified",
              location: candidate.position
                ? `${candidate.position} location`
                : "Not specified",
              dependents: "None",
              visa_status: "Not specified",
            },
            career: {
              experience: "5+ years",
              past_roles: candidate.position
                ? `Junior ${candidate.position}`
                : "Various roles",
              progression: "Steady growth",
            },
            interview: {
              duration: "45 minutes",
              work_eligibility: "Yes",
              id_check: "Verified",
            },
            skills: {
              technical: {
                overallScore: candidate.aiScore
                  ? Math.round(candidate.aiScore * 0.8)
                  : 75,
                skills: [
                  { name: "Programming", score: 80 },
                  { name: "Problem Solving", score: 85 },
                  { name: "Technical Knowledge", score: 75 },
                ],
              },
              soft: {
                overallScore: candidate.aiScore
                  ? Math.round(candidate.aiScore * 0.9)
                  : 80,
                skills: [
                  { name: "Communication", score: 80 },
                  { name: "Teamwork", score: 85 },
                  { name: "Leadership", score: 75 },
                ],
              },
              culture: {
                overallScore: candidate.aiScore
                  ? Math.round(candidate.aiScore * 0.85)
                  : 78,
                skills: [
                  { name: "Values Alignment", score: 75 },
                  { name: "Adaptability", score: 80 },
                  { name: "Growth Mindset", score: 85 },
                ],
              },
            },
            cv: {
              highlights: [
                `${candidate.position ? candidate.position : "Professional"} with proven track record`,
                "Strong technical background",
                "Excellent problem-solving abilities",
                "Team player with collaborative approach",
              ],
              keyInsights: [
                "Technical expertise aligns with requirements",
                "Good cultural fit potential",
                "Demonstrates continuous learning",
                "Strong communication skills",
              ],
              score: candidate.aiScore || 75,
            },
            skillInsights: {
              matchedSkills: [
                "Communication",
                "Problem Solving",
                "Technical Knowledge",
                "Teamwork",
              ],
              missingSkills: [
                "Leadership",
                "Project Management",
                "Advanced Technical Skills",
              ],
              skillGaps: [
                { name: "Leadership", percentage: 60 },
                { name: "Project Management", percentage: 45 },
              ],
              learningPaths: [
                {
                  title: "Advanced Leadership",
                  provider: "LinkedIn Learning (8 weeks)",
                },
                {
                  title: "Project Management Fundamentals",
                  provider: "Coursera (6 weeks)",
                },
              ],
            },
            recommendation:
              candidate.aiScore && candidate.aiScore > 85
                ? "Strongly Recommend"
                : candidate.aiScore && candidate.aiScore > 70
                  ? "Recommend"
                  : "Consider",
          },
        })
        count++
      }
    }

    return count
  },
})
