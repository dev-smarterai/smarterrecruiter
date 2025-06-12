import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface FormatRequestBody {
  content: string;
}

// Define allowed origins (use '*' for development, specific origin for production)
const allowedOrigin = process.env.NODE_ENV === 'production' 
    ? 'https://smarter-ai.vercel.app' 
    : '*'; // Or 'http://localhost:YOUR_FRONTEND_PORT' for local dev

// Function to create CORS headers
const getCorsHeaders = (origin: string | null) => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Add any other headers your frontend sends
  };
  // If the origin is allowed (or using '*'), set the Allow-Origin header
  if (origin === allowedOrigin || allowedOrigin === '*') {
    headers['Access-Control-Allow-Origin'] = origin || allowedOrigin; // Use specific origin if matched, else '*' or configured origin
  }
  return headers;
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);
  return new Response(null, { status: 204, headers }); // Use 204 No Content for OPTIONS
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Immediately check if the origin is allowed before processing
  // This check might be redundant if you trust the OPTIONS preflight, 
  // but adds a layer of security for direct POST requests.
  if (allowedOrigin !== '*' && origin !== allowedOrigin) {
       console.warn(`[CORS Block] Origin ${origin} not allowed.`);
       return new Response('CORS error: Origin not allowed', { status: 403 }); // Return forbidden
  }

  try {
    const body: FormatRequestBody = await req.json();
    const { content } = body;
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400, headers: corsHeaders });
    }
    
    // Initialize OpenAI client with API key from environment variables
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Verify API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return NextResponse.json({ error: 'API key configuration error' }, { status: 500, headers: corsHeaders });
    }

    // Create a system prompt for formatting responses
    const systemPrompt = `
You are a formatter for AI responses. Your task is to transform the provided AI output into natural, conversational language while keeping the factual information intact.

Follow these specific rules:
1. Remove all Markdown symbols (**, ##, -, etc.) without altering the message's content or structure.
2. Convert any lists or bullet points into natural language sentences using appropriate transitions (such as "First," "Additionally," "Also," "Finally," etc.).
3. Keep paragraph breaks for readability but don't use Markdown line breaks.
4. Ensure the tone remains conversational and professional.
5. Preserve all facts, names, and specific details exactly as presented.
6. Don't embellish or add information beyond what's in the original response.
7. Don't use phrases like "Based on the database" or "According to our records" - simply present the information directly.
8. Numbers can be written as digits or spelled out, whichever flows better in the context.
9. For job descriptions and candidate profiles, present the information in a clear, readable format that flows naturally.
10. REMOVE all references to database tables like "Table: candidates" or similar technical metadata.
11. For search results, restructure the data to be more reader-friendly. For example, if you see:
   - "1. Candidate: Adrian (83.8% relevance) Table: candidates Name: Adrian Email: adrian@example.com..."
   - Format it as: "1. Adrian - Email: adrian@example.com..."
12. When formatting lists of people, make each entry a distinct paragraph with clear separation.
13. Don't include any meta-commentary about the formatting process.

For database search results specifically:
- Remove the header "Here's what I found in the database:" and similar phrases
- Clean up the output by removing any internal database references
- If the content appears to be candidate information, focus on presenting their name, skills, experience, and contact info in a clear format
- DO INCLUDE all AI scores, match percentages, test scores, interview ratings, and other quantitative information about candidates

Always maintain the meaning and detail level of the original message, but prioritize human-readable formatting.`;

    // Call OpenAI to process the response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
      ],
      temperature: 0.3, // Lower temperature for more consistent formatting
      max_tokens: 1000,
    });
    
    // Get the formatted response
    const formattedContent = response.choices[0].message.content || content;
    
    // Add CORS headers to the successful response
    return NextResponse.json({ content: formattedContent }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error formatting content:', error);
    // Add CORS headers to the error response
    return NextResponse.json({ error: 'Failed to format content' }, { status: 500, headers: corsHeaders });
  }
} 