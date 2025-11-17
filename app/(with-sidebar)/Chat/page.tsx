import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import ChatClient from '@/app/components/chat/chat-client';

export default async function ChatPage() {
  // Check session server-side and render the chat client with a special "new" id.
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    redirect('/login');
  }
  
  return <ChatClient id="new" initialMessages={[]} userId={session.user.id} />;
}
