import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

// Message type definition
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  functions?: any[];
  includeDatabase?: boolean;
  stream?: boolean; // New parameter to indicate if streaming is desired
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { messages, functions, includeDatabase, stream = false } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request body. Messages array is required.' },
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
    
    // Get the base URL for API requests
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    
    // Extract the last user message
    const lastMessage = [...messages].reverse().find(msg => msg.role === 'user');
    
    // Get database context if requested (now using vectorSearch.ts)
    let databaseContext = '';
    if (lastMessage) {
      try {
        console.log(`Performing semantic search for: "${lastMessage.content}"`);
        
        // Call the semantic search action from vectorSearch.ts
        // This action returns properly formatted markdown ready for the AI
        try {
          // Set a timeout to prevent hanging requests
          const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error("Vector search timed out")), 10000);
          });
          
          const searchPromise = convex.action(api.vectorSearch.performSemanticSearch, {
            query: lastMessage.content,
            limit: 50, // Retrieve enough results for comprehensive answers
          });
          
          databaseContext = await Promise.race([searchPromise, timeoutPromise]);
          
          console.log("Vector search response type:", typeof databaseContext);
          console.log("Vector search response length:", databaseContext ? databaseContext.length : 0);
          
          if (databaseContext && databaseContext.length > 0) {
            console.log("Database context preview:", databaseContext.slice(0, 200) + "...");
          } else {
            console.log("Empty or null database context returned from vector search");
            databaseContext = "No relevant database information found for your query.";
          }
        } catch (vectorSearchError) {
          console.error("Vector search error:", vectorSearchError);
          databaseContext = "Error retrieving database information. The system might be experiencing technical difficulties.";
        }
      } catch (error) {
        console.error('Error searching database:', error);
        databaseContext = "Error retrieving database information.";
      }
    }
    
    const systemContent = `You are an AI recruitment assistant helping the platform administrator manage candidates, jobs, and interviews.

${databaseContext && databaseContext !== "No relevant database information found for your query." && databaseContext !== "Error retrieving database information. The system might be experiencing technical difficulties." ? 
`The following information was retrieved from our recruitment database based on the user's query:

DATABASE CONTEXT:
${databaseContext}

When answering questions about candidates, jobs, or interviews, use ONLY the above information. Don't make up any details that aren't present in this database context.
` : 
`You don't have specific database information for this query. Answer based on general recruitment knowledge and best practices.`}

PRIORITY: If the user wants to navigate to a different page or section (e.g., "show me jobs", "go to candidates", "take me to dashboard"), immediately call the navigateToPage function. Navigation requests should be handled with the highest priority for instant response.

You can help with:
1. **NAVIGATION (HIGHEST PRIORITY)**: Use navigateToPage function immediately when users want to go to different pages/sections
2. Answering questions about candidates, jobs, and interviews using only information in the database context
3. Creating job listings using the createJob function
4. Deleting job listings using the deleteJob function
5. Scheduling interviews using the scheduleInterview function

IMPORTANT GUIDELINES:
- **NAVIGATION FIRST**: Always check if the user wants to navigate before doing anything else. Common navigation phrases include: "show me", "go to", "take me to", "navigate to", "open", "view", "see the", etc.
- When multiple entities with the same name/title exist (like two CTOs or two candidates named Jawad), ALWAYS identify the ambiguity and ask the admin which specific one they're referring to.
- When asked for top candidates, jobs in a specific pay bracket, or other filtered data, use ONLY the information in the database context.
- NEVER invent or hallucinate information not present in the database context.
- If asked about specific entities (candidates, jobs, interviews) that aren't in the context, explain that you don't have that information in the database.
- If asked to perform actions (delete/schedule) that require clarification due to duplicate names/titles, present the options and ask which one specifically.
- If asked to schedule an interview with a candidate name and multiple candidates with that name exist, list them and ask for clarification before proceeding.
- When listing candidates or jobs, always provide key attributes like skills, experience, salary range, etc. to help identify them.
- For salary queries, focus on jobs with matching criteria from the database context only.
- When listing any results (candidates, jobs, etc.), limit your response to a maximum of 10 items unless the admin explicitly asks for more. If there are more than 10 results available, mention this fact and offer to provide more if needed.

SPECIFIC REQUIREMENTS FOR JOB CREATION:
- When asked to create a job listing, explicitly mention ALL required fields that must be provided:
  * Job Title: The specific role (e.g., "Frontend Developer", "Project Manager")
  * Description: Detailed job responsibilities and requirements
  * Location: City and state/country
  * Salary Range: Must be a RANGE with minimum AND maximum values (e.g., "$120,000-$150,000"), not a single value
  * Company: Name of the hiring company
  * Employment Type: Full-time, Part-time, Contract, etc.
  * Required Skills: Key technical or soft skills needed
- If the user provides incomplete information (especially a single salary figure instead of a range), immediately and specifically identify what's missing. For example: "I need a salary range with both minimum and maximum values, not just '$150k'."
- For any missing field, explicitly request it with clear examples of the expected format.

Remember: You are assisting a recruitment platform administrator who relies on accurate database information. Only use data actually present in the context.`;

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
      ...validMessages.filter(msg => msg.role !== 'system')
    ];
    
    // Configure OpenAI request
    const openAIConfig: any = {
      model: "gpt-4-turbo-preview",
      messages: messagesToSend,
      temperature: 0.7,
      max_tokens: 1000,
      stream: stream, // Enable streaming if requested
    };

    // Add functions if provided
    if (functions && Array.isArray(functions) && functions.length > 0) {
      openAIConfig.functions = functions;
      openAIConfig.function_call = "auto";
    }

    // If streaming is requested, return a streaming response
    if (stream) {
      // Enable streaming in OpenAI config
      openAIConfig.stream = true;
      
      try {
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
          throw new Error(`OpenAI API error: ${fetchResponse.status}`);
        }
        

        // Return the stream with a completely new approach
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
                
                // Function call data collected throughout the stream
                let functionCallData = null;
                let functionName = '';
                let functionArgs = '';
                let toolCallIndex = -1;
                let hasToolCalls = false;
                

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

                        // If we have a function call, send it now before completing
                        if (functionCallData || (functionName && functionArgs)) {
                          try {
                            const payload = functionCallData || {
                              name: functionName,
                              arguments: functionArgs
                            };
                            controller.enqueue(
                              encoder.encode(`data: ${JSON.stringify({ functionCall: payload })}\n\n`)
                            );
                          } catch (e) {
                            console.warn('Error sending function call data at stream end:', e);
                          }
                        }
                        
                        // Send the [DONE] marker

                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                        continue;
                      }
                      
                      try {
                        const parsed = JSON.parse(data);

                        
                        // Process regular content
                        const content = parsed.choices?.[0]?.delta?.content || '';

                        if (content) {
                          controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                          );
                        }
                        
                        // COLLECT (but don't immediately send) function call data
                        const fcDelta = parsed.choices?.[0]?.delta?.function_call;
                        if (fcDelta) {
                          if (fcDelta.name) {
                            functionName = fcDelta.name;
                          }
                          if (fcDelta.arguments) {
                            functionArgs += fcDelta.arguments;
                          }
                          
                          // Only if we already have complete data (should be rare)
                          if (functionName && functionArgs && !hasToolCalls) {
                            functionCallData = {
                              name: functionName,
                              arguments: functionArgs
                            };
                          }
                        }
                        
                        // Process tool calls data - also collect don't immediately send
                        const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
                        if (toolCalls && toolCalls.length > 0) {
                          hasToolCalls = true;
                          
                          for (const toolCall of toolCalls) {
                            if (toolCall.index !== undefined && toolCall.index !== toolCallIndex) {
                              toolCallIndex = toolCall.index;
                            }
                            
                            if (toolCall.type === 'function') {
                              if (toolCall.function?.name) {
                                functionName = toolCall.function.name;
                              }
                              if (toolCall.function?.arguments) {
                                functionArgs += toolCall.function.arguments;
                              }
                              
                              // Only set if we have both name and args
                              if (functionName && functionArgs) {
                                functionCallData = {
                                  name: functionName,
                                  arguments: functionArgs
                                };
                              }
                            }
                          }
                        }
                      } catch (e) {
                        console.error('Error parsing SSE data:', e);
                      }
                    }
                  }
                }
                

                // We reached the end of the stream - make sure to send any remaining function call data
                if (functionCallData || (functionName && functionArgs)) {
                  try {
                    const payload = functionCallData || {
                      name: functionName,
                      arguments: functionArgs
                    };
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ functionCall: payload })}\n\n`)
                    );
                  } catch (e) {
                    console.warn('Error sending final function call data:', e);
                  }
                }
                
                // Final [DONE] marker

                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              } catch (error) {
                console.error('Error in stream processing:', error);
                controller.error(error);
              }
            }
          }),
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          }
        );
      } catch (error) {
        console.error('Error creating streaming response:', error);
        return NextResponse.json(
          { error: 'Error creating streaming response' },
          { status: 500 }
        );
      }
    } else {
      // Non-streaming response (existing behavior)
      const response = await openai.chat.completions.create(openAIConfig);
      
      // Get the assistant's message
      const assistantMessage = response.choices[0].message;
      
      // Create a compatible function_call from tool_calls if present
      let functionCall = null;
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0];
        if (toolCall.type === 'function' && toolCall.function) {
          functionCall = {
            name: toolCall.function.name,
            arguments: toolCall.function.arguments
          };
        }
      }
      
      // Explicitly include any function call in the response to ensure they work properly
      return NextResponse.json({ 
        message: {
          ...assistantMessage,
          function_call: functionCall || assistantMessage.function_call
        }
      });
    }
  } catch (error) {
    console.error('Error in OpenAI chat API route:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 