import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    console.error("GROQ_API_KEY environment variable is not set.");
    return NextResponse.json({ error: "Server configuration error: Missing Groq API key." }, { status: 500 });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing 'text' parameter in request body." }, { status: 400 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "playai-tts-arabic",
        input: text,
        voice: "Khalid-PlayAI", // Using the specified voice
        response_format: "wav" // Defaulting to wav, can change if needed
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Groq API Error (${response.status}): ${errorBody}`);
      return NextResponse.json({ error: `Groq API error: ${response.statusText}`, details: errorBody }, { status: response.status });
    }

    // Stream the audio response back to the client
    const audioBlob = await response.blob();

    // Return the audio blob with the correct content type
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav', // Match the response_format
      },
    });

  } catch (error) {
    console.error("Error in Groq TTS proxy route:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Internal server error", details: errorMessage }, { status: 500 });
  }
} 