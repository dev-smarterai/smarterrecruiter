import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; // Use promises for async file operations
import { createReadStream } from 'fs'; // Needed for streaming file to Groq API
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// --- Configuration ---
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const LLM_MODEL = 'llama3-8b-8192';
const TTS_MODEL = 'playai-tts-arabic';
const TTS_VOICE = 'Khalid-PlayAI';
const TTS_FORMAT = 'wav';
const STT_MODEL = 'whisper-large-v3-turbo'; // Added: STT Model configuration
const TEMP_AUDIO_DIR = 'temp_audio';
const TEMP_INPUT_AUDIO_PREFIX = 'input_'; // Prefix for temporary input audio files

// --- Initial Setup ---
if (!GROQ_API_KEY) {
    console.error('Error: GROQ_API_KEY not found in .env file.');
    process.exit(1);
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Helper Functions ---
async function ensureTempDirExists() {
    const dirPath = path.join(__dirname, TEMP_AUDIO_DIR);
    try {
        await fs.access(dirPath);
        console.log(`Temporary audio directory found: ${dirPath}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(dirPath);
            console.log(`Created temporary audio directory: ${dirPath}`);
        } else {
            console.error(`Error accessing/creating temp directory ${dirPath}:`, error);
            throw error;
        }
    }
}

function safeSend(ws, message) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        console.log('WebSocket connection is not open. Message not sent.');
    }
}

// --- Main Chat/TTS Flow (Refactored) ---
async function handleUserMessage(ws, userText, conversationHistory) {
    if (!userText) {
        console.log("Skipping empty user message.");
        return; // Don't process empty messages
    }

    conversationHistory.push({ role: "user", content: userText });

    let fullResponse = "";
    try {
        // 1. Get LLM stream
        console.log(`Sending to LLM (${LLM_MODEL}): "${userText.substring(0, 50)}..."`);
        const stream = await groq.chat.completions.create({
            messages: conversationHistory,
            model: LLM_MODEL,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullResponse += content;
                // Send text chunk to client immediately
                safeSend(ws, { type: 'chat_chunk', text: content });
            }
        }

        // 2. Send end-of-stream signal
        safeSend(ws, { type: 'chat_end' });
        console.log(`LLM full response: "${fullResponse.substring(0, 50)}..."`);

        // Add assistant's full response to history for context
        if (fullResponse) {
            conversationHistory.push({ role: "assistant", content: fullResponse });
        }

        // 3. Generate TTS
        if (fullResponse) {
            let ttsAudioFilePath = null; // Keep track of file path for cleanup
            try {
                console.log(`Generating TTS (${TTS_MODEL}, ${TTS_VOICE}) for: "${fullResponse.substring(0, 50)}..."`);
                // console.log('Inspecting groq.audio object:', groq.audio); // Keep for debugging if needed
                const ttsResponse = await groq.audio.speech.create({
                    model: TTS_MODEL,
                    voice: TTS_VOICE,
                    input: fullResponse,
                    response_format: TTS_FORMAT,
                });
                console.log('TTS API call successful.');

                // Save audio to a temporary file
                const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
                const uniqueFilename = `${uuidv4()}.${TTS_FORMAT}`;
                ttsAudioFilePath = path.join(__dirname, TEMP_AUDIO_DIR, uniqueFilename);
                const audioUrl = `/${TEMP_AUDIO_DIR}/${uniqueFilename}`; // URL path for client

                await fs.writeFile(ttsAudioFilePath, audioBuffer);
                console.log(`TTS audio saved to ${ttsAudioFilePath}`);

                // Send audio URL to client
                safeSend(ws, { type: 'tts_audio', audioUrl: audioUrl });

                // Optional: Clean up TTS audio file after a delay
                setTimeout(async () => {
                    try {
                        if (ttsAudioFilePath) { // Check if path exists
                             await fs.unlink(ttsAudioFilePath);
                             console.log(`Cleaned up TTS audio file: ${ttsAudioFilePath}`);
                        }
                    } catch (cleanupError) {
                        if (cleanupError.code !== 'ENOENT') {
                            console.error(`Error cleaning up TTS audio file ${ttsAudioFilePath}:`, cleanupError);
                        }
                    }
                }, 60 * 1000 * 5); // 5 minutes

            } catch (ttsError) {
                console.error('Groq TTS API error:', ttsError);
                safeSend(ws, { type: 'error', error: 'Failed to generate audio.' });
            }
        }
    } catch (error) {
        console.error('Groq Chat Completions API error:', error);
        safeSend(ws, { type: 'error', error: 'Failed to get response from Groq LLM.' });
        // Clean up conversation history on LLM error
        conversationHistory.pop(); // Remove the user message that caused the error
    }
}

// --- WebSocket Handling ---
wss.on('connection', (ws) => {
    console.log('Client connected');

    let conversationHistory = [
        { role: "system", content: "You are a job interviewer for Bain and company. Always respond ONLY in Arabic. You are interviewing a candidate for a job at Bain and company. You are trying to assess their skills and fit for the role. In your greeting message say you are an interviewer." }
    ];

    ws.on('message', async (message) => {
        // Check if message is Binary (Audio Blob)
        if (message instanceof Buffer || message instanceof ArrayBuffer || message instanceof Blob) {
             console.log(`Received audio data: ${message.byteLength || message.size} bytes`);
             let inputAudioFilePath = null; // For cleanup
             try {
                 // 1. Save the incoming audio blob to a temporary file
                 const uniqueFilename = `${TEMP_INPUT_AUDIO_PREFIX}${uuidv4()}.wav`; // Assume WAV for now
                 inputAudioFilePath = path.join(__dirname, TEMP_AUDIO_DIR, uniqueFilename);
                 await fs.writeFile(inputAudioFilePath, Buffer.from(message)); // Convert to Buffer if necessary
                 console.log(`Input audio saved temporarily to: ${inputAudioFilePath}`);

                 // 2. Transcribe the audio file using Groq STT
                 console.log(`Sending audio for transcription (${STT_MODEL}, language: ar)...`);
                 const transcription = await groq.audio.transcriptions.create({
                     file: createReadStream(inputAudioFilePath), // Stream the saved file
                     model: STT_MODEL,
                     language: "ar", // Explicitly set language to Arabic
                     response_format: "json", // Get plain text
                 });

                 const transcribedText = transcription.text;
                 console.log(`Transcription result: "${transcribedText}"`);

                 // Send transcript back to user for confirmation/display
                 safeSend(ws, { type: 'user_transcript', text: transcribedText });

                 // 3. Feed the transcribed text into the main chat flow
                 await handleUserMessage(ws, transcribedText, conversationHistory);

             } catch (sttError) {
                 console.error('Groq STT API or file handling error:', sttError);
                 safeSend(ws, { type: 'error', error: 'Failed to process audio.' });
             } finally {
                 // 4. Clean up the temporary input audio file immediately
                 if (inputAudioFilePath) {
                     try {
                         await fs.unlink(inputAudioFilePath);
                         console.log(`Cleaned up input audio file: ${inputAudioFilePath}`);
                     } catch (cleanupError) {
                         if (cleanupError.code !== 'ENOENT') {
                             console.error(`Error cleaning up input audio file ${inputAudioFilePath}:`, cleanupError);
                         }
                     }
                 }
             }
         } else {
             // Handle JSON messages (Text input)
             let parsedMessage;
             try {
                 // The message is already likely a string here if not binary
                 parsedMessage = JSON.parse(message.toString());
                 console.log('Received JSON message:', parsedMessage);
             } catch (error) {
                 console.error('Failed to parse JSON message:', message.toString(), error);
                 safeSend(ws, { type: 'error', error: 'Invalid message format.' });
                 return;
             }

             if (parsedMessage.type === 'chat_message' && parsedMessage.text) {
                 const userText = parsedMessage.text;
                 // Call the refactored handler for text messages
                 await handleUserMessage(ws, userText, conversationHistory);
             } else {
                 console.log('Received unhandled JSON message type:', parsedMessage.type);
                 // Optionally send an error for unhandled types
                 // safeSend(ws, { type: 'error', error: 'Unhandled message type.' });
             }
         }
     });

    ws.on('close', () => {
        console.log('Client disconnected');
        conversationHistory = [];
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        conversationHistory = [];
    });
});

// --- HTTP Server Routes ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.use(`/${TEMP_AUDIO_DIR}`, express.static(path.join(__dirname, TEMP_AUDIO_DIR)));

// --- Start Server ---
ensureTempDirExists().then(() => {
    server.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error("Failed to initialize server:", error);
    process.exit(1);
}); 