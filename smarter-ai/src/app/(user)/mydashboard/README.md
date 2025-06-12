# User Dashboard Page

## Overview
This file (`page.tsx`) represents the main dashboard interface for authenticated users. It displays personalized information about the user's candidate profile, job applications, and profile matching metrics.

## Data Flow
1. The page uses Convex queries to fetch data related to the current authenticated user:
   - `getCandidatesByUserId` - Gets basic candidate information
   - `getCandidate` - Gets detailed candidate information with skills assessment
   - `getJobInformation` - Gets job details based on candidate's meeting code

2. Loading states are managed to show appropriate UI while data is being fetched

3. Authentication is checked, redirecting unauthenticated users to the login page

## Component Structure
The dashboard is organized into three columns:

### Left Column
- **ProfileSection**: Displays basic user information
- **SavedJobs**: Shows jobs the user has applied to

### Middle Column
- **AskAdam**: AI assistant interface for user questions

### Right Column
- **ApplicationProgress**: Shows the user's current stage in the application process
- **ProfileMatching**: Displays skills matching metrics and assessments

## Data Processing
- Candidate data is processed to extract relevant information for each component
- Profile matching scores use the candidate's technical skill scores
- Application progress shows the candidate's current status in the hiring pipeline
- Fallback values are provided when specific data points are unavailable

## Key Features
- Real-time data fetching using Convex queries
- Responsive layout for different screen sizes
- Visual representation of profile matching metrics
- Application progress tracking

## Implementation Notes
- The page uses optional chaining (`?.`) extensively to handle potentially undefined values
- Default values are provided as fallbacks when API data is incomplete
- Authentication state determines initial page rendering and redirects 