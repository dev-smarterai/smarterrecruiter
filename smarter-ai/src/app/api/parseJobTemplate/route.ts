import { NextRequest, NextResponse } from 'next/server'
import { Mistral } from '@mistralai/mistralai'

// Initialize Mistral client
const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    let fileContent = ''
    
    // Handle different file types
    if (file.type === 'application/json') {
      // Handle JSON template files
      try {
        const jsonContent = await file.text()
        const parsedJson = JSON.parse(jsonContent)
        
        // Validate and return the JSON structure directly if it matches our format
        if (parsedJson.title || parsedJson.description) {
          return NextResponse.json(parsedJson)
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
      }
    } else if (file.type === 'text/plain') {
      // Handle plain text files
      fileContent = await file.text()
    } else if (file.type === 'application/pdf') {
      // Handle PDF files using Mistral OCR
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdfBuffer = Buffer.from(arrayBuffer)
        const base64Pdf = pdfBuffer.toString('base64')
        
        const ocrResponse = await mistral.ocr.process({
          model: "mistral-ocr-latest",
          document: {
            type: "document_url",
            documentUrl: `data:application/pdf;base64,${base64Pdf}`
          }
        })
        
        // Extract the content from OCR
        fileContent = ocrResponse.pages.map(page => page.markdown).join('\n\n')
       
        
        if (!fileContent.trim()) {
          throw new Error('No content extracted from PDF')
        }
      } catch (error) {
        console.error('Error processing PDF:', error)
        return NextResponse.json({ 
          error: 'Failed to process PDF file. Please try a text file or JSON template.' 
        }, { status: 400 })
      }
    } else if (file.type.includes('word')) {
      // For Word documents, we'd need a Word parser library
      // For now, return an error asking for text or JSON
      return NextResponse.json({ 
        error: 'Word document parsing is not implemented yet. Please use a text file or JSON template.' 
      }, { status: 400 })
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    if (!fileContent) {
      return NextResponse.json({ error: 'Could not extract content from file' }, { status: 400 })
    }

    // Use Mistral to parse the job description
    const completion = await mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a job posting parser. Extract job information from the provided text and return ONLY a valid JSON object with the following structure:

              {
                "title": "Job Title",
                "description": "Job description paragraph",
                "responsibilities": "List of responsibilities separated by newlines",
                "requirements": "List of requirements separated by newlines", 
                "jobType": {
                  "remote": boolean,
                  "fullTime": boolean,
                  "hybrid": boolean
                },
                "salaryRange": "salary range in format like '80k-100k'",
                "jobLevel": "entry|mid|senior|lead|manager",
                "location": "Job location",
                "skills": ["skill1", "skill2", "skill3"],
                "benefits": "List of benefits separated by newlines",
                "experienceLevel": "0-1 years|1-3 years|3-5 years|5+ years"
              }
              
              IMPORTANT: 
              - Return ONLY the JSON object, no additional text or explanations
              - Extract as much information as possible from the text
              - If certain fields are not found, omit them from the response
              - For salary range, convert to the k format (e.g., "$80,000-$100,000" becomes "80k-100k")
              - Do not wrap the JSON in markdown code blocks
              
              Parse this job posting:
              
              ${fileContent}`
            }
          ]
        }
      ]
    })

    // Extract the result from Mistral response
    let result: string = ''
    if (completion.choices && completion.choices.length > 0) {
      const content = completion.choices[0].message.content
      // Handle both string and ContentChunk[] types
      if (typeof content === 'string') {
        result = content
      } else if (Array.isArray(content)) {
        // Join content chunks that are of type text
        result = content
          .filter(chunk => chunk.type === 'text')
          .map(chunk => chunk.text)
          .join('\n')
      }
    }

    if (!result) {
      return NextResponse.json({ error: 'Failed to parse job content' }, { status: 500 })
    }


    try {
      // Try to extract JSON from the response if it's wrapped in markdown or other text
      let jsonString = result.trim()
      
      // Check if the response is wrapped in markdown code blocks
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Try to find JSON object in the response
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }
      
      
      const parsedJob = JSON.parse(jsonString)
      
      // Optionally save as template if requested
      // For now, just return the parsed job data
      // The frontend can decide whether to save it as a template
      
      return NextResponse.json(parsedJob)
    } catch (error) {
      console.error('Error parsing AI response:', error)
      console.error('Raw response that failed to parse:', result)
      return NextResponse.json({ 
        error: 'Failed to parse AI response', 
        details: `Response was: ${result.substring(0, 500)}...` 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error parsing job template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 