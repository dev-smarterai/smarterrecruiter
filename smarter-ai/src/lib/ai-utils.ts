// This file contains shared AI utilities for consistency across chat components

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

/**
 * Message type for AI chat interactions
 */
export interface ChatMessage {
  id: number | string;
  content: string;
  sender: "user" | "ai";
  timestamp?: string; // Optional timestamp for display purposes
}

/**
 * Convert UI chat messages to the format expected by the OpenAI API
 */
export function formatMessagesForApi(messages: ChatMessage[]) {
  return messages.map(msg => ({
    role: msg.sender === "user" ? "user" : "assistant",
    content: msg.content
  }));
}

/**
 * Format an AI response to ensure natural language (no Markdown)
 */
export async function formatResponse(content: string): Promise<string> {
  if (!content) return content;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const formatUrl = new URL('/api/openai-format', baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').toString();

    const response = await fetch(formatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      console.error('Error formatting response:', response.statusText);
      return content; // Return original content if formatting fails
    }

    const data = await response.json();
    return data.content || content;
  } catch (error) {
    console.error('Error in formatResponse:', error);
    return content; // Return original content if there's an error
  }
}

// Define all functions the AI can call
const functions = [
  {
    name: "createJob",
    description: "Create a new job listing based on user-provided details like title, description, requirements, location, etc.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the job position"
        },
        description: {
          type: "string",
          description: "Detailed description of the job role and responsibilities, potentially derived from user's detailed input"
        },
        requirements: {
          type: "string",
          description: "Required qualifications and skills for the position, extracted from user's message"
        },
        location: {
          type: "string",
          description: "Location of the job (city, state, country or 'Remote')"
        },
        salary: {
          type: "string",
          description: "Salary range or compensation details, if mentioned"
        },
        company: {
          type: "string",
          description: "Company name offering the position, if mentioned"
        },
        employmentType: {
          type: "string",
          description: "Type of employment (e.g., Full-time, Part-time, Contract)",
          enum: ["Full-time", "Part-time", "Contract", "Temporary", "Internship"]
        }
      },
      required: ["title", "description", "requirements", "location", "employmentType"]
    }
  },
  {
    name: "deleteJob",
    description: "Delete an existing job listing based on identifying information like title, company, or location.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the job position to delete"
        },
        company: {
          type: "string",
          description: "Company name to help identify the specific job, if provided"
        },
        location: {
          type: "string",
          description: "Location to help identify the specific job, if provided"
        }
      },
      required: ["title"]
    }
  },
  {
    name: "scheduleInterview",
    description: "Schedule an interview with a candidate, capturing details like name, position, date, time, location, and type.",
    parameters: {
      type: "object",
      properties: {
        candidateId: {
          type: "string",
          description: "The ID of the candidate (if known or mentioned)"
        },
        candidateName: {
          type: "string",
          description: "The name of the candidate to interview"
        },
        position: {
          type: "string",
          description: "The position/job title the candidate is interviewing for"
        },
        date: {
          type: "string",
          description: "The date of the interview (YYYY-MM-DD format)"
        },
        time: {
          type: "string",
          description: "The time of the interview (HH:MM format, 24-hour)"
        },
        location: {
          type: "string",
          description: "The location of the interview (physical location or 'Remote')"
        },
        meetingLink: {
          type: "string",
          description: "Video conferencing link for remote interviews (optional)"
        },
        interviewType: {
          type: "string",
          description: "Type of interview (e.g., Technical, HR, Cultural Fit)",
          enum: ["Technical", "HR", "Behavioral", "Cultural Fit", "Initial Screening", "Final Round", "General"]
        },
        notes: {
          type: "string",
          description: "Additional notes or instructions for the interview"
        },
        jobId: {
          type: "string",
          description: "The ID of the job position (if known or mentioned)"
        }
      },
      // Make candidateName required if candidateId is not provided, handled by backend/frontend logic after function call
      required: ["position", "date", "time", "interviewType", "candidateName"]
    }
  },
  {
    name: "navigateToPage",
    description: "Navigate to a specific page or section of the application based on user intent. Use this when users want to go to, view, or access different parts of the system.",
    parameters: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          description: "The user's navigation intent or what they want to access"
        },
        route: {
          type: "string",
          description: "The specific route to navigate to (if known)"
        },
        query: {
          type: "string",
          description: "The original user query that indicates navigation intent"
        }
      },
      required: ["intent", "query"]
    }
  }
];

/**
 * Call the OpenAI API with streaming support
 */
export async function streamChatResponse(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: any) => void,
  includeDatabase?: boolean
) {
  try {
    const apiMessages = formatMessagesForApi(messages);

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender !== "user") {
      throw new Error("Last message must be from user");
    }

    // Always enable database context - the AI will determine when to use it
    console.log("Streaming with database context enabled");

    let endpoint = '/api/openai-chat';
    let requestBody: any = {
      messages: apiMessages,
      functions: functions, // Always provide all functions
      stream: true // Request streaming
    };

    // Make the streaming API call
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Check if the error response indicates a function call that prevented streaming
      try {
        const errorData = await response.json();
        if (errorData?.message?.includes("tool_calls") || errorData?.message?.includes("function_call")) {
          console.warn("Streaming failed due to function call generation. Falling back to non-streaming.");
          onError(new Error("Function call generated, fallback to non-streaming")); // Signal fallback
          return;
        }
      } catch (parseError) {
        // Ignore parsing error, throw original error
      }
      throw new Error(`API error: ${response.status}`);
    }

    // Server-sent events handler
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) {
      throw new Error('Response body is null');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const eventChunks = chunk
          .split('\n\n') // Use correct newline splitting for SSE
          .filter(line => line.trim() !== '' && line.startsWith('data: '));

        for (const eventChunk of eventChunks) {
          const dataLine = eventChunk.substring(5).trim(); // Remove 'data: ' prefix

          if (dataLine === '[DONE]') {
            console.log("Stream finished [DONE]");
            onComplete(fullResponse);
            return;
          }

          try {
            const parsed = JSON.parse(dataLine);

            // Handle content chunks
            if (parsed.content) {
              onChunk(parsed.content);
              fullResponse += parsed.content;
            }

            // Detect if a function call occurred mid-stream (should ideally not happen with well-behaved backends)
            if (parsed.functionCall || parsed.tool_calls) {
              console.log("Function call detected during streaming, collecting it:", parsed.functionCall || parsed.tool_calls);
              
              // Process function call and send it to the handler
              if (parsed.functionCall) {
                // For performDatabaseSearch, we want to ensure we send the complete function call
                // to avoid parsing errors
                try {
                  // Validate the function call has complete arguments
                  const functionCall = parsed.functionCall;
                  const isValid = functionCall.name && 
                                 functionCall.arguments && 
                                 (functionCall.arguments.startsWith('{') && 
                                  functionCall.arguments.endsWith('}'));
                  
                  if (isValid) {
                    // Only handle the function call if it's for the approved functions
                    // Skip handling database search as a function call
                    if (functionCall.name === "createJob" || 
                        functionCall.name === "deleteJob" || 
                        functionCall.name === "scheduleInterview" ||
                        functionCall.name === "navigateToPage") {
                      // Send the function call as a special chunk that the UI will intercept
                      onChunk(`[FUNCTION:${JSON.stringify(functionCall)}]`);
                      
                      reader.cancel(); // Cancel further streaming
                      onComplete(fullResponse); // Signal completion of the text stream
                      return;
                    } else {
                      console.log(`Ignoring function call to ${functionCall.name} - not in approved list`);
                    }
                  } else {
                    console.log("Incomplete function call detected, waiting for more chunks");
                  }
                } catch (e) {
                  console.error("Error processing function call:", e);
                }
              }
              
              if (parsed.tool_calls) {
                // Handle newer tool_calls format
                // Only handle the approved tools
                const toolCall = parsed.tool_calls[0];
                if (toolCall && 
                    toolCall.function && 
                    (toolCall.function.name === "createJob" || 
                     toolCall.function.name === "deleteJob" || 
                     toolCall.function.name === "scheduleInterview" ||
                     toolCall.function.name === "navigateToPage")) {
                  onChunk(`[FUNCTION:${JSON.stringify({
                    name: toolCall.function.name,
                    arguments: toolCall.function.arguments
                  })}]`);
                  
                  reader.cancel(); // Cancel further streaming
                  onComplete(fullResponse); // Signal completion of the text stream
                  return;
                }
              }
            }

          } catch (e) {
            console.error('Error parsing SSE data:', dataLine, e);
            // Potentially handle malformed JSON if necessary, or just log
          }
        }
      }
      // If loop finishes without [DONE] (e.g., connection closed prematurely)
      onComplete(fullResponse);
    } catch (error) {
      console.error("Error reading stream:", error);
      reader.cancel();
      onError(error);
    }
  } catch (error) {
    console.error("Error in streamChatResponse setup:", error);
    onError(error);
  }
}

/**
 * Call the OpenAI API with the given messages
 * Now supports an optional streaming flag and callbacks
 */
export async function sendChatRequest(
  messages: ChatMessage[],
  options?: {
    stream?: boolean,
    includeDatabase?: boolean,
    onChunk?: (chunk: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: any) => void
  }
) : Promise<{
    success: boolean;
    message?: string;
    functionCall?: { name: string; arguments: string };
    error?: string;
    streaming?: boolean; // Indicates if streaming was initiated
}> {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.sender !== "user") {
    throw new Error("Last message must be from user");
  }

  const shouldStream = options?.stream;
  // Always include database context to let the AI decide when to use it
  const includeDatabase = true;

  // If streaming is requested and callbacks are provided, attempt streaming
  if (shouldStream && options.onChunk && options.onComplete && options.onError) {
    // Wrap the stream call in a promise to handle the potential immediate fallback
    return new Promise((resolve) => {
      const streamingOnError = (error: any) => {
        if (error.message?.includes("fallback to non-streaming")) {
          // Fallback was signaled, resolve the promise to trigger non-streaming path
          console.log("Streaming failed, initiating non-streaming request...");
          resolve(sendChatRequest(messages, { ...options, stream: false })); // Retry without streaming
        } else {
          // Actual streaming error
          if(options.onError) options.onError(error);
          resolve({ success: false, error: error.message || "Streaming error" });
        }
      };

      streamChatResponse(
        messages,
        options.onChunk,
        options.onComplete,
        streamingOnError, // Use the wrapped error handler
        includeDatabase  // Pass includeDatabase flag
      );
      // Indicate that streaming was *attempted*
      // The actual response content will come via callbacks
      resolve({ success: true, message: "", streaming: true });
    });
  }

  // Non-streaming implementation or fallback path
  console.log("Executing non-streaming chat request...");
  try {
    const apiMessages = formatMessagesForApi(messages);

    // Always use the chat endpoint, assuming it handles functions
    const endpoint = '/api/openai-chat';
    const requestBody: any = {
      messages: apiMessages,
      functions: functions, // Always send functions
      stream: false, // Explicitly non-streaming
      includeDatabase // Pass the includeDatabase flag
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
       const errorBody = await response.text();
       console.error("API Error Response:", errorBody);
       throw new Error(`API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();

    // Handle function calls (tool_calls prioritized)
    let functionCall = null;
    if (data.message?.tool_calls && data.message.tool_calls.length > 0) {
        const toolCall = data.message.tool_calls[0];
        if (toolCall.type === 'function' && toolCall.function) {
            functionCall = {
                name: toolCall.function.name,
                arguments: toolCall.function.arguments
            };
            console.log("Detected tool_call:", functionCall);
        }
    } else if (data.message?.function_call) { // Fallback for older format
        functionCall = data.message.function_call;
        console.log("Detected function_call:", functionCall);
    }

    if (functionCall) {
        return {
            success: true,
            message: "", // No conversational message needed
            functionCall: functionCall
        };
    }

    // If no function call, process the text response
    const responseContent = data.message?.content || "";
    const formattedMessage = await formatResponse(responseContent);

    return {
      success: true,
      message: formattedMessage,
      streaming: false // Explicitly false
    };
  } catch (error) {
    console.error("Error calling OpenAI API (non-streaming):", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      streaming: false // Explicitly false
    };
  }
}

/**
 * Templates for common recruitment queries - Can be kept for UI buttons but aren't used for classification anymore
 */
export const recruitmentTemplates = {
  findCandidates: "Find the top performing candidate for the Junior Software Developer role.",
  reviewResumes: "Can you review the resume for testuser?",
  scheduleInterviews: "Schedule an interview with testuser for 4pm Tuesday.",
  jobPostings: "Create a job for a Chief of staff. ",
  checkRolePerformance: "Show me the performance metrics for the [position] role. I'd like to see shortlisting rate, skills analysis, and top candidates.",
  rescheduleInterview: "Reschedule the interview with [Candidate Name] for the [Position] role from [Original Date/Time] to [New Date] at [New Time].",
  upcomingInterviews: "Show me my upcoming interviews.",
};

// Perform semantic vector search on the database
// Updated to use the vectorSearch.ts endpoints
export async function performVectorSearch(query: string, tableName?: string, limit?: number) {
  try {
    console.log(`Performing semantic search: query="${query}", table=${tableName}, limit=${limit}`);
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

    // Use the vectorSearch endpoint for semantic searching
    const formattedResults = await convex.action(api.vectorSearch.performSemanticSearch, {
      query: query,
      tableName: tableName,
      limit: limit || 10 // Default limit if not specified
    });

    console.log("Semantic search completed successfully");
    return {
      success: true,
      results: formattedResults // Formatted string with search results ready for display
    };
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return {
      success: false,
      error: `Failed to perform database search: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}