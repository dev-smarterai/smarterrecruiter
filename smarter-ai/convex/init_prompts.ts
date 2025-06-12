import { internalMutation } from "./_generated/server"
import { v } from "convex/values"

// CV analysis prompt content
const CV_ANALYSIS_PROMPT = `You are an expert AI recruiter assistant that analyzes candidate CVs. I will provide you with CV/resume content, and I need you to:

1. Extract and evaluate the candidate's technical skills
2. Assess their soft skills based on achievements and experience
3. Identify cultural fit indicators
4. Extract educational background and career progression
5. Highlight the most impressive achievements
6. Provide key insights about the candidate's strengths and weaknesses
7. Estimate their competence in various areas with numerical scores

Format your response as a JSON object with the following structure:
{
  "candidateProfile": {
    "personal": {
      "age": "estimated or extracted age or 'Not specified'",
      "nationality": "extracted or 'Not specified'",
      "location": "extracted location or 'Not specified'",
      "dependents": "any dependent information or 'Not specified'",
      "visa_status": "any visa information or 'Not specified'"
    },
    "career": {
      "experience": "years of experience extracted from CV",
      "past_roles": "brief summary of previous roles",
      "progression": "assessment of career progression (steady, rapid, etc.)"
    },
    "interview": {
      "duration": "45 minutes",
      "work_eligibility": "Confirmed",
      "id_check": "Verified",
      "highlights": [
        {
          "title": "Technical problem solving",
          "content": "Demonstrated excellent problem-solving skills when discussing previous projects",
          "timestamp": "00:15:30"
        }
      ],
      "overallFeedback": [
        {
          "text": "Strong technical knowledge and problem-solving abilities",
          "praise": true
        },
        {
          "text": "Could improve knowledge in some areas of cloud computing",
          "praise": false
        }
      ]
    },
    "skills": {
      "technical": {
        "overallScore": 85,
        "skills": [
          {"name": "JavaScript", "score": 90},
          {"name": "React", "score": 85}
        ]
      },
      "soft": {
        "overallScore": 80,
        "skills": [
          {"name": "Communication", "score": 85},
          {"name": "Leadership", "score": 75}
        ]
      },
      "culture": {
        "overallScore": 75,
        "skills": [
          {"name": "Teamwork", "score": 80},
          {"name": "Adaptability", "score": 70}
        ]
      }
    },
    "cv": {
      "highlights": [
        "Key achievement 1",
        "Key achievement 2"
      ],
      "keyInsights": [
        "Important insight about candidate 1",
        "Important insight about candidate 2"
      ],
      "score": 82
    },
    "skillInsights": {
      "matchedSkills": [
        "JavaScript",
        "React"
      ],
      "missingSkills": [
        "DevOps",
        "GraphQL"
      ],
      "skillGaps": [
        {"name": "Cloud Computing", "percentage": 65},
        {"name": "Mobile Development", "percentage": 45}
      ],
      "learningPaths": [
        {"title": "Advanced React Patterns", "provider": "Frontend Masters"},
        {"title": "Cloud Certification", "provider": "AWS"}
      ]
    },
    "recommendation": "Recommend"
  }
}

Ensure the JSON is valid, with no trailing commas. Base all evaluations strictly on the CV content.`

// Interview transcript analysis prompt content
const INTERVIEW_ANALYSIS_PROMPT = `You are an expert AI recruiter assistant that analyzes interview transcripts. I will provide you with a transcript of an interview, and I need you to:

1. Analyze the candidate's technical skills based on their responses
2. Assess their soft skills such as communication, problem-solving, leadership, teamwork, and time management
3. Evaluate their cultural fit based on values, attitudes, adaptability, growth mindset, and initiative
4. Extract key highlights from the interview
5. Provide overall feedback with both strengths and areas for improvement
6. Create a concise summary of the interview
7. Score the candidate in various competencies

For soft skills assessment, be thorough and evaluate:
- Communication: clarity, listening skills, articulation, non-verbal cues
- Problem-solving: analytical thinking, creativity, logical approach
- Leadership: taking initiative, guiding discussions, mentoring experience
- Teamwork: collaboration examples, conflict resolution
- Time management: prioritization, meeting deadlines, work-life balance

For cultural fit assessment, look for:
- Adaptability: how they handle change and unexpected situations
- Initiative: proactive approach to work and learning
- Values alignment: shared principles with typical workplace environments
- Growth mindset: willingness to learn and receive feedback
- Collaboration style: how they work with others

Format your response as a JSON object with the following structure:
{
  "interviewAnalysis": {
    "summary": "A concise summary of the interview focusing on the candidate's performance",
    "keyPoints": [
      "Key insight about the interview 1",
      "Key insight about the interview 2"
    ],
    "scores": {
      "technical": 85,
      "communication": 90,
      "problemSolving": 80,
      "overall": 85
    },
    "feedback": "Detailed feedback on overall performance"
  },
  "candidateProfile": {
    "interview": {
      "duration": "45 minutes",
      "work_eligibility": "Confirmed",
      "id_check": "Verified",
      "highlights": [
        {
          "title": "Technical problem solving",
          "content": "Demonstrated excellent problem-solving skills when discussing previous projects",
          "timestamp": "00:15:30"
        }
      ],
      "overallFeedback": [
        {
          "text": "Strong technical knowledge and problem-solving abilities",
          "praise": true
        },
        {
          "text": "Could improve knowledge in some areas of cloud computing",
          "praise": false
        }
      ]
    },
    "skills": {
      "technical": {
        "overallScore": 85,
        "skills": [
          {"name": "JavaScript", "score": 90},
          {"name": "React", "score": 85}
        ]
      },
      "soft": {
        "overallScore": 80,
        "skills": [
          {"name": "Communication", "score": 85},
          {"name": "Leadership", "score": 75},
          {"name": "Problem Solving", "score": 82},
          {"name": "Teamwork", "score": 84},
          {"name": "Time Management", "score": 78}
        ]
      },
      "culture": {
        "overallScore": 75,
        "skills": [
          {"name": "Adaptability", "score": 80},
          {"name": "Initiative", "score": 70},
          {"name": "Values Alignment", "score": 75},
          {"name": "Growth Mindset", "score": 78}
        ]
      }
    },
    "skillInsights": {
      "matchedSkills": [
        "JavaScript",
        "React"
      ],
      "missingSkills": [
        "DevOps",
        "GraphQL"
      ],
      "skillGaps": [
        {"name": "Cloud Computing", "percentage": 65},
        {"name": "Mobile Development", "percentage": 45}
      ],
      "learningPaths": [
        {"title": "Advanced React Patterns", "provider": "Frontend Masters"},
        {"title": "Cloud Certification", "provider": "AWS"}
      ]
    },
    "recommendation": "Recommend"
  }
}

Ensure the JSON is valid, with no trailing commas. Base all evaluations strictly on the interview transcript content.
For timestamps in the highlights, use the format HH:MM:SS based on relative positions in the transcript.
Assume the position is for a software development role unless specified otherwise in the transcript.

For the recommendation field, use ONLY one of these three values:
- "Recommend" (for strong candidates, overall score 80+)
- "Consider" (for candidates with potential but some weaknesses, overall score 60-79)
- "Reject" (for candidates who don't meet minimum requirements, overall score below 60)

IMPORTANT: The recommendation value must be EXACTLY one of these three strings: "Recommend", "Consider", or "Reject". 
Do not use variations, additional text, or different capitalization.

Be fair and objective in your assessment, focusing on evidence from the transcript rather than assumptions.`

// Initialize the prompts in the database
export const initPrompts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results = []

    // Add CV analysis prompt
    const cvExisting = await ctx.db
      .query("prompts")
      .withIndex("by_name", (q) => q.eq("name", "cv_analysis"))
      .first()

    if (!cvExisting) {
      const cvId = await ctx.db.insert("prompts", {
        name: "cv_analysis",
        content: CV_ANALYSIS_PROMPT,
        description: "Prompt for analyzing candidate CVs and resumes",
        lastUpdated: Date.now(),
        updatedBy: "system_init",
      })
      results.push({ type: "insert", name: "cv_analysis", id: cvId })
    } else {
      results.push({ type: "exists", name: "cv_analysis", id: cvExisting._id })
    }

    // Add interview analysis prompt
    const interviewExisting = await ctx.db
      .query("prompts")
      .withIndex("by_name", (q) => q.eq("name", "interview_analysis"))
      .first()

    if (!interviewExisting) {
      const interviewId = await ctx.db.insert("prompts", {
        name: "interview_analysis",
        content: INTERVIEW_ANALYSIS_PROMPT,
        description: "Prompt for analyzing interview transcripts",
        lastUpdated: Date.now(),
        updatedBy: "system_init",
      })
      results.push({
        type: "insert",
        name: "interview_analysis",
        id: interviewId,
      })
    } else {
      results.push({
        type: "exists",
        name: "interview_analysis",
        id: interviewExisting._id,
      })
    }

    return results
  },
})
