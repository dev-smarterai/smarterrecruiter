"use node"

import { action, internalAction } from "./_generated/server"
import { v } from "convex/values"
import { Anthropic } from "@anthropic-ai/sdk"
import { api } from "./_generated/api"
import { Id } from "./_generated/dataModel"

// Default prompt template if we can't get it from the database
const DEFAULT_SYSTEM_PROMPT = `
You are an expert AI recruiter assistant that analyzes candidate CVs. I will provide you with CV/resume content, and I need you to:

1. Extract and evaluate the candidate's technical skills
2. Assess their soft skills based on achievements and experience
3. Identify cultural fit indicators
4. Extract educational background and career progression
5. Highlight the most impressive achievements
6. Provide key insights about the candidate's strengths and weaknesses
7. Estimate their competence in various areas with numerical scores

Format your response as a JSON object with the following candidateProfile structure:
{
  "candidateProfile": {
    "personal": {
      "age": string,
      "nationality": string,
      "location": string,
      "dependents": string,
      "visa_status": string
    },
    "career": {
      "experience": string,
      "past_roles": string,
      "progression": string
    },
    "skills": {
      "technical": {
        "overallScore": number,
        "skills": [{ "name": string, "score": number }]
      },
      "soft": {
        "overallScore": number,
        "skills": [{ "name": string, "score": number }]
      },
      "culture": {
        "overallScore": number,
        "skills": [{ "name": string, "score": number }]
      }
    },
    "cv": {
      "highlights": string[],
      "keyInsights": string[],
      "score": number
    },
    "skillInsights": {
      "matchedSkills": string[],
      "missingSkills": string[],
      "skillGaps": [{ "name": string, "percentage": number }],
      "learningPaths": [{ "title": string, "provider": string }]
    },
    "recommendation": string
  }
}
`

// Action to analyze a CV using Anthropic Claude
export const analyzeCVWithClaude = action({
  args: {
    analysisId: v.string(),
    pdfBase64: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Starting CV analysis in Convex action...")

    try {
      // Get API key from environment
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not set in environment variables")
      }

      // Initialize Anthropic client
      const anthropic = new Anthropic({
        apiKey: apiKey,
      })

      // Get the prompt template from Convex database
      let systemPrompt
      try {
        const prompt = await ctx.runQuery(api.prompts.getByName, {
          name: "cv_analysis",
        })

        if (prompt && prompt.content) {
          console.log("Retrieved CV analysis prompt from database")
          systemPrompt = prompt.content
        } else {
          console.log("CV analysis prompt not found in database, using default")
          systemPrompt = DEFAULT_SYSTEM_PROMPT
        }
      } catch (error) {
        console.error("Error fetching prompt from Convex:", error)
        systemPrompt = DEFAULT_SYSTEM_PROMPT
      }

      console.log("Sending PDF to Claude for analysis...")

      // Call Claude API with the PDF
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219", // Using Claude 3.7 Sonnet
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: args.pdfBase64,
                },
              },
              {
                type: "text",
                text:
                  systemPrompt +
                  "\n\nPlease analyze this CV and provide your assessment in the JSON format described above.",
              },
            ],
          },
        ],
        system:
          "You are an expert AI recruiter assistant. Analyze CVs and provide structured feedback in JSON format.",
      })

      // Extract text from response
      const contentBlock = response.content[0]
      if (contentBlock.type !== "text") {
        throw new Error("Unexpected response format from Claude")
      }

      const content = contentBlock.text
      console.log("Claude analysis response length:", content.length)

      try {
        // Find JSON in the response
        const jsonMatches = content.match(/\{[\s\S]*\}/)
        if (!jsonMatches) {
          throw new Error("No JSON found in Claude's response")
        }

        const jsonStr = jsonMatches[0]
        const parsedResponse = JSON.parse(jsonStr)

        // Verify essential fields exist
        if (!parsedResponse.candidateProfile) {
          console.error("Missing candidateProfile in Claude response")
          throw new Error("Invalid response structure")
        }

        // Create or update candidate record with the analysis
        const candidates = await ctx.runQuery(
          api.candidates.getCandidateByAnalysisId,
          { analysisId: args.analysisId },
        )
        if (candidates && candidates.length > 0) {
          const candidateId = candidates[0]._id
          await ctx.runMutation(api.candidates.updateCandidateProfile, {
            id: candidateId,
            profile: parsedResponse.candidateProfile,
          })
        }

        console.log("Analysis completed and saved successfully")
        return parsedResponse
      } catch (parseError: unknown) {
        console.error("Error parsing Claude response as JSON:", parseError)
        throw new Error(
          `Failed to parse Claude response: ${(parseError as Error).message || "Unknown error"}`,
        )
      }
    } catch (error: unknown) {
      console.error("Error analyzing CV with Claude:", error)
      throw new Error(
        `Failed to analyze CV with Claude: ${(error as Error).message || "Unknown error"}`,
      )
    }
  },
})

// Generate a mock candidate profile for testing/development
export const generateMockCandidateProfile = action({
  args: {},
  returns: v.any(),
  handler: async () => {
    return {
      candidateProfile: {
        personal: {
          age: "Not specified",
          nationality: "Not specified",
          location: "Not specified",
          dependents: "Not specified",
          visa_status: "Not specified",
        },
        career: {
          experience: "5+ years",
          past_roles: "Software Developer, Web Developer",
          progression: "Steady",
        },
        skills: {
          technical: {
            overallScore: 82,
            skills: [
              { name: "JavaScript", score: 85 },
              { name: "React", score: 80 },
              { name: "Node.js", score: 75 },
            ],
          },
          soft: {
            overallScore: 78,
            skills: [
              { name: "Communication", score: 80 },
              { name: "Leadership", score: 75 },
            ],
          },
          culture: {
            overallScore: 80,
            skills: [
              { name: "Teamwork", score: 85 },
              { name: "Adaptability", score: 80 },
            ],
          },
        },
        cv: {
          highlights: [
            "Built a scalable web application with React and Node.js",
            "Led a team of 3 developers on a client project",
          ],
          keyInsights: [
            "Strong technical background with modern web technologies",
            "Shows leadership potential but limited experience",
          ],
          score: 80,
        },
        skillInsights: {
          matchedSkills: ["JavaScript", "React", "Node.js"],
          missingSkills: ["TypeScript", "AWS"],
          skillGaps: [
            { name: "Cloud Technologies", percentage: 60 },
            { name: "Testing", percentage: 50 },
          ],
          learningPaths: [
            { title: "Advanced React Patterns", provider: "Frontend Masters" },
            { title: "AWS Certification", provider: "Amazon" },
          ],
        },
        recommendation: "Recommend",
      },
    }
  },
})

// Analyze CV from stored file
export const analyzeStoredCV = action({
  args: {
    fileId: v.id("files"),
    analysisId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    console.log("Starting analysis of stored CV...")

    try {
      // Get file record
      const fileRecord = await ctx.runQuery(api.files.getById, {
        id: args.fileId,
      })
      if (!fileRecord) throw new Error("File record not found")

      // Verify analysisId matches
      if (fileRecord.analysisId !== args.analysisId) {
        throw new Error("Analysis ID mismatch")
      }

      // Get file content from storage
      const fileContent = await ctx.storage.get(fileRecord.fileId)
      if (!fileContent) throw new Error("File content not found in storage")

      // Convert to base64
      const base64Pdf = Buffer.from(
        fileContent instanceof Blob
          ? await fileContent.arrayBuffer()
          : fileContent,
      ).toString("base64")

      console.log("File retrieved and converted, running analysis...")

      try {
        // Run the analysis
        const result = await ctx.runAction(api.cvAnalysis.analyzeCVWithClaude, {
          analysisId: args.analysisId,
          pdfBase64: base64Pdf,
        })

        // Extract AI score from the result
        const aiScore = result.candidateProfile.cv.score || 0

        // Update candidate record with AI score and CV file ID
        const candidates = await ctx.runQuery(
          api.candidates.getCandidateByAnalysisId,
          { analysisId: args.analysisId },
        )
        if (candidates && candidates.length > 0) {
          const candidateId = candidates[0]._id
          await ctx.runMutation(api.candidates.updateCandidateProfile, {
            id: candidateId,
            profile: result.candidateProfile,
          })
          // Update aiScore and cvFileId
          await ctx.runMutation(api.candidates.update, {
            id: candidateId,
            aiScore: aiScore,
            cvFileId: args.fileId,
          })
        }

        // Update file record with a temporary placeholder while summary is generated
        await ctx.runMutation(api.files.updateCvSummary, {
          fileId: args.fileId,
          summary: "Generating AI summary...",
        })

        // Schedule asynchronous AI-generated summary
        const profileData = result.candidateProfile
        await ctx.scheduler.runAfter(0, api.cvAnalysis.generateCVSummary, {
          fileId: args.fileId,
          profileData: profileData,
        })

        // Update file record status
        await ctx.runMutation(api.files.updateStatus, {
          id: args.fileId,
          status: "analyzed",
        })

        return result
      } catch (error) {
        console.error("Error in CV analysis:", error)

        // Update file record with error status
        await ctx.runMutation(api.files.updateStatus, {
          id: args.fileId,
          status: "error",
        })

        throw new Error(
          `CV analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    } catch (error) {
      console.error("Error in analyzeStoredCV:", error)

      // Update file record with error status
      await ctx.runMutation(api.files.updateStatus, {
        id: args.fileId,
        status: "error",
      })

      throw error
    }
  },
})

// New internal action to generate CV summary asynchronously
export const generateCVSummary = action({
  args: {
    fileId: v.id("files"),
    profileData: v.any(),
  },
  handler: async (ctx, args) => {
    console.log("Generating AI-based CV summary for file:", args.fileId)

    try {
      // Get API key from environment
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not set in environment variables")
      }

      // Initialize Anthropic client
      const anthropic = new Anthropic({
        apiKey: apiKey,
      })

      // Create a prompt for summary generation
      const summaryPrompt = `
        You are an expert AI recruiter assistant. I have analyzed a candidate\'s CV and need a detailed, natural-language summary of the key points for quick reference. 
        Use the following candidate profile data to create a professional summary in approximately 10 sentences. 
        Cover the candidate\'s background, key skills, career progression, notable achievements, strengths, areas for improvement, cultural fit, key highlights from the CV, key insights derived from the analysis, and overall recommendation. 
        Ensure the summary is specific to this candidate, avoiding generic statements, and provides a comprehensive overview.

        Candidate Profile Data:
        - Personal: Age: ${args.profileData.personal.age || "N/A"}, Nationality: ${args.profileData.personal.nationality || "N/A"}, Location: ${args.profileData.personal.location || "N/A"}
        - Career: Experience: ${args.profileData.career.experience || "N/A"}, Past Roles: ${args.profileData.career.past_roles || "N/A"}, Progression: ${args.profileData.career.progression || "N/A"}
        - Skills: Technical (Score: ${args.profileData.skills.technical.overallScore}): ${args.profileData.skills.technical.skills.map((s: any) => `${s.name} (${s.score})`).join(", ") || "None"}, Soft (Score: ${args.profileData.skills.soft.overallScore}): ${args.profileData.skills.soft.skills.map((s: any) => `${s.name} (${s.score})`).join(", ") || "None"}, Cultural Fit (Score: ${args.profileData.skills.culture.overallScore}): ${args.profileData.skills.culture.skills.map((s: any) => `${s.name} (${s.score})`).join(", ") || "None"}
        - CV Highlights: ${args.profileData.cv.highlights.join("; ") || "None"}
        - Key Insights: ${args.profileData.cv.keyInsights.join("; ") || "None"}
        - Recommendation: ${args.profileData.recommendation || "N/A"}
        - Overall CV Score: ${args.profileData.cv.score || "N/A"}

        Provide the summary as plain text without any JSON formatting or additional headers.
      `

      // Call Claude API to generate the summary
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: summaryPrompt,
          },
        ],
        system:
          "You are an expert in summarizing candidate profiles for recruitment purposes.",
      })

      // Extract text from response
      const contentBlock = response.content[0]
      if (contentBlock.type !== "text") {
        throw new Error("Unexpected response format from Claude")
      }

      const summaryText = contentBlock.text.trim()
      console.log("Generated CV summary:", summaryText)

      // Update the file record with the generated summary
      await ctx.runMutation(api.files.updateCvSummary, {
        fileId: args.fileId,
        summary: summaryText,
      })

      return summaryText
    } catch (error: unknown) {
      console.error("Error generating CV summary with Claude:", error)
      // Update with error message if generation fails
      await ctx.runMutation(api.files.updateCvSummary, {
        fileId: args.fileId,
        summary: `Error generating AI summary: ${(error as Error).message || "Unknown error"}`,
      })
      throw new Error(
        `Failed to generate CV summary: ${(error as Error).message || "Unknown error"}`,
      )
    }
  },
})
