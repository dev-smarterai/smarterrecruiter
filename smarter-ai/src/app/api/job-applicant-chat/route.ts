import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

// Message type definition
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  candidateId?: string;
  jobId?: string;
  stream?: boolean;
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { messages, candidateId, jobId, stream = false } = body;

    console.log("Job information chat request:", { candidateId, jobId, stream });
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request body. Messages array is required.' },
        { status: 400 }
      );
    }

    // We still need candidateId for authentication purposes
    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidateId is required for authentication.' },
        { status: 400 }
      );
    }
    
    // Initialize OpenAI client with API key from environment variables
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Verify API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key configuration error' },
        { status: 500 }
      );
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');
    
    // Extract the last user message
    const lastMessage = [...messages].reverse().find(msg => msg.role === 'user');
    
    // Get job information using the jobId (directly from jobs table)
    let jobInfo = '';
    
    try {
      console.log(`Fetching job information for jobId: ${jobId || 'not provided'}`);
      
      if (jobId) {
        try {
          // Use getJobInformation instead of getJobByMeetingCode to get all job fields
          const job = await convex.query(api.jobs.getJobInformation, { meetingCode: jobId });
          
          console.log("Job lookup result:", job ? "Job found" : "Job not found");
          
          if (job) {
            // Format job information using the actual job data
            jobInfo = "# Job Information\n\n";
            jobInfo += `## ${job.title || "Job Position"}\n\n`;
            
            // Add company if available
            if (job.company) {
              jobInfo += `**Company**: ${job.company}\n\n`;
            }
            
            // Add location if available
            if (job.location) {
              jobInfo += `**Location**: ${job.location}\n\n`;
            }
            
            // Add job type if available
            if (job.type) {
              jobInfo += `**Employment Type**: ${job.type}\n\n`;
            }
            
            // Add experience level if available
            if (job.level) {
              jobInfo += `**Level**: ${job.level}\n\n`;
            }
            
            // Add salary if available
            if (job.salary && job.salary.min && job.salary.max) {
              jobInfo += `**Salary Range**: $${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()} ${job.salary.period || 'yearly'}\n\n`;
            }
            
            // Add description if available
            if (job.description) {
              jobInfo += "## Job Description\n\n";
              
              if (job.description.intro) {
                jobInfo += `${job.description.intro}\n\n`;
              }
              
              if (job.description.details) {
                jobInfo += "### Details\n\n";
                jobInfo += `${job.description.details}\n\n`;
              }
              
              if (job.description.responsibilities) {
                jobInfo += "### Key Responsibilities\n\n";
                jobInfo += `${job.description.responsibilities}\n\n`;
              }
              
              if (job.description.closing) {
                jobInfo += `${job.description.closing}\n\n`;
              }
            }
            
            // Add requirements as bullet points if available
            if (job.requirements && job.requirements.length > 0) {
              jobInfo += "## Requirements\n\n";
              job.requirements.forEach(req => {
                jobInfo += `- ${req}\n`;
              });
              jobInfo += "\n";
            }
            
            // Add desirables as bullet points if available
            if (job.desirables && job.desirables.length > 0) {
              jobInfo += "## Nice to Have\n\n";
              job.desirables.forEach(item => {
                jobInfo += `- ${item}\n`;
              });
              jobInfo += "\n";
            }
            
            // Add benefits as bullet points if available
            if (job.benefits && job.benefits.length > 0) {
              jobInfo += "## Benefits\n\n";
              job.benefits.forEach(benefit => {
                jobInfo += `- ${benefit}\n`;
              });
              jobInfo += "\n";
            }
          } else {
            // If specific job not found, fallback to a semantic search 
            console.log("Job not found by ID, falling back to semantic search");
            
            const searchPromise = convex.action(api.vectorSearch.performSemanticSearch, {
              query: "job details",
              limit: 3,
              tableName: "jobs",
            });
            
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Search timed out")), 10000);
            });
            
            jobInfo = await Promise.race([searchPromise, timeoutPromise]) as string;
            
            if (!jobInfo || jobInfo.includes("couldn't find any relevant information")) {
              jobInfo = "I couldn't find specific information about this job. You can ask general questions about job responsibilities, requirements, or other aspects you'd like to know about.";
            }
          }
        } catch (fetchError) {
          console.error("Error fetching job:", fetchError);
          
          // Fallback to generic response
          jobInfo = "I'm having trouble retrieving detailed information about the job right now. You can still ask questions and I'll do my best to help with general job information.";
        }
      } else {
        // If no jobId provided, just give a generic message
        jobInfo = "I don't have specific information about the job you're asking about. Please provide more details in your questions so I can try to help you better.";
      }
    } catch (error) {
      console.error('Error retrieving job information:', error);
      jobInfo = "I'm having difficulty accessing the job database at the moment. Please try again later.";
    }
    
    // Fetch candidate information and CV analysis
    let candidateInfo = '';
    try {
      console.log(`Fetching candidate information for candidateId: ${candidateId}`);
      
      if (candidateId) {
        // Get candidate data using the getCandidate function
        const candidate = await convex.query(api.candidates.getCandidate, { 
          id: candidateId as Id<"candidates"> 
        });
        
        if (candidate) {
          candidateInfo = "# Candidate Information\n\n";
          candidateInfo += `## ${candidate.name || "Candidate"}\n\n`;
          
          // Add basic info
          if (candidate.email) {
            candidateInfo += `**Email**: ${candidate.email}\n\n`;
          }
          
          if (candidate.position) {
            candidateInfo += `**Position**: ${candidate.position}\n\n`;
          }
          
          // Add CV information if available
          if (candidate.candidateProfile && candidate.candidateProfile.cv) {
            const cv = candidate.candidateProfile.cv;
            
            candidateInfo += "## CV Highlights\n\n";
            
            // Add highlights as bullet points
            if (cv.highlights && cv.highlights.length > 0) {
              cv.highlights.forEach(highlight => {
                candidateInfo += `- ${highlight}\n`;
              });
              candidateInfo += "\n";
            }
            
            // Add key insights
            if (cv.keyInsights && cv.keyInsights.length > 0) {
              candidateInfo += "## Key Insights\n\n";
              cv.keyInsights.forEach(insight => {
                candidateInfo += `- ${insight}\n`;
              });
              candidateInfo += "\n";
            }
            
            // Add CV score if available
            if (cv.score !== undefined) {
              candidateInfo += `**CV Match Score**: ${cv.score}/100\n\n`;
            }
          }
          
          // Try to get CV summary from files
          const resumeData = await convex.query(api.files.getResumeByCandidateId, {
            candidateId: candidateId as Id<"candidates">
          });
          
          if (resumeData && resumeData.cvSummary) {
            candidateInfo += "## CV Summary\n\n";
            candidateInfo += `${resumeData.cvSummary}\n\n`;
          }
          
          // Add skills if available
          if (candidate.candidateProfile && candidate.candidateProfile.skills) {
            const skills = candidate.candidateProfile.skills;
            
            candidateInfo += "## Skills Assessment\n\n";
            
            // Technical skills
            if (skills.technical && skills.technical.skills && skills.technical.skills.length > 0) {
              candidateInfo += "### Technical Skills\n\n";
              skills.technical.skills.forEach(skill => {
                candidateInfo += `- ${skill.name}: ${skill.score}/100\n`;
              });
              candidateInfo += "\n";
            }
            
            // Soft skills
            if (skills.soft && skills.soft.skills && skills.soft.skills.length > 0) {
              candidateInfo += "### Soft Skills\n\n";
              skills.soft.skills.forEach(skill => {
                candidateInfo += `- ${skill.name}: ${skill.score}/100\n`;
              });
              candidateInfo += "\n";
            }
          }
          
          // Add skill insights if available
          if (candidate.candidateProfile && candidate.candidateProfile.skillInsights) {
            const skillInsights = candidate.candidateProfile.skillInsights;
            
            // Matched skills
            if (skillInsights.matchedSkills && skillInsights.matchedSkills.length > 0) {
              candidateInfo += "### Matched Skills\n\n";
              skillInsights.matchedSkills.forEach(skill => {
                candidateInfo += `- ${skill}\n`;
              });
              candidateInfo += "\n";
            }
            
            // Missing skills
            if (skillInsights.missingSkills && skillInsights.missingSkills.length > 0) {
              candidateInfo += "### Missing Skills\n\n";
              skillInsights.missingSkills.forEach(skill => {
                candidateInfo += `- ${skill}\n`;
              });
              candidateInfo += "\n";
            }
          }
          
          // Add experience info if available
          if (candidate.candidateProfile && candidate.candidateProfile.career) {
            const career = candidate.candidateProfile.career;
            
            if (career.experience) {
              candidateInfo += `**Experience**: ${career.experience}\n\n`;
            }
            
            if (career.past_roles) {
              candidateInfo += `**Past Roles**: ${career.past_roles}\n\n`;
            }
            
            if (career.progression) {
              candidateInfo += `**Career Progression**: ${career.progression}\n\n`;
            }
          }
        } else {
          candidateInfo = "No detailed candidate information is available.";
        }
      } else {
        candidateInfo = "No candidate ID was provided, so I don't have specific information about you.";
      }
    } catch (error) {
      console.error('Error retrieving candidate information:', error);
      candidateInfo = "I couldn't retrieve your candidate information at this time.";
    }
    
    // Create the system prompt with job and candidate context
    const systemContent = `You are an AI assistant helping a job applicant with questions about a job.

${jobInfo ? jobInfo : "I don't have specific information about this job position right now."}

${candidateInfo ? candidateInfo : "I don't have your candidate information at this time."}

Use the above information to answer questions about the job and provide relevant insights about how the candidate's profile matches the requirements. Focus on being helpful, accurate, and concise.

GUIDELINES:
- Be helpful, friendly, and concise in your responses.
- Focus primarily on providing information about the job described above.
- When relevant, highlight how the candidate's experience and skills match the job requirements.
- Use bullet points for lists to improve readability.
- Keep your responses focused and relevant to the user's question.
- If you don't know the answer to a specific question, be honest about it.
- Be professional but conversational in tone.
- NEVER make up or invent details about the job that aren't in the provided information.
- Do not discuss application status, interviews, or hiring decisions.
- IMPORTANT: Any time the user asks about "the job" or "this job" or anything related to job information, ALWAYS respond with details from the job information above.
- When the user asks about their fit for the role, refer to the candidate information to provide personalized insights.

Remember that you are helping someone learn more about a job position they're interested in and how they might be a good fit for it.`;

    // Create the system message
    const systemMessage = {
      role: 'system' as const,
      content: systemContent
    };
    
    // Ensure all messages have valid roles
    const validMessages = messages.filter((msg: Message) => 
      ['user', 'assistant', 'system'].includes(msg.role)
    );
    
    // Replace any existing system message or add a new one
    const messagesToSend = [
      systemMessage,
      ...validMessages.filter(msg => msg.role !== "system")
    ];
    
    // Configure OpenAI request
    const openAIConfig: any = {
      model: "gpt-4-turbo-preview",
      messages: messagesToSend,
      temperature: 0.7,
      max_tokens: 1000,
      stream: stream,
    };

    // If streaming is requested, return a streaming response
    if (stream) {
      console.log("Starting streaming response");
      
      // Create an OpenAI streaming request
      const fetchResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(openAIConfig)
      });
      
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error(`OpenAI API error: ${fetchResponse.status}`, errorText);
        throw new Error(`OpenAI API error: ${fetchResponse.status}`);
      }
      
      // Return the stream
      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              // Handle the stream from OpenAI
              if (!fetchResponse.body) {
                throw new Error('Response body is null');
              }
              
              const reader = fetchResponse.body.getReader();
              const decoder = new TextDecoder();
              const encoder = new TextEncoder();
              
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                  break;
                }
                
                // Decode the chunk
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    
                    if (data === '[DONE]') {
                      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                      continue;
                    }
                    
                    try {
                      const parsed = JSON.parse(data);
                      const content = parsed.choices?.[0]?.delta?.content || '';
                      
                      if (content) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                      }
                    } catch (e) {
                      console.error('Error parsing streaming data:', e);
                    }
                  }
                }
              }
              
              controller.close();
            } catch (error) {
              console.error('Streaming error:', error);
              controller.error(error);
            }
          }
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        }
      );
    } else {
      // For non-streaming requests
      console.log("Sending non-streaming request to OpenAI");
      const response = await openai.chat.completions.create(openAIConfig);
      const message = response.choices[0].message;
      
      return NextResponse.json({ message });
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
} 