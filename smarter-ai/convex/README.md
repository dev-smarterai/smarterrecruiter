# Convex Setup for Smarter.AI

This folder contains the Convex backend for the Smarter.AI application. It provides a realtime database and backend for managing jobs, candidates, and job applications.

## Schema Overview

The database schema is designed around these core tables:

- **companies**: Information about companies
- **jobs**: Job postings with detailed information
- **candidates**: Candidate profiles and details
- **jobApplications**: Links candidates to jobs with status tracking
- **jobProgress**: Analytics and progress data for each job

## Getting Started

1. Make sure you have Convex CLI installed:

```bash
npm install -g convex
```

2. Start the Convex development server:

```bash
npx convex dev
```

This will sync your Convex functions with your dev deployment in the cloud.

## Importing Existing Data

We've created functions to import your existing mock data into Convex:

```javascript
// Example in your frontend code
import { useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import jobsData from "../src/data/mockStores/jobsData.json"
import candidatesData from "../src/data/mockStores/candidatesData.json"
import jobProgressData from "../src/data/mockStores/jobProgressData.json"

function ImportData() {
  const importJobs = useMutation(api.dataImport.importJobs)
  const importCandidates = useMutation(api.dataImport.importCandidates)
  const importJobProgress = useMutation(api.dataImport.importJobProgress)
  const linkCandidatesToJobs = useMutation(api.dataImport.linkCandidatesToJobs)

  const handleImport = async () => {
    // Import jobs
    await importJobs({ jobs: jobsData.jobs })

    // Import candidates
    await importCandidates({
      candidates: candidatesData.candidatesWithProfiles,
    })

    // Import job progress
    await importJobProgress({ jobsProgress: jobProgressData.jobProgress })

    // Link candidates to jobs
    await linkCandidatesToJobs({
      candidatesByJob: candidatesData.candidatesByJob,
    })
  }

  return <button onClick={handleImport}>Import Data</button>
}
```

## Using Convex in Your Frontend

### Setup in Your App

Add the Convex provider to your app (in your root component):

```tsx
// App.tsx or similar
import { ConvexProvider, ConvexReactClient } from "convex/react"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)

function App() {
  return (
    <ConvexProvider client={convex}>
      <YourAppComponents />
    </ConvexProvider>
  )
}
```

### Querying Data

Use the `useQuery` hook to fetch data:

```tsx
import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"

function JobsList() {
  const jobs = useQuery(api.jobs.getJobs)

  if (jobs === undefined) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {jobs.map((job) => (
        <div key={job._id}>
          <h2>{job.title}</h2>
          <p>{job.company}</p>
        </div>
      ))}
    </div>
  )
}
```

### Creating and Modifying Data

Use the `useMutation` hook to modify data:

```tsx
import { useMutation } from "convex/react"
import { api } from "../convex/_generated/api"

function JobForm() {
  const createJob = useMutation(api.jobs.createJob)

  const handleSubmit = async (formData) => {
    const jobId = await createJob({
      title: formData.title,
      company: formData.company,
      // ... other job fields
    })

    console.log("Created job with ID:", jobId)
  }

  return <form onSubmit={handleFormSubmit}>{/* Form fields */}</form>
}
```

### Dashboard Statistics

We've created functions to generate dashboard statistics:

```tsx
import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"

function Dashboard() {
  const stats = useQuery(api.dashboard.getDashboardStats)

  if (!stats) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <p>{stats.totalJobs}</p>
        </div>

        <div className="stat-card">
          <h3>Total Candidates</h3>
          <p>{stats.totalCandidates}</p>
        </div>

        {/* Other stats */}
      </div>

      <h2>Recent Activities</h2>
      <ul>
        {stats.recentActivities.map((activity, index) => (
          <li key={index}>
            <span>{activity.description}</span>
            <span>{activity.date}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Function Reference

### Jobs

- `getJobs()` - Get all jobs
- `getJob(id)` - Get a job by ID
- `getFeaturedJobs()` - Get featured jobs
- `createJob(jobData)` - Create a new job
- `updateJob(id, jobData)` - Update an existing job
- `deleteJob(id)` - Delete a job

### Candidates

- `getCandidates()` - Get all candidates
- `getCandidate(id)` - Get a candidate by ID
- `getCandidatesByJob(jobId)` - Get candidates for a job
- `createCandidate(candidateData)` - Create a new candidate
- `updateCandidate(id, candidateData)` - Update a candidate
- `deleteCandidate(id)` - Delete a candidate

### Job Applications

- `applyCandidate(candidateId, jobId, matchScore)` - Apply a candidate to a job
- `updateApplicationStatus(applicationId, status)` - Update application status

### Job Progress

- `getJobProgress(jobId)` - Get progress data for a job
- `updateJobProgress(jobId, progressData)` - Update job progress
- `generateRandomJobProgress(jobId)` - Generate random progress data

### Dashboard

- `getDashboardStats()` - Get overall dashboard statistics
- `getJobsStats()` - Get detailed job statistics
- `getCandidatesStats()` - Get detailed candidate statistics

## Development

Add new functions in the appropriate file under the `convex/` directory. Make sure to include validators for arguments and return values.

For database queries, use indexed fields whenever possible for better performance.
