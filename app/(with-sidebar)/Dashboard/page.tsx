'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { 
  User,
  Mail,
  Calendar,
  Sparkles,
  Loader2,
  MapPin,
  Briefcase
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';

interface UserProfile {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    emailVerified?: boolean;
    createdAt?: Date;
  };
  profiles?: Array<{
    id: number;
    career?: string | null;
    college?: string | null;
    program?: string | null;
    interests?: string[] | null;
    skills?: string[] | null;
  }>;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user session
        const session = await authClient.getSession();
        
        if (!session?.data?.user) {
          setIsLoading(false);
          return;
        }

        // Fetch user profiles
        const profilesResponse = await fetch('/api/profiles');
        const profilesData = await profilesResponse.json();

        setUserData({
          user: session.data.user,
          profiles: profilesData.profiles || []
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please sign in to view your dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, profiles } = userData;
  const latestProfile = profiles && profiles.length > 0 ? profiles[profiles.length - 1] : null;
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-6">
            {user.image ? (
              <div className="relative w-24 h-24">
                <Image 
                  src={user.image} 
                  alt={user.name}
                  fill
                  className="rounded-full border-4 border-white shadow-lg object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center border-4 border-white shadow-lg">
                <User className="h-12 w-12 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
              <p className="text-lg text-gray-600">
                Your personalized academic journey dashboard
              </p>
            </div>
          </div>
        </div>
        {/* Main Content Grid */}
        <div className="mb-8">
          
          {/* Account Information Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <User className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Account Information</CardTitle>
                  <CardDescription>Your personal details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-50 mt-1">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Full Name</p>
                    <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-50 mt-1">
                    <Mail className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                    <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                    {user.emailVerified && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-600">
                        <Sparkles className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-50 mt-1">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Member Since</p>
                    <p className="text-lg font-semibold text-gray-900">{memberSince}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Academic Profile Section */}
        {latestProfile && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-emerald-600" />
              Academic Profile
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {latestProfile.career && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100">
                        <Briefcase className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Career Interest</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-xl font-semibold text-gray-900">{latestProfile.career}</p>
                  </CardContent>
                </Card>
              )}

              {latestProfile.college && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <MapPin className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Institution</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-xl font-semibold text-gray-900">{latestProfile.college}</p>
                  </CardContent>
                </Card>
              )}

              {latestProfile.program && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-cyan-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-100">
                        <Sparkles className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Program</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-xl font-semibold text-gray-900">{latestProfile.program}</p>
                  </CardContent>
                </Card>
              )}

              {latestProfile.interests && Array.isArray(latestProfile.interests) && latestProfile.interests.length > 0 && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="border-b bg-gradient-to-r from-lime-50 to-green-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-lime-100">
                        <Sparkles className="h-5 w-5 text-lime-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Interests</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                      {latestProfile.interests.slice(0, 6).map((interest: string, index: number) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full text-sm font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {latestProfile.skills && Array.isArray(latestProfile.skills) && latestProfile.skills.length > 0 && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-green-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100">
                        <Sparkles className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Skills</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                      {latestProfile.skills.slice(0, 6).map((skill: string, index: number) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Welcome Message for New Users */}
        {(!profiles || profiles.length === 0) && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Your Journey</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Create your first academic profile to get personalized pathway recommendations and unlock your potential.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Your information is private and secure. We&apos;re here to support your academic success.
          </p>
        </div>
      </div>
    </div>
  );
}
