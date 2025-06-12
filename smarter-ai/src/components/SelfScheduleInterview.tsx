"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { format, addDays } from "date-fns";
import { Mic } from "lucide-react";
import { convex } from "@/lib/convex";

export default function SelfScheduleInterview() {
  const router = useRouter();
  const { user } = useAuth();

  // Form state
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("14:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [meetingCode, setMeetingCode] = useState("");
  const [accessLoading, setAccessLoading] = useState(false);

  // Get candidate information for the current user
  const candidatesData = useQuery(
    api.candidates.getCandidatesByUserId,
    user?._id ? { userId: user._id } : "skip"
  );

  // Get the first candidate if available (most users will have only one candidate profile)
  const candidateData = candidatesData && candidatesData.length > 0 ? candidatesData[0] : null;

  // Available time slots
  const timeSlots = [
    "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30", "04:00", "04:30",
    "05:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
    "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
  ];

  // Mutation to create an interview request
  const createInterviewRequest = useMutation(api.interviews.createInterviewRequest);

  const handleScheduleInterview = async (e) => {
    e.preventDefault();

    if (!candidateData) {
      setError("You need to have a candidate profile before scheduling an interview.");
      return;
    }

    if (!candidateData.position) {
      setError("Your candidate profile must have a position. Please update your profile.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Create interview request
      const interviewRequestId = await createInterviewRequest({
        candidateId: candidateData._id,
        position: candidateData.position,
        date,
        time,
        status: "Scheduled",
        interviewType: "Voice AI Interview",
        location: "Virtual",
        durationType: "30min"
      });

      // Get the meeting code
      const { meetingCode } = await ensureMeetingCode({ interviewRequestId });

      setMeetingCode(meetingCode);
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("Failed to schedule interview. Please try again.");
      setLoading(false);
      console.error(err);
    }
  };

  // Mutation to ensure a meeting code is generated
  const ensureMeetingCode = useMutation(api.interviews.ensureInterviewRequestHasMeetingCode);

  const handleAccessInterview = async () => {
    // Make sure we have a meeting code
    if (!meetingCode.trim()) {
      setError("Meeting code is not available");
      return;
    }

    setAccessLoading(true);
    setError("");

    try {
      // Get the client's current local time - simplest approach
      const now = new Date();
      const clientLocalTime = {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        day: now.getDate(),
        month: now.getMonth(),
        year: now.getFullYear()
      };

      // Validate the interview access first using the same function as in InterviewAccessGuide
      const result = await convex.query(api.interview_access.validateInterviewAccess, {
        meetingCode: meetingCode,
        userId: user?._id,
        clientLocalTime
      });

      if (result.canAccess) {
        // Access granted, navigate to the interview
        router.push(`/ai-meeting?meetingId=${meetingCode}`);
      } else {
        // Access denied for time-based reasons or other constraints
        setError(result.message || "Interview access is not available at this time. Please return at your scheduled time.");
      }
    } catch (err) {
      console.error("Error validating interview access:", err);
      setError("An error occurred when trying to access your interview. Please try again.");
    } finally {
      setAccessLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-indigo-100 p-2 rounded-full">
          <Mic className="h-5 w-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold">Schedule Your Voice Interview</h2>
      </div>

      {!success ? (
        <form onSubmit={handleScheduleInterview} className="space-y-6">
          {!candidateData && (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">No candidate profile found</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You need to have a candidate profile before scheduling an interview.
                      Please complete your profile first.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {candidateData && !candidateData.position && (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Position information missing</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Your candidate profile doesn't have a position set.
                      Please update your profile with your position.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {candidateData && candidateData.position && (
            <div className="border border-indigo-100 bg-indigo-50 rounded-md p-4">
              <h3 className="text-sm font-medium text-indigo-800">Interview Position</h3>
              <p className="mt-1 text-sm text-indigo-700">
                You'll be interviewed for the position: <span className="font-semibold">{candidateData.position}</span>
              </p>
            </div>
          )}

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Select Time
            </label>
            <select
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !candidateData || !candidateData.position}
          >
            {loading ? "Scheduling..." : "Schedule Voice Interview"}
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Interview Scheduled!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Your voice interview for the <span className="font-medium">{candidateData?.position}</span> position
                    has been scheduled for {format(new Date(date), "MMMM d, yyyy")} at {time}.
                  </p>
                  <p className="mt-2">
                    Your interview access code is: <span className="font-mono font-medium">{meetingCode}</span>
                  </p>
                  <div className="mt-2 bg-green-100 p-2 rounded">
                    <p className="text-xs font-medium mb-1">Important Access Information:</p>
                    <ul className="text-xs list-disc ml-5">
                      <li>You can access the interview <strong>15 minutes before</strong> your scheduled time</li>
                      <li>Access remains open for <strong>60 minutes after</strong> your scheduled time</li>
                      <li>You must use the access code on the scheduled date</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              className="w-full"
              onClick={handleAccessInterview}
              disabled={accessLoading}
            >
              {accessLoading ? "Validating Access..." : "Access Interview Now"}
            </Button>

            {error && (
              <div className="rounded-md bg-red-50 p-3 mt-2">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="button"
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => setSuccess(false)}
              disabled={accessLoading}
            >
              Schedule Another
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 border-t pt-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Important Information:</h3>
        <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
          <li><strong>Voice-Only Interview:</strong> This is a voice-only interview with our AI system</li>
          <li>Please ensure you have a working microphone and are in a quiet environment</li>
          <li>Be prepared to answer questions related to the position you applied for</li>
          <li>The interview will last approximately 15-30 minutes</li>
          <li>A transcript will be saved and sent to the hiring manager</li>
        </ul>
      </div>
    </div>
  );
} 