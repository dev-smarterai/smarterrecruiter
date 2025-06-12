import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Type definitions for our frontend
export interface Job {
  id: Id<"jobs">;
  _creationTime: number;
  title: string;
  company: string;
  companyLogo: string;
  type: string;
  featured: boolean;
  description: {
    intro: string;
    details: string;
    responsibilities: string;
    closing: string;
  };
  requirements: string[];
  desirables: string[];
  benefits: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  location: string;
  posted: string;
  expiry: string;
  level: string;
  experience: string;
  education: string;
}

export interface AtGlanceMetrics {
  openJobs: number;
  candidatesInPipeline: number;
  interviewsByAI: number;
  interviewsByHR: number;
  offersExtended: number;
  offerConversionRate: number;
  sourced: number;
  screened: number;
  scheduled: number;
}

export interface TodaysInterview {
  _id: Id<"interviewRequests">;
  candidateId: Id<"candidates">;
  candidateName: string;
  candidateInitials: string;
  position: string;
  time: string;
  status: string;
  interviewType?: string;
  meetingCode?: string;
}

export interface TopCandidateWithJob {
  candidate: {
    _id: Id<"candidates">;
    name: string;
    initials: string;
    aiScore?: number;
    position?: string;
    email: string;
  };
  jobDescription?: {
    title: string;
    company: string;
    description: {
      intro: string;
      details: string;
      responsibilities: string;
      closing: string;
    };
    requirements: string[];
    salary: {
      min: number;
      max: number;
      currency: string;
      period: string;
    };
    location: string;
  };
}

// API endpoints
export const queries = {
  // Jobs
  getJobs: api.jobs.getJobs,
  getJob: api.jobs.getJob,
  getFeaturedJobs: api.jobs.getFeaturedJobs,

  // Job Templates
  getJobTemplates: api.jobs.getJobTemplates,

  // Job Progress
  getJobProgress: api.jobProgress.getJobProgress,
  getJobProgressData: api.jobProgress.getJobProgressData,

  // Dashboard
  getDashboardStats: api.dashboard.getDashboardStats,
  getAtGlanceMetrics: api.dashboard.getAtGlanceMetrics,
  getJobsStats: api.dashboard.getJobsStats,
  getCandidatesStats: api.dashboard.getCandidatesStats,
  getThirdHighestScoringCandidate: api.dashboard.getThirdHighestScoringCandidate,
  getTodaysInterviews: api.dashboard.getTodaysInterviews,
  getTopCandidateWithJobDescription: api.dashboard.getTopCandidateWithJobDescription,

  // Candidates
  getCandidates: api.candidates.getCandidates,
  getCandidate: api.candidates.getCandidate,
  getCandidatesByJob: api.candidates.getCandidatesByJob,

  // Talent Pool Tags
  getTalentPoolTags: api.talentPoolTags.getTalentPoolTags,
  getTalentPoolTag: api.talentPoolTags.getTalentPoolTag,
  getTagsForCandidate: api.talentPoolTags.getTagsForCandidate,
  getCandidatesForTag: api.talentPoolTags.getCandidatesForTag,

 

  // Job Applications
  getJobApplications: api.jobProgress.getJobApplications,
};

// Mutations
export const mutations = {
  // Jobs
  createJob: api.jobs.createJob,
  updateJob: api.jobs.updateJob,
  deleteJob: api.jobs.deleteJob,
  
  // Job Templates
  saveUploadedTemplate: api.jobs.saveUploadedTemplate,
  
  // Candidates
  createCandidate: api.candidates.createCandidate,
  updateCandidate: api.candidates.updateCandidate,
  
  // Job Applications
  applyCandidate: api.jobProgress.applyCandidate,
  updateApplicationStatus: api.jobProgress.updateApplicationStatus,

  // Talent Pool Tags
  createTalentPoolTag: api.talentPoolTags.createTalentPoolTag,
  updateTalentPoolTag: api.talentPoolTags.updateTalentPoolTag,
  deleteTalentPoolTag: api.talentPoolTags.deleteTalentPoolTag,
  assignTagToCandidate: api.talentPoolTags.assignTagToCandidate,
  removeTagFromCandidate: api.talentPoolTags.removeTagFromCandidate,
};

export default {
  queries,
  mutations,
}; 