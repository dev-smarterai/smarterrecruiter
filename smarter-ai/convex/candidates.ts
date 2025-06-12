import { query, mutation, internalQuery } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"

// Helper function to validate and normalize candidateProfile data
function ensureValidCandidateProfile(candidate: any) {
  if (!candidate) return candidate

  // Clone to avoid modifying the original
  const normalizedCandidate = { ...candidate }

  // If candidateProfile exists, ensure all required fields have valid values
  if (normalizedCandidate.candidateProfile) {
    // Ensure cv exists and has a score
    if (normalizedCandidate.candidateProfile.cv) {
      if (typeof normalizedCandidate.candidateProfile.cv.score !== "number") {
        normalizedCandidate.candidateProfile.cv.score =
          normalizedCandidate.aiScore || 0
      }
    } else {
      // Create cv if missing
      normalizedCandidate.candidateProfile.cv = {
        highlights: [],
        keyInsights: [],
        score: normalizedCandidate.aiScore || 0,
      }
    }
  }

  return normalizedCandidate
}

// Get all candidates
export const getCandidates = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("candidates"),
      _creationTime: v.number(),
      name: v.string(),
      initials: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      textColor: v.string(),
      bgColor: v.string(),
      userId: v.optional(v.id("users")),
      cvFileId: v.optional(v.id("files")),
      meetingCode: v.optional(v.string()),
      coverLetter: v.optional(v.string()),
      bugs: v.optional(
        v.array(
          v.object({
            description: v.string(),
            timestamp: v.string(),
            status: v.string(),
            resolution: v.optional(v.string()),
            resolvedAt: v.optional(v.string()),
          }),
        ),
      ),
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
      candidateProfile: v.optional(
        v.object({
          personal: v.object({
            age: v.optional(v.string()),
            nationality: v.optional(v.string()),
            location: v.optional(v.string()),
            dependents: v.optional(v.string()),
            visa_status: v.optional(v.string()),
          }),
          career: v.object({
            experience: v.optional(v.string()),
            past_roles: v.optional(v.string()),
            progression: v.optional(v.string()),
          }),
          interview: v.object({
            duration: v.optional(v.string()),
            work_eligibility: v.optional(v.string()),
            id_check: v.optional(v.string()),
            highlights: v.optional(
              v.array(
                v.object({
                  title: v.string(),
                  content: v.string(),
                  timestamp: v.string(),
                  mediaUrl: v.optional(v.string()),
                }),
              ),
            ),
            overallFeedback: v.optional(
              v.array(
                v.object({
                  text: v.string(),
                  praise: v.boolean(), // true for positive feedback, false for improvement needed
                }),
              ),
            ),
          }),
          skills: v.object({
            technical: v.object({
              overallScore: v.number(),
              skills: v.array(
                v.object({
                  name: v.string(),
                  score: v.number(),
                }),
              ),
            }),
            soft: v.object({
              overallScore: v.number(),
              skills: v.array(
                v.object({
                  name: v.string(),
                  score: v.number(),
                }),
              ),
            }),
            culture: v.object({
              overallScore: v.number(),
              skills: v.array(
                v.object({
                  name: v.string(),
                  score: v.number(),
                }),
              ),
            }),
          }),
          cv: v.object({
            highlights: v.array(v.string()),
            keyInsights: v.array(v.string()),
            score: v.optional(v.number()),
          }),
          skillInsights: v.object({
            matchedSkills: v.array(v.string()),
            missingSkills: v.array(v.string()),
            skillGaps: v.array(
              v.object({
                name: v.string(),
                percentage: v.number(),
              }),
            ),
            learningPaths: v.array(
              v.object({
                title: v.string(),
                provider: v.string(),
              }),
            ),
          }),
          recommendation: v.string(),
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
  handler: async (ctx) => {
    const candidates = await ctx.db.query("candidates").collect()
    return candidates.map(ensureValidCandidateProfile)
  },
})

// Get candidates by userId
export const getCandidatesByUserId = query({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("candidates"),
      _creationTime: v.number(),
      name: v.string(),
      initials: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      textColor: v.string(),
      bgColor: v.string(),
      userId: v.optional(v.id("users")),
      meetingCode: v.optional(v.string()),
      status: v.optional(v.string()),
      position: v.optional(v.string()),
      appliedDate: v.optional(v.string()),
      aiScore: v.optional(v.number()),
      bugs: v.optional(
        v.array(
          v.object({
            description: v.string(),
            timestamp: v.string(),
            status: v.string(),
            resolution: v.optional(v.string()),
            resolvedAt: v.optional(v.string()),
          }),
        ),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()

    return candidates.map((c) => ({
      _id: c._id,
      _creationTime: c._creationTime,
      name: c.name,
      initials: c.initials,
      email: c.email,
      phone: c.phone,
      textColor: c.textColor,
      bgColor: c.bgColor,
      userId: c.userId,
      meetingCode: c.meetingCode,
      status: c.status,
      position: c.position,
      appliedDate: c.appliedDate,
      aiScore: c.aiScore,
      bugs: c.bugs,
    }))
  },
})

// Get a single candidate by ID
export const getCandidate = query({
  args: { id: v.id("candidates") },
  returns: v.union(
    v.object({
      _id: v.id("candidates"),
      _creationTime: v.number(),
      name: v.string(),
      initials: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      textColor: v.string(),
      bgColor: v.string(),
      userId: v.optional(v.id("users")),
      cvFileId: v.optional(v.id("files")),
      meetingCode: v.optional(v.string()),
      coverLetter: v.optional(v.string()),
      bugs: v.optional(
        v.array(
          v.object({
            description: v.string(),
            timestamp: v.string(),
            status: v.string(),
            resolution: v.optional(v.string()),
            resolvedAt: v.optional(v.string()),
          }),
        ),
      ),
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
      candidateProfile: v.optional(
        v.object({
          personal: v.object({
            age: v.optional(v.string()),
            nationality: v.optional(v.string()),
            location: v.optional(v.string()),
            dependents: v.optional(v.string()),
            visa_status: v.optional(v.string()),
          }),
          career: v.object({
            experience: v.optional(v.string()),
            past_roles: v.optional(v.string()),
            progression: v.optional(v.string()),
          }),
          interview: v.object({
            duration: v.optional(v.string()),
            work_eligibility: v.optional(v.string()),
            id_check: v.optional(v.string()),
            highlights: v.optional(
              v.array(
                v.object({
                  title: v.string(),
                  content: v.string(),
                  timestamp: v.string(),
                  mediaUrl: v.optional(v.string()),
                }),
              ),
            ),
            overallFeedback: v.optional(
              v.array(
                v.object({
                  text: v.string(),
                  praise: v.boolean(),
                }),
              ),
            ),
          }),
          skills: v.object({
            technical: v.object({
              overallScore: v.number(),
              skills: v.array(
                v.object({
                  name: v.string(),
                  score: v.number(),
                }),
              ),
            }),
            soft: v.object({
              overallScore: v.number(),
              skills: v.array(
                v.object({
                  name: v.string(),
                  score: v.number(),
                }),
              ),
            }),
            culture: v.object({
              overallScore: v.number(),
              skills: v.array(
                v.object({
                  name: v.string(),
                  score: v.number(),
                }),
              ),
            }),
          }),
          cv: v.object({
            highlights: v.array(v.string()),
            keyInsights: v.array(v.string()),
            score: v.optional(v.number()),
          }),
          skillInsights: v.object({
            matchedSkills: v.array(v.string()),
            missingSkills: v.array(v.string()),
            skillGaps: v.array(
              v.object({
                name: v.string(),
                percentage: v.number(),
              }),
            ),
            learningPaths: v.array(
              v.object({
                title: v.string(),
                provider: v.string(),
              }),
            ),
          }),
          recommendation: v.string(),
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
    v.null(),
  ),
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.id)
    return ensureValidCandidateProfile(candidate)
  },
})

// Get candidates by job ID
export const getCandidatesByJob = query({
  args: { jobId: v.id("jobs") },
  returns: v.array(
    v.object({
      _id: v.id("candidates"),
      _creationTime: v.number(),
      name: v.string(),
      initials: v.string(),
      email: v.string(),
      textColor: v.string(),
      bgColor: v.string(),
      status: v.string(),
      matchScore: v.number(),
      appliedDate: v.string(),
      meetingCode: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all applications for this job
    const applications = await ctx.db
      .query("jobApplications")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect()

    // Fetch each candidate
    const candidates = []
    for (const app of applications) {
      const candidate = await ctx.db.get(app.candidateId)
      if (candidate) {
        candidates.push({
          _id: candidate._id,
          _creationTime: candidate._creationTime,
          name: candidate.name,
          initials: candidate.initials,
          email: candidate.email,
          textColor: candidate.textColor,
          bgColor: candidate.bgColor,
          status: app.status,
          matchScore: app.matchScore,
          appliedDate: app.appliedDate,
          meetingCode: candidate.meetingCode || app.meetingCode,
        })
      }
    }

    return candidates
  },
})

// Create a new candidate
export const createCandidate = mutation({
  args: {
    name: v.string(),
    initials: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    textColor: v.string(),
    bgColor: v.string(),
    userId: v.optional(v.id("users")),
    meetingCode: v.optional(v.string()),
    coverLetter: v.optional(v.string()),
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
    candidateProfile: v.optional(
      v.object({
        personal: v.object({
          age: v.optional(v.string()),
          nationality: v.optional(v.string()),
          location: v.optional(v.string()),
          dependents: v.optional(v.string()),
          visa_status: v.optional(v.string()),
        }),
        career: v.object({
          experience: v.optional(v.string()),
          past_roles: v.optional(v.string()),
          progression: v.optional(v.string()),
        }),
        interview: v.object({
          duration: v.optional(v.string()),
          work_eligibility: v.optional(v.string()),
          id_check: v.optional(v.string()),
          highlights: v.optional(
            v.array(
              v.object({
                title: v.string(),
                content: v.string(),
                timestamp: v.string(),
                mediaUrl: v.optional(v.string()),
              }),
            ),
          ),
          overallFeedback: v.optional(
            v.array(
              v.object({
                text: v.string(),
                praise: v.boolean(), // true for positive feedback, false for improvement needed
              }),
            ),
          ),
        }),
        skills: v.object({
          technical: v.object({
            overallScore: v.number(),
            skills: v.array(
              v.object({
                name: v.string(),
                score: v.number(),
              }),
            ),
          }),
          soft: v.object({
            overallScore: v.number(),
            skills: v.array(
              v.object({
                name: v.string(),
                score: v.number(),
              }),
            ),
          }),
          culture: v.object({
            overallScore: v.number(),
            skills: v.array(
              v.object({
                name: v.string(),
                score: v.number(),
              }),
            ),
          }),
        }),
        cv: v.object({
          highlights: v.array(v.string()),
          keyInsights: v.array(v.string()),
          score: v.number(),
        }),
        skillInsights: v.object({
          matchedSkills: v.array(v.string()),
          missingSkills: v.array(v.string()),
          skillGaps: v.array(
            v.object({
              name: v.string(),
              percentage: v.number(),
            }),
          ),
          learningPaths: v.array(
            v.object({
              title: v.string(),
              provider: v.string(),
            }),
          ),
        }),
        recommendation: v.string(),
      }),
    ),
    aiScore: v.optional(v.number()),
    status: v.optional(v.string()),
    appliedDate: v.optional(v.string()),
    position: v.optional(v.string()),
    recruiter: v.optional(v.string()),
    progress: v.optional(v.number()),
    lastActivity: v.optional(v.string()),
  },
  returns: v.id("candidates"),
  handler: async (ctx, args) => {
    // Create the candidate first
    const candidateId = await ctx.db.insert("candidates", args)

    // Schedule the vector DB update as a background job
    await ctx.scheduler.runAfter(
      0,
      internal.populateVectorDb.populateSingleCandidateData,
      {
        candidateId,
      },
    )

    return candidateId
  },
})

// Update an existing candidate
export const updateCandidate = mutation({
  args: {
    id: v.id("candidates"),
    name: v.optional(v.string()),
    initials: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    textColor: v.optional(v.string()),
    bgColor: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    meetingCode: v.optional(v.string()),
    coverLetter: v.optional(v.string()),
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
  },
  returns: v.id("candidates"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // If email is being updated, check for uniqueness
    if (updates.email !== undefined) {
      const existingCandidates = await ctx.db
        .query("candidates")
        .withIndex("by_email", (q) => q.eq("email", updates.email as string))
        .collect()

      // Check if email is already used by another candidate
      const isEmailTaken = existingCandidates.some(
        (c) => c._id !== id && c.email === updates.email,
      )

      if (isEmailTaken) {
        throw new Error(
          `Email ${updates.email} is already taken by another candidate.`,
        )
      }
    }

    // Update the candidate
    await ctx.db.patch(id, updates)

    // Schedule the vector DB update as a background job
    await ctx.scheduler.runAfter(
      0,
      internal.populateVectorDb.populateSingleCandidateData,
      {
        candidateId: id,
      },
    )

    return id
  },
})

// Update or set a meeting code for a candidate
export const updateMeetingCode = mutation({
  args: {
    id: v.id("candidates"),
    meetingCode: v.string(),
  },
  returns: v.id("candidates"),
  handler: async (ctx, args) => {
    const { id, meetingCode } = args

    // Check if the candidate exists
    const candidate = await ctx.db.get(id)
    if (!candidate) {
      throw new Error(`Candidate with ID ${id} not found`)
    }

    // Update the meeting code
    await ctx.db.patch(id, { meetingCode })

    return id
  },
})

// Get candidate by meeting code
export const getCandidateByMeetingCode = query({
  args: { meetingCode: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("candidates"),
      name: v.string(),
      email: v.string(),
      position: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("candidates")
      .filter((q) => q.eq(q.field("meetingCode"), args.meetingCode))
      .collect()

    if (candidates.length === 0) {
      return null
    }

    const candidate = candidates[0]
    return {
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      position: candidate.position,
    }
  },
})

// Get candidate by user ID and meeting code
export const getCandidateByUserAndMeetingCode = query({
  args: {
    userId: v.id("users"),
    meetingCode: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("candidates"),
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      position: v.optional(v.string()),
      coverLetter: v.optional(v.string()),
      meetingCode: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("meetingCode"), args.meetingCode))
      .collect()

    if (candidates.length === 0) {
      return null
    }

    const candidate = candidates[0]
    return {
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.position,
      coverLetter: candidate.coverLetter,
      meetingCode: candidate.meetingCode,
    }
  },
})

// Delete a candidate
export const deleteCandidate = mutation({
  args: { id: v.id("candidates") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete the candidate
    await ctx.db.delete(args.id)

    // Delete associated job applications
    const applications = await ctx.db
      .query("jobApplications")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.id))
      .collect()

    for (const app of applications) {
      await ctx.db.delete(app._id)
    }

    // Remove entries from vector database
    await ctx.scheduler.runAfter(
      0,
      internal.populateVectorDb.removeVectorDbEntries,
      {
        tableName: "candidates",
        documentId: args.id,
      },
    )

    return null
  },
})

// Bulk delete candidates
export const bulkDeleteCandidates = mutation({
  args: {
    ids: v.array(v.id("candidates")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    deletedCount: v.number(),
    failedIds: v.array(v.id("candidates")),
  }),
  handler: async (ctx, args) => {
    const { ids } = args
    const failedIds: Id<"candidates">[] = []
    let deletedCount = 0

    for (const candidateId of ids) {
      try {
        // Delete the candidate
        await ctx.db.delete(candidateId)

        // Delete associated job applications
        const applications = await ctx.db
          .query("jobApplications")
          .withIndex("by_candidate", (q) => q.eq("candidateId", candidateId))
          .collect()

        for (const app of applications) {
          await ctx.db.delete(app._id)
        }

        // Remove entries from vector database
        await ctx.scheduler.runAfter(
          0,
          internal.populateVectorDb.removeVectorDbEntries,
          {
            tableName: "candidates",
            documentId: candidateId,
          },
        )

        deletedCount++
      } catch (error) {
        console.error(`Error deleting candidate ${candidateId}:`, error)
        failedIds.push(candidateId)
      }
    }

    if (failedIds.length === 0) {
      return {
        success: true,
        message: `Successfully deleted ${deletedCount} candidate${deletedCount !== 1 ? "s" : ""}`,
        deletedCount,
        failedIds,
      }
    } else {
      return {
        success: deletedCount > 0,
        message: `Deleted ${deletedCount} candidate${deletedCount !== 1 ? "s" : ""}, but failed to delete ${failedIds.length} candidate${failedIds.length !== 1 ? "s" : ""}`,
        deletedCount,
        failedIds,
      }
    }
  },
})

// Add a mutation to update candidateProfile
export const updateCandidateProfile = mutation({
  args: {
    id: v.id("candidates"),
    profile: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      candidateProfile: args.profile,
      lastActivity: new Date().toISOString(),
    })
  },
})

// Add a mutation to add or update a specific section of candidateProfile
export const updateCandidateProfileSection = mutation({
  args: {
    id: v.id("candidates"),
    section: v.string(), // e.g., "personal", "career", "skills", etc.
    data: v.any(), // The new data for the section
  },
  returns: v.id("candidates"),
  handler: async (ctx, args) => {
    const { id, section, data } = args

    // Get the existing candidate
    const candidate = await ctx.db.get(id)
    if (!candidate) {
      throw new Error(`Candidate with ID ${id} not found`)
    }

    // Get current profile or initialize an empty one with required structure
    const currentProfile = candidate.candidateProfile || {
      personal: {
        age: "",
        nationality: "",
        location: "",
        dependents: "",
        visa_status: "",
      },
      career: {
        experience: "",
        past_roles: "",
        progression: "",
      },
      interview: {
        duration: "",
        work_eligibility: "",
        id_check: "",
        highlights: [],
        overallFeedback: [],
      },
      skills: {
        technical: {
          overallScore: 0,
          skills: [],
        },
        soft: {
          overallScore: 0,
          skills: [],
        },
        culture: {
          overallScore: 0,
          skills: [],
        },
      },
      cv: {
        highlights: [],
        keyInsights: [],
        score: 0,
      },
      skillInsights: {
        matchedSkills: [],
        missingSkills: [],
        skillGaps: [],
        learningPaths: [],
      },
      recommendation: "Consider",
    }

    // Update the specific section
    const updatedProfile = {
      ...currentProfile,
      [section]: data,
    }

    // Patch the candidateProfile
    await ctx.db.patch(id, { candidateProfile: updatedProfile })

    return id
  },
})

// Utility query to generate a default candidateProfile for existing candidates
export const generateDefaultCandidateProfile = mutation({
  args: {
    id: v.id("candidates"),
  },
  returns: v.id("candidates"),
  handler: async (ctx, args) => {
    const { id } = args

    // Get the candidate
    const candidate = await ctx.db.get(id)
    if (!candidate) {
      throw new Error(`Candidate with ID ${id} not found`)
    }

    // Skip if already has a profile
    if (candidate.candidateProfile) {
      return id
    }

    // Generate default profile based on existing data
    const defaultProfile = {
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
        highlights: [
          {
            title: "Key moment #1: Communication Skills",
            content:
              "Excellent communication skills demonstrated during the technical discussion",
            timestamp: "00:12:35",
            mediaUrl: "",
          },
          {
            title: "Key moment #2: Problem Solving",
            content:
              "Demonstrated strong problem-solving ability by breaking down complex issues",
            timestamp: "00:25:40",
            mediaUrl: "",
          },
          {
            title: "Key moment #3: Technical Knowledge",
            content:
              "Showed proficiency in required technical areas with detailed explanations",
            timestamp: "00:37:15",
            mediaUrl: "",
          },
          {
            title: "Key moment #4: Job Understanding",
            content:
              "Clear understanding of job requirements and company goals",
            timestamp: "00:42:10",
            mediaUrl: "",
          },
        ],
        overallFeedback: [
          {
            text: "Candidate performed well in the interview and showed good technical understanding and communication skills.",
            praise: true,
          },
          {
            text: "Candidate showed good problem-solving abilities and adaptability.",
            praise: true,
          },
          {
            text: "Candidate needs to improve their communication skills and project management abilities.",
            praise: false,
          },
        ],
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
    }

    // Update the candidate with the default profile
    await ctx.db.patch(id, { candidateProfile: defaultProfile })

    return id
  },
})

// Get candidate experience and skills by candidate ID
export const getCandidateExperienceAndSkills = query({
  args: {
    candidateId: v.id("candidates"),
  },
  returns: v.object({
    experience: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
  }),
  handler: async (ctx, args) => {
    // Get the candidate
    const candidate = await ctx.db.get(args.candidateId)
    if (!candidate) {
      return { experience: undefined, skills: undefined }
    }

    // Get experience from candidateProfile if available
    let experience
    if (candidate.candidateProfile?.career?.experience) {
      experience = candidate.candidateProfile.career.experience
    }

    // Get skills from candidateProfile
    let skills: string[] = []

    // Extract technical skills
    if (candidate.candidateProfile?.skills?.technical?.skills) {
      const technicalSkills =
        candidate.candidateProfile.skills.technical.skills.map(
          (skill: any) => skill.name,
        )
      skills = [...skills, ...technicalSkills]
    }

    // Check if there are any skills in the skillInsights.matchedSkills
    if (candidate.candidateProfile?.skillInsights?.matchedSkills) {
      skills = [
        ...skills,
        ...candidate.candidateProfile.skillInsights.matchedSkills,
      ]
    }

    // Deduplicate skills
    skills = Array.from(new Set(skills))

    return {
      experience,
      skills: skills.length > 0 ? skills : undefined,
    }
  },
})

// Add a getById internal helper for candidate lookup
export const getById = internalQuery({
  args: {
    id: v.id("candidates"),
  },
  returns: v.union(
    v.object({
      _id: v.id("candidates"),
      name: v.string(),
      email: v.string(),
      // Add all other required fields
      initials: v.string(),
      textColor: v.string(),
      bgColor: v.string(),
      userId: v.optional(v.id("users")),
      position: v.optional(v.string()),
      aiScore: v.optional(v.number()),
      candidateProfile: v.optional(v.any()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// Get candidates by name (exact match or partial match)
export const getCandidatesByName = query({
  args: { name: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("candidates"),
      name: v.string(),
      email: v.string(),
      initials: v.string(),
      position: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const nameToSearch = args.name.toLowerCase().trim()

    // Get all candidates (we'll filter in memory since there's no index on name)
    const candidates = await ctx.db.query("candidates").collect()

    // Filter candidates whose names contain the search term
    const matchingCandidates = candidates.filter((candidate) =>
      candidate.name.toLowerCase().includes(nameToSearch),
    )

    // Return simplified candidate objects with just the needed fields
    return matchingCandidates.map((candidate) => ({
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      initials: candidate.initials,
      position: candidate.position,
    }))
  },
})

// Get candidate by analysis ID
export const getCandidateByAnalysisId = query({
  args: { analysisId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("candidates"),
      name: v.string(),
      email: v.string(),
      initials: v.string(),
      textColor: v.string(),
      bgColor: v.string(),
      userId: v.optional(v.id("users")),
      position: v.optional(v.string()),
      aiScore: v.optional(v.number()),
      candidateProfile: v.optional(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    // First try to find the file with this analysisId
    const files = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("analysisId"), args.analysisId))
      .collect()

    if (files.length === 0) {
      return []
    }

    // Get the candidate ID from the file
    const file = files[0]
    if (!file.candidateId) {
      return []
    }

    // Get the candidate
    const candidate = await ctx.db.get(file.candidateId)
    if (!candidate) {
      return []
    }

    // Return the candidate with the required fields
    return [
      {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        initials: candidate.initials,
        textColor: candidate.textColor,
        bgColor: candidate.bgColor,
        userId: candidate.userId,
        position: candidate.position,
        aiScore: candidate.aiScore,
        candidateProfile: candidate.candidateProfile,
      },
    ]
  },
})

// Update candidate with AI score and CV file ID
export const update = mutation({
  args: {
    id: v.id("candidates"),
    aiScore: v.optional(v.number()),
    cvFileId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const updateData: { aiScore?: number; cvFileId?: Id<"files"> } = {}
    if (args.aiScore !== undefined) {
      updateData.aiScore = args.aiScore
    }
    if (args.cvFileId !== undefined) {
      updateData.cvFileId = args.cvFileId
    }
    await ctx.db.patch(args.id, updateData)
    return true
  },
})
