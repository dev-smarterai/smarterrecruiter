interface Job {
    id: number
    title: string
    company: string
    location: string
    type: string
  }
  
  interface SavedJobsProps {
    jobs: Job[]
  }
  
  const SavedJobs = ({ jobs }: SavedJobsProps) => {
    return (
      <div className="bg-indigo-50 p-6 rounded-lg shadow-sm" style={{ height: '280px' }}>
        <h2 className="text-xl font-bold text-gray-900 mb-4 font-sans">Saved Jobs</h2>
        <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 48px)' }}>
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job.id} className="bg-white border rounded-lg p-4 relative">
                <div className="absolute top-4 left-4">
                  <div className="text-blue-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-8">
                  <h3 className="font-semibold font-sans">{job.title}</h3>
                  <p className="text-sm text-gray-600 font-sans">{job.company}</p>
                  <p className="text-xs text-gray-500 font-sans">
                    {job.type} • {job.location}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-[150px]">
              <p className="text-gray-500 italic">No saved jobs found</p>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  export default SavedJobs
  