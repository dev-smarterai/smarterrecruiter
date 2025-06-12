import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentState,
  useMultibandTrackVolume,
  useVoiceAssistant,
  useTracks,
  useTrackTranscription
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
  
  // Access the LiveKit voice assistant hook when connected
  const { 
    state: voiceAssistantState, 
    audioTrack: agentAudioTrack 
  } = connectionDetails ? useVoiceAssistant() : { state: "disconnected" as AgentState, audioTrack: null };
  
  // Get volume data from the agent's audio track
  const volumes = useMultibandTrackVolume(agentAudioTrack, { bands: 1 });
  
  // Track microphone stream
  const micStreamRef = useRef<MediaStream | null>(null);
  
  // Register a function for AI tool usage (compatibility with original hook)
  function registerFunction(name: string, fn: Function) {
    functionRegistry.current[name] = fn;
    console.log(`Registered function: ${name}`);
  }
  
  // Handle transcriptions when connected
  useEffect(() => {
    if (connectionDetails && isSessionActive) {
      // Monitor agent state to update our session status
      if (voiceAssistantState) {
        setAgentState(voiceAssistantState);
        
        if (voiceAssistantState === "connected" as AgentState) {
          setStatus("Connected to LiveKit Voice Assistant");
        } else if (voiceAssistantState === "connecting" as AgentState) {
          setStatus("Connecting to LiveKit Voice Assistant...");
        } else if (voiceAssistantState === "disconnected" as AgentState) {
          setStatus("Disconnected from LiveKit Voice Assistant");
        }
      }
      
      // Update current volume from the agent audio track
      if (volumes && volumes.length > 0) {
        setCurrentVolume(volumes[0]);
      }
    }
  }, [connectionDetails, isSessionActive, voiceAssistantState, volumes]);
  
  // Create a hidden audio element for the agent's voice
  useEffect(() => {
    if (isSessionActive && !audioElement && agentAudioTrack) {
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      
      // Try to attach the agent audio track to the element
      if (agentAudioTrack instanceof MediaStreamTrack) {
        const stream = new MediaStream([agentAudioTrack]);
        audioEl.srcObject = stream;
      }
      
      setAudioElement(audioEl);
      console.log("Created audio element for agent voice");
    }
    
    return () => {
      if (audioElement) {
        audioElement.srcObject = null;
        setAudioElement(null);
      }
    };
  }, [isSessionActive, agentAudioTrack, audioElement]);
  
  // Handle user microphone tracks and transcription
  const userTracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: false }]);
  const micTrackRef = userTracks.find(trackRef => 
    trackRef.publication.kind === Track.Kind.Audio && 
    trackRef.source === Track.Source.Microphone
  );
  
  // Get transcriptions
  const { segments: userSegmentsRaw } = useTrackTranscription(micTrackRef);
  const { segments: agentSegmentsRaw } = useTrackTranscription(agentAudioTrack);
  
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
  
  // Connect to LiveKit with the system prompt
  const startSession = useCallback(async () => {
    try {
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
      setStatus("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      // Apply mute state to the new stream if needed
      if (isMuted && stream) {
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = false;
        });
      }
      
      // Call our API route with the system prompt
      setStatus("Establishing LiveKit connection...");
      const response = await fetch("/api/livekit/connection-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt,
          // Optional: include job title and candidate name if available in window object
          jobTitle: (window as any).jobTitleForAIMeeting,
          candidateName: (window as any).candidateNameForAIMeeting
        }),
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to establish LiveKit connection: ${response.status}. ${errText}`);
      }
      
      const data = await response.json();
      setConnectionDetails(data);
      setIsSessionActive(true);
      setStatus("LiveKit Voice Assistant connected");
      
    } catch (err) {
      console.error("startSession error:", err);
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
      stopSession();
    }
  }, [isMuted]);
  
  // Stop the LiveKit session and clean up
  const stopSession = useCallback(() => {
    // Clear connection details to disconnect LiveKit Room
    setConnectionDetails(null);
    
    // Stop microphone stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    // Clean up audio element
    if (audioElement) {
      audioElement.srcObject = null;
      setAudioElement(null);
    }
    
    // Reset state
    setIsSessionActive(false);
    setStatus("Session stopped");
    setMsgs([]);
    setConversation([]);
    setAgentState("disconnected");
  }, [audioElement]);
  
  // Toggle start/stop from a single button
  const handleStartStopClick = useCallback(() => {
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
    audioElement
  };
} 