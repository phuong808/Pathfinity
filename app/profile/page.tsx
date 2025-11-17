'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (isPending) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Not Authenticated</h1>
        <p>You need to be logged in to view your profile.</p>
        <Button onClick={() => router.push('/login')}>Go to Login</Button>
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      // Make a request to change password API endpoint
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to change password');
      } else {
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { authClient } = await import('@/lib/auth-client');
      await authClient.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings</p>
        </div>

        {/* User Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Account Information</h2>
          <div className="space-y-2">
            <p><strong>Name:</strong> {session.user.name}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>User ID:</strong> {session.user.id}</p>
            <p><strong>Email Verified:</strong> {session.user.emailVerified ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Password Change Form */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">
            {session.user.emailVerified === false ? 'Set Password' : 'Change Password'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {session.user.emailVerified === false 
              ? "Set a password to enable email/password login alongside your OAuth account."
              : "Update your password for enhanced security."
            }
          </p>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                {session.user.emailVerified === false ? 'Verification Password' : 'Current Password'}
              </label>
              <Input
                id="currentPassword"
                type="password"
                required
                placeholder={session.user.emailVerified === false 
                  ? "Enter any verification string" 
                  : "Enter current password"
                }
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              {session.user.emailVerified === false && (
                <p className="text-xs text-muted-foreground mt-1">
                  Since you signed up via OAuth, enter any text to verify it&apos;s you.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                required
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? (session.user.emailVerified === false ? 'Setting Password...' : 'Changing Password...') 
                : (session.user.emailVerified === false ? 'Set Password' : 'Change Password')
              }
            </Button>
          </form>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
      <Button variant="outline" onClick={() => router.push('/Chat')} className="flex-1">
        Back to Chat
          </Button>
          <Button variant="outline" onClick={handleSignOut} className="flex-1">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}