import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const runtime = 'edge'; // Use edge runtime for better streaming support

export async function POST(request: NextRequest) {
  try {
    // Extract job information from request body
    const body = await request.json();
    const { title, existingDescription, existingResponsibilities, existingRequirements, existingSkills, existingBenefits } = body;
    
    if (!title) {
      return new Response(JSON.stringify({ error: 'No job title provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a system prompt that instructs the AI about the task
    const systemPrompt = `You are an expert HR professional creating compelling job descriptions. 
Generate high-quality, professional content for a job posting based on the provided title.
Your responses should be detailed, specific, and directly usable in a job posting.`;

    // Build a prompt based on the job title and any existing content
    let prompt = `Create a professional job description for a "${title}" position.`;
    prompt += `\n\nProvide the following sections:
1. Job description (1-2 paragraphs)
2. Responsibilities (5-8 bullet points, separated by newlines)
3. Requirements (5-8 bullet points, separated by newlines)
4. Skills (5-8 skills as a comma-separated list)
5. Benefits (4-6 bullet points, separated by newlines)

Return the results in a JSON object with the following keys:
- description: the full job description text (string)
- responsibilities: the bulleted list of responsibilities (string with entries separated by newlines)
- requirements: the bulleted list of requirements (string with entries separated by newlines) 
- skills: an array of skill strings
- benefits: the bulleted list of benefits (string with entries separated by newlines)

Make sure all string values are properly formatted as strings, not arrays or objects.
`;

    if (existingDescription) {
      prompt += `\nExisting description to improve or build upon: "${existingDescription}"\n`;
    }
    
    if (existingResponsibilities) {
      prompt += `\nExisting responsibilities to improve or build upon: "${existingResponsibilities}"\n`;
    }
    
    if (existingRequirements) {
      prompt += `\nExisting requirements to improve or build upon: "${existingRequirements}"\n`;
    }
    
    if (existingSkills) {
      prompt += `\nExisting skills to improve or build upon: "${existingSkills}"\n`;
    }
    
    if (existingBenefits) {
      prompt += `\nExisting benefits to improve or build upon: "${existingBenefits}"\n`;
    }

    // Create a streaming response using the ReadableStream API
    const encoder = new TextEncoder();
    
    // Initial template structure for the JSON
    const initialData = {
      description: '',
      responsibilities: '',
      requirements: '',
      skills: [],
      benefits: '',
      _incomplete: true // Flag to indicate streaming is in progress
    };
    
    // Store the most recently built JSON structure
    let partialData = { ...initialData };
    
    // Keep track of the content received so far (for JSON parsing)
    let accumulatedJSON = '';

    // Keep track of update count to throttle updates
    let updateCounter = 0;
    
    const stream = new ReadableStream({
      async start(controller) {
        // Send the initial skeleton structure immediately
        controller.enqueue(encoder.encode(JSON.stringify(partialData) + '\n'));
        
        // Create OpenAI streaming completion
        const openAIStream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          stream: true,
        });
        
        // Process the OpenAI stream
        try {
          let buffer = '';
          
          for await (const chunk of openAIStream) {
            // Get content from the chunk
            const content = chunk.choices[0]?.delta?.content || '';
            buffer += content;
            accumulatedJSON += content;
            
            // Increment the update counter
            updateCounter++;
            
            // Only send updates every few tokens to avoid overwhelming the client
            // Or if we have more than 20 characters accumulated
            if (updateCounter % 3 === 0 || buffer.length > 20) {
              try {
                // Try to parse the full accumulated JSON
                let completeParsedData = null;
                try {
                  completeParsedData = JSON.parse(accumulatedJSON);
                } catch (e) {
                  // Not valid JSON yet, continue with partial extraction
                }
                
                // If we have valid complete JSON, use it
                if (completeParsedData) {
                  partialData = {
                    description: typeof completeParsedData.description === 'string' ? completeParsedData.description : partialData.description,
                    responsibilities: typeof completeParsedData.responsibilities === 'string' ? completeParsedData.responsibilities : partialData.responsibilities,
                    requirements: typeof completeParsedData.requirements === 'string' ? completeParsedData.requirements : partialData.requirements,
                    skills: Array.isArray(completeParsedData.skills) ? completeParsedData.skills : 
                          (typeof completeParsedData.skills === 'string' ? completeParsedData.skills.split(',').map(s => s.trim()) : partialData.skills),
                    benefits: typeof completeParsedData.benefits === 'string' ? completeParsedData.benefits : partialData.benefits,
                    _incomplete: false
                  };
                } else {
                  // Extract partial field updates based on patterns in the accumulated text
                  // This allows streaming even before we have valid JSON
                  
                  // Check for description content
                  const descMatch = /"description"\s*:\s*"([^"]*)/i.exec(accumulatedJSON);
                  if (descMatch && descMatch[1]) {
                    partialData.description = descMatch[1];
                  }
                  
                  // Check for responsibilities content
                  const respMatch = /"responsibilities"\s*:\s*"([^"]*)/i.exec(accumulatedJSON);
                  if (respMatch && respMatch[1]) {
                    partialData.responsibilities = respMatch[1].replace(/\\n/g, '\n');
                  }
                  
                  // Check for requirements content
                  const reqMatch = /"requirements"\s*:\s*"([^"]*)/i.exec(accumulatedJSON);
                  if (reqMatch && reqMatch[1]) {
                    partialData.requirements = reqMatch[1].replace(/\\n/g, '\n');
                  }
                  
                  // Check for benefits content
                  const benMatch = /"benefits"\s*:\s*"([^"]*)/i.exec(accumulatedJSON);
                  if (benMatch && benMatch[1]) {
                    partialData.benefits = benMatch[1].replace(/\\n/g, '\n');
                  }
                  
                  // Skills are harder to extract partially, so we'll wait for valid JSON for those
                  
                  // Mark as still incomplete
                  partialData._incomplete = true;
                }
                
                // Enqueue the updated data
                controller.enqueue(encoder.encode(JSON.stringify(partialData) + '\n'));
                
                // Clear the buffer after sending
                buffer = '';
              } catch (error) {
                console.error('Error processing chunk:', error);
              }
            }
          }
          
          // Send one final update
          try {
            const finalData = JSON.parse(accumulatedJSON);
            partialData = {
              description: typeof finalData.description === 'string' ? finalData.description : partialData.description,
              responsibilities: typeof finalData.responsibilities === 'string' ? finalData.responsibilities : partialData.responsibilities,
              requirements: typeof finalData.requirements === 'string' ? finalData.requirements : partialData.requirements,
              skills: Array.isArray(finalData.skills) ? finalData.skills : 
                    (typeof finalData.skills === 'string' ? finalData.skills.split(',').map(s => s.trim()) : partialData.skills),
              benefits: typeof finalData.benefits === 'string' ? finalData.benefits : partialData.benefits,
              _incomplete: false
            };
          } catch (e) {
            // If we can't parse the final JSON, just keep what we have
            partialData._incomplete = false;
          }
          
          // Send the final data
          controller.enqueue(encoder.encode(JSON.stringify(partialData) + '\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    // Return a streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error generating job description:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
