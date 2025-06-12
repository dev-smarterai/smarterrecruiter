# Job Progress Integration Guide

This guide explains how to connect the job progress page with real-time data from the database.

## Overview

The job progress page currently uses placeholder data from the `jobProgress` table. To make this page show actual data about applications, candidates, and resumes, we need to integrate it with other tables in the database.

## Current Data Structure

The `jobProgress` table schema already has fields for displaying:
- Resume statistics
- Top candidate insights
- Skills analysis
- Candidate lists
- Suggested questions

## Integration Plan

### 1. Resume/CV Statistics

Connect with actual resume data by:
- Filtering the `files` table for entries with `fileCategory: "resume"`  
- Joining with `jobApplications` to filter files related to the current job
- Calculating summary statistics:
  - Total resumes: Count of applications for the job
  - Meeting minimum criteria: Applications with match score ≥ 50
  - Shortlisted: Applications with status "interview" or "offer"
  - Rejected: Applications with status "rejected"

### 2. Candidate Information

Populate candidate insights from real data:
- Retrieve all job applications for the current job ID
- Join with the `candidates` table to get detailed candidate profiles
- For top candidate:
  - Select the candidate with the highest match score
  - Extract education, location, skills from their profile
  - List achievements from their profile
- For the candidates list:
  - Include all candidates who have applied for the job
  - Show their match scores and current status

### 3. Skills Analysis

Calculate real skills metrics:
- Aggregate skills data from all candidates who applied
- Compare against job requirements to identify:
  - Top skills present in the candidate pool
  - Missing skills based on job requirements
  - Calculate skill gaps for the job
- Determine average skill fit across all applications

## Implementation Strategy

### 1. Create a new query function:

```typescript
export const getJobProgressData = query({
  args: { jobId: v.id("jobs") },
  returns: v.object(/* same shape as jobProgress */),
  handler: async (ctx, args) => {
    // Query job, applications, candidates, and files
    // Calculate statistics and metrics
    // Return data in the same structure as jobProgress
  }
});
```

### 2. Add update triggers:

Create mutations that update job progress when related data changes:

```typescript
// When a new application is submitted
export const onJobApplicationCreated = mutation({
  // ...
  handler: async (ctx, args) => {
    // After creating the application
    await ctx.runMutation(internal.jobProgress.updateJobProgressFromApplications, {
      jobId: args.jobId
    });
  }
});

// When application status changes
export const updateApplicationStatus = mutation({
  // ...
  handler: async (ctx, args) => {
    // After updating status
    await ctx.runMutation(internal.jobProgress.updateJobProgressFromApplications, {
      jobId: application.jobId
    });
  }
});

// When a candidate is updated
export const updateCandidate = mutation({
  // ...
  handler: async (ctx, args) => {
    // After updating candidate
    // Find all jobs this candidate applied to
    const applications = await ctx.db
      .query("jobApplications")
      .withIndex("by_candidate", q => q.eq("candidateId", args.candidateId))
      .collect();
    
    // Update job progress for each job
    for (const app of applications) {
      await ctx.runMutation(internal.jobProgress.updateJobProgressFromApplications, {
        jobId: app.jobId
      });
    }
  }
});
```

### 3. Create an internal update function:

```typescript
export const updateJobProgressFromApplications = internalMutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    // Calculate all job progress metrics
    // Update the jobProgress table entry for this job
  }
});
```

## Page Implementation

Update the job progress page to use the new query:

```tsx
// In page.tsx
const jobProgress = useQuery(queries.getJobProgressData, { 
  jobId: jobIdStr as Id<"jobs"> 
});
```

No changes to the schema are needed, as the existing structure already supports all the required data fields.

## Benefits

This integration will:
1. Show real-time data based on actual applications and candidates
2. Provide accurate insights for recruiters and hiring managers
3. Automatically update when relevant data changes
4. Maintain the existing UI while using real data

## Next Steps

1. Implement the `getJobProgressData` query function
2. Add update triggers to relevant mutations
3. Create the internal update function
4. Test with real applications and candidates
5. Update the job progress page to use the new query 