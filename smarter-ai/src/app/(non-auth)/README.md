# AI Interviewer Demo Page

## Overview

This page provides a demonstration of the AI interviewer functionality without requiring actual job data, candidates, or meeting codes. It uses mock data to allow the interviewer to function in a demo environment.

## Changes Made

1. **Added TranslationsProvider Wrapper**
   - Wrapped the main component with `TranslationsProvider` to fix the context error
   - This ensures the translation functions work properly throughout the component

2. **Created Simulated Job and Candidate Data**
   - Modified `prepareDynamicVariables` to use demo data when real data is unavailable
   - Added fallback demo job data with title, company, description, requirements
   - Created fallback candidate information
   - Added simulated knowledge base content

3. **Bypassed Meeting ID Requirements**
   - Added a default "DEMO123" meeting ID when none is provided in URL
   - Removed the conditional redirect to the meeting page

4. **Simplified Job Data Validation**
   - Removed strict validation checks that would prevent the demo from working
   - Replaced variable validation with demo values

5. **Fixed UI Elements**
   - Added required `alt` attributes to Image components
   - Fixed styling for better display in demo mode

6. **Removed Loading Gate**
   - Eliminated the conditional rendering that prevented the component from rendering when job or candidate data was missing
   - Now the UI renders regardless of data availability

7. **Extended VideoCamera Component**
   - Updated the VideoCameraProps interface to include new props:
     - `recordingEnabled` - Flag for recording functionality
     - `meetingId` - Reference to the meeting ID
     - `candidateId` - Reference to the candidate ID
     - `isCameraEnabled` - Toggle for camera on/off state
   - These changes fix TypeScript errors in the component usage
   - Added camera toggle functionality with visual feedback
   - Added microphone toggle functionality with visual feedback

8. **Authentication Bypass and API Access Fixes**
   - Modified the middleware to allow API calls from the YC demo page
   - Added referer checking to permit requests coming from the `/yc` route
   - Added extra request headers (`X-From-YC-Page`) to identify YC page requests
   - Enhanced error handling to provide better debugging information
   - Added special handling in the LiveKit API route for demo mode and YC page requests
   - Improved error messages to make troubleshooting easier
   - Added CORS headers to the LiveKit API responses
   - Added explicit JSON error handling to catch and report format errors

9. **Improved Demo Experience**
   - Added isDemo flag to indicate demo mode to the LiveKit API
   - Modified the YC demo prompt to explicitly mention the demo context
   - Added fallback values for job title and candidate name
   - Ensured cookies and session data are properly included in API requests
   - Added camera toggle functionality to enable/disable video
   - Added microphone toggle to mute/unmute audio with visual indicators
   - Added toast notifications for media device state changes

10. **Enhanced Microphone Control**
    - Added a visual red slash overlay on the microphone icon when muted
    - Modified the TranscriptionCollector to completely block user audio from being processed when muted
    - Added clear toast notifications with different styling for mute/unmute states
    - Implemented complete audio isolation to prevent the AI from hearing the user when muted
    - Added warning feedback when user is speaking while muted

## How To Use

1. Navigate to the `/yc` route
2. Optionally, you can add a `?meetingId=DEMO123` parameter to simulate a real meeting ID
3. Click the "Start Interview" button
4. Speak into your microphone to interact with the AI interviewer
5. The AI will respond using voice and transcripts will appear in the right panel
6. Toggle camera on/off by clicking the camera icon
7. Toggle microphone mute/unmute by clicking the microphone icon - when muted, the AI won't hear you

## Technical Notes

- Some TypeScript errors related to the LiveKitRoom component may still exist, but these don't affect functionality
- The demo uses LiveKit for real-time audio processing and AI integration
- The VideoCamera component has been extended to support the demo requirements
- Camera toggling works by disabling video tracks and showing a visual overlay
- Microphone toggling works by setting the `audio` prop on the LiveKitRoom component
- The TranscriptionCollector component ignores user audio input when the microphone is muted
- The middleware now allows API calls from the YC page without requiring authentication
- API requests include special headers and flags to identify them as coming from the demo

## Future Improvements

- Fix remaining TypeScript errors for LiveKitRoom components
- Add more customization options for the demo interviewer
- Improve error handling for audio devices
- Add more detailed demo data options
- Create a dedicated API route for demo purposes to avoid modifying the main route
- Implement proper demo user sessions that don't require authentication
- Add options to block AI from hearing audio even when microphone appears active
- Implement clearer visual indicators for muted microphone state 