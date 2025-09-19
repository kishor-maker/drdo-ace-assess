// app/components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserProfile {
  role: 'candidate' | 'expert';
  id: string;
  name: string;
}

export default function Navbar() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for user profile in localStorage
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (error) {
        console.error('Failed to parse user profile:', error);
        localStorage.removeItem('userProfile');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    setUserProfile(null);
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-blue-600">TalentMatch</span>
          </Link>

          {/* Navigation Links & Auth Status */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : userProfile ? (
              // Logged in state
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-medium">{userProfile.name}</span>
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    userProfile.role === 'candidate' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {userProfile.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              // Not logged in state
              <div className="flex items-center space-x-4">
                <Link 
                  href="/" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Register
                </Link>
                <div className="text-sm text-gray-500">
                  Not logged in
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}