import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

// Initialize Mistral client
const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || '',
});

async function fetchPDFFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getCVSummaryFromMistral(pdfBuffer: Buffer): Promise<string> {
  try {
    // Convert PDF buffer to base64
    const base64Pdf = pdfBuffer.toString('base64');
    
    // First use Mistral OCR to process the PDF document
    console.log("Processing PDF with Mistral OCR...");
    const ocrResponse = await mistral.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: `data:application/pdf;base64,${base64Pdf}`
      }
    });
    
    // Log the OCR successful processing
    console.log(`Processed ${ocrResponse.pages.length} pages from CV document`);
    
    // Extract the content from OCR for further processing
    // Get the markdown content from the OCR result
    const extractedContent = ocrResponse.pages.map(page => page.markdown).join('\n\n');
    
    // Now use Mistral chat model to analyze the CV content
    console.log("Generating CV summary from extracted content using Mistral LLM...");
    const chatResponse = await mistral.chat.complete({
      model: "mistral-small-latest", // You can change to other Mistral models as needed
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please provide a concise summary of this candidate's CV, focusing on their key skills, experience, and achievements. Keep it under 500 words and make it conversational, as this will be used in a voice interview context.\n\nHere is the CV content:\n\n" + extractedContent
            }
          ]
        }
      ]
    });
    
    // Extract the summary from the response
    if (chatResponse.choices && chatResponse.choices.length > 0) {
      const content = chatResponse.choices[0].message.content;
      // Handle both string and ContentChunk[] types
      if (typeof content === 'string') {
        return content;
      } else if (Array.isArray(content)) {
        // Join content chunks that are of type text
        return content
          .filter(chunk => chunk.type === 'text')
          .map(chunk => chunk.text)
          .join('\n');
      }
    }
    
    throw new Error('Unexpected response format from Mistral');
  } catch (error: any) {
    console.error("Error getting CV summary from Mistral:", error);
    throw new Error(`Failed to get CV summary: ${error.message}`);
  }
}

// Alternative implementation using document understanding directly
async function getCVSummaryFromMistralDirect(pdfUrl: string): Promise<string> {
  try {
    console.log("Using Mistral document understanding for CV analysis...");
    
    // Use document understanding to directly analyze the PDF
    const chatResponse = await mistral.chat.complete({
      model: "mistral-small-latest", // You can change to other Mistral models as needed
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please provide a concise summary of this candidate's CV, focusing on their key skills, experience, and achievements. Keep it under 500 words and make it conversational, as this will be used in a voice interview context."
            },
            {
              type: "document_url",
              documentUrl: pdfUrl
            }
          ]
        }
      ]
    });
    
    // Extract the summary from the response
    if (chatResponse.choices && chatResponse.choices.length > 0) {
      const content = chatResponse.choices[0].message.content;
      // Handle both string and ContentChunk[] types
      if (typeof content === 'string') {
        return content;
      } else if (Array.isArray(content)) {
        // Join content chunks that are of type text
        return content
          .filter(chunk => chunk.type === 'text')
          .map(chunk => chunk.text)
          .join('\n');
      }
    }
    
    throw new Error('Unexpected response format from Mistral');
  } catch (error: any) {
    console.error("Error getting CV summary from Mistral:", error);
    throw new Error(`Failed to get CV summary: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cvUrl } = await request.json();
    
    if (!cvUrl) {
      return NextResponse.json({ error: 'No CV URL provided' }, { status: 400 });
    }

    let summary: string;
    
    // If the CV URL is already accessible externally, use the direct method
    if (cvUrl.startsWith('http')) {
      // Use the direct document understanding method
      summary = await getCVSummaryFromMistralDirect(cvUrl);
    } else {
      // Fetch the PDF from the URL first
      const pdfBuffer = await fetchPDFFromUrl(cvUrl);
      
      // Get summary using the OCR then LLM approach
      summary = await getCVSummaryFromMistral(pdfBuffer);
    }
    
    return NextResponse.json({ summary }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing CV:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 