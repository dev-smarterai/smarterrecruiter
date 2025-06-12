import { candidates } from "./candidates";
import { Candidate } from "./schema";

// Generate position and status for each candidate
const positions = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "UI/UX Designer",
    "Product Manager",
    "DevOps Engineer",
    "Data Scientist"
];

// Use fixed statuses instead of random ones to avoid hydration errors
const statuses = [
    "applied",
    "screening",
    "interview",
    "offer",
    "rejected"
];

// Mock recruiters
const recruiters = [
    "Sarah Miller",
    "John Davis",
    "Emma Thompson",
    "Michael Wilson"
];

// Extract date from the timestamps for the applied date
function getAppliedDate(candidate: any): string {
    if (candidate.profile && candidate.profile.timestamps && candidate.profile.timestamps.length > 0) {
        const appliedTimestamp = candidate.profile.timestamps.find((t: any) => t.label === "Applied");
        if (appliedTimestamp) {
            return appliedTimestamp.date;
        }
    }
    return "N/A";
}

// Get the last activity date from timestamps
function getLastActivity(candidate: any): string {
    if (candidate.profile && candidate.profile.timestamps && candidate.profile.timestamps.length > 0) {
        // Get the most recent timestamp
        const lastTimestamp = candidate.profile.timestamps[candidate.profile.timestamps.length - 1];
        return `${lastTimestamp.label}: ${lastTimestamp.date}`;
    }
    return "N/A";
}

// Calculate progress based on status
function getProgress(status: string): number {
    switch (status) {
        case "applied": return 20;
        case "screening": return 40;
        case "interview": return 60;
        case "offer": return 80;
        case "rejected": return 100;
        default: return 0;
    }
}

// Use a deterministic approach for assigning statuses based on candidate ID
function getStatusForCandidate(id: string): string {
    // Convert the ID to a number and use modulo to get a consistent status
    const idNumber = parseInt(id, 10);
    const statusIndex = idNumber % statuses.length;
    return statuses[statusIndex];
}

// Use a deterministic approach for assigning positions based on candidate ID
function getPositionForCandidate(id: string): string {
    // Convert the ID to a number and use a different modulo to get a consistent position
    const idNumber = parseInt(id, 10);
    const positionIndex = (idNumber * 2) % positions.length;
    return positions[positionIndex];
}

// Use a deterministic approach for assigning recruiters based on candidate ID
function getRecruiterForCandidate(id: string): string {
    const idNumber = parseInt(id, 10);
    const recruiterIndex = (idNumber * 3) % recruiters.length;
    return recruiters[recruiterIndex];
}

// Transform the data to match the new schema
export const candidatesData: Candidate[] = candidates.map(candidate => {
    const status = getStatusForCandidate(candidate.id);
    return {
        id: candidate.id,
        name: candidate.name,
        initials: candidate.initials,
        email: candidate.email,
        textColor: candidate.textColor,
        bgColor: candidate.bgColor,
        aiScore: candidate.profile.aiScore,
        status: status,
        appliedDate: getAppliedDate(candidate),
        position: getPositionForCandidate(candidate.id),
        recruiter: getRecruiterForCandidate(candidate.id),
        progress: getProgress(status),
        lastActivity: getLastActivity(candidate)
    };
}); 