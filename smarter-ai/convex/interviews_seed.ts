import { mutation } from "./_generated/server"
import { v } from "convex/values"

// Seed interview requests with existing candidates
export const seedInterviewRequests = mutation({
  args: {},
  returns: v.array(v.id("interviewRequests")),
  handler: async (ctx) => {
    // Get existing candidates
    const candidates = await ctx.db.query("candidates").collect()

    if (candidates.length === 0) {
      throw new Error("No candidates found. Please create candidates first.")
    }

    // Sample positions
    const positions = [
      "Frontend Engineer",
      "Backend Developer",
      "Full Stack Engineer",
      "Data Scientist",
      "DevOps Engineer",
      "Product Designer",
      "Project Manager",
      "AI/ML Engineer",
    ]

    // Sample interview types
    const interviewTypes = [
      "Technical",
      "Behavioral",
      "Cultural Fit",
      "System Design",
      "Final Round",
    ]

    // Sample status values
    const statuses = ["pending", "accepted", "rejected"]

    // Sample times
    const times = ["9:00 AM", "10:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"]

    // Sample durations
    const durations = ["30min", "45min", "60min", "90min"]

    // Sample locations
    const locations = [
      "Conference Room A",
      "Conference Room B",
      "Zoom Meeting",
      "Google Meet",
    ]

    // Current date for reference
    const now = new Date()

    // Generate interview requests
    const interviewRequestIds = []

    // Create 2-3 interview requests for each candidate
    for (const candidate of candidates) {
      // Number of interviews for this candidate (1-3)
      const numInterviews = Math.floor(Math.random() * 3) + 1

      for (let i = 0; i < numInterviews; i++) {
        // Generate interview date (between today and 30 days in the future)
        const daysInFuture = Math.floor(Math.random() * 30) + 1
        const interviewDate = new Date(now)
        interviewDate.setDate(now.getDate() + daysInFuture)

        // Random selections
        const position = positions[Math.floor(Math.random() * positions.length)]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const time = times[Math.floor(Math.random() * times.length)]
        const durationType =
          durations[Math.floor(Math.random() * durations.length)]
        const location = locations[Math.floor(Math.random() * locations.length)]
        const interviewType =
          interviewTypes[Math.floor(Math.random() * interviewTypes.length)]

        // Create interview request
        const interviewRequestId = await ctx.db.insert("interviewRequests", {
          candidateId: candidate._id,
          position: position || candidate.position || "Software Engineer",
          date: interviewDate.toISOString().split("T")[0], // YYYY-MM-DD format
          time,
          status,
          durationType,
          location,
          interviewType,
          notes: `Interview with ${candidate.name} for ${position} position.`,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          round: i + 1,
        })

        interviewRequestIds.push(interviewRequestId)
      }
    }

    return interviewRequestIds
  },
})
