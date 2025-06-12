export type Usage = {
  owner: string
  status: string
  costs: number
  region: string
  stability: number
  lastEdited: string
}

export type Candidate = {
  id: string
  _id?: string
  name: string
  initials: string
  email: string
  phone?: string
  textColor: string
  bgColor: string
  aiScore?: number
  status?: string
  appliedDate?: string
  position?: string
  recruiter?: string
  progress?: number
  lastActivity?: string
  cvFileId?: string
  userId?: string
  meetingCode?: string
  coverLetter?: string
  candidateProfile?: {
    personal?: {
      age?: string
      nationality?: string
      location?: string
      dependents?: string
      visa_status?: string
    }
    career?: {
      experience?: string
      past_roles?: string
      progression?: string
    }
    interview?: {
      duration?: string
      work_eligibility?: string
      id_check?: string
      highlights?: Array<{
        title: string
        content: string
        timestamp: string
        mediaUrl?: string
      }>
      overallFeedback?: Array<{
        text: string
        praise: boolean
      }>
    }
    skills?: {
      technical?: {
        overallScore: number
        skills: Array<{
          name: string
          score: number
        }>
      }
      soft?: {
        overallScore: number
        skills: Array<{
          name: string
          score: number
        }>
      }
      culture?: {
        overallScore: number
        skills: Array<{
          name: string
          score: number
        }>
      }
    }
    cv?: {
      highlights: string[]
      keyInsights: string[]
      score?: number
    }
    skillInsights?: {
      matchedSkills: string[]
      missingSkills: string[]
      skillGaps: Array<{
        name: string
        percentage: number
      }>
      learningPaths: Array<{
        title: string
        provider: string
      }>
    }
    recommendation?: string
  }
}

export type OverviewData = {
  date: string
  "Rows written": number
  "Rows read": number
  Queries: number
  "Payments completed": number
  "Sign ups": number
  Logins: number
  "Sign outs": number
  "Support calls": number
}
