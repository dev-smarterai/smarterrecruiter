"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, X, Filter, ChevronRight, Search, ArrowUpDown, Calendar, Star, StarHalf } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/Badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/Dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Select"
import { Tooltip, type TooltipProps } from "@/components/Tooltip"

export type CandidateStatus = "sourced" | "screened" | "shortlisted" | "rejected"

export type Candidate = {
  id: string
  name: string
  avatarUrl?: string
  previousCompany: string
  experience: number
  degree: string
  status: CandidateStatus
  inviteToInterview?: boolean
  approved?: boolean
}

export type HiringStage = {
  label: string
  completed: boolean
}

export type HiringProcess = {
  position: string
  stages: HiringStage[]
  currentStage: number
  skills: string[]
  daysWithoutReview?: number
}

export type FilterOptions = {
  experience?: string
  degree?: string
  company?: string
}

interface CandidateTrackerProps {
  candidates: Candidate[]
  hiringProcess: HiringProcess
  onInviteToInterview?: (candidateId: string) => void
  onReviewNow?: () => void
  onFilterChange?: (filter: FilterOptions) => void
}

export default function CandidateTracker({
  candidates,
  hiringProcess,
  onInviteToInterview,
  onReviewNow,
  onFilterChange,
}: CandidateTrackerProps) {
  const [activeTab, setActiveTab] = useState<CandidateStatus>("shortlisted")
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterOptions>({})
  const [tempFilters, setTempFilters] = useState<FilterOptions>({})
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Initialize tempFilters when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      setTempFilters({ ...filters })
    }
  }, [isDialogOpen, filters])

  // Apply filters, search, and sorting
  const applyFilters = useCallback(() => {
    let result = candidates.filter((candidate) => candidate.status === activeTab)

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(query) ||
          candidate.previousCompany.toLowerCase().includes(query) ||
          candidate.degree.toLowerCase().includes(query),
      )
    }

    // Apply filters
    if (filters.experience) {
      const [min, max] = filters.experience.split("-").map(Number)
      result = result.filter((candidate) => candidate.experience >= min && candidate.experience <= (max || 100))
    }

    if (filters.degree) {
      result = result.filter((candidate) => candidate.degree.toLowerCase().includes(filters.degree!.toLowerCase()))
    }

    if (filters.company) {
      result = result.filter((candidate) =>
        candidate.previousCompany.toLowerCase().includes(filters.company!.toLowerCase()),
      )
    }

    // Apply sorting
    if (sortBy) {
      result = [...result].sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name)
            break
          case "company":
            comparison = a.previousCompany.localeCompare(b.previousCompany)
            break
          case "experience":
            comparison = a.experience - b.experience
            break
          case "degree":
            comparison = a.degree.localeCompare(b.degree)
            break
          default:
            break
        }

        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    setFilteredCandidates(result)
  }, [candidates, activeTab, searchQuery, filters, sortBy, sortDirection])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters })
    setIsDialogOpen(false)
    onFilterChange?.(tempFilters)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDirection("asc")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
  }

  const clearFilters = () => {
    setTempFilters({})
  }

  const clearAllFilters = () => {
    setFilters({})
    setSearchQuery("")
    setSortBy(null)
  }

  const uniqueCompanies = [...new Set(candidates.map((c) => c.previousCompany))]
  const uniqueDegrees = [...new Set(candidates.map((c) => c.degree))]

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Candidate List */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-black">Position: {hiringProcess.position}</h1>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-slate-200 focus-visible:ring-purple-500 rounded-lg h-12"
                />
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 bg-white border-slate-200 hover:bg-slate-50 rounded-lg h-12 px-4 font-medium"
                  >
                    <Filter className="h-5 w-5 text-purple-600" />
                    Filters
                    {Object.keys(filters).length > 0 && (
                      <Badge variant="neutral" className="ml-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
                        {Object.keys(filters).length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Filter Candidates</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Experience</label>
                      <Select
                        onValueChange={(value) => setTempFilters({ ...tempFilters, experience: value })}
                        value={tempFilters.experience || "any"}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any experience</SelectItem>
                          <SelectItem value="0-2">0-2 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="6-8">6-8 years</SelectItem>
                          <SelectItem value="9-">9+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Degree</label>
                      <Select
                        onValueChange={(value) => setTempFilters({ ...tempFilters, degree: value })}
                        value={tempFilters.degree || "any"}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select degree" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any degree</SelectItem>
                          {uniqueDegrees.map((degree) => (
                            <SelectItem key={degree} value={degree}>
                              {degree}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Previous Company</label>
                      <Select
                        onValueChange={(value) => setTempFilters({ ...tempFilters, company: value })}
                        value={tempFilters.company || "any"}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any company</SelectItem>
                          {uniqueCompanies.map((company) => (
                            <SelectItem key={company} value={company}>
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleApplyFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabs and Content */}
          <div className="bg-slate-50 rounded-xl p-4 md:p-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as CandidateStatus)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 w-full mb-6 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger
                  value="sourced"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-lg py-3 font-medium"
                >
                  Sourced
                </TabsTrigger>
                <TabsTrigger
                  value="screened"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-lg py-3 font-medium"
                >
                  Screened
                </TabsTrigger>
                <TabsTrigger
                  value="shortlisted"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-lg py-3 font-medium"
                >
                  Shortlisted
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-lg py-3 font-medium"
                >
                  Rejected
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <div className="overflow-x-auto">
                  <div className="rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Table Header */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 py-4 px-4 sm:px-6 bg-slate-50 border-b border-slate-200">
                      <div
                        className="font-semibold text-sm text-black cursor-pointer flex items-center gap-1"
                        onClick={() => handleSort("name")}
                      >
                        Name
                        {sortBy === "name" && (
                          <ArrowUpDown className={cn("h-3 w-3", sortDirection === "desc" ? "rotate-180" : "")} />
                        )}
                      </div>
                      <div
                        className="font-semibold text-sm text-black cursor-pointer flex items-center gap-1 hidden sm:flex"
                        onClick={() => handleSort("company")}
                      >
                        Previous company
                        {sortBy === "company" && (
                          <ArrowUpDown className={cn("h-3 w-3", sortDirection === "desc" ? "rotate-180" : "")} />
                        )}
                      </div>
                      <div
                        className="font-semibold text-sm text-black cursor-pointer flex items-center gap-1 hidden sm:flex"
                        onClick={() => handleSort("experience")}
                      >
                        Experience
                        {sortBy === "experience" && (
                          <ArrowUpDown className={cn("h-3 w-3", sortDirection === "desc" ? "rotate-180" : "")} />
                        )}
                      </div>
                      <div
                        className="font-semibold text-sm text-black cursor-pointer flex items-center gap-1 hidden sm:flex"
                        onClick={() => handleSort("degree")}
                      >
                        Degree/Education
                        {sortBy === "degree" && (
                          <ArrowUpDown className={cn("h-3 w-3", sortDirection === "desc" ? "rotate-180" : "")} />
                        )}
                      </div>
                      <div className="font-semibold text-sm text-black text-right hidden sm:block">Status</div>
                    </div>

                    {/* Table Body */}
                    <div>
                      {filteredCandidates.length > 0 ? (
                        filteredCandidates.map((candidate, index) => (
                          <div
                            key={candidate.id}
                            className={cn(
                              "border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/70",
                              index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                            )}
                          >
                            {/* Mobile View */}
                            <div className="block sm:hidden p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-500" />
                                    <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                                      {getInitials(candidate.name)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-green-600">{candidate.name}</div>
                                    <div className="text-xs text-slate-500">{candidate.previousCompany}</div>
                                  </div>
                                </div>
                                {candidate.approved ? (
                                  <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center">
                                    <X className="h-4 w-4 text-red-600" />
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  <Badge className="bg-purple-100 text-purple-800 border-0">
                                    {candidate.experience} years
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-medium">{candidate.degree}</span>
                                </div>
                                {candidate.inviteToInterview && (
                                  <div className="col-span-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                      onClick={() => onInviteToInterview?.(candidate.id)}
                                    >
                                      Invite to interview
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Desktop View */}
                            <div className="hidden sm:grid sm:grid-cols-5 gap-4 py-4 px-6 items-center">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-500" />
                                  <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                                    {getInitials(candidate.name)}
                                  </div>
                                </div>
                                <span className="font-semibold text-green-600">{candidate.name}</span>
                              </div>
                              <div className="font-medium text-slate-700">{candidate.previousCompany}</div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-0">
                                  {candidate.experience} years
                                </Badge>
                              </div>
                              <div className="text-slate-700">{candidate.degree}</div>
                              <div className="flex justify-end items-center gap-2">
                                {candidate.inviteToInterview && (
                                  <Tooltip content="Schedule an interview with this candidate">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                      onClick={() => onInviteToInterview?.(candidate.id)}
                                    >
                                      Invite to interview
                                    </Button>
                                  </Tooltip>
                                )}
                                {candidate.approved ? (
                                  <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center">
                                    <X className="h-4 w-4 text-red-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                              <Search className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="font-medium">No candidates match your filters</p>
                            <p className="text-sm text-slate-400">Try adjusting your search criteria</p>
                            <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                              Clear All Filters
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

  
        </div>
      </div>

  )
}
