import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Message type definition
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  functions?: any[];
  forceFunction?: string;
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { messages, functions, forceFunction } = body;
    
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

    // Create a system message focused on function execution
    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI recruitment assistant that specializes in managing job listings and scheduling interviews. 
      
${forceFunction === 'createJob' 
  ? 'Your task is to create a new job listing based on the user\'s request. Extract all relevant details about the job from the conversation and use the createJob function. If any required information is missing, use reasonable defaults based on the job title and industry standards.' 
  : forceFunction === 'deleteJob'
  ? 'Your task is to delete an existing job listing based on the user\'s request. Extract the job title, company, and location from the conversation and use the deleteJob function to remove it from the database.'
  : forceFunction === 'scheduleInterview'
  ? 'Your task is to schedule an interview based on the user\'s request. Extract the candidate name/ID, position, date, time, location and interview type from the conversation and use the scheduleInterview function to create the interview. If any required information is missing, ask for it specifically.'
  : 'Use the appropriate function based on the user\'s request. For job creation, deletion, or interview scheduling, extract all relevant details and use the corresponding function rather than responding with text.'}

Always use the appropriate function rather than responding with text. Be thorough in extracting all relevant information from the user's request.`
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
    
    // Configure OpenAI request for function calling
    const openAIConfig: any = {
      model: "gpt-4-turbo-preview",
      messages: messagesToSend,
      temperature: 0.7,
      max_tokens: 1000,
    };

    // Add functions and force the function call
    if (functions && Array.isArray(functions) && functions.length > 0) {
      openAIConfig.functions = functions;
      
      if (forceFunction) {
        openAIConfig.function_call = { name: forceFunction };
      } else {
        openAIConfig.function_call = "auto";
      }
    }

    const response = await openai.chat.completions.create(openAIConfig);
    
    // Get the assistant's message
    const assistantMessage = response.choices[0].message;
    
    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Error in OpenAI functions API route:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 