import { NextRequest, NextResponse } from 'next/server';

// Ensure the function is marked as a Next.js runtime handler
export const runtime = 'nodejs';

// Configure route options for Next.js App Router
export const dynamic = 'force-dynamic'; // Never cache this route
export const revalidate = 0; // Don't revalidate
export const fetchCache = 'force-no-store'; // Don't cache fetch requests
export const maxDuration = 30; // 30 seconds max duration

// Supported file types
const SUPPORTED_FILE_TYPES = [
  'application/pdf', 
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/bmp', 
  'image/tiff'
];

// Helper function to process documents using Mistral OCR
async function processDocumentWithOcr(fileBuffer: Buffer, mimeType: string) {
  try {
    // Check if Mistral API key is configured
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (!mistralApiKey) {
      console.log('Mistral API key not configured');
      return { success: false, text: null, message: 'OCR service not configured' };
    }
    
    // Convert buffer to base64
    const base64File = fileBuffer.toString('base64');
    
    // Determine document type 
    let documentType = 'document_base64';
    let mediaType = mimeType;
    
    // Call Mistral OCR API
    const response = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: documentType,
          document_base64: `data:${mediaType};base64,${base64File}`
        },
        include_image_base64: false
      })
    });
    
    if (!response.ok) {
      console.error('OCR API error:', await response.text());
      return { success: false, text: null, message: 'OCR service error' };
    }
    
    const ocrResult = await response.json();
    
    // Extract text from OCR results
    let extractedText = '';
    if (ocrResult.pages && ocrResult.pages.length > 0) {
      extractedText = ocrResult.pages.map((page: any) => page.markdown).join('\n');
    }
    
    return { 
      success: extractedText.length > 0, 
      text: extractedText,
      pageCount: ocrResult.pages?.length || 0,
      message: extractedText.length > 0 ? 'Document processed with OCR' : 'Could not extract text with OCR'
    };
  } catch (error) {
    console.error('Error processing document with OCR:', error);
    return { success: false, text: null, message: 'OCR processing error' };
  }
}

// Export POST method for API route
export async function POST(request: NextRequest) {
  console.log('Document OCR endpoint called');
  try {
    // Get form data with the file
    console.log('Attempting to read form data');
    const formData = await request.formData();
    console.log('Form data received, keys:', [...formData.keys()]);
    
    const documentFile = formData.get('document') as File | null;
    console.log('Document file from form:', documentFile ? {
      name: documentFile.name,
      type: documentFile.type,
      size: documentFile.size
    } : 'No file found');

    if (!documentFile) {
      console.log('No file uploaded');
      return NextResponse.json(
        { success: false, message: 'No file was uploaded' },
        { status: 400 }
      );
    }

    // Check if file type is supported
    const isSupported = SUPPORTED_FILE_TYPES.some(type => documentFile.type.includes(type));
    
    if (!isSupported) {
      console.log('Unsupported file type:', documentFile.type);
      return NextResponse.json(
        { success: false, message: 'Unsupported file type. Please upload a PDF or image.' },
        { status: 400 }
      );
    }

    // Convert the file to Buffer for processing
    console.log('Converting file to buffer');
    const arrayBuffer = await documentFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer created, size:', buffer.length);

    // Process the document with OCR
    console.log('Processing document with OCR');
    const ocrResult = await processDocumentWithOcr(buffer, documentFile.type);
    
    if (ocrResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Document processed successfully',
        pageCount: ocrResult.pageCount,
        extractedText: ocrResult.text
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to extract text from the document. ' + ocrResult.message
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in document OCR route:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing the document' },
      { status: 500 }
    );
  }
} 