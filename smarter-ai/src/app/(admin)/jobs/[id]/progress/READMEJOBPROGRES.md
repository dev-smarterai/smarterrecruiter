# Job Progress Integration with Real Data

## Overview
This implementation connects the Job Progress page with real data from the job application system. Instead of generating random data, the system now aggregates information from candidates, jobs, and job applications to display meaningful insights.

## Key Components

### Query Functions
- `getJobProgressData`: Fetches real-time job progress data by directly querying candidates with the job's meeting code, then falling back to job applications if needed.

### Candidate Matching Logic
- Direct Matching: Candidates are matched to jobs using the job's meeting code stored in the candidate record
- Fallback Matching: If no candidates have the job's meeting code, the system falls back to finding candidates through job applications
- AI Score Priority: Uses the candidate's AI score as the match score, prioritizing genuine evaluation scores

## Data Aggregation
The system aggregates the following data points:

- **Summary Statistics**
  - Total resumes received
  - Candidates meeting minimum criteria
  - Shortlisted candidates
  - Rejected candidates

- **Top Candidate Analysis**
  - Selects the candidate with highest AI score
  - Extracts education and location information from profile
  - Identifies key skills and achievements from candidate profile
  - Determines potential skill gaps based on job requirements

- **Skill Analysis**
  - Most common skills in the candidate pool
  - Skills missing from the candidate pool but required for the job
  - Recommended learning paths for candidates

- **Interview Questions**
  - Generated based on job title and requirements
  - Tailored to the specific role and skills needed

- **Candidate List**
  - Shows only the top 4 candidates sorted by AI score (highest first)
  - Displays candidate name, email, and match score

## Real-time Updates
The job progress data automatically updates when:
1. A new candidate applies for the job
2. An application status changes (screening, interview, offer, etc.)
3. A candidate's meeting code is updated to match the job

## Implementation Details
- The system uses Convex for backend data storage and real-time updates
- Job progress data is calculated and aggregated from multiple database tables:
  - candidates (primary source by meeting code)
  - jobApplications (fallback source)
  - jobs (for requirements and metadata)
  - jobProgress (for cached data)

## Using the API
```typescript
// Import the API
import { queries, mutations } from "@/lib/api";

// Get job progress data with real candidate information
const jobProgress = useQuery(queries.getJobProgressData, { jobId });

// Apply a candidate to a job (will update job progress)
mutations.applyCandidate({
  candidateId,
  jobId,
  matchScore
});

// Update application status (will update job progress)
mutations.updateApplicationStatus({
  applicationId,
  status // "screening", "interview", "offer", "hired", "rejected"
});
``` 