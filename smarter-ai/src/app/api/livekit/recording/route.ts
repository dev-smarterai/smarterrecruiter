import { 
  EgressClient, 
  EncodedFileOutput, 
  EncodingOptionsPreset, 
  RoomCompositeOptions,
  SegmentedFileOutput,
  S3Upload
} from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

// LiveKit API credentials from environment variables
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

// AWS S3 credentials (optional - configure if using S3 upload)
const S3_ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.AWS_S3_SECRET_KEY;
const S3_REGION = process.env.AWS_S3_REGION;
const S3_BUCKET = process.env.AWS_S3_BUCKET;

// Create a new EgressClient instance
const getEgressClient = () => {
  if (!API_KEY || !API_SECRET || !LIVEKIT_URL) {
    throw new Error("Missing LiveKit credentials");
  }
  
  // Ensure LIVEKIT_URL is properly formatted
  // For Egress API, convert WebSocket URLs to HTTPS
  let livekitUrl = LIVEKIT_URL;
  if (livekitUrl.startsWith('wss://')) {
    livekitUrl = livekitUrl.replace('wss://', 'https://');
  } else if (livekitUrl.startsWith('ws://')) {
    livekitUrl = livekitUrl.replace('ws://', 'http://');
  } else if (!livekitUrl.startsWith('http://') && !livekitUrl.startsWith('https://')) {
    livekitUrl = `https://${livekitUrl}`;
  }
  
  console.log(`Using LiveKit URL: ${livekitUrl}`);
  return new EgressClient(livekitUrl, API_KEY, API_SECRET);
};

/**
 * Starts a recording of a LiveKit room
 * Supports different output types: mp4, hls
 * 
 * NOTE: This endpoint begins recording and stores the file temporarily on LiveKit's servers.
 * After recording completes, use the GET endpoint with uploadToConvex=true to:
 * 1. Download the recorded file from LiveKit
 * 2. Upload it to Convex storage
 */
export async function POST(request: Request) {
  try {
    const { 
      roomName,
      output_type = "mp4", 
      layout = "grid",
      preset = "H264_720P_30",  // Default to 720p 30fps
      s3Upload = false,         // Whether to upload to S3
      fileName,                 // Optional custom filename
      candidateId               // Optional candidate ID for later upload to Convex
    } = await request.json();

    if (!roomName) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // Log request details
    console.log(`Starting recording for room: ${roomName} with output type: ${output_type}`);
    
    const egressClient = getEgressClient();
    const timestamp = Date.now();
    const fileBaseName = fileName || `${roomName}_${timestamp}`;
    
    let result;

    // Handle different output types according to the docs
    if (output_type === "hls") {
      // For HLS output - create segment files for streaming
      const outputOptions: any = {
        room_name: roomName,
        layout,
        preset,
        options: {
          roomComposite: {
            roomName,
            layout,
            encodingOptions: {
              "case": preset,
              "value": {}
            }
          }
        },
        output: {
          segment_outputs: [{
            filename_prefix: fileBaseName,
            playlist_name: `${fileBaseName}.m3u8`,
            segment_duration: 2,
            // Store files temporarily on LiveKit's servers
            direct: true
          }]
        }
      };
      
      // Add S3 configuration if needed
      if (s3Upload && S3_ACCESS_KEY && S3_SECRET_KEY && S3_BUCKET) {
        outputOptions.output.segment_outputs[0].s3 = {
          access_key: S3_ACCESS_KEY,
          secret: S3_SECRET_KEY,
          region: S3_REGION,
          bucket: S3_BUCKET
        };
        // Remove direct flag when using S3
        delete outputOptions.output.segment_outputs[0].direct;
      }
      
      console.log("Using egress options for HLS:", JSON.stringify(outputOptions, null, 2));
      
      // Get properly formatted LiveKit URL for API calls
      let livekitUrl = LIVEKIT_URL;
      if (livekitUrl?.startsWith('wss://')) {
        livekitUrl = livekitUrl.replace('wss://', 'https://');
      } else if (livekitUrl?.startsWith('ws://')) {
        livekitUrl = livekitUrl.replace('ws://', 'http://');
      } else if (livekitUrl && !livekitUrl.startsWith('http://') && !livekitUrl.startsWith('https://')) {
        livekitUrl = `https://${livekitUrl}`;
      }
      
      if (!livekitUrl) {
        throw new Error("Missing LiveKit URL");
      }
      
      console.log(`Using LiveKit URL for API call: ${livekitUrl}`);
      
      // Use the lower-level API directly since that's what the examples show
      const response = await fetch(`${livekitUrl}/twirp/livekit.Egress/StartRoomCompositeEgress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${generateLiveKitToken()}`
        },
        body: JSON.stringify(outputOptions)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LiveKit Egress API error: ${response.status} ${errorText}`);
        throw new Error(`LiveKit Egress API error: ${response.status} ${errorText}`);
      }
      
      result = await response.json();
      console.log("HLS recording started successfully:", result);
    } else {
      // Default - MP4 file output (single file)
      const outputOptions: any = {
        room_name: roomName,
        layout,
        preset,
        options: {
          roomComposite: {
            roomName,
            layout,
            encodingOptions: {
              "case": preset,
              "value": {}
            }
          }
        },
        output: {
          file_outputs: [{
            filepath: `${fileBaseName}.${output_type}`,
            // Store files temporarily on LiveKit's servers
            direct: true
          }]
        }
      };
      
      // Add S3 configuration if needed
      if (s3Upload && S3_ACCESS_KEY && S3_SECRET_KEY && S3_BUCKET) {
        outputOptions.output.file_outputs[0].s3 = {
          access_key: S3_ACCESS_KEY,
          secret: S3_SECRET_KEY,
          region: S3_REGION,
          bucket: S3_BUCKET
        };
        // Remove direct flag when using S3
        delete outputOptions.output.file_outputs[0].direct;
      }
      
      console.log("Using egress options for MP4:", JSON.stringify(outputOptions, null, 2));
      
      // Get properly formatted LiveKit URL for API calls
      let livekitUrl = LIVEKIT_URL;
      if (livekitUrl?.startsWith('wss://')) {
        livekitUrl = livekitUrl.replace('wss://', 'https://');
      } else if (livekitUrl?.startsWith('ws://')) {
        livekitUrl = livekitUrl.replace('ws://', 'http://');
      } else if (livekitUrl && !livekitUrl.startsWith('http://') && !livekitUrl.startsWith('https://')) {
        livekitUrl = `https://${livekitUrl}`;
      }
      
      if (!livekitUrl) {
        throw new Error("Missing LiveKit URL");
      }
      
      console.log(`Using LiveKit URL for API call: ${livekitUrl}`);
      
      // Use the lower-level API directly since that's what the examples show
      const response = await fetch(`${livekitUrl}/twirp/livekit.Egress/StartRoomCompositeEgress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${generateLiveKitToken()}`
        },
        body: JSON.stringify(outputOptions)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LiveKit Egress API error: ${response.status} ${errorText}`);
        throw new Error(`LiveKit Egress API error: ${response.status} ${errorText}`);
      }
      
      result = await response.json();
      console.log("MP4 recording started successfully:", result);
    }

    // Store candidate ID in a session if provided, for later use
    if (candidateId) {
      // We'll use this later when uploading to Convex
      // This is a simple way to associate the recording with a candidate
      console.log(`Recording started for candidate: ${candidateId}`);
    }

    return NextResponse.json({ 
      egressId: result.egress_id,
      status: result.status,
      roomName,
      outputType: output_type,
      layoutUsed: layout,
      candidateId // Return the candidateId if it was provided
    });
  } catch (error) {
    console.error("Error starting recording:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Generate a LiveKit API token for Egress API calls
 */
function generateLiveKitToken() {
  if (!API_KEY || !API_SECRET) {
    throw new Error("LiveKit API credentials are missing");
  }
  
  const payload = {
    iss: API_KEY,
    sub: "egress-client",
    jti: Math.random().toString(36).substring(2, 15),
    video: {
      room: "*", // Allow access to all rooms for egress
      roomAdmin: true,
      roomCreate: true,
      roomRecord: true // Add roomRecord permission required for Egress API
    },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
  };
  
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  // Simple JWT implementation for this example
  const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const signature = require('crypto')
    .createHmac('sha256', API_SECRET)
    .update(`${headerBase64}.${payloadBase64}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `${headerBase64}.${payloadBase64}.${signature}`;
}

// API endpoint to stop a recording
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const egressId = searchParams.get("egressId");

    if (!egressId) {
      return NextResponse.json(
        { error: "Egress ID is required" },
        { status: 400 }
      );
    }

    console.log(`Stopping recording with egress ID: ${egressId}`);
    const egressClient = getEgressClient();
    
    // Call the stopEgress method
    await egressClient.stopEgress(egressId);
    console.log(`Successfully stopped recording with egress ID: ${egressId}`);

    return NextResponse.json({ 
      message: "Recording stopped successfully",
      egressId: egressId 
    });
  } catch (error) {
    console.error("Error stopping recording:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Utility function to attempt converting string to Convex ID
const tryConvertToConvexId = (idString: string): Id<"candidates"> | null => {
  try {
    // In a real implementation, we would need to validate this is a proper ID
    // Here we're relying on Convex's type checking at runtime
    return idString as unknown as Id<"candidates">;
  } catch (e) {
    console.error("Failed to convert string to Convex ID:", e);
    return null;
  }
};

// API endpoint to get the status of a recording and optionally upload to Convex
/**
 * Gets the status of a recording and optionally uploads the recording to Convex storage
 * 
 * This endpoint has two functions:
 * 1. Check the status of a recording using the egressId
 * 2. When uploadToConvex=true and recording is complete:
 *    - Download the recording from LiveKit's temporary storage
 *    - Upload it to Convex storage
 *    - Associate it with the candidate (if candidateId is provided)
 * 
 * Example usage:
 * - Just check status: GET /api/livekit/recording?egressId=EG_123456
 * - Upload to Convex: GET /api/livekit/recording?egressId=EG_123456&uploadToConvex=true&candidateId=123
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const egressId = searchParams.get("egressId");
    const uploadToConvex = searchParams.get("uploadToConvex") === "true";
    const candidateId = searchParams.get("candidateId");

    if (!egressId) {
      return NextResponse.json(
        { error: "Egress ID is required" },
        { status: 400 }
      );
    }

    const egressClient = getEgressClient();
    // Use listEgress with egressId option
    const results = await egressClient.listEgress({
      egressId: egressId
    });

    if (results.length === 0) {
      return NextResponse.json({ message: "Recording not found" });
    }
    
    const egress = results[0];
    
    // If upload to Convex was requested, and the recording is complete,
    // and candidateId is provided, upload the recording to Convex
    if (uploadToConvex && 
        egress.status.toString() === "EGRESS_COMPLETE" && 
        candidateId && 
        CONVEX_URL) {
      
      // Get the file URL from the egress result
      let fileUrl: string | null = null;
      
      // Handle different output types
      // Using type assertion to access properties that may not be in the type definition
      const egressAny = egress as any;
      
      if (egressAny.file?.url) {
        // Single MP4 file
        fileUrl = egressAny.file.url;
      } else if (egressAny.playlist?.url) {
        // HLS playlist
        fileUrl = egressAny.playlist.url;
      }

      if (!fileUrl) {
        return NextResponse.json(
          { 
            error: "No file URL found in egress result",
            egress: egress
          },
          { status: 500 }
        );
      }

      try {
        // Download the file from LiveKit
        const fileResponse = await fetch(fileUrl);
        
        if (!fileResponse.ok) {
          return NextResponse.json(
            { error: `Failed to download file: ${fileResponse.statusText}` },
            { status: 500 }
          );
        }

        // Get file details for Convex
        const fileData = await fileResponse.blob();
        const fileName = egressAny.file?.filename || `recording_${egressId}.mp4`;
        const fileSize = fileData.size;
        const fileType = fileData.type || "video/mp4";

        // Upload to Convex
        const convex = new ConvexHttpClient(CONVEX_URL);
        
        // Use mutation for generateUploadUrl since it's defined as a mutation
        const uploadUrl = await convex.mutation(api.files.generateUploadUrl);
        
        // Upload file to Convex storage
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": fileType,
          },
          body: fileData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload to Convex failed: ${uploadResponse.statusText}`);
        }

        // Get the storage ID from the response
        const uploadResult = await uploadResponse.json();
        const storageId = uploadResult.storageId;

        if (!storageId) {
          throw new Error("Failed to get storage ID from Convex");
        }

        // Convert candidateId string to a Convex ID type
        const convexCandidateId = tryConvertToConvexId(candidateId);
        
        if (!convexCandidateId) {
          throw new Error(`Invalid candidate ID format: ${candidateId}`);
        }

        // Save file reference in Convex database with proper ID type
        const fileDoc = await convex.mutation(api.files.saveFileId, {
          fileId: storageId,
          fileName: fileName,
          fileSize: fileSize,
          fileType: fileType,
          candidateId: convexCandidateId,
          fileCategory: "meeting_recording"
        });

        return NextResponse.json({
          egress: egress,
          convexUpload: {
            success: true,
            fileId: fileDoc,
            fileName: fileName
          }
        });
      } catch (error) {
        console.error("Error uploading to Convex:", error);
        return NextResponse.json({
          egress: egress,
          convexUpload: {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          }
        });
      }
    }

    // If we're not uploading to Convex, or if there was an error,
    // just return the egress information
    return NextResponse.json(egress);
  } catch (error) {
    console.error("Error getting recording status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 