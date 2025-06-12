import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Message type definition
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request body. Messages array is required.' },
        { status: 400 }
      );
    }
    
    // Initialize Anthropic client with API key from environment variables
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    
    // Verify API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key configuration error' },
        { status: 500 }
      );
    }
    
    // Format messages for Claude API
    // Note: Claude expects system prompts to be formatted in a specific way
    let systemPrompt = '';
    const formattedMessages: Anthropic.MessageParam[] = [];
    
    // Extract system prompt if present
    const systemMessages = messages.filter((msg: Message) => msg.role === 'system');
    if (systemMessages.length > 0) {
      systemPrompt = systemMessages[0].content;
    }
    
    // Add user and assistant messages (filtering out system messages)
    for (const msg of messages) {
      if (msg.role !== 'system') {
        // Ensure we're only passing roles that Anthropic accepts
        if (msg.role === 'user' || msg.role === 'assistant') {
          formattedMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    }
    
    // Make request to Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      system: systemPrompt || undefined,
      messages: formattedMessages,
      max_tokens: 4000,
      temperature: 0.7,
    });
    
    return NextResponse.json({ response: response.content[0] });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 