import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { RequestType } from '@/lib/ai-utils';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Missing message parameter' },
        { status: 400 }
      );
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Verify API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key configuration error' },
        { status: 500 }
      );
    }

    // Create a system prompt for classification
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a classifier for recruitment assistant requests. Classify the user message into one of these categories:
          
1. DATABASE_QUERY - Questions about existing candidates, jobs, or other data in the recruitment database
2. CREATE_JOB - Requests to create a new job listing (includes job titles, descriptions, requirements)
3. DELETE_JOB - Requests to delete or remove an existing job listing
4. SCHEDULE_INTERVIEW - Requests to schedule or arrange interviews with candidates
5. GENERAL_QUESTION - General questions about recruitment or other topics

Respond with ONLY the category number (1-5) that best matches the request.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.1,
      max_tokens: 5
    });

    // Extract and validate the category
    const result = response.choices[0].message.content.trim();
    let type: RequestType;
    
    if (result === "1" || result.includes("DATABASE_QUERY")) {
      type = RequestType.DATABASE_QUERY;
    } else if (result === "2" || result.includes("CREATE_JOB")) {
      type = RequestType.CREATE_JOB;
    } else if (result === "3" || result.includes("DELETE_JOB")) {
      type = RequestType.DELETE_JOB;
    } else if (result === "4" || result.includes("SCHEDULE_INTERVIEW")) {
      type = RequestType.SCHEDULE_INTERVIEW;
    } else {
      type = RequestType.GENERAL_QUESTION;
    }

    console.log(`Classified "${message}" as ${RequestType[type]}`);
    
    return NextResponse.json({ type });
  } catch (error) {
    console.error('Error in classification:', error);
    return NextResponse.json(
      { error: 'An error occurred during classification', type: RequestType.GENERAL_QUESTION },
      { status: 500 }
    );
  }
} 