import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Core Company/Workspace Management
  companies: defineTable({
    name: v.string(),
    logo: v.optional(v.string()),
    settings: v.object({
      defaultCurrency: v.string(),
      timezone: v.string(),
      workingHours: v.object({
        start: v.string(), // "09:00"
        end: v.string(),   // "17:00"
      }),
      retentionTrackingPeriod: v.number(), // months to track retention
    }),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // User Management - Recruiters, Hiring Managers, etc.
  users: defineTable({
    // Auth fields
    tokenIdentifier: v.optional(v.string()),
    
    // User information
    email: v.string(),
    name: v.optional(v.string()),
    companyId: v.id("companies"),
    
    // Password hash (for password-based auth)
    passwordHash: v.optional(v.string()),
    
    // Session management
    sessionToken: v.optional(v.string()),
    
    role: v.union(
      v.literal("admin"),
      v.literal("recruiter"), 
      v.literal("hiring_manager"),
      v.literal("interviewer"),
      v.literal("coordinator"),
      v.literal("user")
    ),
    completedOnboarding: v.boolean(),
    avatar: v.optional(v.string()),
    isActive: v.boolean(),
    lastLogin: v.optional(v.number()),
    lastActivity: v.optional(v.number()),
    
    // User preferences and metadata
    metadata: v.optional(v.object({
      preferredTheme: v.optional(v.string()),
      notifications: v.optional(v.boolean()),
      timezone: v.optional(v.string()),
      language: v.optional(v.string()),
    })),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_sessionToken", ["sessionToken"])
    .index("by_companyId", ["companyId"])
    .index("by_companyId_and_role", ["companyId", "role"])
    .index("by_companyId_and_isActive", ["companyId", "isActive"]),

  // Job Management
  jobs: defineTable({
    title: v.string(),
    companyId: v.id("companies"),
    company: v.string(), // Company name for backwards compatibility
    companyLogo: v.optional(v.string()),
    department: v.string(),
    level: v.union(
      v.literal("junior"),
      v.literal("mid"),
      v.literal("senior"),
      v.literal("lead"),
      v.literal("executive")
    ),
    type: v.union(
      v.literal("full_time"),
      v.literal("part_time"),
      v.literal("contract"),
      v.literal("internship")
    ),
    location: v.string(),
    isRemote: v.boolean(),
    featured: v.boolean(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("closed"),
      v.literal("cancelled")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    
    // Job description and requirements
    description: v.object({
      intro: v.string(),
      details: v.string(),
      responsibilities: v.string(),
      closing: v.string(),
    }),
    requirements: v.array(v.string()),
    desirables: v.array(v.string()),
    benefits: v.array(v.string()),
    requiredSkills: v.array(v.string()),
    preferredSkills: v.array(v.string()),
    experience: v.string(),
    education: v.string(),
    
    salary: v.object({
      min: v.number(),
      max: v.number(),
      currency: v.string(),
      period: v.union(v.literal("hourly"), v.literal("monthly"), v.literal("yearly")),
    }),
    
    // Team and management
    hiringManagerId: v.id("users"),
    recruiterId: v.optional(v.id("users")),
    
    // Hiring targets and metrics
    targetHires: v.number(),
    actualHires: v.number(),
    budgetPerHire: v.optional(v.number()),
    targetStartDate: v.optional(v.number()),
    applicationDeadline: v.optional(v.number()),
    timeToFillTarget: v.optional(v.number()), // days
    
    // Interview configuration
    meetingCode: v.optional(v.string()),
    interviewPrompt: v.optional(v.string()),
    aiInterviewerConfig: v.optional(v.object({
      introduction: v.string(),
      questions: v.array(v.object({
        id: v.string(),
        text: v.string(),
        importance: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low"),
        ),
        followUpPrompts: v.optional(v.array(v.string())),
      })),
      conversationalStyle: v.union(
        v.literal("formal"),
        v.literal("casual"),
        v.literal("friendly"),
      ),
      focusAreas: v.array(v.string()),
      timeLimit: v.number(),
      systemPrompt: v.optional(v.string()),
    })),
    
    // Timestamps
    posted: v.number(), // Changed from string to number
    expiry: v.optional(v.number()), // Changed from string to number
    createdAt: v.number(),
    updatedAt: v.number(),
    closedAt: v.optional(v.number()),
  })
    .index("by_companyId", ["companyId"])
    .index("by_company", ["company"])
    .index("by_featured", ["featured"])
    .index("by_status", ["status"])
    .index("by_companyId_and_status", ["companyId", "status"])
    .index("by_hiringManagerId", ["hiringManagerId"])
    .index("by_recruiterId", ["recruiterId"])
    .index("by_department", ["department"])
    .index("by_createdAt", ["createdAt"]),

  // Candidate Sources (LinkedIn, job boards, referrals, etc.)
  sources: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("job_board"),
      v.literal("linkedin"),
      v.literal("referral"),
      v.literal("career_site"),
      v.literal("recruiting_agency"),
      v.literal("university"),
      v.literal("social_media"),
      v.literal("ai_sourcing"),
      v.literal("other")
    ),
    companyId: v.id("companies"),
    isActive: v.boolean(),
    costPerCandidate: v.optional(v.number()),
    monthlyBudget: v.optional(v.number()),
    contactInfo: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_type", ["type"])
    .index("by_companyId_and_type", ["companyId", "type"])
    .index("by_companyId_and_isActive", ["companyId", "isActive"]),

  // Main Candidates table (core info only)
  candidates: defineTable({
    name: v.string(),
    initials: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    
    // Visual/UI related fields (for backwards compatibility)
    textColor: v.string(),
    bgColor: v.string(),
    
    // Basic professional info
    location: v.string(),
    linkedinUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    yearsExperience: v.optional(v.number()),
    currentTitle: v.optional(v.string()),
    currentCompany: v.optional(v.string()),
    currentSalary: v.optional(v.number()),
    expectedSalary: v.optional(v.number()),
    
    // Core skills and qualifications
    skills: v.array(v.string()),
    certifications: v.array(v.string()),
    education: v.optional(v.object({
      degree: v.string(),
      institution: v.string(),
      graduationYear: v.optional(v.number()),
    })),
    
    // File references
    userId: v.optional(v.id("users")),
    cvFileId: v.optional(v.id("files")),
    resumeFileId: v.optional(v.id("_storage")),
    
    // Source and referral tracking
    sourceId: v.optional(v.id("sources")),
    referredBy: v.optional(v.id("users")),
    
    // Availability and preferences
    isAvailable: v.boolean(),
    willingToRelocate: v.boolean(),
    preferredWorkType: v.union(
      v.literal("remote"),
      v.literal("hybrid"),
      v.literal("onsite"),
      v.literal("flexible")
    ),
    
    // Meeting and communication
    meetingCode: v.optional(v.string()),
    coverLetter: v.optional(v.string()),
    
    // Status tracking
    aiScore: v.optional(v.number()),
    status: v.optional(v.string()),
    appliedDate: v.optional(v.number()), // Changed from string to number
    position: v.optional(v.string()),
    recruiter: v.optional(v.string()),
    progress: v.optional(v.number()),
    lastActivity: v.optional(v.number()), // Changed from string to number
    lastContactedAt: v.optional(v.number()),
    
    // Basic profile summary
    profile: v.optional(v.object({
      summary: v.string(),
      portfolio: v.string(),
      aiScore: v.number(),
      documents: v.array(v.object({
        name: v.string(),
        link: v.string(),
      })),
      insights: v.string(),
      timestamps: v.array(v.object({
        label: v.string(),
        date: v.string(),
      })),
    })),
    
    // General fields
    notes: v.optional(v.string()),
    tags: v.array(v.string()),
    
    // Bug tracking (keeping for backwards compatibility)
    bugs: v.optional(v.array(v.object({
      description: v.string(),
      timestamp: v.number(), // Changed from string to number
      status: v.string(),
      resolution: v.optional(v.string()),
      resolvedAt: v.optional(v.number()), // Changed from string to number
    }))),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_userId", ["userId"])
    .index("by_sourceId", ["sourceId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_skills", ["skills"])
    .index("by_isAvailable", ["isAvailable"])
    .index("by_referredBy", ["referredBy"])
    .index("by_status", ["status"])
    .index("by_lastActivity", ["lastActivity"]),

  // Detailed Candidate Profiles (normalized from the massive nested object)
  candidateProfiles: defineTable({
    candidateId: v.id("candidates"),
    
    // Personal information
    personal: v.object({
      age: v.optional(v.string()),
      nationality: v.optional(v.string()),
      location: v.optional(v.string()),
      dependents: v.optional(v.string()),
      visaStatus: v.optional(v.string()), // Changed from visa_status
    }),
    
    // Career information
    career: v.object({
      experience: v.optional(v.string()),
      pastRoles: v.optional(v.string()), // Changed from past_roles
      progression: v.optional(v.string()),
    }),
    
    // Interview specific data
    interview: v.object({
      duration: v.optional(v.string()),
      workEligibility: v.optional(v.string()), // Changed from work_eligibility
      idCheck: v.optional(v.string()), // Changed from id_check
      highlights: v.optional(v.array(v.object({
        title: v.string(),
        content: v.string(),
        timestamp: v.string(),
        mediaUrl: v.optional(v.string()),
      }))),
      overallFeedback: v.optional(v.array(v.object({
        text: v.string(),
        praise: v.boolean(),
      }))),
    }),
    
    // CV analysis
    cv: v.object({
      highlights: v.array(v.string()),
      keyInsights: v.array(v.string()),
      score: v.optional(v.number()),
    }),
    
    // Skills insights
    skillInsights: v.object({
      matchedSkills: v.array(v.string()),
      missingSkills: v.array(v.string()),
      skillGaps: v.array(v.object({
        name: v.string(),
        percentage: v.number(),
      })),
      learningPaths: v.array(v.object({
        title: v.string(),
        provider: v.string(),
      })),
    }),
    
    recommendation: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_candidateId", ["candidateId"]),

  // Candidate Skills Assessment (normalized from nested skills object)
  candidateSkills: defineTable({
    candidateId: v.id("candidates"),
    category: v.union(
      v.literal("technical"),
      v.literal("soft"),
      v.literal("culture")
    ),
    overallScore: v.number(),
    skills: v.array(v.object({
      name: v.string(),
      score: v.number(),
    })),
    assessedAt: v.number(),
    assessedBy: v.optional(v.id("users")), // Who assessed these skills
    assessmentMethod: v.optional(v.union(
      v.literal("ai_interview"),
      v.literal("human_interview"),
      v.literal("test"),
      v.literal("portfolio_review"),
      v.literal("manual_entry")
    )),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_candidateId", ["candidateId"])
    .index("by_category", ["category"])
    .index("by_candidateId_and_category", ["candidateId", "category"])
    .index("by_assessedAt", ["assessedAt"]),

  // Applications - Junction between candidates and jobs
  applications: defineTable({
    candidateId: v.id("candidates"),
    jobId: v.id("jobs"),
    status: v.union(
      v.literal("applied"),
      v.literal("screening"),
      v.literal("interviewing"),
      v.literal("offered"),
      v.literal("hired"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
    stage: v.union(
      v.literal("application_review"),
      v.literal("initial_screening"),
      v.literal("technical_screening"),
      v.literal("phone_interview"),
      v.literal("technical_interview"),
      v.literal("behavioral_interview"),
      v.literal("panel_interview"),
      v.literal("final_interview"),
      v.literal("reference_check"),
      v.literal("background_check"),
      v.literal("offer_negotiation")
    ),
    appliedAt: v.number(),
    lastActivityAt: v.number(),
    screenedAt: v.optional(v.number()),
    screenedBy: v.optional(v.id("users")),
    interviewStartedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    offerMadeAt: v.optional(v.number()),
    offerAmount: v.optional(v.number()),
    offerAcceptedAt: v.optional(v.number()),
    hiredAt: v.optional(v.number()),
    withdrawnAt: v.optional(v.number()),
    coverLetter: v.optional(v.string()),
    matchScore: v.optional(v.number()), // AI-calculated match score 0-100
    screeningScore: v.optional(v.number()), // Manual screening score 0-100
    overallScore: v.optional(v.number()), // Combined score 0-100
    feedback: v.optional(v.string()),
    tags: v.array(v.string()),
    meetingCode: v.optional(v.string()), // Meeting code for this application
    
    // For backwards compatibility with existing jobApplications table
    appliedDate: v.optional(v.number()), // Changed from string
    progress: v.number(),
  })
    .index("by_candidateId", ["candidateId"])
    .index("by_jobId", ["jobId"])
    .index("by_status", ["status"])
    .index("by_stage", ["stage"])
    .index("by_candidateId_and_jobId", ["candidateId", "jobId"])
    .index("by_jobId_and_status", ["jobId", "status"])
    .index("by_appliedAt", ["appliedAt"])
    .index("by_screenedBy", ["screenedBy"])
    .index("by_lastActivityAt", ["lastActivityAt"]),

  // Interview Requests (keeping existing structure)
  interviewRequests: defineTable({
    candidateId: v.id("candidates"),
    position: v.string(),
    date: v.number(), // Changed from string to number
    time: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("rescheduled")
    ),
    meetingCode: v.optional(v.string()),
    notes: v.optional(v.string()),
    interviewerIds: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    durationType: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    createdAt: v.number(), // Changed from string to number
    updatedAt: v.optional(v.number()), // Changed from string to number
    rescheduledFrom: v.optional(v.object({
      date: v.number(), // Changed from string to number
      time: v.string(),
    })),
    round: v.optional(v.number()),
    interviewType: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
  })
    .index("by_candidateId", ["candidateId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_candidateId_and_status", ["candidateId", "status"])
    .index("by_jobId", ["jobId"]),

  // Interview Management (both AI and Human)
  interviews: defineTable({
    // References
    candidateId: v.id("candidates"),
    jobId: v.optional(v.id("jobs")),
    interviewRequestId: v.optional(v.id("interviewRequests")),
    applicationId: v.optional(v.id("applications")),
    
    // Interview metadata
    title: v.string(),
    meetingCode: v.string(),
    type: v.union(
      v.literal("ai_screening"),
      v.literal("phone_screening"),
      v.literal("video_interview"),
      v.literal("technical_interview"),
      v.literal("behavioral_interview"),
      v.literal("panel_interview"),
      v.literal("final_interview"),
      v.literal("culture_fit"),
      v.literal("technical"), // for backwards compatibility
      v.literal("behavioral"), // for backwards compatibility
      v.literal("ai") // for backwards compatibility
    ),
    mode: v.union(v.literal("ai"), v.literal("human")),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show"),
      v.literal("rescheduled"),
      v.literal("analyzed"),
      v.literal("archived"),
      v.literal("error")
    ),
    
    // Time tracking
    scheduledAt: v.optional(v.number()),
    startedAt: v.number(), // Changed from string to number
    endedAt: v.optional(v.number()), // Changed from string to number
    duration: v.optional(v.number()), // Duration in seconds
    durationMinutes: v.optional(v.number()),
    
    // Team
    interviewerIds: v.array(v.id("users")), // Empty for AI interviews
    createdBy: v.optional(v.id("users")),
    
    // AI Configuration
    aiConfigId: v.optional(v.id("aiConfigurations")),
    
    // Meeting and recording
    meetingLink: v.optional(v.string()),
    recordingUrl: v.optional(v.string()),
    videoId: v.optional(v.string()), // Changed from video_id
    
    // Content
    transcript: v.array(v.object({
      sender: v.string(),
      text: v.string(),
      timestamp: v.number(), // Changed from string to number
    })),
    summary: v.optional(v.string()),
    keyPoints: v.array(v.string()),
    concerns: v.array(v.string()),
    feedback: v.optional(v.string()),
    
    // Scoring
    scores: v.optional(v.object({
      technical: v.optional(v.number()),
      communication: v.optional(v.number()),
      problemSolving: v.optional(v.number()),
      culturalFit: v.optional(v.number()),
      experience: v.optional(v.number()),
      overall: v.optional(v.number()),
    })),
    recommendation: v.optional(v.union(
      v.literal("strong_hire"),
      v.literal("hire"),
      v.literal("maybe"),
      v.literal("no_hire"),
      v.literal("strong_no_hire")
    )),
    nextSteps: v.optional(v.string()),
    
    // Error handling
    hasError: v.optional(v.boolean()),
    
    // Bug tracking (keeping for backwards compatibility)
    bugs: v.optional(v.array(v.object({
      description: v.string(),
      timestamp: v.number(), // Changed from string to number
      status: v.string(),
      resolution: v.optional(v.string()),
      resolvedAt: v.optional(v.number()), // Changed from string to number
    }))),
    
    // Metadata
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_candidateId", ["candidateId"])
    .index("by_jobId", ["jobId"])
    .index("by_applicationId", ["applicationId"])
    .index("by_scheduledAt", ["scheduledAt"])
    .index("by_status", ["status"])
    .index("by_mode", ["mode"])
    .index("by_type", ["type"])
    .index("by_mode_and_status", ["mode", "status"])
    .index("by_startedAt", ["startedAt"])
    .index("by_meetingCode", ["meetingCode"])
    .index("by_createdAt", ["createdAt"]),

  // AI Configuration for interviews and screening
  aiConfigurations: defineTable({
    companyId: v.optional(v.id("companies")),
    name: v.string(),
    interfaceType: v.optional(v.string()), // For backwards compatibility
    type: v.union(
      v.literal("screening"),
      v.literal("technical_interview"),
      v.literal("behavioral_interview"),
      v.literal("culture_interview"),
      v.literal("realtime-interview"), // backwards compatibility
      v.literal("chat") // backwards compatibility
    ),
    prompt: v.string(),
    
    // Interview questions configuration
    questions: v.array(v.object({
      id: v.string(),
      text: v.string(),
      category: v.union(
        v.literal("technical"),
        v.literal("behavioral"),
        v.literal("experience"),
        v.literal("culture")
      ),
      difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
      timeLimit: v.optional(v.number()), // seconds
      followUpQuestions: v.array(v.string()),
      expectedAnswerPoints: v.array(v.string()),
    })),
    
    // Evaluation criteria
    evaluationCriteria: v.array(v.object({
      name: v.string(),
      weight: v.number(), // 0-1
      description: v.string(),
      scoringGuideline: v.string(),
    })),
    
    // Configuration options (keeping backwards compatibility)
    options: v.object({
      voice: v.optional(v.string()),
      temperature: v.number(),
    }),
    
    // Voice settings for AI interviews
    voiceSettings: v.optional(v.object({
      voiceId: v.string(),
      speed: v.number(),
      pitch: v.number(),
      stability: v.number(),
    })),
    
    duration: v.number(), // minutes
    passingScore: v.number(),
    isDefault: v.boolean(),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(), // Changed from string to number
    updatedAt: v.optional(v.number()), // Changed from string to number
  })
    .index("by_name", ["name"])
    .index("by_companyId", ["companyId"])
    .index("by_type", ["type"])
    .index("by_companyId_and_type", ["companyId", "type"])
    .index("by_isDefault", ["isDefault"])
    .index("by_interfaceType_and_isDefault", ["interfaceType", "isDefault"])
    .index("by_createdBy", ["createdBy"]),

  // Feedback and Ratings
  feedback: defineTable({
    interviewId: v.id("interviews"),
    fromUserId: v.id("users"), // interviewer
    toApplicationId: v.id("applications"), // candidate application
    rating: v.number(), // 1-5
    categories: v.object({
      technical: v.optional(v.number()),
      communication: v.optional(v.number()),
      problemSolving: v.optional(v.number()),
      teamwork: v.optional(v.number()),
      leadership: v.optional(v.number()),
      culturalFit: v.optional(v.number()),
    }),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    comments: v.optional(v.string()),
    wouldHire: v.boolean(),
    confidence: v.number(), // 1-5, how confident in the assessment
    createdAt: v.number(),
  })
    .index("by_interviewId", ["interviewId"])
    .index("by_fromUserId", ["fromUserId"])
    .index("by_toApplicationId", ["toApplicationId"])
    .index("by_rating", ["rating"])
    .index("by_createdAt", ["createdAt"]),

  // Job Progress Analytics (keeping existing structure)
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
      learningPaths: v.array(v.object({
        title: v.string(),
        provider: v.string(),
      })),
    }),
    candidates: v.array(v.object({
      id: v.string(),
      name: v.string(),
      email: v.string(),
      matchScore: v.number(),
    })),
  })
    .index("by_jobId", ["jobId"]),

  // Hiring Analytics - Time-series data for all metrics shown in dashboard
  analytics: defineTable({
    companyId: v.id("companies"),
    metric: v.union(
      // Volume metrics
      v.literal("applications_received"),
      v.literal("candidates_screened"),
      v.literal("interviews_conducted"),
      v.literal("offers_made"),
      v.literal("hires_made"),
      v.literal("rejections_made"),
      
      // Time metrics
      v.literal("time_to_hire"),
      v.literal("time_to_screen"),
      v.literal("time_to_interview"),
      v.literal("time_to_offer"),
      v.literal("response_time"),
      
      // Quality metrics
      v.literal("hire_quality_score"),
      v.literal("interview_score_average"),
      v.literal("screening_accuracy"),
      v.literal("ai_vs_human_accuracy"),
      
      // Efficiency metrics
      v.literal("cost_per_hire"),
      v.literal("cost_per_application"),
      v.literal("recruiter_hours_saved"),
      v.literal("interview_to_hire_ratio"),
      v.literal("screen_to_interview_ratio"),
      v.literal("offer_acceptance_rate"),
      v.literal("candidate_show_rate"),
      
      // Retention metrics
      v.literal("retention_30_days"),
      v.literal("retention_90_days"),
      v.literal("retention_180_days"),
      v.literal("retention_365_days"),
      
      // Source effectiveness
      v.literal("source_conversion_rate"),
      v.literal("source_cost_effectiveness"),
      v.literal("source_quality_score")
    ),
    value: v.number(),
    secondaryValue: v.optional(v.number()), // for ratios, percentages
    dimensions: v.object({
      jobId: v.optional(v.id("jobs")),
      userId: v.optional(v.id("users")),
      sourceId: v.optional(v.id("sources")),
      department: v.optional(v.string()),
      location: v.optional(v.string()),
      level: v.optional(v.string()),
      interviewType: v.optional(v.string()),
    }),
    period: v.union(
      v.literal("hour"),
      v.literal("day"),
      v.literal("week"),
      v.literal("month"),
      v.literal("quarter"),
      v.literal("year")
    ),
    timestamp: v.number(), // Start of the period
    calculatedAt: v.number(), // When this metric was calculated
  })
    .index("by_companyId", ["companyId"])
    .index("by_metric", ["metric"])
    .index("by_timestamp", ["timestamp"])
    .index("by_companyId_and_metric", ["companyId", "metric"])
    .index("by_companyId_and_timestamp", ["companyId", "timestamp"])
    .index("by_metric_and_timestamp", ["metric", "timestamp"])
    .index("by_period", ["period"]),

  // Activity logs for detailed tracking and audit trail
  activities: defineTable({
    companyId: v.id("companies"),
    userId: v.optional(v.id("users")), // null for system activities
    entityType: v.union(
      v.literal("candidate"),
      v.literal("application"),
      v.literal("interview"),
      v.literal("job"),
      v.literal("user"),
      v.literal("offer"),
      v.literal("feedback")
    ),
    entityId: v.string(), // ID of the entity
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
      v.literal("status_changed"),
      v.literal("stage_changed"),
      v.literal("email_sent"),
      v.literal("interview_scheduled"),
      v.literal("interview_completed"),
      v.literal("offer_made"),
      v.literal("offer_accepted"),
      v.literal("offer_rejected"),
      v.literal("hired"),
      v.literal("rejected"),
      v.literal("withdrawn"),
      v.literal("contacted"),
      v.literal("note_added")
    ),
    details: v.optional(v.object({
      oldValue: v.optional(v.string()),
      newValue: v.optional(v.string()),
      field: v.optional(v.string()),
      reason: v.optional(v.string()),
      metadata: v.optional(v.record(v.string(), v.string())),
    })),
    timestamp: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_userId", ["userId"])
    .index("by_entityType", ["entityType"])
    .index("by_entityId", ["entityId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"])
    .index("by_companyId_and_entityType", ["companyId", "entityType"])
    .index("by_entityType_and_action", ["entityType", "action"]),

  // Employee retention tracking (for hired candidates)
  employeeRetention: defineTable({
    applicationId: v.id("applications"), // Original application that led to hire
    employeeId: v.string(), // Internal employee ID
    hireDate: v.number(),
    terminationDate: v.optional(v.number()),
    terminationReason: v.optional(v.union(
      v.literal("voluntary"),
      v.literal("involuntary"),
      v.literal("layoff"),
      v.literal("performance"),
      v.literal("relocation"),
      v.literal("other")
    )),
    performanceRatings: v.array(v.object({
      period: v.string(), // "Q1 2024"
      rating: v.number(), // 1-5
      timestamp: v.number(),
    })),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_applicationId", ["applicationId"])
    .index("by_hireDate", ["hireDate"])
    .index("by_isActive", ["isActive"])
    .index("by_terminationDate", ["terminationDate"]),

  // File storage metadata
  files: defineTable({
    companyId: v.optional(v.id("companies")),
    uploadedBy: v.optional(v.id("users")),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    storageId: v.optional(v.id("_storage")),
    fileId: v.optional(v.id("_storage")), // For backwards compatibility
    candidateId: v.optional(v.id("candidates")),
    entityType: v.union(
      v.literal("resume"),
      v.literal("cover_letter"),
      v.literal("portfolio"),
      v.literal("company_logo"),
      v.literal("interview_recording"),
      v.literal("offer_letter"),
      v.literal("contract"),
      v.literal("other")
    ),
    entityId: v.optional(v.string()), // ID of related entity
    isPublic: v.boolean(),
    tags: v.array(v.string()),
    uploadedAt: v.number(),
    updatedAt: v.optional(v.number()),
    
    // Analysis fields (keeping backwards compatibility)
    cvSummary: v.optional(v.string()),
    fileCategory: v.optional(v.string()),
    status: v.optional(v.string()),
    analysisId: v.optional(v.string()),
  })
    .index("by_companyId", ["companyId"])
    .index("by_uploadedBy", ["uploadedBy"])
    .index("by_entityType", ["entityType"])
    .index("by_entityId", ["entityId"])
    .index("by_candidateId", ["candidateId"])
    .index("by_uploadedAt", ["uploadedAt"]),

  // Vector embeddings for AI search and knowledge base
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
    metadata: v.optional(v.object({
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
    })),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // OpenAI embedding dimensions
      filterFields: [
        "tableName",
        "metadata.entityType",
        "metadata.candidateStatus",
        "metadata.jobTitle",
        "metadata.jobCompany",
        "metadata.interviewStatus",
      ],
    }),

  // Knowledge base for AI interviews and company information
  knowledgeBase: defineTable({
    companyId: v.optional(v.id("companies")),
    name: v.string(), // Name of the knowledge base
    title: v.optional(v.string()), // Alternative title field
    content: v.string(), // The actual content/information
    category: v.union(
      v.literal("company_info"),
      v.literal("job_requirements"),
      v.literal("interview_guidelines"),
      v.literal("evaluation_criteria"),
      v.literal("company_culture"),
      v.literal("benefits_packages"),
      v.literal("technical_standards"),
      v.literal("legal_compliance")
    ),
    tags: v.array(v.string()),
    isPublic: v.boolean(), // Whether all users in company can see this
    isActive: v.boolean(),
    isDefault: v.boolean(), // Whether this is the default knowledge base
    version: v.number(),
    updatedBy: v.optional(v.id("users")),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    lastUpdated: v.number(), // For backwards compatibility (was string)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_isDefault", ["isDefault"])
    .index("by_category", ["category"])
    .index("by_companyId_and_category", ["companyId", "category"])
    .index("by_isActive", ["isActive"])
    .index("by_updatedBy", ["updatedBy"]),

  // System prompts table for AI analysis
  prompts: defineTable({
    name: v.string(),
    content: v.string(),
    description: v.optional(v.string()),
    lastUpdated: v.number(),
    updatedBy: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_lastUpdated", ["lastUpdated"]),

  // Communication templates and automation
  templates: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    type: v.union(
      v.literal("email"),
      v.literal("sms"),
      v.literal("interview_invite"),
      v.literal("rejection"),
      v.literal("offer"),
      v.literal("follow_up")
    ),
    stage: v.union(
      v.literal("application_received"),
      v.literal("screening_pass"),
      v.literal("screening_fail"),
      v.literal("interview_invitation"),
      v.literal("interview_reminder"),
      v.literal("interview_feedback"),
      v.literal("offer_made"),
      v.literal("offer_accepted"),
      v.literal("rejection"),
      v.literal("follow_up")
    ),
    subject: v.optional(v.string()),
    content: v.string(),
    variables: v.array(v.string()), // Available variables like {candidateName}, {jobTitle}
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_type", ["type"])
    .index("by_stage", ["stage"])
    .index("by_companyId_and_type", ["companyId", "type"]),
}); 