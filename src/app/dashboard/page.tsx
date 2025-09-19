// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = 'https://hackathon-504442537671.europe-west1.run.app';

interface UserProfile {
  role: 'candidate' | 'expert';
  id: string;
  name: string;
}

interface Interview {
  id: string;
  candidate_id: string;
  job_role: string;
  time: string;
  score?: number;
}

interface Assignment {
  candidate_id: string;
  expert_id: string;
  session: string; // This is the interview ID
  priority: number;
  id: string;
}

interface BookInterviewForm {
  job_role: string;
  time: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [interviewDetails, setInterviewDetails] = useState<{[key: string]: Interview}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookInterviewForm>({
    job_role: '',
    time: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check for user profile
    const profile = localStorage.getItem('userProfile');
    if (!profile) {
      router.push('/');
      return;
    }

    try {
      const parsedProfile = JSON.parse(profile);
      setUserProfile(parsedProfile);
      
      if (parsedProfile.role === 'candidate') {
        fetchCandidateInterviews(parsedProfile.id);
      } else {
        fetchExpertAssignments(parsedProfile.id);
      }
    } catch (error) {
      console.error('Failed to parse user profile:', error);
      router.push('/');
    }
  }, [router]);

  const fetchCandidateInterviews = async (candidateId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/interview/candidate/${candidateId}`);
      if (response.ok) {
        const data = await response.json();
        setInterviews(data);
      } else {
        console.error('Failed to fetch interviews');
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpertAssignments = async (expertId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/expert/${expertId}`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
        
        // Fetch interview details for each assignment
        const interviewIds = [...new Set(data.map((a: Assignment) => a.session))];
        const interviewPromises = interviewIds.map((id) => fetchInterviewDetails(id));
        const interviewResults = await Promise.all(interviewPromises);
        
        const interviewMap: {[key: string]: Interview} = {};
        interviewResults.forEach(interview => {
          if (interview) {
            interviewMap[interview.id] = interview;
          }
        });
        setInterviewDetails(interviewMap);
      } else {
        console.error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInterviewDetails = async (interviewId: string) => {
    try {
      // Note: We might need an endpoint to get interview by ID
      // For now, we'll return null and handle this case
    router.push('/interview/' + interviewId);
    } catch (error) {
      console.error('Error fetching interview details:', error);
      return null;
    }
  };

  const handleBookInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setIsBooking(true);
    setMessage(null);

    try {
      const interviewData = {
        candidate_id: userProfile.id,
        job_role: bookingForm.job_role,
        time: bookingForm.time || new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/interview/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData)
      });

      if (response.ok) {
        const newInterview = await response.json();
        setMessage({ type: 'success', text: 'Interview booked successfully!' });
        setShowBookForm(false);
        setBookingForm({ job_role: '', time: '' });
        
        // Refresh interviews
        fetchCandidateInterviews(userProfile.id);
      } else {
        setMessage({ type: 'error', text: 'Failed to book interview. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error booking interview. Please try again.' });
      console.error('Error booking interview:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const upcomingInterviews = interviews.filter(interview => isUpcoming(interview.time));
  const completedInterviews = interviews.filter(interview => !isUpcoming(interview.time));

  const upcomingAssignments = assignments.filter(assignment => {
    const interview = interviewDetails[assignment.session];
    return interview && isUpcoming(interview.time);
  });
  const completedAssignments = assignments.filter(assignment => {
    const interview = interviewDetails[assignment.session];
    return interview && !isUpcoming(interview.time);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userProfile.name}
          </h1>
          <p className="text-gray-600 mt-2">
            {userProfile.role === 'candidate' 
              ? 'Track your interviews and book new sessions' 
              : 'Review your assigned interviews and help candidates succeed'
            }
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Book Interview Button (Candidates only) */}
        {userProfile.role === 'candidate' && (
          <div className="mb-8">
            <button
              onClick={() => setShowBookForm(!showBookForm)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Book New Interview
            </button>
          </div>
        )}

        {/* Book Interview Form */}
        {showBookForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h3 className="text-lg font-semibold mb-4">Book New Interview</h3>
            <form onSubmit={handleBookInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Role *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={bookingForm.job_role}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, job_role: e.target.value }))}
                  placeholder="e.g., Software Engineer, Product Manager"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time (optional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={bookingForm.time}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isBooking}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isBooking ? 'Booking...' : 'Book Interview'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading your interviews...</div>
          </div>
        )}

        {/* Interview Lists */}
        {!isLoading && (
          <div className="space-y-8">
            {/* Upcoming Interviews */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Upcoming {userProfile.role === 'candidate' ? 'Interviews' : 'Assignments'}
              </h2>
              <div className="grid gap-4">
                {userProfile.role === 'candidate' ? (
                  upcomingInterviews.length > 0 ? (
                    upcomingInterviews.map(interview => (
                      <Link 
                        key={interview.id} 
                        href={`/interview/${interview.id}`}
                        className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-green-500"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {interview.job_role}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              Scheduled: {formatDateTime(interview.time)}
                            </p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            Upcoming
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                      No upcoming interviews. Book one to get started!
                    </div>
                  )
                ) : (
                  upcomingAssignments.length > 0 ? (
                    upcomingAssignments.map(assignment => {
                      const interview = interviewDetails[assignment.session];
                      return (
                        <Link 
                          key={assignment.id}
                          href={`/interview/${assignment.session}`}
                          className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-green-500"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Interview Assignment
                              </h3>
                              <p className="text-gray-600 mt-1">
                                Priority: {assignment.priority} | Session: {assignment.session}
                              </p>
                              {interview && (
                                <p className="text-gray-600">
                                  Role: {interview.job_role} | Time: {formatDateTime(interview.time)}
                                </p>
                              )}
                            </div>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              Upcoming
                            </span>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                      No upcoming assignments. You'll be notified when candidates book interviews in your expertise area.
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Completed Interviews */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Completed {userProfile.role === 'candidate' ? 'Interviews' : 'Assignments'}
              </h2>
              <div className="grid gap-4">
                {userProfile.role === 'candidate' ? (
                  completedInterviews.length > 0 ? (
                    completedInterviews.map(interview => (
                      <Link 
                        key={interview.id}
                        href={`/interview/${interview.id}`}
                        className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-gray-400"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {interview.job_role}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              Completed: {formatDateTime(interview.time)}
                            </p>
                            {interview.score && (
                              <p className="text-blue-600 font-medium">
                                Score: {interview.score}/100
                              </p>
                            )}
                          </div>
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                            Completed
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                      No completed interviews yet.
                    </div>
                  )
                ) : (
                  completedAssignments.length > 0 ? (
                    completedAssignments.map(assignment => {
                      const interview = interviewDetails[assignment.session];
                      return (
                        <Link 
                          key={assignment.id}
                          href={`/interview/${assignment.session}`}
                          className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-gray-400"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Interview Assignment
                              </h3>
                              <p className="text-gray-600 mt-1">
                                Priority: {assignment.priority} | Session: {assignment.session}
                              </p>
                              {interview && (
                                <p className="text-gray-600">
                                  Role: {interview.job_role} | Completed: {formatDateTime(interview.time)}
                                </p>
                              )}
                            </div>
                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                              Completed
                            </span>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                      No completed assignments yet.
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}