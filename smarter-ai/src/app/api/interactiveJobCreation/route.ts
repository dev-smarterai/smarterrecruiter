import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const runtime = 'edge';

// Define the structure for job data
interface JobData {
  title?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  skills?: string[];
  benefits?: string;
  location?: string;
  salaryRange?: string;
  jobLevel?: string;
  experienceLevel?: string;
  jobType?: {
    remote?: boolean;
    fullTime?: boolean;
    hybrid?: boolean;
  };
  company?: string;
  companyLogo?: string;
  featured?: boolean;
  desirables?: string;
  education?: string;
  type?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
}

// Define the structure for chat messages
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Define the response structure
interface InteractiveJobResponse {
  conversationalResponse: string;
  jobDataUpdates: Partial<JobData>;
  needsMoreInfo: boolean;
  suggestedQuestions: string[];
  _incomplete: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, currentJobData }: { messages: ChatMessage[], currentJobData: JobData } = body;
    
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage.role !== 'user') {
      return new Response(JSON.stringify({ error: 'Last message must be from user' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enhanced system prompt that encourages comprehensive job generation
    const systemPrompt = `You are an expert HR assistant who creates comprehensive, professional job postings. You are PROACTIVE and THOROUGH in generating job content.

CURRENT JOB DATA: ${JSON.stringify(currentJobData, null, 2)}

CORE PRINCIPLES:
1. BE PROACTIVE: Generate comprehensive job content even with minimal input
2. FILL IN INTELLIGENT DEFAULTS: Use industry standards and best practices
3. ASK ONLY ESSENTIAL QUESTIONS: Only ask when absolutely necessary for critical details
4. GENERATE COMPLETE SECTIONS: Create full descriptions, responsibilities, requirements, etc.
5. ALWAYS INCLUDE SALARY: Generate realistic salary ranges based on job title and level

WHEN USER PROVIDES JOB INFO:
- Generate a COMPLETE job posting with all sections filled
- Use industry knowledge to create comprehensive content
- ALWAYS include salary information in both formats (salaryRange string AND salary object)
- Only ask follow-up questions for truly critical missing info (like specific company requirements)
- Default to common industry practices for benefits, requirements, etc.

RESPONSE FORMAT (ALWAYS VALID JSON):
{
  "conversationalResponse": "Your helpful response explaining what you've created",
  "jobDataUpdates": {
    // ALWAYS include comprehensive updates - don't be sparse!
    // Generate full content for ALL fields:
    "title": "Professional job title",
    "description": "2-3 paragraph company/role overview", 
    "responsibilities": "6-8 detailed bullet points of key duties",
    "requirements": "5-7 specific qualifications and experience requirements",
    "skills": ["8-12 relevant technical and soft skills"],
    "benefits": "6-8 attractive benefits (health, dental, 401k, PTO, remote work, etc.)",
    "location": "Location (default to 'Remote' unless specified)",
    "salaryRange": "$X,000 - $Y,000 format string",
    "salary": {
      "min": 50000,
      "max": 80000, 
      "currency": "USD",
      "period": "yearly"
    },
    "jobLevel": "junior/mid/senior based on requirements",
    "experienceLevel": "X-Y years based on role",
    "education": "Education requirements",
    "jobType": { "remote": true, "fullTime": true, "hybrid": false },
    "desirables": "Nice-to-have qualifications"
  },
  "needsMoreInfo": false,
  "suggestedQuestions": [],
  "_incomplete": true
}

SALARY GENERATION GUIDELINES:
- Research typical salaries for the job title and level
- Generate both "salaryRange" (string like "$50,000 - $80,000") and "salary" object
- Entry level: $40k-60k, Mid level: $60k-90k, Senior: $90k-130k (adjust by industry)
- Tech roles typically 20-30% higher
- Always use "yearly" period and "USD" currency unless specified

CONTENT GENERATION GUIDELINES:
- TITLE: Professional, clear job titles
- DESCRIPTION: 2-3 paragraph company/role overview
- RESPONSIBILITIES: 6-8 detailed bullet points of key duties
- REQUIREMENTS: 5-7 specific qualifications and experience requirements
- SKILLS: 8-12 relevant technical and soft skills as array
- BENEFITS: 6-8 attractive benefits (health, dental, 401k, PTO, remote work, etc.)
- LOCATION: Default to "Remote" unless specified otherwise
- JOB TYPE: Default to { "remote": true, "fullTime": true, "hybrid": false }

EXAMPLES OF BEING PROACTIVE:
- User: "Software engineer job" → Generate COMPLETE posting with all sections including realistic $70k-100k salary
- User: "Marketing manager, $80k" → Generate COMPLETE posting, use the specified salary
- User: "Fill in the rest" → Complete ALL missing sections comprehensively with appropriate salaries

CONVERSATION HISTORY: ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Remember: Be comprehensive and proactive. Generate complete, professional content with realistic salaries rather than asking too many questions.`;

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const openAIStream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: latestUserMessage.content }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            stream: true,
          });
          
          let accumulatedContent = '';
          let lastSentTime = 0;
          const THROTTLE_MS = 100; // Send updates every 100ms max
          
          for await (const chunk of openAIStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            accumulatedContent += content;
            
            const now = Date.now();
            
            // Throttle updates to prevent overwhelming the client
            if (now - lastSentTime > THROTTLE_MS) {
              try {
                // Try to parse the accumulated JSON
                const response = JSON.parse(accumulatedContent);
                
                // Send the parsed response
                const streamResponse: InteractiveJobResponse = {
                  conversationalResponse: response.conversationalResponse || '',
                  jobDataUpdates: response.jobDataUpdates || {},
                  needsMoreInfo: response.needsMoreInfo ?? false,
                  suggestedQuestions: response.suggestedQuestions || [],
                  _incomplete: true
                };
                
                controller.enqueue(encoder.encode(JSON.stringify(streamResponse) + '\n'));
                lastSentTime = now;
              } catch (e) {
                // JSON not complete yet, continue accumulating
                // Send a minimal update to show progress with dynamic messages
                if (accumulatedContent.includes('"conversationalResponse"')) {
                  // Determine what stage we're at based on content length and keywords
                  let progressMessage = 'Analyzing your request...';
                  const contentLength = accumulatedContent.length;
                  
                  // More sophisticated progress detection based on content
                 if (contentLength > 100 && contentLength < 300) {
                    progressMessage = 'Processing job details...';
                  } else if (contentLength > 300 && contentLength < 600) {
                    progressMessage = 'Structuring job posting...';
                  } else if (contentLength > 600 && contentLength < 900) {
                    progressMessage = 'Crafting role description...';
                  } else if (contentLength > 900 && contentLength < 1200) {
                    progressMessage = 'Finalizing requirements...';
                  } else if (contentLength > 1200 && contentLength < 1500) {
                    progressMessage = 'Polishing job details...';
                  } else if (contentLength > 1500) {
                    progressMessage = 'Completing job posting...';
                  }
                  
                  const partialResponse: InteractiveJobResponse = {
                    conversationalResponse: progressMessage,
                    jobDataUpdates: {},
                    needsMoreInfo: false,
                    suggestedQuestions: [],
                    _incomplete: true
                  };
                  controller.enqueue(encoder.encode(JSON.stringify(partialResponse) + '\n'));
                  lastSentTime = now;
                }
              }
            }
          }
          
          // Final processing
          try {
            const finalResponse = JSON.parse(accumulatedContent);
            const completedResponse: InteractiveJobResponse = {
              conversationalResponse: finalResponse.conversationalResponse || 'Job posting updated successfully!',
              jobDataUpdates: finalResponse.jobDataUpdates || {},
              needsMoreInfo: finalResponse.needsMoreInfo ?? false,
              suggestedQuestions: finalResponse.suggestedQuestions || [],
              _incomplete: false
            };
            
            controller.enqueue(encoder.encode(JSON.stringify(completedResponse) + '\n'));
          } catch (e) {
            console.error('Final JSON parsing failed:', e);
            // Send a fallback response
            const fallbackResponse: InteractiveJobResponse = {
              conversationalResponse: "I've updated your job posting with the information provided.",
              jobDataUpdates: {},
              needsMoreInfo: false,
              suggestedQuestions: [],
              _incomplete: false
            };
            controller.enqueue(encoder.encode(JSON.stringify(fallbackResponse) + '\n'));
          }
          
          controller.close();
          
        } catch (error) {
          console.error('OpenAI streaming error:', error);
          
          const errorResponse: InteractiveJobResponse = {
            conversationalResponse: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
            jobDataUpdates: {},
            needsMoreInfo: true,
            suggestedQuestions: ["Could you please try rephrasing your request?"],
            _incomplete: false
          };
          
          controller.enqueue(encoder.encode(JSON.stringify(errorResponse) + '\n'));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error: any) {
    console.error('Error in interactive job creation:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      conversationalResponse: "I'm sorry, something went wrong. Please try again.",
      jobDataUpdates: {},
      needsMoreInfo: true,
      suggestedQuestions: [],
      _incomplete: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 