// app/interview/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface Question {
  id: string;
  question_text: string;
  expert_id: string;
  session_id: string;
  relevance_score?: number;
}

interface Answer {
  id: string;
  candidate_id: string;
  question_id: string;
  answer_text: string;
  score?: number;
}

interface QuestionSubmit {
  question_text: string;
  expert_id: string;
  session_id: string;
}

interface AnswerSubmit {
  candidate_id: string;
  question_id: string;
  answer_text: string;
}

export default function InterviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<{[key: string]: Answer}>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (!profile) {
      router.push('/');
      return;
    }

    try {
      const parsedProfile = JSON.parse(profile);
      setUserProfile(parsedProfile);
      fetchInterviewData(parsedProfile);
    } catch (error) {
      console.error('Failed to parse user profile:', error);
      router.push('/');
    }
  }, [params.id, router]);

  const fetchInterviewData = async (profile: UserProfile) => {
    setIsLoading(true);
    try {
      // Fetch interview details
      const interviewResponse = await fetch(`${API_BASE_URL}/interview/${params.id}`);
      if (interviewResponse.ok) {
        const interviewData = await interviewResponse.json();
        setInterview(interviewData);
      }

      // Fetch questions for this session
      const questionsResponse = await fetch(`${API_BASE_URL}/questions/session/${params.id}`);
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);
      }

    } catch (error) {
      console.error('Error fetching interview data:', error);
      setMessage({ type: 'error', text: 'Failed to load interview data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = () => {
    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
  };

  const handleAnswerSubmit = async (questionId: string) => {
    if (!userProfile || !answers[questionId]?.trim()) return;

    setIsSubmitting(true);
    try {
      const answerData: AnswerSubmit = {
        candidate_id: userProfile.id,
        question_id: questionId,
        answer_text: answers[questionId]
      };

      const response = await fetch(`${API_BASE_URL}/answers/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answerData)
      });

      if (response.ok) {
        const submittedAnswer = await response.json();
        setSubmittedAnswers(prev => ({ ...prev, [questionId]: submittedAnswer }));
        setMessage({ type: 'success', text: 'Answer submitted successfully!' });
        
        // Move to next question if not the last one
        if (currentQuestionIndex < questions.length - 1) {
          setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1);
            setMessage(null);
          }, 1500);
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to submit answer' });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setMessage({ type: 'error', text: 'Error submitting answer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInterviewSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/interview/submit/${params.id}`, {
        method: 'POST'
      });

      if (response.ok) {
        const updatedInterview = await response.json();
        setInterview(updatedInterview);
        setMessage({ type: 'success', text: `Interview completed! Final score: ${updatedInterview.score}/100` });
      } else {
        setMessage({ type: 'error', text: 'Failed to submit interview' });
      }
    } catch (error) {
      console.error('Error submitting interview:', error);
      setMessage({ type: 'error', text: 'Error submitting interview' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!userProfile || !newQuestion.trim()) return;

    setIsAddingQuestion(true);
    try {
      const questionData: QuestionSubmit = {
        question_text: newQuestion,
        expert_id: userProfile.id,
        session_id: params.id
      };

      const response = await fetch(`${API_BASE_URL}/questions/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
      });

      if (response.ok) {
        const newQuestionData = await response.json();
        setQuestions(prev => [...prev, newQuestionData]);
        setNewQuestion('');
        setMessage({ type: 'success', text: 'Question added successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to add question' });
      }
    } catch (error) {
      console.error('Error adding question:', error);
      setMessage({ type: 'error', text: 'Error adding question' });
    } finally {
      setIsAddingQuestion(false);
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

  const isInterviewTime = (dateString: string) => {
    const interviewTime = new Date(dateString);
    const now = new Date();
    return now >= interviewTime;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading interview...</div>
      </div>
    );
  }

  if (!userProfile || !interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Interview not found</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCandidate = userProfile.role === 'candidate';
  const interviewTimePassed = isInterviewTime(interview.time);
  const hasScore = interview.score !== null && interview.score !== undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {interview.job_role} Interview
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Interview ID: {interview.id}</span>
            <span>Scheduled: {formatDateTime(interview.time)}</span>
            {hasScore && <span className="text-blue-600 font-semibold">Score: {interview.score}/100</span>}
          </div>
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

        {/* Candidate View */}
        {isCandidate && (
          <div>
            {!interviewTimePassed ? (
              /* Interview hasn't started yet */
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Interview Scheduled
                </h2>
                <p className="text-gray-600 mb-6">
                  Your interview is scheduled for {formatDateTime(interview.time)}
                </p>
                <div className="text-sm text-gray-500">
                  Please return at the scheduled time to begin your interview.
                </div>
              </div>
            ) : hasScore ? (
              /* Interview completed with score */
              <div className="bg-white p-8 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  Interview Results
                </h2>
                <div className="text-center mb-8">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {interview.score}/100
                  </div>
                  <div className="text-gray-600">Final Score</div>
                </div>
                
                {/* Show answered questions and scores */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Your Answers:</h3>
                  {questions.map((question, index) => {
                    const answer = submittedAnswers[question.id];
                    return (
                      <div key={question.id} className="border-l-4 border-blue-200 pl-4">
                        <div className="font-medium text-gray-900 mb-2">
                          Q{index + 1}: {question.question_text}
                        </div>
                        {answer && (
                          <div>
                            <div className="text-gray-700 mb-2">{answer.answer_text}</div>
                            {answer.score && (
                              <div className="text-sm text-blue-600 font-medium">
                                Score: {answer.score}/100
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Interview can be started */
              <div className="bg-white rounded-lg shadow">
                {!interviewStarted ? (
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                      Ready to Start Interview
                    </h2>
                    <p className="text-gray-600 mb-6">
                      You have {questions.length} questions to answer. Take your time and provide detailed responses.
                    </p>
                    <button
                      onClick={handleStartInterview}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-semibold"
                    >
                      Start Interview
                    </button>
                  </div>
                ) : (
                  /* Interview in progress */
                  <div className="p-8">
                    {/* Progress indicator */}
                    <div className="mb-8">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                        <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {currentQuestion ? (
                      <div>
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            {currentQuestion.question_text}
                          </h3>
                          <textarea
                            className="w-full h-40 border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Type your detailed answer here..."
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => setAnswers(prev => ({
                              ...prev,
                              [currentQuestion.id]: e.target.value
                            }))}
                          />
                        </div>

                        <div className="flex justify-between">
                          <button
                            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>

                          {currentQuestionIndex < questions.length - 1 ? (
                            <button
                              onClick={() => handleAnswerSubmit(currentQuestion.id)}
                              disabled={isSubmitting || !answers[currentQuestion.id]?.trim()}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? 'Submitting...' : 'Submit & Next'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAnswerSubmit(currentQuestion.id)}
                              disabled={isSubmitting || !answers[currentQuestion.id]?.trim()}
                              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                            </button>
                          )}
                        </div>

                        {/* Submit Interview Button (shown after all questions answered) */}
                        {currentQuestionIndex === questions.length - 1 && submittedAnswers[currentQuestion.id] && (
                          <div className="mt-8 text-center">
                            <button
                              onClick={handleInterviewSubmit}
                              disabled={isSubmitting}
                              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 text-lg font-semibold disabled:opacity-50"
                            >
                              {isSubmitting ? 'Finalizing...' : 'Complete Interview'}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-600">
                        No questions available for this interview.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Expert View */}
        {!isCandidate && (
          <div className="space-y-8">
            {/* Add Question Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Interview Question</h2>
              <div className="space-y-4">
                <textarea
                  className="w-full h-24 border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your interview question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                />
                <button
                  onClick={handleAddQuestion}
                  disabled={isAddingQuestion || !newQuestion.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isAddingQuestion ? 'Adding...' : 'Add Question'}
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Interview Questions ({questions.length})
                </h2>
              </div>
              <div className="divide-y">
                {questions.length > 0 ? (
                  questions.map((question, index) => (
                    <div key={question.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-2">
                            Q{index + 1}: {question.question_text}
                          </div>
                          {question.relevance_score && (
                            <div className="text-sm text-purple-600">
                              Relevance Score: {question.relevance_score}/100
                            </div>
                          )}
                        </div>
                        <div className="ml-4 text-sm text-gray-500">
                          Added by Expert
                        </div>
                      </div>

                      {/* Show answer scores if interview is completed */}
                      {hasScore && submittedAnswers[question.id] && (
                        <div className="mt-4 p-4 bg-gray-50 rounded">
                          <div className="text-sm font-medium text-gray-700 mb-2">Candidate's Answer:</div>
                          <div className="text-gray-800 mb-2">{submittedAnswers[question.id].answer_text}</div>
                          {submittedAnswers[question.id].score && (
                            <div className="text-sm text-blue-600 font-medium">
                              Score: {submittedAnswers[question.id].score}/100
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No questions added yet. Add your first question above.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}