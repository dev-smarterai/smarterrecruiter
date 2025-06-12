"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { cx } from "@/lib/utils";
import {
  RiBriefcaseLine,
  RiUserLine,
  RiDatabase2Line,
  RiMoneyDollarCircleLine,
  RiPercentLine,
  RiArrowRightUpLine,
} from "@remixicon/react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { Job, queries, mutations } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from "@/components/Table";
import { Badge } from "@/components/Badge";
import { ProgressBar } from "@/components/ProgressBar";
import { useAuth } from "@/lib/auth";
import Dashboard3 from "@/components/newUI/admin/dashboard/dashboard3";
import React, { useState, useEffect } from "react";
import AskAdamAdmin from "@/components/newUI/admin/dashboard/ask-adam-admin";
import AskAdamCandidate from "@/components/newUI/admin/dashboard/ask-adam-candidate";
// AI Navigation System imports
import { AIPageWrapper } from "@/lib/ai-navigation";
import { AIContentBlock, AIGrid } from "@/components/ui/ai-navigation/AIContentBuilder";

// ---------------------------------------------
// Types
// ---------------------------------------------
interface JobListing {
  id: Job["id"];
  title: string;
  company: string;
  location: string;
  type: string;
  featured?: boolean;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  posted?: string;
}


// ---------------------------------------------
// Component
// ---------------------------------------------
export default function Dashboard() {
  //-------------------------------------------------------------
  // AUTH & DATA
  //-------------------------------------------------------------
  const { user, isLoading: isAuthLoading } = useAuth();
  const [showAskAdam, setShowAskAdam] = useState(false);
  const [isAdamAnimating, setIsAdamAnimating] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setHasScrolled(scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const jobs = useQuery(queries.getJobs);
  const atGlanceMetrics = useQuery(queries.getAtGlanceMetrics);
  const candidateStats = useQuery(queries.getCandidatesStats);
  const thirdHighestCandidate = useQuery(queries.getThirdHighestScoringCandidate);
  const talentPoolTags = useQuery(queries.getTalentPoolTags);
  const todaysInterviews = useQuery(queries.getTodaysInterviews);
  const topCandidateWithJob = useQuery(queries.getTopCandidateWithJobDescription);
  console.log(topCandidateWithJob);


  // Mutations
  const createTalentPoolTag = useMutation(mutations.createTalentPoolTag);

  // Handle Adam animation
  const handleAskAdamClick = () => {
    setIsAdamAnimating(true);
    setTimeout(() => {
      setShowAskAdam(true);
      setIsAdamAnimating(false);
    }, 700); // Animation duration
  };

  // Handle tag creation
  const handleCreateTag = async () => {
    if (newTagName.trim()) {
      try {
        // Generate a random color for the new tag
        const colors = [
          "bg-indigo-100 text-indigo-700",
          "bg-green-100 text-green-700",
          "bg-blue-100 text-blue-700",
          "bg-purple-100 text-purple-700",
          "bg-pink-100 text-pink-700",
          "bg-yellow-100 text-yellow-700",
          "bg-orange-100 text-orange-700",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Create the tag in the database
        await createTalentPoolTag({
          name: newTagName.trim(),
          color: randomColor,
          createdBy: user?._id,
        });
        
        setNewTagName("");
        setShowNewTagInput(false);
      } catch (error) {
        console.error("Error creating tag:", error);
        // You could add a toast notification here
      }
    }
  };

  //-------------------------------------------------------------
  // FORMAT DATA (no business‑logic change)
  //-------------------------------------------------------------
  const jobsData: JobListing[] =
    jobs?.map((job) => ({
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      featured: job.featured,
      salary: job.salary,
      posted: job.posted,
    })) || [];

  const displayJobs = jobsData.slice(0, 5); // show 5 jobs instead of 3

  //-------------------------------------------------------------
  // EARLY RETURNS
  //-------------------------------------------------------------
  if (isAuthLoading || !jobs || !atGlanceMetrics || !candidateStats || !talentPoolTags || todaysInterviews === undefined || topCandidateWithJob === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to access the dashboard</p>
      </div>
    );
  }

  //-------------------------------------------------------------
  // PIPELINE DATA
  //-------------------------------------------------------------
  const pipelineData = candidateStats.candidatesPerStatus || {};
  const pipelineStages = [
    { key: "applied", label: "Applied" },
    { key: "screening", label: "Screened" },
    { key: "interview", label: "Interviewed" },
    { key: "offer", label: "Offers" },
    { key: "rejected", label: "Rejected" },
  ];
  const totalCandidates = Object.values(pipelineData).reduce(
    (sum, count) => sum + (count as number),
    0
  );
  const stageColors = [
    "bg-indigo-600",
    "bg-green-500",
    "bg-yellow-500",
    "bg-orange-500",
    "bg-red-500",
  ];

  //-------------------------------------------------------------
  // METRICS CONFIG
  //-------------------------------------------------------------
  const glanceMetrics = [
    {
      name: "Candidates in pipeline",
      value: atGlanceMetrics.candidatesInPipeline.toString(),
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h10a4 4 0 014 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      name: "Open Jobs",
      value: atGlanceMetrics.openJobs.toString(),
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M16 3v4M8 3v4" />
        </svg>
      ),
    },
    {
      name: "Offers to Extend",
      value: atGlanceMetrics.offersExtended.toString(),
      icon: (
        <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
    },
    {
      name: "Interviews this week",
      value: `${atGlanceMetrics.interviewsByAI + atGlanceMetrics.interviewsByHR}`,
      icon: (
        <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      name: "Offer conversion rate",
      value: `${atGlanceMetrics.offerConversionRate}%`,
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8" />
        </svg>
      ),
    },
  ];

  //-------------------------------------------------------------
  // JSX
  //-------------------------------------------------------------
  return (
    <AIPageWrapper>
      <div className="space-y-6 md:space-y-8 lg:space-y-12 pb-6 md:pb-8 lg:pb-12 px-4 md:px-6 lg:px-8">
      {/* ------------------------------------------------------ */}
      {/* HERO SECTION (three‑column layout)                    */}
      {/* ------------------------------------------------------ */}
      <AIContentBlock delay={0} blockType="header">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:min-h-screen">
                  {/* Mobile and tablet layout */}
          <div className="lg:hidden space-y-6">
            {/* Greeting first on mobile/tablet */}
            <AIContentBlock delay={0.5} blockType="header">
              <div>
                <h1 className="text-xl font-semibold text-gray-700">
                  Good Morning, {user.name}
                </h1>
                <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl leading-snug font-extrabold text-gray-900">
                  Find Your Best <br /> Candidates!
                </h2>
              </div>
            </AIContentBlock>

                      {/* Center content - Ask Adam */}
            <AIContentBlock delay={1} blockType="card">
              <div className="flex flex-col items-center justify-center gap-6">
            {!showAskAdam ? (
              <>
                {/* Orb with animation */}
                <div 
                  className={`relative flex items-center justify-center transition-all duration-700 ease-in-out cursor-pointer group ${isAdamAnimating ? 'scale-150 opacity-0' : ''}`}
                  onClick={handleAskAdamClick}
                >
                  {/* Orb video */}
                  <video
                    src="/orb.webm"
                    width={300}
                    height={300}
                    className="w-64 h-64 md:w-80 md:h-80 rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-300/0 transition-all duration-300"></div>
                </div>
                {/* Ask Adam */}
                <Button 
                  className={`w-28 transition-all duration-500 ease-in-out ${isAdamAnimating ? 'scale-110 bg-indigo-600 text-white' : ''}`} 
                  onClick={handleAskAdamClick}
                >
                  Ask Adam
                </Button>
              </>
            ) : (
              <div className="w-full h-[400px] md:h-[500px] animate-fadeIn">
                <AskAdamAdmin onClose={() => setShowAskAdam(false)} />
              </div>
            )}
            </div>
          </AIContentBlock>
          
                      {/* Grid for other content on mobile/tablet */}
            <AIGrid staggerDelay={0.15}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Left content */}
            <div className="space-y-4 md:space-y-6">

              {/* Job listings (compact list) */}
              <Card className="p-5 bg-indigo-50/40 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Job listings</h3>
                <ul className="space-y-3">
                  {displayJobs.map((job) => {
                    // Calculate days ago
                    const postedDate = new Date(job.posted || Date.now());
                    const currentDate = new Date();
                    const diffTime = Math.abs(currentDate.getTime() - postedDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const timeAgo = diffDays <= 0 ? "Today" : diffDays === 1 ? "1d ago" : `${diffDays}d ago`;
                    
                    return (
                      <li key={job.id.toString()}>
                        <Link href={`/jobs/${job.id}`}>
                          <div className="flex items-center justify-between rounded-full bg-white/60 px-4 py-2 text-sm shadow-sm backdrop-blur-md hover:bg-white/80 hover:shadow-md transition-all duration-200 cursor-pointer">
                            <span className="truncate w-36 font-medium text-gray-800">
                              {job.title}
                            </span>
                            <span className="text-xs text-gray-400 ml-3">Posted {timeAgo}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              {/* Short‑listed candidate card */}
              <Card className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-700 text-left">Shortlisted</h3>
                  <h3 className="text-sm font-medium text-gray-700 text-left">Candidate</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center">
                  {/* Left side - Profile info */}
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Arlurway</span>
                    </div>
                    <p className="text-sm text-gray-500">Oslo, Norway</p>
                  </div>
                  
                  {/* Right side - Profile image */}
                  <div className="flex justify-end">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://randomuser.me/api/portraits/men/32.jpg"
                      alt="shortlisted candidate"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right content */}
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Todays Actions */}
              <Card className="p-3 md:p-4 bg-indigo-50 flex flex-col rounded-2xl backdrop-blur-md ring-2 ring-indigo-300/60 space-y-2 w-full">
                <h3 className="text-sm font-semibold mb-1">Today's Interviews</h3>
                <p className="text-xs text-gray-500 mb-2">
                  {todaysInterviews.length > 0 ? `${todaysInterviews.length} interview${todaysInterviews.length > 1 ? 's' : ''} scheduled` : 'No interviews scheduled'}
                </p>
                <ul className="space-y-2 text-xs flex-1">
                  {todaysInterviews.length > 0 ? (
                    todaysInterviews.slice(0, 2).map((interview) => (
                      <li key={interview._id} className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center font-medium text-indigo-600 text-xs">
                            {interview.candidateInitials}
                          </div>
                          <div>
                            <p className="font-medium leading-snug">Candidate Interview</p>
                            <p className="text-xs text-gray-500 leading-snug">
                              {interview.candidateName} – {interview.position}
                            </p>
                          </div>
                        </div>
                        <span className="whitespace-nowrap text-gray-600 font-medium text-xs">
                          {interview.time}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-center justify-center py-4">
                      <p className="text-xs text-gray-400">No interviews scheduled for today</p>
                    </li>
                  )}
                </ul>
              </Card>

              {/* Metrics cards group - Modernized design with animation */}
              <Card style={{
                background: 'linear-gradient(to right, #F0F4FF 0%, #E8EFFF 20%, #D6E0FA 50%, #D8D8F5 75%, #ECE0FF 100%)',
              }} className="p-4 md:p-5 w-full rounded-2xl bg-gradient-to-br from-white to-indigo-50/30 shadow-md border border-indigo-100/50 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-indigo-700 mb-5 flex items-center">
                  At a Glance
                </h3>
                <div className="space-y-3.5">
                  {glanceMetrics.slice(0, 5).map((metric, index) => (
                    <div 
                      key={metric.name}
                      className="group hover:bg-white transition-all duration-300 ease-in-out rounded-xl overflow-hidden"
                    >
                      <Link href={
                        metric.name === "Candidates in pipeline" ? "/pipeline" : 
                        metric.name === "Open Jobs" ? "/jobs" :
                        metric.name === "Interviews this week" ? "/interview-schedule" : "#"
                      }>
                        <div className="flex items-center justify-between p-2.5 rounded-xl hover:shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              index === 0 ? 'bg-indigo-100 text-indigo-600' : 
                              index === 1 ? 'bg-green-100 text-green-600' : 
                              index === 2 ? 'bg-yellow-100 text-yellow-600' : 
                              index === 3 ? 'bg-pink-100 text-pink-600' : 
                              'bg-blue-100 text-blue-600'
                            } transform group-hover:scale-110 transition-transform duration-300`}>
                              {metric.icon}
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 font-medium block">
                                {metric.name}
                              </span>
                              <span className="text-lg font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">
                                {metric.value}
                              </span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <RiArrowRightUpLine className="h-4 w-4 text-indigo-500" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
                          </div>
              </div>
            </AIGrid>
          </div>

        {/* Desktop layout (lg and above) */}
        {/* ---------------- LEFT COLUMN --------------------- */}
        <AIContentBlock delay={0.5} blockType="list">
          <div className="hidden lg:block space-y-4 md:space-y-6 lg:space-y-8">
          {/* Greeting & headline */}
          <div>
            <h1 className="text-xl font-semibold text-gray-700">
              Good Morning, {user.name}
            </h1>
            <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl leading-snug font-extrabold text-gray-900">
              Find Your Best <br /> Candidates!
            </h2>
          </div>

          {/* Job listings (compact list) */}
          <Card className="p-5 bg-indigo-50/40 rounded-2xl">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Job listings</h3>
            <ul className="space-y-3">
              {displayJobs.map((job) => {
                // Calculate days ago
                const postedDate = new Date(job.posted || Date.now());
                const currentDate = new Date();
                const diffTime = Math.abs(currentDate.getTime() - postedDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const timeAgo = diffDays <= 0 ? "Today" : diffDays === 1 ? "1d ago" : `${diffDays}d ago`;
                
                return (
                  <li key={job.id.toString()}>
                    <Link href={`/jobs/${job.id}`}>
                      <div className="flex items-center justify-between rounded-full bg-white/60 px-4 py-2 text-sm shadow-sm backdrop-blur-md hover:bg-white/80 hover:shadow-md transition-all duration-200 cursor-pointer">
                        <span className="truncate w-36 font-medium text-gray-800">
                          {job.title}
                        </span>
                        <span className="text-xs text-gray-400 ml-3">Posted {timeAgo}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Short‑listed candidate card */}
          <Card className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700 text-left">Shortlisted</h3>
              <h3 className="text-sm font-medium text-gray-700 text-left">Candidate</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              {/* Left side - Profile info */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Arlurway</span>
                </div>
                <p className="text-sm text-gray-500">Oslo, Norway</p>
              </div>
              
              {/* Right side - Profile image */}
              <div className="flex justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="shortlisted candidate"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              </div>
            </div>
          </Card>
          </div>
        </AIContentBlock>

        {/* ---------------- CENTER COLUMN ------------------- */}
        <AIContentBlock delay={1} blockType="card">
          <div className="hidden lg:flex relative flex-col items-center justify-center gap-4 md:gap-6 lg:col-span-1">
          {!showAskAdam ? (
            <>
                             {/* Orb with animation - moved down for better centering */}
               <div 
                 className={`relative flex items-center justify-center mt-4 md:mt-8 transition-all duration-700 ease-in-out cursor-pointer group ${isAdamAnimating ? 'scale-150 opacity-0' : ''}`}
                 onClick={handleAskAdamClick}
               >
                 {/* Orb video */}
                 <video
                   src="/orb.webm"
                   width={300}
                   height={300}
                   className="w-64 h-64 md:w-80 md:h-80  rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                   autoPlay
                   loop
                   muted
                   playsInline
                 />
                 {/* Hover effect */}
                 <div className="absolute inset-0 rounded-full border-2 border-indigo-300/0 transition-all duration-300"></div>
               </div>
              {/* Ask Adam */}
              <Button 
                className={`w-28 mb-16 sm:mb-0 md:w-32 transition-all duration-500 ease-in-out ${isAdamAnimating ? 'scale-110 bg-indigo-600 text-white' : ''}`} 
                onClick={handleAskAdamClick}
              >
                Ask Adam
              </Button>
            </>
          ) : (
            <div className="w-full   lg:h-[600px] animate-fadeIn">
              <AskAdamAdmin onClose={() => setShowAskAdam(false)} />
            </div>
          )}
          </div>
        </AIContentBlock>

        {/* ---------------- RIGHT COLUMN ------------------- */}
        <div className="hidden lg:flex flex-col gap-3 md:gap-4 items-end lg:col-span-1">
          {/* Today's Interviews */}
          <Card className="p-3 md:p-4 bg-indigo-50 flex flex-col rounded-2xl backdrop-blur-md ring-2 ring-indigo-300/60 space-y-2 max-w-xs w-full">
            <h3 className="text-sm font-semibold mb-1">Today's Interviews</h3>
            <p className="text-xs text-gray-500 mb-2">
              {todaysInterviews.length > 0 ? `${todaysInterviews.length} interview${todaysInterviews.length > 1 ? 's' : ''} scheduled` : 'No interviews scheduled'}
            </p>
            <ul className="space-y-2 text-xs flex-1">
              {todaysInterviews.length > 0 ? (
                todaysInterviews.slice(0, 2).map((interview) => (
                  <li key={interview._id} className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center font-medium text-indigo-600 text-xs">
                        {interview.candidateInitials}
                      </div>
                      <div>
                        <p className="font-medium leading-snug">Candidate Interview</p>
                        <p className="text-xs text-gray-500 leading-snug">
                          {interview.candidateName} – {interview.position}
                        </p>
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-gray-600 font-medium text-xs">
                      {interview.time}
                    </span>
                  </li>
                ))
              ) : (
                <li className="flex items-center justify-center py-4">
                  <p className="text-xs text-gray-400">No interviews scheduled for today</p>
                </li>
              )}
            </ul>
          </Card>

          {/* Metrics cards group - Modernized design with animation */}
          <Card style={{
            background: 'linear-gradient(to right, #F0F4FF 0%, #E8EFFF 20%, #D6E0FA 50%, #D8D8F5 75%, #ECE0FF 100%)',
          }} className="p-4 md:p-5 w-full max-w-xs rounded-2xl bg-gradient-to-br from-white to-indigo-50/30 shadow-md border border-indigo-100/50 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-indigo-700 mb-5 flex items-center">
          
              At a Glance
            </h3>
            <div className="space-y-3.5">
              {glanceMetrics.slice(0, 5).map((metric, index) => (
                <div 
                  key={metric.name}
                  className="group hover:bg-white transition-all duration-300 ease-in-out rounded-xl overflow-hidden"
                >
                  <Link href={
                    metric.name === "Candidates in pipeline" ? "/pipeline" : 
                    metric.name === "Open Jobs" ? "/jobs" :
                    metric.name === "Interviews this week" ? "/interview-schedule" : "#"
                  }>
                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          index === 0 ? 'bg-indigo-100 text-indigo-600' : 
                          index === 1 ? 'bg-green-100 text-green-600' : 
                          index === 2 ? 'bg-yellow-100 text-yellow-600' : 
                          index === 3 ? 'bg-pink-100 text-pink-600' : 
                          'bg-blue-100 text-blue-600'
                        } transform group-hover:scale-110 transition-transform duration-300`}>
                          {metric.icon}
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 font-medium block">
                            {metric.name}
                          </span>
                          <span className="text-lg font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">
                            {metric.value}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <RiArrowRightUpLine className="h-4 w-4 text-indigo-500" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
        </div>
      </AIContentBlock>

      {/* ------------------------------------------------------ */}
      {/* PIPELINE OVERVIEW & OTHER SECTIONS                     */}
      {/* ------------------------------------------------------ */}

      {/* Candidate Pipeline Overview */}
      {/* <div className="space-y-4 mt-6">
        <h2 className="text-lg font-semibold">Candidate Pipeline Overview</h2>
        <Card className="p-6 rounded-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
            {pipelineStages.map((stage) => (
              <div key={stage.key} className="text-center">
                <div className="text-xl font-bold mb-1">
                  {pipelineData[stage.key] || 0}
                </div>
                <div className="text-xs text-gray-500">{stage.label}</div>
              </div>
            ))}
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full flex overflow-hidden">
            {pipelineStages.map((stage, index) => {
              const count = pipelineData[stage.key] || 0;
              const percentage =
                totalCandidates > 0 ? (count / totalCandidates) * 100 : 0;
              return (
                <div
                  key={stage.key}
                  className={`${stageColors[index]} h-full`}
                  style={{ width: `${percentage}%` }}
                />
              );
            })}
          </div>
        </Card>
      </div> */}

      {/* Job Listings Table */}
      <AIContentBlock delay={1} blockType="table">
        <div className="space-y-4 mt-6 md:mt-8 lg:mt-10">
        <div className="flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-semibold">Job Listings</h2>
          <Link
            href="/jobs"
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Top Hire card - Dynamic data */}
          <div style={{
            background: 'linear-gradient(to right, #F0F4FF 0%, #E8EFFF 20%, #D6E0FA 50%, #D8D8F5 75%, #ECE0FF 100%)',
          }} className="p-2 rounded-3xl">
          <Card  className="p-6 rounded-3xl bg-indigo-50 border-2 border-gray-100 shadow-sm h-auto relative">
            {/* Gemini icon in top-left */}
            <div className="absolute top-4 left-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/gemini-color.svg"
                alt="Gemini"
                width={16}
                height={16}
                className="w-4 h-4"
              />
            </div>
            
            {/* WhatsApp icon in top-right */}
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-green-600">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="relative mt-4">
                {topCandidateWithJob ? (
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                    {topCandidateWithJob.candidate.initials}
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-semibold text-lg">
                    ?
                  </div>
                )}
              </div>
              
              <h3 className="text-center text-lg font-semibold mt-4 text-gray-900">
                {topCandidateWithJob ? topCandidateWithJob.candidate.name : 'Top Hire'}
              </h3>
              
              {topCandidateWithJob ? (
                <div className="space-y-3 mt-4 w-full">
                  <div>
                    <h4 className="text-sm text-blue-500 flex items-center font-medium">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/gemini-color.svg"
                        alt="Gemini"
                        width={12}
                        height={12}
                        className="w-3 h-3 mr-2"
                      />
                      AI Score
                    </h4>
                    <p className="text-sm text-gray-700 ml-5 mt-1">
                      {topCandidateWithJob.candidate.aiScore || 'Not scored'}
                    </p>
                  </div>
                  
                  {topCandidateWithJob.jobDescription && (
                    <>
                      <div>
                        <h4 className="text-sm text-blue-500 flex items-center font-medium">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/gemini-color.svg"
                            alt="Gemini"
                            width={12}
                            height={12}
                            className="w-3 h-3 mr-2"
                          />
                          Position
                        </h4>
                        <p className="text-sm text-gray-700 ml-5 mt-1">{topCandidateWithJob.jobDescription.title}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm text-blue-500 flex items-center font-medium">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/gemini-color.svg"
                            alt="Gemini"
                            width={12}
                            height={12}
                            className="w-3 h-3 mr-2"
                          />
                          Company
                        </h4>
                        <p className="text-sm text-gray-700 ml-5 mt-1">{topCandidateWithJob.jobDescription.company}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm text-blue-500 flex items-center font-medium">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/gemini-color.svg"
                            alt="Gemini"
                            width={12}
                            height={12}
                            className="w-3 h-3 mr-2"
                          />
                          Salary Range
                        </h4>
                        <p className="text-sm text-gray-700 ml-5 mt-1">
                          {topCandidateWithJob.jobDescription.salary.currency}{topCandidateWithJob.jobDescription.salary.min.toLocaleString()} - {topCandidateWithJob.jobDescription.salary.currency}{topCandidateWithJob.jobDescription.salary.max.toLocaleString()} {topCandidateWithJob.jobDescription.salary.period}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3 mt-4 w-full">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">No candidates with AI scores available</p>
                  </div>
                </div>
              )}
              
              <div className="mt-6 w-full grid grid-cols-2 gap-2">
              </div>
            </div>
          </Card>
          </div>
          
          {/* Job Listings section */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden bg-indigo-50 rounded-2xl">
              <div className="overflow-x-auto">
                <TableRoot>
                  <Table>
                    <TableHead>
                      <TableRow className="border-b border-gray-100">
                        <TableHeaderCell className="text-gray-600 font-medium py-4">Job Title</TableHeaderCell>
                        <TableHeaderCell className="text-gray-600 font-medium py-4">Department</TableHeaderCell>
                        <TableHeaderCell className="text-gray-600 font-medium py-4">Posted</TableHeaderCell>
                        <TableHeaderCell className="text-gray-600 font-medium py-4">Applicants</TableHeaderCell>
                        <TableHeaderCell className="text-gray-600 font-medium py-4">Shortlisted</TableHeaderCell>
                        <TableHeaderCell className="text-gray-600 font-medium py-4">Status</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jobs.slice(0, 5).map((job, index) => {
                        // Define background colors for job titles
                        const bgColors = [
                          "bg-purple-100 text-purple-800",
                          "bg-pink-100 text-pink-800", 
                          "bg-blue-100 text-blue-800",
                          "bg-orange-100 text-orange-800",
                          "bg-purple-100 text-purple-800"
                        ];
                        
                        // Profile images for applicants
                        const profileImages = [
                          "https://randomuser.me/api/portraits/women/32.jpg",
                          "https://randomuser.me/api/portraits/men/45.jpg",
                          "https://randomuser.me/api/portraits/men/23.jpg",
                          "https://randomuser.me/api/portraits/women/67.jpg",
                          "https://randomuser.me/api/portraits/men/89.jpg"
                        ];
                        
                        const applicantCount = Math.floor(Math.random() * 50) + 10;
                        const shortlistedCount = Math.floor(Math.random() * 10) + 1;
                        
                        return (
                          <TableRow key={job._id.toString()} className="border-b border-gray-50 hover:bg-slate-50/40 cursor-pointer">
                            <TableCell className="py-4">
                              <Link href={`/jobs/${job._id}`}>
                                <div className={`${bgColors[index % bgColors.length]} px-3 py-2 rounded-lg inline-block font-medium hover:opacity-80 transition-opacity`}>
                                  {job.title}
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell className="py-4 text-gray-700">{job.company}</TableCell>
                            <TableCell className="py-4 text-gray-700">{job.posted}</TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={profileImages[index % profileImages.length]}
                                  alt="Applicant"
                                  className="w-6 h-6 rounded-full"
                                />
                                <span className="font-semibold text-gray-900">{applicantCount}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-gray-700 font-semibold">{shortlistedCount}</TableCell>
                            <TableCell className="py-4">
                              <span className="bg-indigo-300 text-indigo-800 px-2 py-1 rounded-md text-sm font-medium">Open</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableRoot>
              </div>
            </Card>
          </div>
        </div>
        </div>
      </AIContentBlock>

      {/* Grid layout for Ask Adam, Talent Pool Tags and Analytics Snapshot */}
      <AIGrid staggerDelay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mt-6 md:mt-8 lg:mt-10">
        {/* Ask Adam Admin */}
        <div className="space-y-4 md:col-span-2 lg:col-span-1">
          <div className="h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
            <AskAdamCandidate  jobCreationMode={false} />
          </div>
        </div>

        {/* Talent Pool Tags */}
        <div className="space-y-4">
          <Card className="p-4 md:p-6 rounded-3xl bg-indigo-50">
            <h2 className="text-lg font-semibold mb-4">Talent Pool Tags</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {talentPoolTags.map((tag) => (
                <div key={tag._id} className={`py-1.5 px-3 ${tag.color} rounded-full text-xs`}>
                  {tag.name} {tag.count > 0 && `(${tag.count})`}
                </div>
              ))}
            </div>
            {!showNewTagInput ? (
              <button 
                onClick={() => setShowNewTagInput(true)}
                className="text-indigo-600 flex items-center gap-1 text-sm font-medium hover:text-indigo-800 transition-colors"
              >
                <span>+ Create New Tag</span>
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                  placeholder="Enter tag name..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTag}
                    className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-sm hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowNewTagInput(false);
                      setNewTagName("");
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
        
        {/* Analytics Snapshot */}
        <div className="space-y-4">
          <Card className="p-4 md:p-6 rounded-3xl bg-indigo-50">
            <h2 className="text-lg font-semibold mb-4">Analytics Snapshot</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Time-to-hire</span>
                  <span className="text-sm font-semibold">12 days</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full">
                  <div className="h-full w-1/2 bg-indigo-500 rounded-full"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Top Source</span>
                  <span className="text-sm font-semibold">LinkedIn (80%)</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full">
                  <div className="h-full w-4/5 bg-indigo-500 rounded-full"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Drop-off Stage</span>
                  <span className="text-sm font-semibold">Assessments</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="flex h-full">
                    <div className="bg-indigo-500 h-full w-1/5"></div>
                    <div className="bg-green-500 h-full w-1/5"></div>
                    <div className="bg-orange-500 h-full w-1/5"></div>
                    <div className="bg-red-500 h-full w-2/5"></div>
                  </div>
                </div>
              </div>
              
              <div className="pt-3">
                <h3 className="text-sm font-medium mb-3">Hidden Gem Detector</h3>
                {thirdHighestCandidate ? (
                  <Link href={`/candidates/${thirdHighestCandidate.id}`}>
                    <div className="flex items-center gap-3 hover:bg-white/50 rounded-lg p-2 -m-2 transition-colors cursor-pointer">
                      <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs">
                        {thirdHighestCandidate.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{thirdHighestCandidate.name}</p>
                        <p className="text-xs text-gray-500">
                          Score: {thirdHighestCandidate.aiScore || 'N/A'} • {thirdHighestCandidate.position || 'Position not specified'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-semibold">
                      ?
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">No candidates available</p>
                      <p className="text-xs text-gray-400">Add more candidates to see hidden gems</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
        </div>
      </AIGrid>

      {/* ------------------------------------------------------ */}
      {/* DASHBOARD 3 SECTION                                    */}
      {/* ------------------------------------------------------ */}
      <AIContentBlock delay={3} blockType="card">
        <div className="">
          <Dashboard3 
            metrics={{
              activeJobs: atGlanceMetrics.openJobs,
              candidates: atGlanceMetrics.candidatesInPipeline,
              sourced: atGlanceMetrics.sourced,
              screened: atGlanceMetrics.screened,
              scheduled: atGlanceMetrics.scheduled,
            }}
          />
        </div>
      </AIContentBlock>
      </div>
    </AIPageWrapper>
  );
}

