import candidatesData from './candidatesData.json';
import jobsData from './jobsData.json';
import jobProgressData from './jobProgressData.json';

// Helper functions for accessing candidate data
export const getCandidates = () => candidatesData.candidatesWithProfiles;
export const getCandidateById = (id: string) => {
  const candidate = candidatesData.candidatesWithProfiles.find(c => c.id === id);
  if (!candidate) return null;
  return candidate;
};
export const getCandidatesByJob = (jobId: string) => {
  const candidates = candidatesData.candidatesByJob[jobId as keyof typeof candidatesData.candidatesByJob] || [];
  return candidates.map((id: string) => 
    candidatesData.candidatesWithProfiles.find(c => c.id === id)
  ).filter(Boolean);
};

// Helper functions for accessing job data
export const getJobs = () => jobsData.jobs;
export const getJobById = (id: string) => {
  const job = jobsData.jobs.find(j => j.id === id);
  if (!job) return null;
  return job;
};

// Function to add a new job to both jobsData and jobProgressData
export interface NewJobFormData {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  jobType: {
    remote: boolean;
    fullTime: boolean;
    hybrid: boolean;
  };
  salaryRange: string;
  jobLevel: string;
  location: string;
  skills: string[];
  benefits: string;
  experienceLevel: string;
  deadline: string;
}

// Helper functions for accessing job progress data
export const getJobProgress = (jobId?: string) => {
  if (jobId) {
    return jobProgressData.jobProgress.find(jp => jp.jobId === jobId);
  }
  return jobProgressData.jobProgress;
};

// Alias for backwards compatibility
export const getJobProgressById = (jobId: string) => getJobProgress(jobId);

// Generate random data for new job postings
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElementFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomSuggestedQuestions(title: string): string[] {
  const questions = [
    `What experience do you have with ${title} roles?`,
    `How do you approach problem-solving in a ${title} position?`,
    `Describe a challenging project you worked on as a ${title}.`,
    `What tools or technologies do you prefer as a ${title}?`,
    `How do you stay updated with best practices for ${title} roles?`,
    `Can you explain your process for handling complex tasks in ${title} positions?`,
    `What metrics do you use to measure success in your work as a ${title}?`,
    `How do you collaborate with cross-functional teams as a ${title}?`
  ];
  
  // Randomly select 2-3 questions
  const count = getRandomInt(2, 3);
  const selectedQuestions: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const question = getRandomElementFromArray(questions);
    if (!selectedQuestions.includes(question)) {
      selectedQuestions.push(question);
    }
  }
  
  return selectedQuestions;
}

function generateRandomMissingCriteria(skills: string[]): string[] {
  const allPossibleCriteria = [
    "Cloud Computing", "Deep Learning", "Agile Methodologies", 
    "UX Research", "Mobile Development", "Blockchain", 
    "Cybersecurity", "DevOps", "Microservices Architecture",
    "Leadership", "Technical Writing", "Public Speaking",
    "AI/ML", "Data Visualization", "System Design"
  ];
  
  // Filter out skills that are already in the job requirements
  const possibleCriteria = allPossibleCriteria.filter(
    criteria => !skills.some(skill => 
      skill.toLowerCase().includes(criteria.toLowerCase()) || 
      criteria.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  // Randomly select 2-3 missing criteria
  const count = getRandomInt(2, 3);
  const selectedCriteria: string[] = [];
  
  for (let i = 0; i < count && i < possibleCriteria.length; i++) {
    const criterion = getRandomElementFromArray(possibleCriteria);
    if (!selectedCriteria.includes(criterion)) {
      selectedCriteria.push(criterion);
    }
  }
  
  return selectedCriteria;
}

function generateRandomLearningPaths(missingCriteria: string[]): Array<{title: string, provider: string}> {
  const providers = [
    "LinkedIn Learning", "Udemy", "Coursera", "edX", 
    "Pluralsight", "A Cloud Guru", "Frontend Masters",
    "Codecademy", "DataCamp", "Udacity"
  ];
  
  return missingCriteria.map(criteria => ({
    title: `${criteria} Fundamentals`,
    provider: `${getRandomElementFromArray(providers)} (Framework)`
  }));
}

export function createNewJob(jobInfo: NewJobFormData) {
  // In a real app, this would be an API call
  // For this mock implementation, we'll just simulate adding to the in-memory objects
  
  // Generate a new ID (simple implementation)
  const newJobId = (jobsData.jobs.length + 1).toString();
  
  // Parse salary range
  let salaryMin = 50000;
  let salaryMax = 100000;
  if (jobInfo.salaryRange) {
    const range = jobInfo.salaryRange.split('-');
    if (range.length === 2) {
      // Convert from format like "20k-40k" to numbers
      salaryMin = parseInt(range[0].replace('k', '000'));
      salaryMax = parseInt(range[1].replace('k', '000'));
    }
  }
  
  // Create job type string
  let jobType = "FULL-TIME";
  if (jobInfo.jobType.remote) jobType = "REMOTE";
  if (jobInfo.jobType.hybrid) jobType = "HYBRID";
  
  // Format requirements from string to array
  const requirementsArray = jobInfo.requirements.split('\n')
    .filter(req => req.trim().length > 0);
  
  // Format benefits from string to array
  const benefitsArray = jobInfo.benefits.split('\n')
    .filter(benefit => benefit.trim().length > 0);
  
  // Create new job entry for jobsData
  const newJob = {
    id: newJobId,
    title: jobInfo.title,
    company: "Your Company", // This would be dynamically set in a real app
    companyLogo: "/company-logo.png",
    type: jobType,
    featured: false,
    description: {
      intro: `Your Company is looking for a talented ${jobInfo.title} to join our team.`,
      details: jobInfo.description,
      responsibilities: jobInfo.responsibilities,
      closing: "We look forward to your application!"
    },
    requirements: requirementsArray,
    desirables: [], // This isn't in the form yet
    benefits: benefitsArray,
    salary: {
      min: salaryMin,
      max: salaryMax,
      currency: "USD",
      period: "Yearly salary"
    },
    location: jobInfo.location,
    posted: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
    expiry: jobInfo.deadline ? new Date(jobInfo.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : "",
    level: jobInfo.jobLevel,
    experience: jobInfo.experienceLevel,
    education: ""
  };
  
  // Generate random data for job progress
  const totalResumes = getRandomInt(50, 500);
  const meetingMinCriteria = getRandomInt(totalResumes * 0.2, totalResumes * 0.4);
  const shortlisted = getRandomInt(meetingMinCriteria * 0.1, meetingMinCriteria * 0.3);
  const rejected = totalResumes - meetingMinCriteria;
  const biasScore = getRandomInt(80, 95);
  
  // Generate random missing criteria
  const missingCriteria = generateRandomMissingCriteria(jobInfo.skills);
  
  // Generate random learning paths
  const learningPaths = generateRandomLearningPaths(missingCriteria);
  
  // Generate random suggested questions
  const suggestedQuestions = generateRandomSuggestedQuestions(jobInfo.title);
  
  // Create new job progress entry for jobProgressData with random data
  const newJobProgress = {
    jobId: newJobId,
    title: jobInfo.title,
    role: jobInfo.title,
    summary: {
      totalResumes: totalResumes,
      meetingMinCriteria: meetingMinCriteria,
      shortlisted: shortlisted,
      rejected: rejected,
      biasScore: biasScore
    },
    topCandidate: {
      name: candidatesData.candidatesWithProfiles.length > 0 ? 
        candidatesData.candidatesWithProfiles[0].name : "Sample Candidate",
      position: jobInfo.title,
      matchPercentage: getRandomInt(85, 95),
      education: "MSc in " + jobInfo.skills[0] + " (Top University)",
      location: jobInfo.location || "Remote",
      achievements: [
        jobInfo.skills.length > 0 ? 
          `Expert in ${jobInfo.skills[0]} with proven track record` : 
          "Proven track record in similar roles",
        "Improved team performance by 30% in previous role"
      ],
      skills: jobInfo.skills.length > 0 ? jobInfo.skills : ["Technical Skills"],
      skillGaps: missingCriteria,
      linkedin: "https://linkedin.com/in/topcandidate"
    },
    skillAnalysis: {
      totalScreened: totalResumes,
      matchingThreshold: getRandomInt(70, 85),
      shortlistedRate: Math.round((shortlisted / totalResumes) * 100),
      averageSkillFit: getRandomInt(65, 85)
    },
    suggestedQuestions: suggestedQuestions,
    candidatesPool: {
      topSkills: jobInfo.skills.length > 0 ? jobInfo.skills : ["Technical Skills"],
      missingCriteria: missingCriteria,
      learningPaths: learningPaths
    },
    candidates: candidatesData.candidatesWithProfiles
      .slice(0, Math.min(4, candidatesData.candidatesWithProfiles.length))
      .map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        matchScore: getRandomInt(50, 95)
      }))
  };
  
  // In a real app, these would be API calls to update the backend
  // For this mock implementation, we're simulating the addition
  
  // Add to in-memory objects
  const updatedJobsData = {
    ...jobsData,
    jobs: [...jobsData.jobs, newJob]
  };
  
  const updatedJobProgressData = {
    ...jobProgressData,
    jobProgress: [...jobProgressData.jobProgress, newJobProgress]
  };
  
  // In a real app we would save these to a database
  // For mock purposes, we're just returning the updated data
  // that would be used to update the UI
  return {
    job: newJob,
    jobProgress: newJobProgress,
    updatedJobsData,
    updatedJobProgressData
  };
}

export interface AtGlanceMetric {
  name: string;
  value: string | React.ReactNode;
  icon: React.ReactNode;
  chart: React.ReactNode;
}

export function getDashboardStats() {
  const jobs = getJobs();
  const candidates = getCandidates();
  const jobProgress = getJobProgress() as any[];
  
  // Calculate statistics
  const openJobs = jobs.length;
  
  // Count candidates in pipeline (total candidates from candidatesData)
  const candidatesInPipeline = candidates.length;
  
  // Count interviews this week (this is simulated since we don't have actual date data)
  // We'll count candidates in screening or interview status
  const interviewsByAI = candidates.filter(c => 
    c.status === 'screening' || c.status === 'interview'
  ).length;
  const interviewsByHR = Math.floor(interviewsByAI / 2); // Just an example calculation
  
  // Count offers extended (candidates with 'offer' status)
  const offersExtended = candidates.filter(c => c.status === 'offer').length;
  
  // Calculate offer conversion rate (offers / total candidates who reached interview)
  const candidatesReachedInterview = candidates.filter(c => 
    c.status === 'interview' || c.status === 'offer' || c.status === 'rejected'
  ).length;
  const offerConversionRate = candidatesReachedInterview > 0 
    ? Math.round((offersExtended / candidatesReachedInterview) * 100) 
    : 0;
  
  return {
    openJobs,
    candidatesInPipeline,
    interviewsByAI,
    interviewsByHR,
    offersExtended,
    offerConversionRate
  };
}

export { candidatesData, jobsData, jobProgressData }; 