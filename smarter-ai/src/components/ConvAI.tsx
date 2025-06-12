"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConversation } from "@11labs/react";
import { cn } from "@/lib/utils";

interface ConvAIProps {
  onStatusChange?: (isActive: boolean) => void;
  className?: string;
  onConversationInstance?: (conversation: any) => void;
  onMessage?: (message: any) => void;
  dynamicVariables?: Record<string, string>;
}

async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch {
    console.error("Microphone permission denied");
    return false;
  }
}

async function getSignedUrl(): Promise<string> {
  try {
    const response = await fetch("/api/signed-url");
    if (!response.ok) {
      console.warn("Failed to get signed URL from server, falling back to mock URL");
      return "mock-signed-url";
    }
    const data = await response.json();
    
    // If it's our mock URL, log for debugging
    if (data.isMock) {
      console.log("Using mock signed URL for development");
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error("Error fetching signed URL:", error);
    console.warn("Falling back to mock URL due to error");
    return "mock-signed-url";
  }
}

export function ConvAI({ onStatusChange, className, onConversationInstance, onMessage, dynamicVariables }: ConvAIProps) {
  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs connected");
      onStatusChange?.(true);
    },
    onDisconnect: () => {
      console.log("ElevenLabs disconnected");
      onStatusChange?.(false);
    },
    onError: error => {
      console.error("ElevenLabs error:", error);
      alert("An error occurred during the conversation");
      onStatusChange?.(false);
    },
    onMessage: message => {
      console.log("ElevenLabs onMessage raw:", message);
      
      // Pass the message to the parent component if callback is provided
      if (onMessage) {
        try {
          // Handle both string and object messages
          if (typeof message === 'string') {
            console.log("ElevenLabs string message:", message);
            onMessage(message);
          } 
          else if (message && typeof message === 'object') {
            console.log("ElevenLabs object message:", JSON.stringify(message, null, 2));
            onMessage(message);
          }
        } catch (err) {
          console.error("Error handling ElevenLabs message:", err);
        }
      }
    },
    // Additional handlers for specific message types
    onTranscript: (transcript: any) => {
      console.log("ElevenLabs onTranscript:", transcript);
      if (onMessage) {
        try {
          onMessage({
            type: 'transcript',
            text: transcript.text || "",
            is_final: transcript.is_final || false,
            speaker: 'user' // Transcripts are typically from the user
          });
        } catch (err) {
          console.error("Error handling transcript:", err);
        }
      }
    },
    onAgentMessage: (agentMessage: any) => {
      console.log("ElevenLabs onAgentMessage:", agentMessage);
      if (onMessage) {
        try {
          onMessage({
            type: 'agent_message',
            text: typeof agentMessage === 'string' ? agentMessage : (agentMessage.text || ""),
            speaker: 'ai'
          });
        } catch (err) {
          console.error("Error handling agent message:", err);
        }
      }
    }
  });

  // Pass the conversation instance to the parent component
  React.useEffect(() => {
    if (onConversationInstance) {
      onConversationInstance(conversation);
    }
  }, [conversation, onConversationInstance]);

  async function startConversation() {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert("No permission");
      return;
    }
    const signedUrl = await getSignedUrl();
    
    // Include dynamic variables if provided
    const sessionConfig: any = { signedUrl };
    if (dynamicVariables && Object.keys(dynamicVariables).length > 0) {
      console.log("Starting with dynamic variables:", dynamicVariables);
      sessionConfig.dynamic_variables = dynamicVariables;
    }
    
    const conversationId = await conversation.startSession(sessionConfig);
    console.log(conversationId);
  }

  const stopConversation = React.useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className={cn("flex justify-center items-center gap-x-4", className)}>
      <Card className={"rounded-3xl bg-white"}>
        <CardContent>
          <CardHeader>
            <CardTitle className={"text-center"}>
              {conversation.status === "connected"
                ? conversation.isSpeaking
                  ? `Agent is speaking`
                  : "Agent is listening"
                : "Disconnected"}
            </CardTitle>
          </CardHeader>
          <div className={"flex flex-col gap-y-4 text-center"}>
            <div
              className={cn(
                "orb my-16 mx-12",
                conversation.status === "connected" && conversation.isSpeaking
                  ? "orb-active animate-orb"
                  : conversation.status === "connected"
                  ? "animate-orb-slow orb-inactive"
                  : "orb-inactive"
              )}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 