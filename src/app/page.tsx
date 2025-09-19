// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'https://hackathon-504442537671.europe-west1.run.app';

export default function RegistrationPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'expert'>('candidate');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
 const profile = localStorage.getItem('userProfile');
    if (profile) {
        router.push('/dashboard');
    }
  // Candidate form state
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    job_role: '',
    education: [
      { degree: '', field: '', institution: '', year: new Date().getFullYear(), grade: '' }
    ],
    experience: [
      { company: '', role: '', duration_months: 0, projects: [''], skills: [''] }
    ]
  });

  // Expert form state
  const [expertForm, setExpertForm] = useState({
    name: '',
    expertise: '',
    seniority: 1
  });

  const handleRoleToggle = (role: 'candidate' | 'expert') => {
    setSelectedRole(role);
    setMessage(null);
  };

  const addEducation = () => {
    setCandidateForm(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', field: '', institution: '', year: new Date().getFullYear(), grade: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    setCandidateForm(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    setCandidateForm(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', duration_months: 0, projects: [''], skills: [''] }]
    }));
  };

  const removeExperience = (index: number) => {
    setCandidateForm(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/candidates/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateForm),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setMessage({ type: 'success', text: `Candidate profile created! ID: ${data.id}` });

      // Store user profile
      localStorage.setItem('userProfile', JSON.stringify({ 
        role: 'candidate', 
        id: data.id, 
        name: candidateForm.name,
        ...data 
      }));

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create candidate profile. Please try again.' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/experts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expertForm),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setMessage({ type: 'success', text: `Expert profile created! ID: ${data.id}` });

      // Store user profile
      localStorage.setItem('userProfile', JSON.stringify({ 
        role: 'expert', 
        id: data.id, 
        name: expertForm.name,
        ...data 
      }));

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create expert profile. Please try again.' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join TalentMatch</h1>
          <p className="text-xl text-gray-600">Connect with opportunities or share your expertise</p>
        </div>

        {/* Role Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => handleRoleToggle('candidate')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              selectedRole === 'candidate' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            I'm Looking for Opportunities
          </button>
          <button
            onClick={() => handleRoleToggle('expert')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              selectedRole === 'expert' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            I'm an Expert Interviewer
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 text-center font-medium ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Candidate Form */}
        {selectedRole === 'candidate' && (
          <form onSubmit={handleCandidateSubmit} className="space-y-6 bg-white p-8 shadow-lg rounded-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Candidate Registration</h2>
              <p className="text-gray-600">Tell us about your background and experience</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desired Job Role *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={candidateForm.job_role}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, job_role: e.target.value }))}
                  placeholder="e.g., Software Engineer, Product Manager"
                  required
                />
              </div>
            </div>

            {/* Education Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                <button
                  type="button"
                  onClick={addEducation}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200"
                >
                  Add Education
                </button>
              </div>
              {candidateForm.education.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700">Education {index + 1}</span>
                    {candidateForm.education.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Degree (e.g., Bachelor's, Master's)"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={edu.degree}
                      onChange={(e) => setCandidateForm(prev => {
                        const copy = [...prev.education];
                        copy[index].degree = e.target.value;
                        return { ...prev, education: copy };
                      })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Field of Study"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={edu.field}
                      onChange={(e) => setCandidateForm(prev => {
                        const copy = [...prev.education];
                        copy[index].field = e.target.value;
                        return { ...prev, education: copy };
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Institution"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={edu.institution}
                      onChange={(e) => setCandidateForm(prev => {
                        const copy = [...prev.education];
                        copy[index].institution = e.target.value;
                        return { ...prev, education: copy };
                      })}
                    />
                    <input
                      type="number"
                      placeholder="Graduation Year"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={edu.year}
                      onChange={(e) => setCandidateForm(prev => {
                        const copy = [...prev.education];
                        copy[index].year = parseInt(e.target.value) || new Date().getFullYear();
                        return { ...prev, education: copy };
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Experience Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                <button
                  type="button"
                  onClick={addExperience}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                >
                  Add Experience
                </button>
              </div>
              {candidateForm.experience.map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700">Experience {index + 1}</span>
                    {candidateForm.experience.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Company Name"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={exp.company}
                      onChange={(e) => setCandidateForm(prev => {
                        const copy = [...prev.experience];
                        copy[index].company = e.target.value;
                        return { ...prev, experience: copy };
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Job Role"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={exp.role}
                      onChange={(e) => setCandidateForm(prev => {
                        const copy = [...prev.experience];
                        copy[index].role = e.target.value;
                        return { ...prev, experience: copy };
                      })}
                    />
                    <input
                      type="number"
                      placeholder="Duration (months)"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={exp.duration_months}
                      onChange={(e) => setCandidateForm(prev => {
                        const copy = [...prev.experience];
                        copy[index].duration_months = parseInt(e.target.value) || 0;
                        return { ...prev, experience: copy };
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {isLoading ? 'Creating Profile...' : 'Create Candidate Profile'}
            </button>
          </form>
        )}

        {/* Expert Form */}
        {selectedRole === 'expert' && (
          <form onSubmit={handleExpertSubmit} className="space-y-6 bg-white p-8 shadow-lg rounded-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Expert Registration</h2>
              <p className="text-gray-600">Share your expertise and help candidates succeed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={expertForm.name}
                onChange={(e) => setExpertForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area of Expertise *</label>
              <textarea
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={expertForm.expertise}
                onChange={(e) => setExpertForm(prev => ({ ...prev, expertise: e.target.value }))}
                placeholder="Describe your areas of expertise, technologies you work with, industries you've been in, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seniority Level *</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={expertForm.seniority}
                onChange={(e) => setExpertForm(prev => ({ ...prev, seniority: parseInt(e.target.value) }))}
                required
              >
                <option value={1}>Junior (1-2 years)</option>
                <option value={2}>Mid-level (3-5 years)</option>
                <option value={3}>Senior (6-10 years)</option>
                <option value={4}>Lead/Principal (10+ years)</option>
                <option value={5}>Executive/Director (15+ years)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-purple-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 disabled:bg-purple-300 transition-colors"
            >
              {isLoading ? 'Creating Profile...' : 'Create Expert Profile'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}