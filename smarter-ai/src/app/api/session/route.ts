import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {        
        if (!process.env.OPENAI_API_KEY){
            throw new Error(`OPENAI_API_KEY is not set`);
        }
        
        // Parse the request body to check for a custom system prompt
        let requestBody;
        try {
            requestBody = await request.json();
        } catch (e) {
            requestBody = {}; // Default to empty object if no body
        }
        
        // Require system prompt - no fallback
        if (!requestBody.systemPrompt) {
            const errorMessage = "ERROR: No system prompt provided. A job-specific system prompt is required.";
            console.error(errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }
        
        // Additional validation of system prompt quality
        if (typeof requestBody.systemPrompt !== 'string' || requestBody.systemPrompt.trim().length < 100) {
            const errorMessage = "ERROR: System prompt is too short or invalid. A comprehensive job-specific system prompt of at least 100 characters is required.";
            console.error(errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }
        
        // Check for potential template variables that weren't replaced
        if (requestBody.systemPrompt.includes("{{") && requestBody.systemPrompt.includes("}}")) {
            const unreplacedVariables = requestBody.systemPrompt.match(/{{[^}]*}}/g);
            const errorMessage = `ERROR: System prompt contains unreplaced template variables: ${unreplacedVariables?.join(', ')}. All variables must be replaced before sending to API.`;
            console.error(errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }
        
        // Use the provided system prompt - no default fallback
        const instructions = requestBody.systemPrompt;
        
        // Log the system prompt being used
        console.log("===== USING CUSTOM SYSTEM PROMPT IN API REQUEST =====");
        console.log("System prompt length:", requestBody.systemPrompt.length);
        console.log("FULL SYSTEM PROMPT:");
        console.log(requestBody.systemPrompt);
        console.log("System prompt first 100 chars for quick identification:", requestBody.systemPrompt.substring(0, 100));
        console.log("===================================================");
        
        // Prepare the request body
        const requestBodyForOpenAI = {
            model: "gpt-4o-realtime-preview",
            voice: "ash",
            modalities: ["audio", "text"],
            instructions: instructions,
            tool_choice: "auto",
        };
        
        console.log("Sending request to OpenAI with instructions length:", instructions.length);
        
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBodyForOpenAI),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${JSON.stringify(response)}`);
        }

        const data = await response.json();

        // Return the JSON response to the client
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching session data:", error);
        return NextResponse.json({ error: "Failed to fetch session data" }, { status: 500 });
    }
}