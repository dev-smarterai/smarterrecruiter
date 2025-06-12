import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

// Initialize OpenAI client for analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Default prompt template if we can't get it from the database
const DEFAULT_SYSTEM_PROMPT = `
You are an expert AI recruiter assistant that analyzes interview transcripts. I will provide you with a transcript of an interview, and I need you to analyze technical skills, soft skills, and cultural fit, then provide a structured JSON response with scores and insights.
`;

// Get the prompt template from Convex database
async function getPromptTemplate(): Promise<string> {
  try {
    // Fetch the interview analysis prompt from Convex
    const prompt = await convex.query(api.prompts.getByName, { name: "interview_analysis" });
    console.log("Prompt:", prompt);
    if (prompt && prompt.content) {
      console.log("Retrieved interview analysis prompt from database");
      return prompt.content;
    } else {
      console.log("Interview analysis prompt not found in database, using default");
      return DEFAULT_SYSTEM_PROMPT;
    }
  } catch (error) {
    console.error("Error fetching prompt from Convex:", error);
    // Fall back to the default prompt if there are any issues
    return DEFAULT_SYSTEM_PROMPT;
  }
}

// Function to analyze interview transcript using OpenAI
async function analyzeTranscriptWithOpenAI(transcript: any[]): Promise<any> {
  try {
    // Get the prompt template from Convex
    console.log("Loading interview analysis prompt template...");
    const systemPrompt = await getPromptTemplate();
    
    // Format transcript for OpenAI
    const formattedTranscript = transcript.map(entry => 
      `[${entry.timestamp}] ${entry.sender.toUpperCase()}: ${entry.text}`
    ).join("\n\n");
    
    console.log("Sending transcript to OpenAI for analysis...");
    console.log(`Transcript length: ${formattedTranscript.length} characters`);
    
    // Call OpenAI API with the transcript - improved system message to ensure complete output
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert AI recruiter assistant who specializes in thoroughly analyzing interview transcripts. CRITICALLY IMPORTANT: You MUST always return a complete JSON response with ALL fields populated according to the structure I provide, even for very short transcripts. For short or incomplete transcripts, provide lower scores but still complete the full analysis. NEVER return empty arrays or missing fields. Focus on technical skills, soft skills (communication, problem-solving, leadership, teamwork), and cultural fit. Your recommendation MUST be EXACTLY one of these: 'Recommend', 'Consider', or 'Reject'."
        },
        {
          role: "user",
          content: systemPrompt + "\n\nHere is the interview transcript:\n\n" + formattedTranscript
        }
      ],
      temperature: 0.5,
      max_tokens: 4000,
      top_p: 0.9,
      presence_penalty: 0.0,
      frequency_penalty: 0.0,
    });
    
    // Extract text from response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Unexpected empty response from OpenAI");
    }
    
    console.log("OpenAI analysis response length:", content.length);
    console.log("Sample of response:", content.substring(0, 200));
    
    try {
      // Find JSON in the response
      const jsonMatches = content.match(/\{[\s\S]*\}/);
      if (!jsonMatches) {
        throw new Error("No JSON found in OpenAI's response");
      }
      
      const jsonStr = jsonMatches[0];
      const parsedResponse = JSON.parse(jsonStr);
      
      // Return the parsed response directly
      return parsedResponse;
    } catch (parseError: any) {
      console.error("Error parsing OpenAI response as JSON:", parseError);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error("Error analyzing transcript with OpenAI:", error);
    throw new Error(`Failed to analyze transcript with OpenAI: ${error.message || "Unknown error"}`);
  }
}

// Simple API handler for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Interview Analysis API is working!' }, { status: 200 });
}

// API route handler for interview transcript analysis
export async function POST(request: NextRequest) {
  console.log("API route /api/analyze-transcript called");
  
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set in environment variables");
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }
  
  try {
    const data = await request.json();
    
    // Validate request data
    if (!data.transcript || !Array.isArray(data.transcript) || data.transcript.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty transcript provided' }, { status: 400 });
    }
    
    // Check that transcript items have the required structure
    const validTranscript = data.transcript.every((item: any) => 
      item.sender && typeof item.sender === 'string' &&
      item.text && typeof item.text === 'string' &&
      item.timestamp && typeof item.timestamp === 'string'
    );
    
    if (!validTranscript) {
      return NextResponse.json({ 
        error: 'Transcript items must contain sender, text, and timestamp fields' 
      }, { status: 400 });
    }
    
    console.log(`Processing transcript with ${data.transcript.length} entries`);
    
    // Analyze transcript with OpenAI
    console.log("Starting OpenAI transcript analysis...");
    const analysis = await analyzeTranscriptWithOpenAI(data.transcript);
    
    console.log("Analysis complete, returning results");
    return NextResponse.json(analysis, { status: 200 });
  } catch (error: any) {
    console.error('Error processing interview transcript:', error);
    return NextResponse.json({ error: `Server error processing transcript: ${error.message}` }, { status: 500 });
  }
}