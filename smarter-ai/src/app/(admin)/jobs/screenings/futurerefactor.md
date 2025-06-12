# Candidate Job Screening Refactor

## Changes Made

### 1. Updated Candidate Query Return Type
In `candidates.ts`, we expanded the `getCandidatesByJob` query to include additional fields needed by the UI:

- Added `position`, `experience`, `degree`, and `previousCompany` fields
- Added `candidateProfile` with career and skills information
- Included technical and soft skills with their scores
- Added parsing of previous company from career history

### 2. Updated Screenings Page
In `src/app/(admin)/jobs/[id]/screenings/page.tsx`:

- Removed dependency on `jobsProgress.candidates`
- Added direct query to `getCandidatesByJob`
- Updated candidate data transformation to use actual fields instead of placeholders
- Added proper type handling for undefined values
- Changed status handling to default to "sourced" if not present

## Required Database Changes

### Current Limitation
The current database schema has a critical limitation:

- The `candidates` table does not have a direct relationship with jobs
- It only uses `meetingCode` for identification
- There's no `jobId` field in the candidates table

### Required Changes

1. **Add Job Applications Table**
```typescript
// In schema.ts
jobApplications: defineTable({
  jobId: v.id("jobs"),
  candidateId: v.id("candidates"),
  status: v.string(),
  matchScore: v.number(),
  appliedDate: v.string(),
  meetingCode: v.optional(v.string()),
}).index("by_job", ["jobId"])
  .index("by_candidate", ["candidateId"])
```

2. **Update Candidate Creation Flow**
- When creating a candidate, also create a job application entry
- Link the candidate to the job through the jobApplications table
- Migrate existing candidates to have proper job application entries

3. **Update getCandidatesByJob Query**
- Query should first look up applications in jobApplications table
- Then fetch corresponding candidate details
- Join the data to return complete candidate information

### Migration Steps

1. Create the new jobApplications table
2. Write a migration script to:
   - Find all existing candidates
   - Create corresponding job application entries
   - Link them using meetingCode if available
3. Update all candidate creation flows to include job application creation
4. Update queries to use the new table structure

## Next Steps

1. Implement the jobApplications table
2. Write and run the migration script
3. Update the candidate creation flow
4. Test the new data structure with existing UI components
5. Update any other queries that might be affected by this change

## Benefits

- Proper relational structure between jobs and candidates
- Ability to track multiple applications per candidate
- Better organization of application status and match scores
- Cleaner separation of concerns between candidate data and application data 