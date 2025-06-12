"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import jobsData from '../data/mockStores/jobsData.json';
import candidatesData from '../data/mockStores/candidatesData.json';
import jobProgressData from '../data/mockStores/jobProgressData.json';

export default function DataImport() {
  const [status, setStatus] = useState<{
    jobs?: number | null;
    candidates?: number | null;
    jobProgress?: number | null;
    links?: number | null;
    error?: string;
  }>({});

  const importJobs = useMutation(api.dataImport.importJobs);
  const importCandidates = useMutation(api.dataImport.importCandidates);
  const importJobProgress = useMutation(api.dataImport.importJobProgress);
  const linkCandidatesToJobs = useMutation(api.dataImport.linkCandidatesToJobs);

  const handleImport = async () => {
    try {
      setStatus({ ...status, error: undefined });
      
      // Import jobs
      const jobsCount = await importJobs({ jobs: jobsData.jobs });
      setStatus(prev => ({ ...prev, jobs: jobsCount }));
      
      // Import candidates
      const candidatesCount = await importCandidates({ 
        candidates: candidatesData.candidatesWithProfiles 
      });
      setStatus(prev => ({ ...prev, candidates: candidatesCount }));
      
      // Import job progress
      const progressCount = await importJobProgress({ 
        jobsProgress: jobProgressData.jobProgress 
      });
      setStatus(prev => ({ ...prev, jobProgress: progressCount }));
      
      // Link candidates to jobs
      const linksCount = await linkCandidatesToJobs({ 
        candidatesByJob: candidatesData.candidatesByJob 
      });
      setStatus(prev => ({ ...prev, links: linksCount }));
      
    } catch (error) {
      console.error("Import error:", error);
      setStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }));
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Import Mock Data to Convex</h1>
      
      <button 
        onClick={handleImport}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
      >
        Import All Data
      </button>
      
      {status.error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          <p className="font-medium">Error:</p>
          <p>{status.error}</p>
        </div>
      )}
      
      {(status.jobs !== undefined || status.candidates !== undefined || 
        status.jobProgress !== undefined || status.links !== undefined) && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="font-semibold mb-2">Import Results:</h2>
          <ul className="space-y-2">
            {status.jobs !== undefined && (
              <li>Jobs imported: <span className="font-medium">{status.jobs}</span></li>
            )}
            {status.candidates !== undefined && (
              <li>Candidates imported: <span className="font-medium">{status.candidates}</span></li>
            )}
            {status.jobProgress !== undefined && (
              <li>Job progress records imported: <span className="font-medium">{status.jobProgress}</span></li>
            )}
            {status.links !== undefined && (
              <li>Candidate-job links created: <span className="font-medium">{status.links}</span></li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 