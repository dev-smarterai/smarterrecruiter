import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol";
import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant,
} from "livekit-server-sdk";
import { NextResponse } from "next/server";

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// Keep the GET endpoint for backward compatibility
export async function GET() {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    // Generate participant token
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;
    const participantToken = await createParticipantToken(
      { identity: participantIdentity },
      roomName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
    };
    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

// Add POST endpoint for interview system prompts
export async function POST(request: Request) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    // Check if the request is coming from the /yc or /a16z page
    const referer = request.headers.get('referer');
    const ycPageHeader = request.headers.get('X-From-YC-Page');
    const a16zPageHeader = request.headers.get('X-From-A16Z-Page');
    const isFromYCPage = (referer && referer.includes('/yc')) || ycPageHeader === 'true';
    const isFromA16ZPage = (referer && referer.includes('/a16z')) || a16zPageHeader === 'true';
    const isDemoPage = isFromYCPage || isFromA16ZPage;
    
    console.log("[LiveKit API] Request referer:", referer);
    console.log("[LiveKit API] YC page header:", ycPageHeader);
    console.log("[LiveKit API] A16Z page header:", a16zPageHeader);
    console.log("[LiveKit API] Is from YC page:", isFromYCPage);
    console.log("[LiveKit API] Is from A16Z page:", isFromA16ZPage);

    try {
      // Get the system prompt from the request body
      const requestBody = await request.json();
      console.log("[LiveKit API] Request body keys:", Object.keys(requestBody));
      
      const {
        systemPrompt: instructions,
        candidateName,
        jobTitle,
        model,
        video_id,
        isDemo, // New parameter to indicate if this is a demo request
        isYCPage: isYCPageFlag,
        isA16ZPage: isA16ZPageFlag,
      } = requestBody;

      // Add additional flag from request body
      if (isYCPageFlag) {
        console.log("[LiveKit API] isYCPage flag is set in request body");
      }
      
      if (isA16ZPageFlag) {
        console.log("[LiveKit API] isA16ZPage flag is set in request body");
      }

      // Validate system prompt is provided - relaxed for demo mode
      if (!isDemo && !isDemoPage && (!instructions || typeof instructions !== 'string' || instructions.trim().length < 100)) {
        const errorMessage = "ERROR: System prompt is too short or invalid. A comprehensive job-specific system prompt is required.";
        console.error(errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      console.log("===== USING INSTRUCTIONS IN LIVEKIT CONNECTION =====");
      console.log("Instructions length:", instructions?.length || 'N/A (demo mode)');
      console.log("Model:", model || "groq-arabic (default)");
      console.log("Video ID:", video_id);
      console.log("Is demo:", isDemo ? "Yes" : "No");
      console.log("Is YC page (from headers or flags):", isFromYCPage);
      console.log("Is A16Z page (from headers or flags):", isFromA16ZPage);
      console.log("===================================================");

      // Generate participant token with additional metadata
      const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000_000)}`;
      const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

      // Add candidate name if provided
      const displayName = candidateName ? candidateName : "";

      // For demo mode or demo pages, use a default system prompt if none provided
      let demoPageType = isFromYCPage ? "YC" : isFromA16ZPage ? "A16Z" : "";
      const finalInstructions = isDemo || isDemoPage 
        ? (instructions || `You are an AI assistant conducting a job interview for a ${demoPageType} demo. Be professional and friendly. Ask about the candidate's experience and skills. Mention that this is a technology demonstration for Smarter.ai - the AI-powered interview platform.`)
        : instructions;

      console.log("[LiveKit API] Final instructions length:", finalInstructions.length);

      const participantToken = await createParticipantTokenWithPrompt(
        { identity: participantIdentity, name: displayName },
        roomName,
        finalInstructions,
        jobTitle || "Demo Position",
        model || "groq", // Use the model parameter or default to groq
        video_id,
      );

      // Return connection details
      const data: ConnectionDetails = {
        serverUrl: LIVEKIT_URL,
        roomName,
        participantToken: participantToken,
        participantName: participantIdentity,
      };

      const headers = new Headers({
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*", // Allow from any origin
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Referer, X-From-YC-Page, X-From-A16Z-Page",
      });

      console.log("[LiveKit API] Successfully generated connection details");
      return NextResponse.json(data, { headers });
    } catch (jsonError) {
      console.error("[LiveKit API] JSON parsing error:", jsonError);
      return NextResponse.json(
        { error: "Error parsing request body: " + String(jsonError) },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[LiveKit API] Top-level error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: Request) {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Referer, X-From-YC-Page, X-From-A16Z-Page",
    "Access-Control-Max-Age": "86400", // 24 hours
  });
  
  return new NextResponse(null, { status: 204, headers });
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "50m",
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  at.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: "smarter-agent",
      }),
    ],
  });
  return at.toJwt();
}

// Function to create a token with instructions metadata
function createParticipantTokenWithPrompt(
  userInfo: AccessTokenOptions,
  roomName: string,
  instructions: string,
  jobTitle?: string,
  model?: string,
  video_id?: string
) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "50m",
    metadata: JSON.stringify({ instructions, job_title: jobTitle || "Interview Position", model: model || "groq-arabic", video_id: video_id || "" }),
  });

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };

  at.addGrant(grant);

  // Set up agent configuration
  at.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: "smarter-agent",
      }),
    ],
  });

  return at.toJwt();
}
