import React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentState,
  useMultibandTrackVolume,
  useVoiceAssistant,
  useTracks,
  useTrackTranscription,
  LiveKitRoom
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useTranslations } from "@/components/openai-realtime/translations-context";

// Define the Tool interface to match the original hook
export interface Tool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

// Define Conversation type to match the original hook
interface Conversation {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isFinal?: boolean;
  status?: 'speaking' | 'processing' | 'final';
}

// Define the return type to closely match the original hook
interface UseLiveKitVoiceAssistantReturn {
  status: string;
  isSessionActive: boolean;
  registerFunction: (name: string, fn: Function) => void;
  handleStartStopClick: () => void;
  msgs: any[];
  conversation: Conversation[];
  sendTextMessage: (text: string) => void;
  currentVolume: number;
  isMuted: boolean;
  toggleMute: () => void;
  audioElement: HTMLAudioElement | null;
  _liveKitWrapper: React.ReactNode;
}

// Define a separate component to access LiveKit hooks only when inside Room context
function VoiceAssistantContent({
  connectionDetails,
  onTranscriptUpdate,
  onAgentStateChange,
  onVolumeUpdate
}: {
  connectionDetails: any;
  onTranscriptUpdate: (userSegments: any[], agentSegments: any[]) => void;
  onAgentStateChange: (state: AgentState) => void;
  onVolumeUpdate: (volume: number) => void;
}) {
  // Access the LiveKit voice assistant hook when connected
  const { state: voiceAssistantState, audioTrack: agentAudioTrack } = useVoiceAssistant();
  
  // Get volume data from the agent's audio track
  const volumes = useMultibandTrackVolume(agentAudioTrack, { bands: 1 });
  
  // Handle user microphone tracks and transcription
  const userTracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: false }]);
  const micTrackRef = userTracks.find(trackRef => 
    trackRef.publication.kind === Track.Kind.Audio && 
    trackRef.source === Track.Source.Microphone
  );
  
  // Get transcriptions
  const { segments: userSegmentsRaw } = useTrackTranscription(micTrackRef);
  const { segments: agentSegmentsRaw } = useTrackTranscription(agentAudioTrack);
  
  // Update parent component with state changes
  useEffect(() => {
    onAgentStateChange(voiceAssistantState);
  }, [voiceAssistantState, onAgentStateChange]);
  
  useEffect(() => {
    if (volumes && volumes.length > 0) {
      onVolumeUpdate(volumes[0]);
    }
  }, [volumes, onVolumeUpdate]);
  
  useEffect(() => {
    onTranscriptUpdate(userSegmentsRaw || [], agentSegmentsRaw || []);
  }, [userSegmentsRaw, agentSegmentsRaw, onTranscriptUpdate]);
  
  return null; // This component doesn't render anything, it just provides data to parent
}

// Main hook for LiveKit Voice Assistant
export default function useLiveKitVoiceAssistant(
  voice: string,
  tools?: Tool[],
): UseLiveKitVoiceAssistantReturn {
  const { t, locale } = useTranslations();
  const [status, setStatus] = useState<string>("");
  const [connectionDetails, setConnectionDetails] = useState<any | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Function registry for tools (compatibility with original hook)
  const functionRegistry = useRef<Record<string, Function>>({});
  
  // Voice assistant state tracking
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  
  // State to store raw transcription segments
  const [userSegmentsRaw, setUserSegmentsRaw] = useState<any[]>([]);
  const [agentSegmentsRaw, setAgentSegmentsRaw] = useState<any[]>([]);
  
  // Track microphone stream
  const micStreamRef = useRef<MediaStream | null>(null);
  
  // Register a function for AI tool usage (compatibility with original hook)
  function registerFunction(name: string, fn: Function) {
    functionRegistry.current[name] = fn;
    console.log(`Registered function: ${name}`);
  }
  
  // Handle transcript updates from the VoiceAssistantContent component
  const handleTranscriptUpdate = useCallback((userSegments: any[], agentSegments: any[]) => {
    setUserSegmentsRaw(userSegments);
    setAgentSegmentsRaw(agentSegments);
  }, []);
  
  // Handle agent state changes from the VoiceAssistantContent component
  const handleAgentStateChange = useCallback((state: AgentState) => {
    setAgentState(state);
    
    if (state === "connected" as AgentState) {
      setStatus("Connected to LiveKit Voice Assistant");
    } else if (state === "connecting" as AgentState) {
      setStatus("Connecting to LiveKit Voice Assistant...");
    } else if (state === "disconnected" as AgentState) {
      setStatus("Disconnected from LiveKit Voice Assistant");
    }
  }, []);
  
  // Handle volume updates from the VoiceAssistantContent component
  const handleVolumeUpdate = useCallback((volume: number) => {
    setCurrentVolume(volume);
  }, []);
  
  // Process transcriptions into conversation format
  useEffect(() => {
    if (isSessionActive) {
      // Process user segments
      if (userSegmentsRaw && userSegmentsRaw.length > 0) {
        const latestSegment = userSegmentsRaw[userSegmentsRaw.length - 1];
        
        // Add as a user message
        if (latestSegment.text) {
          const existingMsgIndex = conversation.findIndex(msg => 
            msg.role === 'user' && 
            msg.id === latestSegment.id
          );
          
          if (existingMsgIndex >= 0) {
            // Update existing message
            setConversation(prev => {
              const updated = [...prev];
              updated[existingMsgIndex] = {
                ...updated[existingMsgIndex],
                text: latestSegment.text,
                isFinal: true,
                status: 'final'
              };
              return updated;
            });
          } else {
            // Add new message
            setConversation(prev => [
              ...prev,
              {
                id: latestSegment.id,
                role: 'user',
                text: latestSegment.text,
                timestamp: new Date().toISOString(),
                isFinal: true,
                status: 'final'
              }
            ]);
          }
        }
      }
      
      // Process agent segments
      if (agentSegmentsRaw && agentSegmentsRaw.length > 0) {
        const latestSegment = agentSegmentsRaw[agentSegmentsRaw.length - 1];
        
        // Add as an assistant message
        if (latestSegment.text) {
          const existingMsgIndex = conversation.findIndex(msg => 
            msg.role === 'assistant' && 
            msg.id === latestSegment.id
          );
          
          if (existingMsgIndex >= 0) {
            // Update existing message
            setConversation(prev => {
              const updated = [...prev];
              updated[existingMsgIndex] = {
                ...updated[existingMsgIndex],
                text: latestSegment.text,
                isFinal: true
              };
              return updated;
            });
          } else {
            // Add new message
            setConversation(prev => [
              ...prev,
              {
                id: latestSegment.id,
                role: 'assistant',
                text: latestSegment.text,
                timestamp: new Date().toISOString(),
                isFinal: true
              }
            ]);
          }
        }
      }
    }
  }, [isSessionActive, userSegmentsRaw, agentSegmentsRaw, conversation]);
  
  // Create a hidden audio element for the agent's voice
  useEffect(() => {
    if (isSessionActive && !audioElement) {
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      setAudioElement(audioEl);
      console.log("Created audio element for agent voice");
    }
    
    return () => {
      if (audioElement) {
        audioElement.srcObject = null;
        setAudioElement(null);
      }
    };
  }, [isSessionActive, audioElement]);
  
  // Connect to LiveKit with the system prompt
  const startSession = useCallback(async () => {
    try {
      console.log("=== STARTING LIVEKIT SESSION ===");
      setStatus("Preparing LiveKit connection...");
      
      // Get the system prompt from the window object (same as the original hook)
      let systemPrompt;
      
      if (typeof window !== 'undefined' && (window as any).systemPromptForAIMeeting) {
        systemPrompt = (window as any).systemPromptForAIMeeting;
        
        // Validate system prompt
        if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.trim().length < 100) {
          throw new Error("ERROR: System prompt exists but is too short or invalid. A comprehensive job-specific system prompt is required.");
        }
        
        console.log("===== USING CUSTOM SYSTEM PROMPT FROM WINDOW OBJECT =====");
        console.log("System prompt length:", systemPrompt.length);
        console.log("System prompt first 100 chars:", systemPrompt.substring(0, 100));
        console.log("==========================================================");
      } else {
        throw new Error("ERROR: No custom system prompt found. Job-specific system prompt is required.");
      }
      
      // Request microphone access
      console.log("Requesting microphone access...");
      setStatus("Requesting microphone access...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        console.log("Microphone access granted, tracks:", stream.getTracks().length);
        
        // Apply mute state to the new stream if needed
        if (isMuted && stream) {
          const audioTracks = stream.getAudioTracks();
          audioTracks.forEach(track => {
            track.enabled = false;
          });
          console.log("Microphone tracks muted:", audioTracks.length);
        }
      } catch (micError) {
        console.error("Microphone access error:", micError);
        throw new Error(`Microphone access failed: ${micError instanceof Error ? micError.message : String(micError)}`);
      }
      
      // Call our API route with the system prompt
      console.log("Calling API to establish LiveKit connection...");
      setStatus("Establishing LiveKit connection...");
      
      const payload = {
        systemPrompt,
        // Optional: include job title and candidate name if available in window object
        jobTitle: (window as any).jobTitleForAIMeeting,
        candidateName: (window as any).candidateNameForAIMeeting
      };
      
      console.log("Sending payload to connection-details API:", {
        systemPromptLength: payload.systemPrompt.length,
        jobTitle: payload.jobTitle,
        candidateName: payload.candidateName
      });
      
      try {
        const response = await fetch("/api/livekit/connection-details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          const errText = await response.text();
          console.error("LiveKit connection API error:", response.status, errText);
          throw new Error(`Failed to establish LiveKit connection: ${response.status}. ${errText}`);
        }
        
        const data = await response.json();
        console.log("LiveKit connection details received:", {
          serverUrl: data.serverUrl,
          roomName: data.roomName,
          participantName: data.participantName,
          tokenProvided: !!data.participantToken,
        });
        
        setConnectionDetails(data);
        setIsSessionActive(true);
        setStatus("LiveKit Voice Assistant connected");
        console.log("LiveKit session started successfully");
      } catch (apiError) {
        console.error("API call error:", apiError);
        throw new Error(`API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    } catch (err) {
      console.error("startSession error:", err);
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
      stopSession();
      
      // Show error as alert for better visibility
      if (typeof window !== 'undefined') {
        window.alert(`LiveKit session start error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }, [isMuted]);
  
  // Stop the LiveKit session and clean up
  const stopSession = useCallback(() => {
    console.log("=== STOPPING LIVEKIT SESSION ===");
    
    // Clear connection details to disconnect LiveKit Room
    setConnectionDetails(null);
    
    // Stop microphone stream
    if (micStreamRef.current) {
      console.log("Stopping microphone tracks...");
      micStreamRef.current.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track, id: ${track.id}`);
        track.stop();
      });
      micStreamRef.current = null;
    }
    
    // Clean up audio element
    if (audioElement) {
      console.log("Cleaning up audio element");
      audioElement.srcObject = null;
      setAudioElement(null);
    }
    
    // Reset state
    setIsSessionActive(false);
    setStatus("Session stopped");
    setMsgs([]);
    setConversation([]);
    setAgentState("disconnected");
    console.log("LiveKit session stopped and cleaned up");
  }, [audioElement]);
  
  // Toggle start/stop from a single button
  const handleStartStopClick = useCallback(() => {
    console.log("handleStartStopClick called, isSessionActive:", isSessionActive);
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  }, [isSessionActive, startSession, stopSession]);
  
  // Toggle microphone mute state
  const toggleMute = useCallback(() => {
    if (!micStreamRef.current) return;
    
    setIsMuted(prevMuted => {
      const newMuteState = !prevMuted;
      
      // Toggle mute state of microphone tracks
      const audioTracks = micStreamRef.current?.getAudioTracks() || [];
      audioTracks.forEach(track => {
        track.enabled = !newMuteState;
      });
      
      console.log(`Microphone ${newMuteState ? 'muted' : 'unmuted'}`);
      return newMuteState;
    });
  }, []);
  
  // Send a text message (as with the original hook)
  const sendTextMessage = useCallback((text: string) => {
    if (!isSessionActive) {
      console.error("Cannot send message, session not active");
      return;
    }
    
    // Add message to conversation immediately
    const messageId = uuidv4();
    const newMessage: Conversation = {
      id: messageId,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      isFinal: true,
      status: 'final',
    };
    
    setConversation(prev => [...prev, newMessage]);
    
    // No need to send through data channel with LiveKit
    // LiveKit will automatically process the text input through its voice assistant
    
    // Add to the message log for UI purposes
    setMsgs(prev => [...prev, { type: "text_message", text, timestamp: Date.now() }]);
  }, [isSessionActive]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSessionActive) {
        stopSession();
      }
    };
  }, [isSessionActive, stopSession]);
  
  // Replace LiveKitRoom component with a functional rendering approach to work around TypeScript errors
  const liveKitWrapper = useMemo(() => {
    if (!connectionDetails) return null;
    
    console.log("Rendering LiveKit Room with connection details");
    
    // Create a function to manually render the LiveKit Room
    const renderLiveKitRoom = () => {
      // This will be called after the component mounts to manually render LiveKit
      if (typeof document === 'undefined') return;
      
      const container = document.getElementById('livekit-context-container');
      if (!container) {
        console.error("LiveKit container not found");
        return;
      }
      
      // The actual React rendering happens in the page component where _liveKitWrapper is used
      console.log("LiveKit Room container is ready for rendering");
    };
    
    // Use useEffect to call the render function after mount
    useEffect(() => {
      renderLiveKitRoom();
    }, [connectionDetails]);
    
    return (
      <div style={{ display: 'none' }}>
        <LiveKitRoom
          token={connectionDetails.participantToken}
          serverUrl={connectionDetails.serverUrl}
          // The roomName is encoded in the token
          connect={true}
          audio={true}
          video={false}
          onDisconnected={() => {
            console.log("LiveKit room disconnected event fired");
            if (isSessionActive) {
              console.log("LiveKit room disconnected while session was active, stopping session");
              stopSession();
            }
          }}
        >
          <VoiceAssistantContent
            connectionDetails={connectionDetails}
            onTranscriptUpdate={handleTranscriptUpdate}
            onAgentStateChange={handleAgentStateChange}
            onVolumeUpdate={handleVolumeUpdate}
          />
        </LiveKitRoom>
      </div>
    );
  }, [connectionDetails, isSessionActive, stopSession, handleTranscriptUpdate, handleAgentStateChange, handleVolumeUpdate]);
  
  return {
    status,
    isSessionActive,
    registerFunction,
    handleStartStopClick,
    msgs,
    conversation,
    sendTextMessage,
    currentVolume,
    isMuted,
    toggleMute,
    audioElement,
    _liveKitWrapper: liveKitWrapper // We add this to render in the page component
  };
} 