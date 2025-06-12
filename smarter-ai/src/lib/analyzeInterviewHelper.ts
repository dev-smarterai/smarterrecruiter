/**
 * Helper function to analyze interview transcripts
 * This is used both for automatic analysis after interview completion
 * and for manual analysis from the candidate profile page
 */

/**
 * Analyzes an interview transcript using the analyze-transcript API
 * @param transcript The interview transcript to analyze
 * @returns The analysis results
 */
export async function analyzeInterviewTranscript(
  transcript: Array<{sender: string, text: string, timestamp: string}>
) {
  // Send transcript to analyze-transcript endpoint
  const response = await fetch('/api/analyze-transcript', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze interview');
  }

  const analysisData = await response.json();
  console.log("Analysis data received:", analysisData);
  
  return analysisData;
}

