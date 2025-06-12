"use client"
import { Button } from "@/components/Button"
import type React from "react"
import { Input } from "@/components/Input"
import { cx } from "@/lib/utils"
import {
  RiArrowLeftLine,
  RiMagicLine,
  RiUploadLine,
  RiComputerLine,
  RiPaintBrushLine,
  RiCodeLine,
  RiEyeLine,
  RiEditLine,
} from "@remixicon/react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { mutations, queries } from "@/lib/api"
import AskAdamCandidate from "@/components/newUI/admin/dashboard/ask-adam-candidate"
import { 
  InlineEditableText, 
  InlineEditableList, 
  InlineEditableSkills, 
  InlineEditableSelect 
} from "@/components/ui/inline-editable"
// AI Navigation System imports
import { AIPageWrapper } from "@/lib/ai-navigation"
import { AIContentBlock } from "@/components/ui/ai-navigation/AIContentBuilder"
import { Id } from "../../../../../../convex/_generated/dataModel"
import { z } from "zod"

// Zod schema for job validation - same as new job page
const JobValidationSchema = z.object({
  title: z.string().min(1, "Job title is required").max(100, "Job title must be less than 100 characters"),
  description: z.string().min(10, "Job description must be at least 10 characters").max(2000, "Job description is too long"),
  responsibilities: z.string().min(10, "Job responsibilities must be at least 10 characters"),
  requirements: z.string().min(10, "Job requirements must be at least 10 characters"),
  location: z.string().min(1, "Job location is required").max(100, "Location is too long"),
  salaryRange: z.string().min(1, "Salary range is required").refine((val) => {
    // Validate salary format
    const salaryRegex = /^(\$?\d{1,3}(?:,?\d{3})*k?)\s*-\s*(\$?\d{1,3}(?:,?\d{3})*k?)$/i
    return salaryRegex.test(val.trim())
  }, "Salary range must be in format like '50k-80k' or '50,000-80,000'"),
  jobLevel: z.string().optional(),
  experienceLevel: z.string().optional(),
  skills: z.array(z.string().min(1)).min(1, "At least one skill is required"),
  benefits: z.string().optional(),
  jobType: z.object({
    remote: z.boolean(),
    fullTime: z.boolean(),
    hybrid: z.boolean(),
  }),
  deadline: z.string().optional(),
})

type JobFormData = z.infer<typeof JobValidationSchema>

// Utility function to parse salary with better error handling - same as new job page
const parseSalaryRange = (salaryRange: string): { min: number; max: number } => {
  const salaryStr = salaryRange.trim()
  
  if (!salaryStr.includes('-')) {
    throw new Error("Salary range must include a dash (e.g., '50k-80k')")
  }
  
  const range = salaryStr.split('-')
  if (range.length !== 2) {
    throw new Error("Salary range must have exactly one dash separator")
  }
  
  const parseAmount = (str: string): number => {
    const cleanStr = str.trim().toLowerCase().replace(/[$,]/g, '')
    
    if (cleanStr.includes('k')) {
      const num = parseInt(cleanStr.replace('k', ''))
      if (isNaN(num)) throw new Error(`Invalid salary amount: ${str}`)
      return num * 1000
    } else {
      const num = parseInt(cleanStr)
      if (isNaN(num)) throw new Error(`Invalid salary amount: ${str}`)
      // If the number is small (< 1000), assume it's in thousands
      return num < 1000 ? num * 1000 : num
    }
  }
  
  const min = parseAmount(range[0])
  const max = parseAmount(range[1])
  
  if (min >= max) {
    throw new Error("Minimum salary must be less than maximum salary")
  }
  
  if (min < 1000 || max < 1000) {
    throw new Error("Salary values seem too low. Please check the format.")
  }
  
  return { min, max }
}

// Job templates
const jobTemplates = [
  {
    id: "product-designer",
    icon: <RiPaintBrushLine className="h-5 w-5 text-indigo-600" />,
    title: "Product Designer",
    description: "Design and prototype websites...",
    template: {
      title: "Product Designer",
      description:
        "We are looking for a talented Product Designer to join our team. You will be responsible for creating intuitive and visually appealing user interfaces for our digital products.",
      responsibilities:
        "Create user-centered designs by understanding business requirements\nDevelop wireframes, prototypes, and high-fidelity mockups\nCollaborate with developers to implement designs\nConduct user research and usability testing\nStay up-to-date with design trends and best practices",
      requirements:
        "3+ years of experience in product design\nProficiency in design tools like Figma, Sketch, or Adobe XD\nStrong portfolio demonstrating UI/UX design skills\nExcellent communication and collaboration skills\nExperience with design systems and component libraries",
      jobType: {
        remote: true,
        fullTime: true,
        hybrid: false,
      },
      salaryRange: "80k-100k",
      jobLevel: "mid",
      location: "San Francisco, CA",
      skills: ["UI/UX Design", "Wireframing", "Prototyping", "User Research", "Design Systems"],
      benefits:
        "Competitive salary\nHealth, dental, and vision insurance\nFlexible work arrangements\n401(k) matching\nProfessional development budget",
      experienceLevel: "3-5 years",
      deadline: "",
    },
  },
  {
    id: "marketing-specialist",
    icon: <RiPaintBrushLine className="h-5 w-5 text-pink-600" />,
    title: "Marketing Specialist",
    description: "Develop marketing campaigns...",
    template: {
      title: "Marketing Specialist",
      description:
        "We're seeking a creative and data-driven Marketing Specialist to help grow our brand presence and drive customer acquisition through innovative marketing campaigns.",
      responsibilities:
        "Develop and execute marketing campaigns across digital channels\nManage social media accounts and create engaging content\nAnalyze campaign performance and optimize based on data\nCollaborate with design team on marketing materials\nStay current with marketing trends and best practices",
      requirements:
        "2+ years of experience in digital marketing\nProficiency with marketing analytics tools\nExcellent writing and communication skills\nExperience with social media management\nBasic understanding of SEO principles",
      jobType: {
        remote: true,
        fullTime: true,
        hybrid: false,
      },
      salaryRange: "60k-80k",
      jobLevel: "mid",
      location: "New York, NY",
      skills: ["Digital Marketing", "Social Media", "Content Creation", "Analytics", "SEO"],
      benefits:
        "Competitive salary\nHealth insurance\nUnlimited PTO\nRemote work options\nProfessional development opportunities",
      experienceLevel: "1-3 years",
      deadline: "",
    },
  },
  {
    id: "software-engineer",
    icon: <RiCodeLine className="h-5 w-5 text-blue-600" />,
    title: "Software Engineer",
    description: "Build and maintain mobile apps",
    template: {
      title: "Software Engineer",
      description:
        "We are looking for a skilled Software Engineer to join our development team. You will design, develop, and maintain high-quality software solutions that meet business requirements.",
      responsibilities:
        "Design and develop software applications\nWrite clean, maintainable, and efficient code\nTroubleshoot, debug, and upgrade existing systems\nCollaborate with cross-functional teams\nParticipate in code reviews and documentation",
      requirements:
        "Bachelor's degree in Computer Science or related field\n3+ years of experience in software development\nProficiency in one or more programming languages\nFamiliarity with software design patterns\nExperience with agile development methodologies",
      jobType: {
        remote: false,
        fullTime: true,
        hybrid: true,
      },
      salaryRange: "100k-120k",
      jobLevel: "senior",
      location: "Austin, TX",
      skills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
      benefits:
        "Competitive salary\nComprehensive health benefits\n401(k) with company match\nFlexible work arrangements\nContinuing education stipend",
      experienceLevel: "3-5 years",
      deadline: "",
    },
  },
  {
    id: "sales-consultant",
    icon: <RiComputerLine className="h-5 w-5 text-purple-600" />,
    title: "Sales Consultant",
    description: "Drive revenue through B2B sales...",
    template: {
      title: "Sales Consultant",
      description:
        "Waveta is seeking an enthusiastic and results-driven Sales Consultant to join our growing team. You'll be responsible for identifying client product solutions, and helping drive revenue in a fast-paced $385M environment.",
      responsibilities:
        "Connect with prospective clients through outreach campaigns\nDeliveryr product demos tailored to prospect gos\nMaintain sales accuracy and manage pipelines\nCollaborate with marketing optimize campaigns\nmeet monthly/quarterly revenue targets",
      requirements:
        "2-4 years of B2B SaaS sales experience\nProven track record of meeting or exceeding sales quotas\nExcellent communication and presentation skills\nExperience with CRM software (HubSpot, Salesforce, etc.)\nSelf-motivated with strong time management skills",
      jobType: {
        remote: true,
        fullTime: true,
        hybrid: false,
      },
      salaryRange: "80k-100k",
      jobLevel: "mid",
      location: "San Francisco, CA",
      skills: ["B2B Sales", "CRM", "Communication", "Presentation", "Negotiation"],
      benefits:
        "Competitive salary: $80,000-$120,000\nPlus bonus\nComprehensive health benefits\nRemote work options\nProfessional development opportunities",
      experienceLevel: "1-3 years",
      deadline: "",
    },
  },
]

// Mock job data structure for new job
const emptyJobData = {
  title: "",
  description: "",
  responsibilities: "",
  requirements: "",
  jobType: {
    remote: false,
    fullTime: true,
    hybrid: false,
  },
  salaryRange: "",
  jobLevel: "",
  location: "",
  skills: [],
  benefits: "",
  experienceLevel: "",
  deadline: "",
}

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as Id<"jobs">
  
  // Fetch existing job data
  const existingJob = useQuery(queries.getJob, { id: jobId })
  
  const [jobInfo, setJobInfo] = useState(emptyJobData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enhanceOptions, setEnhanceOptions] = useState({
    description: false,
    responsibilities: false,
    requirements: false,
    salaryRange: false,
    skills: false,
    benefits: false,
  })
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  // Add tracking for which fields were updated most recently
  const [recentlyUpdated, setRecentlyUpdated] = useState<Record<string, boolean>>({})
  // Template pagination state
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0)
  const [showDatabaseTemplates, setShowDatabaseTemplates] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Reference for timeouts to clear them if needed
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form with existing job data when it loads
  useEffect(() => {
    if (existingJob) {
      // Convert job data to form format
      const formattedJobData = {
        title: existingJob.title,
        description: existingJob.description.details,
        responsibilities: existingJob.description.responsibilities,
        requirements: existingJob.requirements.join('\n'),
        jobType: {
          remote: existingJob.type === "REMOTE",
          fullTime: existingJob.type === "FULL-TIME" || existingJob.type === "HYBRID",
          hybrid: existingJob.type === "HYBRID",
        },
        salaryRange: `${Math.floor(existingJob.salary.min / 1000)}k-${Math.floor(existingJob.salary.max / 1000)}k`,
        jobLevel: existingJob.level,
        location: existingJob.location,
        skills: existingJob.requirements, // Using requirements as skills for now
        benefits: existingJob.benefits.join('\n'),
        experienceLevel: existingJob.experience,
        deadline: existingJob.expiry ? new Date(existingJob.expiry).toISOString().split("T")[0] : "",
      }
      setJobInfo(formattedJobData)
    }
  }, [existingJob])

  // Clear the "recently updated" highlight after a delay
  useEffect(() => {
    // Clean up all timeouts on unmount
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  // Function to mark a field as recently updated with auto-clearing after a delay
  const markFieldAsUpdated = (field: string) => {
    // Clear any existing timeout for this field
    if (timeoutRefs.current[field]) {
      clearTimeout(timeoutRefs.current[field])
    }
    
    // Mark the field as recently updated
    setRecentlyUpdated(prev => ({
      ...prev,
      [field]: true
    }))
    
    // Set a timeout to clear the highlight after 1.5 seconds
    timeoutRefs.current[field] = setTimeout(() => {
      setRecentlyUpdated(prev => ({
        ...prev,
        [field]: false
      }))
    }, 1500)
  }

  // Handle job data updates from AI chat
  const handleJobDataUpdate = (updates: any) => {
    setJobInfo((prev) => {
      const updated = { ...prev }
      const updatedFields = []

      // Update fields based on the AI response
      if (updates.title && updates.title !== prev.title) {
        updated.title = updates.title
        updatedFields.push('title')
      }
      
      if (updates.description && updates.description !== prev.description) {
        updated.description = updates.description
        updatedFields.push('description')
      }
      
      // Handle responsibilities - convert array to string if needed
      if (updates.responsibilities) {
        const responsibilitiesStr = Array.isArray(updates.responsibilities) 
          ? updates.responsibilities.join('\n')
          : updates.responsibilities
        if (responsibilitiesStr !== prev.responsibilities) {
          updated.responsibilities = responsibilitiesStr
          updatedFields.push('responsibilities')
        }
      }
      
      // Handle requirements - convert array to string if needed
      if (updates.requirements) {
        const requirementsStr = Array.isArray(updates.requirements)
          ? updates.requirements.join('\n')
          : updates.requirements
        if (requirementsStr !== prev.requirements) {
          updated.requirements = requirementsStr
          updatedFields.push('requirements')
        }
      }
      
      // Handle skills - ensure it's always an array
      if (updates.skills) {
        const skillsArray = Array.isArray(updates.skills) 
          ? updates.skills
          : typeof updates.skills === 'string' 
            ? updates.skills.split(',').map(s => s.trim()).filter(s => s)
            : []
        const currentSkills = prev.skills.join(',')
        const newSkills = skillsArray.join(',')
        if (newSkills !== currentSkills && skillsArray.length > 0) {
          updated.skills = skillsArray
          updatedFields.push('skills')
        }
      }
      
      // Handle benefits - convert array to string if needed
      if (updates.benefits) {
        const benefitsStr = Array.isArray(updates.benefits)
          ? updates.benefits.join('\n')
          : updates.benefits
        if (benefitsStr !== prev.benefits) {
          updated.benefits = benefitsStr
          updatedFields.push('benefits')
        }
      }
      
      if (updates.location && updates.location !== prev.location) {
        updated.location = updates.location
        updatedFields.push('location')
      }
      
      // Handle salary - prefer salary object over salaryRange string
      if (updates.salary && typeof updates.salary === 'object') {
        const { min, max, currency = 'USD', period = 'yearly' } = updates.salary
        if (min && max) {
          const salaryRangeStr = `$${(min / 1000).toFixed(0)}k-$${(max / 1000).toFixed(0)}k`
          if (salaryRangeStr !== prev.salaryRange) {
            updated.salaryRange = salaryRangeStr
            updatedFields.push('salaryRange')
          }
        }
      } else if (updates.salaryRange && updates.salaryRange !== prev.salaryRange) {
        updated.salaryRange = updates.salaryRange
        updatedFields.push('salaryRange')
      }
      
      if (updates.jobLevel && updates.jobLevel !== prev.jobLevel) {
        updated.jobLevel = updates.jobLevel
        updatedFields.push('jobLevel')
      }
      
      if (updates.experienceLevel && updates.experienceLevel !== prev.experienceLevel) {
        updated.experienceLevel = updates.experienceLevel
        updatedFields.push('experienceLevel')
      }
      
      if (updates.jobType && typeof updates.jobType === 'object') {
        updated.jobType = { ...prev.jobType, ...updates.jobType }
        updatedFields.push('jobType')
      }

      // Mark updated fields as recently updated
      updatedFields.forEach(field => markFieldAsUpdated(field))

      return updated
    })
  }

  // Get the mutations and queries from Convex
  const updateJob = useMutation(mutations.updateJob)
  const saveUploadedTemplate = useMutation(mutations.saveUploadedTemplate)
  const dbTemplates = useQuery(queries.getJobTemplates) || []

  // Show loading state while fetching job data
  if (existingJob === undefined) {
    return (
      <AIPageWrapper className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading job details...</p>
          </div>
        </div>
      </AIPageWrapper>
    )
  }

  // Show error if job not found
  if (existingJob === null) {
    return (
      <AIPageWrapper className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold mb-4">Job not found</h1>
            <p className="text-gray-500 mb-6">The job you're trying to edit doesn't exist or has been removed.</p>
            <Link href="/jobs">
              <Button>Back to Jobs</Button>
            </Link>
          </div>
        </div>
      </AIPageWrapper>
    )
  }

  const toggleJobType = (type: "remote" | "fullTime" | "hybrid") => {
    setJobInfo((prev) => ({
      ...prev,
      jobType: {
        ...prev.jobType,
        [type]: !prev.jobType[type],
      },
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setJobInfo((prev) => ({
      ...prev,
      [id.replace("job-", "")]: value,
    }))
  }

  const toggleEnhance = (field: keyof typeof enhanceOptions) => {
    setEnhanceOptions((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  // Helper functions for template management
  const getAllTemplates = () => {
    const hardcodedTemplates = jobTemplates.map(t => ({
      ...t,
      source: 'hardcoded' as const
    }))
    
    const databaseTemplates = dbTemplates.map(t => ({
      id: t._id,
      icon: <RiComputerLine className="h-5 w-5 text-purple-600" />,
      title: t.template.title,
      description: t.description || `${t.category} template`,
      template: {
        title: t.template.title,
        description: t.template.description,
        responsibilities: t.template.responsibilities,
        requirements: t.template.requirements,
        jobType: t.template.jobType,
        salaryRange: t.template.salaryRange || "",
        jobLevel: t.template.jobLevel || "",
        location: t.template.location || "",
        skills: t.template.skills,
        benefits: t.template.benefits || "",
        experienceLevel: t.template.experienceLevel || "",
        deadline: "", // Database templates don't have deadlines
      },
      source: 'database' as const,
      category: t.category
    }))
    
    return [...hardcodedTemplates, ...databaseTemplates]
  }

  // Filter templates based on search query
  const getFilteredTemplates = () => {
    const allTemplates = getAllTemplates()
    
    if (!searchQuery.trim()) {
      return allTemplates
    }
    
    const query = searchQuery.toLowerCase()
    return allTemplates.filter(template => 
      template.title.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      ('category' in template && template.category && template.category.toLowerCase().includes(query))
    )
  }

  const filteredTemplates = getFilteredTemplates()
  const templatesPerPage = 3
  const totalPages = Math.ceil(filteredTemplates.length / templatesPerPage)
  const currentTemplates = filteredTemplates.slice(
    currentTemplateIndex * templatesPerPage,
    (currentTemplateIndex + 1) * templatesPerPage
  )

  const nextTemplates = () => {
    setCurrentTemplateIndex((prev) => (prev + 1) % totalPages)
  }

  const prevTemplates = () => {
    setCurrentTemplateIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const applyTemplate = (templateId: string) => {
    const template = filteredTemplates.find((t) => t.id === templateId)
    if (template) {
      setJobInfo(template.template)
      
      // Mark all fields as recently updated
      Object.keys(template.template).forEach(field => {
        if (field !== 'jobType' && field !== 'skills' && field !== 'deadline') {
          markFieldAsUpdated(field)
        }
      })
      if (template.template.skills?.length > 0 && template.template.skills[0] !== "") {
        markFieldAsUpdated('skills')
      }
    }
  }

  const enhanceAllWithAI = async () => {
    // Don't allow enhancement if no title is provided
    if (!jobInfo.title) {
      alert("Please enter a job title before using AI enhancement")
      return
    }

    setIsEnhancing(true)
    
    try {
      // Prepare data to send to API
      const requestData = {
        title: jobInfo.title,
        existingDescription: jobInfo.description || "",
        existingResponsibilities: jobInfo.responsibilities || "",
        existingRequirements: jobInfo.requirements || "",
        existingSkills: jobInfo.skills[0] ? jobInfo.skills.join(", ") : "",
        existingBenefits: jobInfo.benefits || "",
      }
      
      // Call the API with streaming response
      const response = await fetch('/api/generateJob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enhance job description')
      }
      
      // Process the streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }
      
      // Create a buffer decoder
      const decoder = new TextDecoder()
      
      // Keep track of which fields have been updated
      const updatedFields = new Set()
      
      // Process chunks as they arrive
      let isComplete = false
      while (!isComplete) {
        const { value, done } = await reader.read()
        
        if (done) {
          break
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true })
        
        // Split the chunk by newlines (each line should be a complete JSON object)
        const jsonLines = chunk.split('\n').filter(line => line.trim().length > 0)
        
        // Process each JSON line
        for (const jsonLine of jsonLines) {
          try {
            // Parse the JSON object
            const enhancedJob = JSON.parse(jsonLine)
            
            // Check if the streaming is complete
            if (enhancedJob._incomplete === false) {
              isComplete = true
            }
            
            // Update the job info with the streaming content
            setJobInfo((prev) => {
              const updatedJob = { ...prev }
              const newlyUpdatedFields = []
              
              // Only update fields that have valid content
              if (enhancedJob.description && enhancedJob.description !== prev.description) {
                updatedJob.description = enhancedJob.description
                newlyUpdatedFields.push('description')
                updatedFields.add('description')
              }
              
              if (enhancedJob.responsibilities && enhancedJob.responsibilities !== prev.responsibilities) {
                updatedJob.responsibilities = enhancedJob.responsibilities
                newlyUpdatedFields.push('responsibilities')
                updatedFields.add('responsibilities')
              }
              
              if (enhancedJob.requirements && enhancedJob.requirements !== prev.requirements) {
                updatedJob.requirements = enhancedJob.requirements
                newlyUpdatedFields.push('requirements')
                updatedFields.add('requirements')
              }
              
              if (Array.isArray(enhancedJob.skills) && enhancedJob.skills.length > 0) {
                const currentSkills = prev.skills.join(',')
                const newSkills = enhancedJob.skills.join(',')
                if (newSkills !== currentSkills) {
                  updatedJob.skills = enhancedJob.skills
                  newlyUpdatedFields.push('skills')
                  updatedFields.add('skills')
                }
              }
              
              if (enhancedJob.benefits && enhancedJob.benefits !== prev.benefits) {
                updatedJob.benefits = enhancedJob.benefits
                newlyUpdatedFields.push('benefits')
                updatedFields.add('benefits')
              }
              
              // Keep current values for deadline field
              updatedJob.deadline = prev.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
              
              // Mark fields as recently updated
              newlyUpdatedFields.forEach(field => markFieldAsUpdated(field))
              
              return updatedJob
            })
          } catch (error) {
            console.error("Error parsing job data:", error)
          }
        }
      }
      
      // If we didn't get updates for all fields, try one more time with a full request
      const missingFields = ['description', 'responsibilities', 'requirements', 'skills', 'benefits'].filter(
        field => !updatedFields.has(field)
      )
      
      if (missingFields.length > 0 && !isComplete) {
        console.log("Trying to fetch missing fields:", missingFields)
        // Make a final non-streaming request to get any missing fields
        try {
          const finalResponse = await fetch('/api/generateJob', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          })
          
          if (finalResponse.ok) {
            const fullJobData = await finalResponse.json()
            setJobInfo((prev) => {
              const finalUpdatedJob = { ...prev }
              const finalNewlyUpdatedFields = []
              
              for (const field of missingFields) {
                if (field === 'skills') {
                  if (Array.isArray(fullJobData.skills) && fullJobData.skills.length > 0) {
                    finalUpdatedJob.skills = fullJobData.skills
                    finalNewlyUpdatedFields.push('skills')
                  }
                } else if (fullJobData[field]) {
                  finalUpdatedJob[field] = fullJobData[field]
                  finalNewlyUpdatedFields.push(field)
                }
              }
              
              finalNewlyUpdatedFields.forEach(field => markFieldAsUpdated(field))
              return finalUpdatedJob
            })
          }
        } catch (err) {
          console.error("Error in final request:", err)
        }
      }
    } catch (error) {
      console.error("Error enhancing job with AI:", error)
      alert("An error occurred while enhancing the job description. Please try again.")
    } finally {
      setIsEnhancing(false)
    }
  }

  // Function for enhancing individual fields
  const enhanceFieldWithAI = async (field: keyof typeof enhanceOptions) => {
    // Don't allow enhancement if no title is provided
    if (!jobInfo.title) {
      alert("Please enter a job title before using AI enhancement")
      return
    }

    // Mark the field as being enhanced
    const updatedOptions = { ...enhanceOptions }
    updatedOptions[field] = true
    setEnhanceOptions(updatedOptions)
    
    try {
      // Prepare data to send to API - only send the specific field that needs enhancement
      const requestData = {
        title: jobInfo.title,
        existingDescription: field === 'description' ? jobInfo.description || "" : "",
        existingResponsibilities: field === 'responsibilities' ? jobInfo.responsibilities || "" : "",
        existingRequirements: field === 'requirements' ? jobInfo.requirements || "" : "",
        existingSkills: field === 'skills' ? (jobInfo.skills[0] ? jobInfo.skills.join(", ") : "") : "",
        existingBenefits: field === 'benefits' ? jobInfo.benefits || "" : ""
      }
      
      // Call the API with streaming enabled
      const response = await fetch('/api/generateJob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enhance job field')
      }
      
      // Process the streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }
      
      // Create a buffer decoder
      const decoder = new TextDecoder()
      
      // Track if the field was updated
      let fieldWasUpdated = false
      let isComplete = false
      
      // Process chunks as they arrive
      while (!isComplete) {
        const { value, done } = await reader.read()
        
        if (done) {
          break
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true })
        
        // Split the chunk by newlines (each line should be a complete JSON object)
        const jsonLines = chunk.split('\n').filter(line => line.trim().length > 0)
        
        // Process the JSON lines
        for (const jsonLine of jsonLines) {
          try {
            // Parse the JSON object
            const enhancedJob = JSON.parse(jsonLine)
            
            // Check if streaming is complete
            if (enhancedJob._incomplete === false) {
              isComplete = true
            }
            
            // Immediately update the UI with the enhanced content
            setJobInfo((prev) => {
              const updated = { ...prev }
              
              switch (field) {
                case 'description':
                  if (enhancedJob.description && enhancedJob.description !== prev.description) {
                    updated.description = enhancedJob.description
                    fieldWasUpdated = true
                    markFieldAsUpdated('description')
                  }
                  break
                case 'responsibilities':
                  if (enhancedJob.responsibilities && enhancedJob.responsibilities !== prev.responsibilities) {
                    updated.responsibilities = enhancedJob.responsibilities
                    fieldWasUpdated = true
                    markFieldAsUpdated('responsibilities')
                  }
                  break
                case 'requirements':
                  if (enhancedJob.requirements && enhancedJob.requirements !== prev.requirements) {
                    updated.requirements = enhancedJob.requirements
                    fieldWasUpdated = true
                    markFieldAsUpdated('requirements')
                  }
                  break
                case 'skills':
                  if (Array.isArray(enhancedJob.skills) && enhancedJob.skills.length > 0) {
                    const currentSkills = prev.skills.join(',')
                    const newSkills = enhancedJob.skills.join(',')
                    if (newSkills !== currentSkills) {
                      updated.skills = enhancedJob.skills
                      fieldWasUpdated = true
                      markFieldAsUpdated('skills')
                    }
                  } else if (typeof enhancedJob.skills === 'string' && enhancedJob.skills.trim()) {
                    updated.skills = enhancedJob.skills.split(',').map(s => s.trim())
                    fieldWasUpdated = true
                    markFieldAsUpdated('skills')
                  }
                  break
                case 'benefits':
                  if (enhancedJob.benefits && enhancedJob.benefits !== prev.benefits) {
                    updated.benefits = enhancedJob.benefits
                    fieldWasUpdated = true
                    markFieldAsUpdated('benefits')
                  }
                  break
              }
              
              return updated
            })
          } catch (error) {
            console.error(`Error parsing ${field} data:`, error)
          }
        }
      }
      
      // If we didn't get an update for this field, try one more time with a non-streaming request
      if (!fieldWasUpdated && !isComplete) {
        try {
          console.log(`Trying to fetch missing field: ${field}`)
          const finalResponse = await fetch('/api/generateJob', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          })
          
          if (finalResponse.ok) {
            const fullJobData = await finalResponse.json()
            
            setJobInfo((prev) => {
              const updated = { ...prev }
              
              switch (field) {
                case 'description':
                  if (fullJobData.description) {
                    updated.description = fullJobData.description
                    markFieldAsUpdated('description')
                  }
                  break
                case 'responsibilities':
                  if (fullJobData.responsibilities) {
                    updated.responsibilities = fullJobData.responsibilities
                    markFieldAsUpdated('responsibilities')
                  }
                  break
                case 'requirements':
                  if (fullJobData.requirements) {
                    updated.requirements = fullJobData.requirements
                    markFieldAsUpdated('requirements')
                  }
                  break
                case 'skills':
                  if (Array.isArray(fullJobData.skills) && fullJobData.skills.length > 0) {
                    updated.skills = fullJobData.skills
                    markFieldAsUpdated('skills')
                  }
                  break
                case 'benefits':
                  if (fullJobData.benefits) {
                    updated.benefits = fullJobData.benefits
                    markFieldAsUpdated('benefits')
                  }
                  break
              }
              
              return updated
            })
          }
        } catch (err) {
          console.error(`Error in final request for ${field}:`, err)
        }
      }
    } catch (error) {
      console.error(`Error enhancing ${field} with AI:`, error)
      alert(`An error occurred while enhancing the ${field}. Please try again.`)
    } finally {
      // Reset enhancement state
      const resetOptions = { ...enhanceOptions }
      resetOptions[field] = false
      setEnhanceOptions(resetOptions)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/json'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document, text file, or JSON file.')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/parseJobTemplate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to parse job template')
      }

      const parsedJob = await response.json()

      // Update the form with parsed data
      setJobInfo((prev) => {
        const updated = { ...prev }
        const updatedFields = []

        if (parsedJob.title) {
          updated.title = parsedJob.title
          updatedFields.push('title')
        }
        if (parsedJob.description) {
          updated.description = parsedJob.description
          updatedFields.push('description')
        }
        if (parsedJob.responsibilities) {
          updated.responsibilities = parsedJob.responsibilities
          updatedFields.push('responsibilities')
        }
        if (parsedJob.requirements) {
          updated.requirements = parsedJob.requirements
          updatedFields.push('requirements')
        }
        if (parsedJob.jobType) {
          updated.jobType = { ...prev.jobType, ...parsedJob.jobType }
        }
        if (parsedJob.salaryRange) {
          updated.salaryRange = parsedJob.salaryRange
        }
        if (parsedJob.jobLevel) {
          updated.jobLevel = parsedJob.jobLevel
        }
        if (parsedJob.location) {
          updated.location = parsedJob.location
        }
        if (parsedJob.skills && Array.isArray(parsedJob.skills)) {
          updated.skills = parsedJob.skills
          updatedFields.push('skills')
        }
        if (parsedJob.benefits) {
          updated.benefits = parsedJob.benefits
          updatedFields.push('benefits')
        }
        if (parsedJob.experienceLevel) {
          updated.experienceLevel = parsedJob.experienceLevel
        }

        // Mark updated fields
        updatedFields.forEach(field => markFieldAsUpdated(field))

        return updated
      })

      // Save the parsed template to Convex for future use
      try {
        const templateName = `${parsedJob.title || 'Uploaded'} Template - ${new Date().toLocaleDateString()}`
        await saveUploadedTemplate({
          name: templateName,
          parsedTemplate: parsedJob,
          category: 'Uploaded',
          // createdBy: currentUser?.id, // Add this when you have user context
        })
        console.log('Template saved successfully')
      } catch (error) {
        console.error('Error saving template:', error)
        // Don't show error to user as the main functionality (form population) worked
      }

    } catch (error) {
      console.error('Error parsing job template:', error)
      alert('Failed to parse the job template. Please try again or check the file format.')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpdateJob = async () => {
    setIsSubmitting(true)

    try {
      // Prepare data for validation
      const formData: JobFormData = {
        title: jobInfo.title || "",
        description: jobInfo.description || "",
        responsibilities: jobInfo.responsibilities || "",
        requirements: jobInfo.requirements || "",
        location: jobInfo.location || "",
        salaryRange: jobInfo.salaryRange || "",
        jobLevel: jobInfo.jobLevel,
        experienceLevel: jobInfo.experienceLevel,
        skills: Array.isArray(jobInfo.skills) 
          ? jobInfo.skills.filter(skill => skill && skill.trim())
          : [],
        benefits: jobInfo.benefits || "",
        jobType: jobInfo.jobType,
        deadline: jobInfo.deadline,
      }

      // Validate using Zod schema
      const validationResult = JobValidationSchema.safeParse(formData)
      
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        )
        alert("Please fix the following errors:\n\n" + errorMessages.join("\n"))
        setIsSubmitting(false)
        return
      }

      // Parse salary using our utility function
      const { min: salaryMin, max: salaryMax } = parseSalaryRange(validationResult.data.salaryRange)

      // Create job type string
      let jobType = "FULL-TIME"
      if (validationResult.data.jobType.remote) jobType = "REMOTE"
      if (validationResult.data.jobType.hybrid) jobType = "HYBRID"

      // Format requirements from string to array - safely handle null/undefined
      const requirementsArray = validationResult.data.requirements 
        ? validationResult.data.requirements.split("\n").filter((req) => req.trim().length > 0)
        : []

      // Format benefits from string to array - safely handle null/undefined
      const benefitsArray = validationResult.data.benefits
        ? validationResult.data.benefits.split("\n").filter((benefit) => benefit.trim().length > 0)
        : []

      // Create job update data for Convex
      const jobUpdates = {
        id: jobId,
        title: validationResult.data.title.trim(),
        type: jobType,
        description: {
          intro: `${existingJob.company} is looking for a talented ${validationResult.data.title} to join our team.`,
          details: validationResult.data.description.trim(),
          responsibilities: validationResult.data.responsibilities.trim(),
          closing: "We look forward to your application!",
        },
        requirements: requirementsArray,
        benefits: benefitsArray,
        salary: {
          min: salaryMin,
          max: salaryMax,
          currency: "USD",
          period: "Yearly salary",
        },
        location: validationResult.data.location.trim(),
        expiry: validationResult.data.deadline
          ? new Date(validationResult.data.deadline).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
          : existingJob.expiry,
        level: validationResult.data.jobLevel || existingJob.level,
        experience: validationResult.data.experienceLevel || existingJob.experience,
      }

      // Log the data being sent for debugging
      console.log("Updating job with validated data:", jobUpdates)

      // Update job using Convex
      await updateJob(jobUpdates)

      // Redirect to the job listing page
      setIsSubmitting(false)
      router.push(`/jobs/${jobId}`)
    } catch (error) {
      console.error("Error updating job:", error)
      setIsSubmitting(false)
      
      // Better error handling
      if (error instanceof Error) {
        alert(`Failed to update job: ${error.message}`)
      } else {
        alert("There was an error updating the job. Please check all fields and try again.")
      }
    }
  }

  return (
    <AIPageWrapper className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <AIContentBlock delay={0} blockType="header">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link href="/jobs" className="mr-3">
                <RiArrowLeftLine className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-800">Edit Job: {existingJob.title}</h1>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateJob}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
              >
                {isSubmitting ? "Updating..." : "Update Job"}
              </Button>
            </div>
          </div>
        </AIContentBlock>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ask Adam Section */}
            <AIContentBlock delay={1} blockType="card">
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="">
                  <AskAdamCandidate 
                    initialInputValue={`Help me edit the job posting for ${existingJob.title}`}
                    jobCreationMode={true}
                    currentJobData={jobInfo}
                    onJobDataUpdate={handleJobDataUpdate}
                  />
                </div>
              </div>
            </AIContentBlock>

            {/* Job Templates Section */}
            <AIContentBlock delay={2} blockType="card">
              <div className="bg-white rounded-3xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium text-gray-800">Search</h2>
                </div>
                
                <div className="mb-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentTemplateIndex(0) // Reset to first page when searching
                      }}
                      className="w-full p-2 pl-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  {totalPages > 1 && (
                    <>
                      <button
                        onClick={prevTemplates}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                        disabled={totalPages <= 1}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-500">
                        {currentTemplateIndex + 1} / {totalPages}
                      </span>
                      <button
                        onClick={nextTemplates}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                        disabled={totalPages <= 1}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  {currentTemplates.map((template) => (
                    <div key={template.id} className="flex items-center space-x-3">
                      <div className={cx(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        template.source === 'database' ? "bg-purple-100" : "bg-indigo-100"
                      )}>
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{template.title}</h3>
                        <p className="text-xs text-gray-500">
                          {template.description}
                          {template.source === 'database' && (
                            <span className="ml-1 text-purple-600">• Uploaded</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => applyTemplate(template.id)}
                        className="text-xs text-purple-600 hover:text-purple-800"
                      >
                        Use
                      </button>
                    </div>
                  ))}
                  
                  {filteredTemplates.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        {searchQuery ? "No templates match your search" : "No templates available"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-indigo-100 hover:bg-gray-50 disabled:opacity-50"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Parsing...
                      </>
                    ) : (
                      <>
                        <RiUploadLine className="mr-2 h-4 w-4" />
                        Upload Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            </AIContentBlock>
          </div>

          {/* Main Content Area - COMPLETELY UNTOUCHED */}
          <div className="lg:col-span-3">
            {/* Job Preview Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-blue-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden shadow-lg">
                    <div className="bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 h-full w-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{jobInfo.title ? jobInfo.title.charAt(0) : "W"}</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      <InlineEditableText
                        value={jobInfo.title}
                        onChange={(value) => setJobInfo(prev => ({ ...prev, title: value }))}
                        placeholder="Job Title"
                        isRecentlyUpdated={recentlyUpdated.title}
                        className="text-xl font-bold text-gray-900"
                      />
                    </h2>
                    <p className="text-gray-600 text-sm">
                      <InlineEditableText
                        value={jobInfo.location}
                        onChange={(value) => setJobInfo(prev => ({ ...prev, location: value }))}
                        placeholder="Location"
                        isRecentlyUpdated={recentlyUpdated.location}
                        className="text-gray-600 text-sm inline"
                      />
                      {" • "}
                      {jobInfo.jobType.remote ? "Remote-Friendly" : jobInfo.jobType.hybrid ? "Hybrid" : "On-site"}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 shadow-sm mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Overview</h3>
                  <InlineEditableText
                    value={jobInfo.description}
                    onChange={(value) => setJobInfo(prev => ({ ...prev, description: value }))}
                    placeholder="Click to add job description..."
                    multiline={true}
                    isRecentlyUpdated={recentlyUpdated.description}
                    className="text-gray-700 text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Responsibilities</h3>
                    <InlineEditableList
                      items={jobInfo.responsibilities ? 
                        (typeof jobInfo.responsibilities === 'string' 
                          ? jobInfo.responsibilities.split('\n').filter(item => item.trim()) 
                          : Array.isArray(jobInfo.responsibilities) 
                            ? (jobInfo.responsibilities as string[]).filter(item => item && item.trim())
                            : []
                        ) : []}
                      onChange={(items) => setJobInfo(prev => ({ ...prev, responsibilities: items.join('\n') }))}
                      placeholder="Click to add responsibilities..."
                      bulletColor="text-blue-500"
                      isRecentlyUpdated={recentlyUpdated.responsibilities}
                    />
                  </div>

                  <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Skills</h3>
                    <InlineEditableSkills
                      skills={Array.isArray(jobInfo.skills) 
                        ? jobInfo.skills.filter(skill => skill && skill.trim())
                        : typeof jobInfo.skills === 'string'
                          ? (jobInfo.skills as string).split(',').map(s => s.trim()).filter(s => s)
                          : []}
                      onChange={(skills) => setJobInfo(prev => ({ ...prev, skills }))}
                      placeholder="Click to add skills..."
                      isRecentlyUpdated={recentlyUpdated.skills}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-purple-50 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Qualifications</h3>
                    <InlineEditableList
                      items={jobInfo.requirements ? 
                        (typeof jobInfo.requirements === 'string' 
                          ? jobInfo.requirements.split('\n').filter(item => item.trim()) 
                          : Array.isArray(jobInfo.requirements) 
                            ? (jobInfo.requirements as string[]).filter(item => item && item.trim())
                            : []
                        ) : []}
                      onChange={(items) => setJobInfo(prev => ({ ...prev, requirements: items.join('\n') }))}
                      placeholder="Click to add qualifications..."
                      bulletColor="text-purple-500"
                      isRecentlyUpdated={recentlyUpdated.requirements}
                    />
                  </div>

                  <div className="bg-green-50 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Salary</h3>
                    <div className="space-y-1">
                      <p className="text-gray-800 font-medium text-xs">
                        Salary: <InlineEditableSelect
                          value={jobInfo.salaryRange}
                          options={[
                            { value: "20k-40k", label: "$20,000 - $40,000" },
                            { value: "40k-60k", label: "$40,000 - $60,000" },
                            { value: "60k-80k", label: "$60,000 - $80,000" },
                            { value: "80k-100k", label: "$80,000 - $100,000" },
                            { value: "100k-120k", label: "$100,000 - $120,000" },
                            { value: "120k-150k", label: "$120,000 - $150,000" },
                          ]}
                          onChange={(value) => setJobInfo(prev => ({ ...prev, salaryRange: value }))}
                          placeholder="Select salary range"
                          isRecentlyUpdated={recentlyUpdated.salaryRange}
                          className="inline text-gray-800 font-medium text-xs"
                        />
                      </p>
                      <p className="text-gray-600 text-xs">Plus bonus</p>
                      <p className="text-gray-600 text-xs">
                        Job Type:{" "}
                        <InlineEditableSelect
                          value={jobInfo.jobType.fullTime ? "full-time" : jobInfo.jobType.remote ? "remote" : jobInfo.jobType.hybrid ? "hybrid" : "full-time"}
                          options={[
                            { value: "full-time", label: "Full-time" },
                            { value: "remote", label: "Remote" },
                            { value: "hybrid", label: "Hybrid" },
                          ]}
                          onChange={(value) => {
                            const newJobType = {
                              fullTime: value === "full-time",
                              remote: value === "remote",
                              hybrid: value === "hybrid"
                            }
                            setJobInfo(prev => ({ ...prev, jobType: newJobType }))
                          }}
                          placeholder="Select job type"
                          isRecentlyUpdated={recentlyUpdated.jobType}
                          className="inline text-gray-600 text-xs"
                        />
                      </p>
                      <p className="text-gray-600 text-xs">
                        Location: <InlineEditableText
                          value={jobInfo.location}
                          onChange={(value) => setJobInfo(prev => ({ ...prev, location: value }))}
                          placeholder="Location"
                          isRecentlyUpdated={recentlyUpdated.location}
                          className="inline text-gray-600 text-xs"
                        />
                      </p>
                      <p className="text-gray-600 text-xs">Works: Monday–Friday</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Benefits</h3>
                    <InlineEditableList
                      items={jobInfo.benefits ? 
                        (typeof jobInfo.benefits === 'string' 
                          ? jobInfo.benefits.split('\n').filter(item => item.trim()) 
                          : Array.isArray(jobInfo.benefits) 
                            ? (jobInfo.benefits as string[]).filter(item => item && item.trim())
                            : []
                        ) : []}
                      onChange={(items) => setJobInfo(prev => ({ ...prev, benefits: items.join('\n') }))}
                      placeholder="Click to add benefits..."
                      bulletColor="text-green-500"
                      isRecentlyUpdated={recentlyUpdated.benefits}
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Similar Roles</h3>
                    <div className="space-y-1">
                      <p className="text-gray-700 font-medium text-xs">Customer Success Manager - $85k-105k</p>
                      <p className="text-gray-700 font-medium text-xs">Mid-Market Account Exec - $110k-125k</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AIPageWrapper>
  )
}
           