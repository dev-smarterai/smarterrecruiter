import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Users table for authentication and roles
  users: defineTable({
    // Auth fields
    tokenIdentifier: v.string(),

    // User information
    name: v.optional(v.string()),
    email: v.string(),

    // Password hash (for password-based auth)
    passwordHash: v.optional(v.string()),

    // Session management
    sessionToken: v.optional(v.string()),

    // Role management
    role: v.string(), // "admin" or "user"
    completedOnboarding: v.boolean(),

    // Optional avatar/image
    avatar: v.optional(v.string()),

    // Last access or modification time
    lastLogin: v.optional(v.string()),
    lastActivity: v.optional(v.string()),

    // Any additional user metadata
    metadata: v.optional(
      v.object({
        preferredTheme: v.optional(v.string()),
        notifications: v.optional(v.boolean()),
      }),
    ),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_session", ["sessionToken"]),

  // Knowledge Base table for company information to be used in AI interviews
  knowledgeBase: defineTable({
    name: v.string(), // Name of the knowledge base
    content: v.string(), // The actual content/information
    lastUpdated: v.string(), // ISO date string when last updated
    isDefault: v.boolean(), // Whether this is the default knowledge base
  }).index("by_default", ["isDefault"]),

  // AI Configurations table
  aiConfigurations: defineTable({
    name: v.string(),
    interfaceType: v.string(), // "realtime-interview", "chat", etc.
    prompt: v.string(),
    options: v.object({
      voice: v.optional(v.string()), // Voice ID for speech synthesis
      temperature: v.number(),
      // Add any other configuration options here
    }),
    isDefault: v.boolean(), // Whether this is the default configuration for the interface type
    createdAt: v.string(), // ISO date string
    updatedAt: v.optional(v.string()), // ISO date string for last update time
  })
    .index("by_name", ["name"])
    .index("by_default", ["interfaceType", "isDefault"]),

  // Companies table
  companies: defineTable({
    name: v.string(),
    logo: v.string(),
  }),

  // Talent Pool Tags table
  talentPoolTags: defineTable({
    name: v.string(), // Tag name (e.g., "Top Performer", "Tech Expert")
    color: v.string(), // CSS color class (e.g., "bg-indigo-100 text-indigo-700")
    count: v.number(), // Number of candidates with this tag
    description: v.optional(v.string()), // Optional description of the tag
    createdBy: v.optional(v.id("users")), // User who created the tag
    createdAt: v.string(), // ISO date string
    updatedAt: v.optional(v.string()), // ISO date string
    isActive: v.optional(v.boolean()), // Whether the tag is active/visible
  })
    .index("by_name", ["name"])
    .index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"]),

  // Candidate Tags - junction table for many-to-many relationship
  candidateTags: defineTable({
    candidateId: v.id("candidates"),
    tagId: v.id("talentPoolTags"),
    assignedBy: v.optional(v.id("users")), // User who assigned the tag
    assignedAt: v.string(), // ISO date string when tag was assigned
  })
    .index("by_candidate", ["candidateId"])
    .index("by_tag", ["tagId"])
    .index("by_candidate_and_tag", ["candidateId", "tagId"]),

  // Job Templates table
  jobTemplates: defineTable({
    name: v.string(), // Template name (e.g., "Software Engineer Template", "Sales Consultant Template")
    description: v.optional(v.string()), // Brief description of the template
    category: v.optional(v.string()), // Category like "Engineering", "Sales", "Marketing", etc.
    
    // Template data structure (similar to jobs but as a template)
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
      salaryRange: v.optional(v.string()), // e.g., "80k-100k"
      jobLevel: v.optional(v.string()), // "entry", "mid", "senior", etc.
      location: v.optional(v.string()),
      skills: v.array(v.string()),
      benefits: v.optional(v.string()),
      experienceLevel: v.optional(v.string()), // "0-1 years", "1-3 years", etc.
    }),
    
    // Metadata
    isDefault: v.optional(v.boolean()), // Whether this is a default template
    isPublic: v.optional(v.boolean()), // Whether this template can be shared
    createdBy: v.optional(v.id("users")), // User who created the template
    createdAt: v.string(), // ISO date string
    updatedAt: v.optional(v.string()), // ISO date string
    usageCount: v.optional(v.number()), // How many times this template has been used
  })
    .index("by_category", ["category"])
    .index("by_created_by", ["createdBy"])
    .index("by_default", ["isDefault"])
    .index("by_public", ["isPublic"]),

  // Jobs table
  jobs: defineTable({
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
    status: v.optional(v.string()), // "active", "inactive", "closed", "draft"
    meetingCode: v.optional(v.string()), // Meeting code for job interviews
    interviewPrompt: v.optional(v.string()), // Custom interview prompt for Eleven Labs
    templateId: v.optional(v.id("jobTemplates")), // Reference to the template used to create this job
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
        timeLimit: v.number(),
        systemPrompt: v.optional(v.string()),
      }),
    ),
  })
    .index("by_company", ["company"])
    .index("by_featured", ["featured"])
    .index("by_template", ["templateId"])
    .index("by_status", ["status"]),

  // Candidates table
  candidates: defineTable({
    name: v.string(),
    initials: v.string(),
    email: v.string(),
    phone: v.optional(v.string()), // Phone number from application form
    textColor: v.string(),
    bgColor: v.string(),
    userId: v.optional(v.id("users")), // Link to user ID
    cvFileId: v.optional(v.id("files")),
    meetingCode: v.optional(v.string()), // Meeting code for candidate interviews
    coverLetter: v.optional(v.string()), // Cover letter from application form
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
    bugs: v.optional(
      v.array(
        v.object({
          description: v.string(),
          timestamp: v.string(), // ISO date string
          status: v.string(), // "open", "resolved", "investigating"
          resolution: v.optional(v.string()),
          resolvedAt: v.optional(v.string()),
        }),
      ),
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
  })
    .index("by_email", ["email"])
    .index("by_userId", ["userId"]), // Add index for querying by user ID

  // Interview Requests table
  interviewRequests: defineTable({
    // Link to candidate
    candidateId: v.id("candidates"),

    // Position being interviewed for
    position: v.string(),

    // Interview schedule details
    date: v.string(), // ISO date string format
    time: v.string(), // e.g., "10:00 AM"

    // Status of the interview request
    status: v.string(), // "pending", "accepted", "rejected", or "rescheduled"

    // Meeting code for this specific interview
    meetingCode: v.optional(v.string()),

    // Optional fields for additional data
    notes: v.optional(v.string()),
    interviewerIds: v.optional(v.array(v.string())), // IDs of team members conducting interview
    location: v.optional(v.string()), // Physical location or virtual meeting link
    durationType: v.optional(v.string()), // "30min", "45min", "60min", etc.

    // For virtual interviews
    meetingLink: v.optional(v.string()),

    // For tracking changes/history
    createdAt: v.string(), // ISO date string
    updatedAt: v.optional(v.string()), // ISO date string
    rescheduledFrom: v.optional(
      v.object({
        date: v.string(),
        time: v.string(),
      }),
    ),

    // For interview series or multi-stage interviews
    round: v.optional(v.number()), // 1, 2, 3, etc.
    interviewType: v.optional(v.string()), // "technical", "behavioral", "culture fit", etc.

    // If linked to a job
    jobId: v.optional(v.id("jobs")),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_candidate_and_status", ["candidateId", "status"])
    .index("by_job", ["jobId"]),

  // Interviews table - actual interviews and transcripts
  interviews: defineTable({
    // References
    candidateId: v.id("candidates"),
    jobId: v.optional(v.id("jobs")),
    interviewRequestId: v.optional(v.id("interviewRequests")),
    hasError: v.optional(v.boolean()),
    // Interview metadata
    title: v.string(), // e.g., "Technical Interview with John Doe"
    meetingCode: v.string(), // Code used for the meeting
    interviewType: v.optional(v.string()), // "technical", "behavioral", "ai", etc.
    //hasError: v.optional(v.boolean()), // True if there was an error during the interview
    // Add video_id for LiveKit recordings
    video_id: v.optional(v.string()), // ID for LiveKit or S3 recordings

    // Time tracking
    startedAt: v.string(), // ISO date string when interview started
    endedAt: v.optional(v.string()), // ISO date string when interview ended
    duration: v.optional(v.number()), // Duration in seconds

    // Interview content
    transcript: v.array(
      v.object({
        sender: v.string(), // "user", "ai", "interviewer", "candidate"
        text: v.string(),
        timestamp: v.string(), // ISO date string
      }),
    ),

    // Analysis and summary (optional, can be generated later)
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),

    // AI scoring (optional)
    scores: v.optional(
      v.object({
        technical: v.optional(v.number()),
        communication: v.optional(v.number()),
        problemSolving: v.optional(v.number()),
        overall: v.optional(v.number()),
      }),
    ),

    // Status tracking
    status: v.string(), // "in_progress", "completed", "analyzed", "archived", "error"

    // Bug reports - new field to store multiple bugs
    bugs: v.optional(
      v.array(
        v.object({
          description: v.string(),
          timestamp: v.string(), // ISO date string
          status: v.string(), // "open", "resolved", "investigating"
          resolution: v.optional(v.string()),
          resolvedAt: v.optional(v.string()),
        }),
      ),
    ),

    // Other metadata
    createdBy: v.optional(v.id("users")), // User who created/started the interview
    tags: v.optional(v.array(v.string())), // For categorization
    feedback: v.optional(v.string()), // Interviewer feedback
  })
    .index("by_candidate", ["candidateId"])
    .index("by_job", ["jobId"])
    .index("by_status", ["status"])
    .index("by_type", ["interviewType"])
    .index("by_date", ["startedAt"])
    .index("by_meeting_code", ["meetingCode"]),

  // JobApplications - connects candidates to jobs
  jobApplications: defineTable({
    candidateId: v.id("candidates"),
    jobId: v.id("jobs"),
    status: v.string(), // "applied", "screening", "interview", "offer", "rejected"
    appliedDate: v.string(),
    progress: v.number(),
    matchScore: v.number(),
    meetingCode: v.optional(v.string()), // Meeting code for this application
  })
    .index("by_job", ["jobId"])
    .index("by_candidate", ["candidateId"])
    .index("by_job_and_status", ["jobId", "status"]),

  // JobProgress - analytics for each job
  jobProgress: defineTable({
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
  }).index("by_job", ["jobId"]),

  // Add files table for CV storage
  files: defineTable({
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    candidateId: v.id("candidates"),
    uploadedAt: v.number(),
    cvSummary: v.optional(v.string()),
    fileCategory: v.optional(v.string()),
    status: v.optional(v.string()),
    analysisId: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  }).index("by_candidateId", ["candidateId"]),

  // Store database knowledge and embeddings for vector search
  dbDocuments: defineTable({
    // The document title
    title: v.string(),

    // The document content
    content: v.string(),

    // The table name this document is from (for filtering)
    tableName: v.string(),

    // The document ID in the original table
    documentId: v.optional(v.string()),

    // OpenAI embedding vector for search
    embedding: v.array(v.number()),

    // Additional metadata for improved filtering
    metadata: v.optional(
      v.object({
        // Entity type (candidate, job, interview, etc.)
        entityType: v.optional(v.string()),

        // Candidate-specific metadata
        candidateStatus: v.optional(v.string()),
        candidatePosition: v.optional(v.string()),
        candidateSkills: v.optional(v.array(v.string())),

        // Job-specific metadata
        jobTitle: v.optional(v.string()),
        jobCompany: v.optional(v.string()),
        jobLevel: v.optional(v.string()),

        // Interview-specific metadata
        interviewStatus: v.optional(v.string()),
        interviewType: v.optional(v.string()),

        // Generic metadata
        createdAt: v.optional(v.string()),
        updatedAt: v.optional(v.string()),
      }),
    ),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536, // OpenAI embedding dimensions
    filterFields: [
      "tableName",
      "metadata.entityType",
      "metadata.candidateStatus",
      "metadata.jobTitle",
      "metadata.jobCompany",
      "metadata.interviewStatus",
    ], // Add more filter fields for more precise filtering
  }),

  // System prompts table for AI analysis
  prompts: defineTable({
    name: v.string(),
    content: v.string(),
    description: v.optional(v.string()),
    lastUpdated: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_name", ["name"]),
})
