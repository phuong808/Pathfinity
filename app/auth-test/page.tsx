'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AuthTestPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Not Authenticated</h1>
        <p>You need to be logged in to view this page.</p>
        <Button onClick={() => router.push('/login')}>Go to Login</Button>
      </div>
    );
  }

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
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-3xl font-bold">Authentication Test</h1>
      <div className="bg-gray-100 p-4 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-2">User Information:</h2>
        <p><strong>ID:</strong> {session.user.id}</p>
        <p><strong>Name:</strong> {session.user.name}</p>
        <p><strong>Email:</strong> {session.user.email}</p>
        {session.user.image && (
          <p><strong>Image:</strong> 
            <Image 
              src={session.user.image} 
              alt="Profile" 
              width={32} 
              height={32} 
              className="rounded-full inline ml-2" 
            />
          </p>
        )}
        <p><strong>Email Verified:</strong> {session.user.emailVerified ? 'Yes' : 'No'}</p>
      </div>
      <div className="flex gap-4">
  <Button onClick={() => router.push('/Chat')}>Go to Chat</Button>
        <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
      </div>
    </div>
  );
}