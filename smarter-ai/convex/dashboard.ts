import { query } from "./_generated/server"
import { v } from "convex/values"

// Get dashboard stats
export const getDashboardStats = query({
  args: {},
  returns: v.object({
    totalJobs: v.number(),
    totalCandidates: v.number(),
    totalApplications: v.number(),
    activeJobs: v.number(),
    featuredJobs: v.number(),
    candidatesPerStatus: v.object({
      applied: v.number(),
      screening: v.number(),
      interview: v.number(),
      offer: v.number(),
      rejected: v.number(),
    }),
    recentActivities: v.array(
      v.object({
        type: v.string(),
        description: v.string(),
        date: v.string(),
      }),
    ),
  }),
  handler: async (ctx) => {
    // Get counts
    const jobs = await ctx.db.query("jobs").collect()
    const candidates = await ctx.db.query("candidates").collect()
    const applications = await ctx.db.query("jobApplications").collect()

    // Count active jobs (not expired)
    const today = new Date()
    const activeJobs = jobs.filter((job) => {
      const expiryDate = new Date(job.expiry)
      return expiryDate >= today
    }).length

    // Count featured jobs
    const featuredJobs = jobs.filter((job) => job.featured).length

    // Count candidates per status
    const candidatesPerStatus = {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    }

    applications.forEach((app) => {
      if (app.status in candidatesPerStatus) {
        candidatesPerStatus[app.status as keyof typeof candidatesPerStatus]++
      }
    })

    // Get recent activities
    const recentActivities = []

    // Add job creations
    const recentJobs = jobs
      .sort(
        (a, b) => new Date(b.posted).getTime() - new Date(a.posted).getTime(),
      )
      .slice(0, 3)

    for (const job of recentJobs) {
      recentActivities.push({
        type: "job_created",
        description: `New job posted: ${job.title}`,
        date: job.posted,
      })
    }

    // Add recent applications if available
    if (applications.length > 0) {
      const appWithDates = applications
        .filter((app) => app.appliedDate)
        .map((app) => ({
          ...app,
          parsedDate: new Date(app.appliedDate).getTime(),
        }))
        .sort((a, b) => b.parsedDate - a.parsedDate)
        .slice(0, 3)

      for (const app of appWithDates) {
        const candidate = await ctx.db.get(app.candidateId)
        const job = await ctx.db.get(app.jobId)

        if (candidate && job) {
          recentActivities.push({
            type: "application",
            description: `${candidate.name} applied for ${job.title}`,
            date: app.appliedDate,
          })
        }
      }
    }

    // Sort all activities by date
    recentActivities.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return {
      totalJobs: jobs.length,
      totalCandidates: candidates.length,
      totalApplications: applications.length,
      activeJobs,
      featuredJobs,
      candidatesPerStatus,
      recentActivities: recentActivities.slice(0, 5), // Limit to 5 activities
    }
  },
})

// Get job statistics
export const getJobsStats = query({
  args: {},
  returns: v.object({
    totalJobs: v.number(),
    activeJobs: v.number(),
    jobsPerLocation: v.record(v.string(), v.number()),
    jobsPerLevel: v.record(v.string(), v.number()),
    averageSalaryRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    topFeaturedJobs: v.array(
      v.object({
        id: v.id("jobs"),
        title: v.string(),
        company: v.string(),
        location: v.string(),
        type: v.string(),
        applicants: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    // Get all jobs
    const jobs = await ctx.db.query("jobs").collect()

    // Count active jobs (not expired)
    const today = new Date()
    const activeJobs = jobs.filter((job) => {
      const expiryDate = new Date(job.expiry)
      return expiryDate >= today
    }).length

    // Count jobs per location and level
    const jobsPerLocation: Record<string, number> = {}
    const jobsPerLevel: Record<string, number> = {}

    // Calculate average salary
    let totalMinSalary = 0
    let totalMaxSalary = 0
    let jobsWithSalary = 0

    for (const job of jobs) {
      // Count by location
      if (job.location) {
        jobsPerLocation[job.location] = (jobsPerLocation[job.location] || 0) + 1
      }

      // Count by level
      if (job.level) {
        jobsPerLevel[job.level] = (jobsPerLevel[job.level] || 0) + 1
      }

      // Sum salaries
      if (
        job.salary &&
        typeof job.salary.min === "number" &&
        typeof job.salary.max === "number"
      ) {
        totalMinSalary += job.salary.min
        totalMaxSalary += job.salary.max
        jobsWithSalary++
      }
    }

    // Calculate average salary range
    const averageSalaryRange = {
      min: jobsWithSalary > 0 ? Math.round(totalMinSalary / jobsWithSalary) : 0,
      max: jobsWithSalary > 0 ? Math.round(totalMaxSalary / jobsWithSalary) : 0,
    }

    // Get top featured jobs
    let topFeaturedJobs = await ctx.db
      .query("jobs")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .take(5)

    // Get applicant counts for each job
    const jobsWithApplicants = []
    for (const job of topFeaturedJobs) {
      const applications = await ctx.db
        .query("jobApplications")
        .withIndex("by_job", (q) => q.eq("jobId", job._id))
        .collect()

      jobsWithApplicants.push({
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        applicants: applications.length,
      })
    }

    return {
      totalJobs: jobs.length,
      activeJobs,
      jobsPerLocation,
      jobsPerLevel,
      averageSalaryRange,
      topFeaturedJobs: jobsWithApplicants,
    }
  },
})

// Get candidate statistics
export const getCandidatesStats = query({
  args: {},
  returns: v.object({
    totalCandidates: v.number(),
    averageAiScore: v.number(),
    candidatesPerStatus: v.record(v.string(), v.number()),
    topCandidates: v.array(
      v.object({
        id: v.id("candidates"),
        name: v.string(),
        position: v.optional(v.string()),
        aiScore: v.optional(v.number()),
        applications: v.number(),
      }),
    ),
    recentCandidates: v.array(
      v.object({
        id: v.id("candidates"),
        name: v.string(),
        email: v.string(),
        appliedDate: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx) => {
    // Get all candidates
    const candidates = await ctx.db.query("candidates").collect()

    // Calculate average AI score
    let totalAiScore = 0
    let candidatesWithScore = 0

    for (const candidate of candidates) {
      if (typeof candidate.aiScore === "number") {
        totalAiScore += candidate.aiScore
        candidatesWithScore++
      }
    }

    const averageAiScore =
      candidatesWithScore > 0
        ? Math.round(totalAiScore / candidatesWithScore)
        : 0

    // Count candidates per status
    const candidatesPerStatus: Record<string, number> = {}

    for (const candidate of candidates) {
      if (candidate.status) {
        candidatesPerStatus[candidate.status] =
          (candidatesPerStatus[candidate.status] || 0) + 1
      }
    }

    // Get top candidates by AI score
    const topCandidates = [...candidates]
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 5)

    // Get application counts for top candidates
    const topCandidatesWithApplications = []
    for (const candidate of topCandidates) {
      const applications = await ctx.db
        .query("jobApplications")
        .withIndex("by_candidate", (q) => q.eq("candidateId", candidate._id))
        .collect()

      topCandidatesWithApplications.push({
        id: candidate._id,
        name: candidate.name,
        position: candidate.position,
        aiScore: candidate.aiScore,
        applications: applications.length,
      })
    }

    // Get recent candidates
    const recentCandidates = [...candidates]
      .sort((a, b) => {
        const dateA = a.appliedDate ? new Date(a.appliedDate).getTime() : 0
        const dateB = b.appliedDate ? new Date(b.appliedDate).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 5)
      .map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        appliedDate: c.appliedDate,
      }))

    return {
      totalCandidates: candidates.length,
      averageAiScore,
      candidatesPerStatus,
      topCandidates: topCandidatesWithApplications,
      recentCandidates,
    }
  },
})

// Get the third highest scoring candidate for Hidden Gem Detector
export const getThirdHighestScoringCandidate = query({
  args: {},
  returns: v.union(
    v.object({
      id: v.id("candidates"),
      name: v.string(),
      initials: v.string(),
      aiScore: v.optional(v.number()),
      position: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    // Get all candidates and sort by AI score
    const candidates = await ctx.db.query("candidates").collect()
    
    // Filter candidates with AI scores and sort by score descending
    const candidatesWithScores = candidates
      .filter(candidate => typeof candidate.aiScore === "number")
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
    
    // Return the third highest (index 2) if it exists
    if (candidatesWithScores.length >= 3) {
      const thirdCandidate = candidatesWithScores[2]
      return {
        id: thirdCandidate._id,
        name: thirdCandidate.name,
        initials: thirdCandidate.initials,
        aiScore: thirdCandidate.aiScore,
        position: thirdCandidate.position,
      }
    }
    
    return null
  },
})

// Get at-a-glance metrics for dashboard
export const getAtGlanceMetrics = query({
  args: {},
  returns: v.object({
    openJobs: v.number(),
    candidatesInPipeline: v.number(),
    interviewsByAI: v.number(),
    interviewsByHR: v.number(),
    offersExtended: v.number(),
    offerConversionRate: v.number(),
    sourced: v.number(),
    screened: v.number(),
    scheduled: v.number(),
  }),
  handler: async (ctx) => {
    // Get counts
    const jobs = await ctx.db.query("jobs").collect()
    const candidates = await ctx.db.query("candidates").collect()
    const applications = await ctx.db.query("jobApplications").collect()
    const interviews = await ctx.db.query("interviews").collect()
    const interviewRequests = await ctx.db.query("interviewRequests").collect()

    // Count active jobs (using status field if available, otherwise not expired)
    const today = new Date()
    const openJobs = jobs.filter((job) => {
      // If job has status field, use it
      if (job.status) {
        return job.status === "active"
      }
      // Otherwise, check if not expired
      const expiryDate = new Date(job.expiry)
      return expiryDate >= today
    }).length

    // Count candidates in pipeline (total candidates)
    const candidatesInPipeline = candidates.length

    // Count sourced candidates (all candidates who have applied)
    const sourced = applications.filter(
      (app) => app.status === "applied" || app.status === "screening" || 
               app.status === "interview" || app.status === "offer"
    ).length

    // Count screened candidates (those who passed initial screening)
    const screened = applications.filter(
      (app) => app.status === "screening" || app.status === "interview" || app.status === "offer"
    ).length

    // Count scheduled interviews (from interview requests with pending/accepted status)
    const scheduled = interviewRequests.filter(
      (req) => req.status === "pending" || req.status === "accepted"
    ).length

    // Count interviews this week (from actual interviews and interview requests)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const oneWeekFromNow = new Date()
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)

    const interviewsThisWeek = interviewRequests.filter((req) => {
      const reqDate = new Date(req.date)
      return reqDate >= oneWeekAgo && reqDate <= oneWeekFromNow
    }).length

    const interviewsByAI = Math.floor(interviewsThisWeek * 0.7) // Assume 70% are AI interviews
    const interviewsByHR = interviewsThisWeek - interviewsByAI

    // Count offers extended (candidates with 'offer' status)
    const offersExtended = applications.filter(
      (app) => app.status === "offer",
    ).length

    // Calculate offer conversion rate (offers / total candidates who reached interview)
    const candidatesReachedInterview = applications.filter(
      (app) =>
        app.status === "interview" ||
        app.status === "offer" ||
        app.status === "rejected",
    ).length

    const offerConversionRate =
      candidatesReachedInterview > 0
        ? Math.round((offersExtended / candidatesReachedInterview) * 100)
        : 0

    return {
      openJobs,
      candidatesInPipeline,
      interviewsByAI,
      interviewsByHR,
      offersExtended,
      offerConversionRate,
      sourced,
      screened,
      scheduled,
    }
  },
})

// Get today's interviews for the dashboard
export const getTodaysInterviews = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("interviewRequests"),
      candidateId: v.id("candidates"),
      candidateName: v.string(),
      candidateInitials: v.string(),
      position: v.string(),
      time: v.string(),
      status: v.string(),
      interviewType: v.optional(v.string()),
      meetingCode: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]

    // Get all interview requests for today
    const todaysInterviews = await ctx.db
      .query("interviewRequests")
      .withIndex("by_date", (q) => q.eq("date", todayString))
      .collect()

    // Get candidate information for each interview
    const interviewsWithCandidates = []
    for (const interview of todaysInterviews) {
      const candidate = await ctx.db.get(interview.candidateId)
      if (candidate) {
        interviewsWithCandidates.push({
          _id: interview._id,
          candidateId: interview.candidateId,
          candidateName: candidate.name,
          candidateInitials: candidate.initials,
          position: interview.position,
          time: interview.time,
          status: interview.status,
          interviewType: interview.interviewType,
          meetingCode: interview.meetingCode,
        })
      }
    }

    // Sort by time
    interviewsWithCandidates.sort((a, b) => {
      // Convert time strings to comparable format (assuming HH:MM AM/PM format)
      const timeA = new Date(`1970-01-01 ${a.time}`).getTime()
      const timeB = new Date(`1970-01-01 ${b.time}`).getTime()
      return timeA - timeB
    })

    return interviewsWithCandidates
  },
})

// Get the top candidate (highest AI score) with their job description
export const getTopCandidateWithJobDescription = query({
  args: {},
  returns: v.union(
    v.object({
      candidate: v.object({
        _id: v.id("candidates"),
        name: v.string(),
        initials: v.string(),
        aiScore: v.optional(v.number()),
        position: v.optional(v.string()),
        email: v.string(),
      }),
      jobDescription: v.optional(v.object({
        title: v.string(),
        company: v.string(),
        description: v.object({
          intro: v.string(),
          details: v.string(),
          responsibilities: v.string(),
          closing: v.string(),
        }),
        requirements: v.array(v.string()),
        salary: v.object({
          min: v.number(),
          max: v.number(),
          currency: v.string(),
          period: v.string(),
        }),
        location: v.string(),
      })),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    // Get all candidates and sort by AI score
    const candidates = await ctx.db.query("candidates").collect()
    
    // Filter candidates with AI scores and sort by score descending
    const candidatesWithScores = candidates
      .filter(candidate => typeof candidate.aiScore === "number")
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
    
    if (candidatesWithScores.length === 0) {
      return null
    }

    const topCandidate = candidatesWithScores[0]

    // Find the job using the candidate's meeting code
    let jobDescription: {
      title: string;
      company: string;
      description: {
        intro: string;
        details: string;
        responsibilities: string;
        closing: string;
      };
      requirements: string[];
      salary: {
        min: number;
        max: number;
        currency: string;
        period: string;
      };
      location: string;
    } | undefined = undefined;
    
    if (topCandidate.meetingCode) {
      // Find the job that has the same meeting code as the candidate
      const jobs = await ctx.db.query("jobs").collect()
      const matchingJob = jobs.find(job => job.meetingCode === topCandidate.meetingCode)
      
      if (matchingJob) {
        jobDescription = {
          title: matchingJob.title,
          company: matchingJob.company,
          description: matchingJob.description,
          requirements: matchingJob.requirements,
          salary: matchingJob.salary,
          location: matchingJob.location,
        }
      }
    }

    return {
      candidate: {
        _id: topCandidate._id,
        name: topCandidate.name,
        initials: topCandidate.initials,
        aiScore: topCandidate.aiScore,
        position: topCandidate.position,
        email: topCandidate.email,
      },
      jobDescription,
    }
  },
})
