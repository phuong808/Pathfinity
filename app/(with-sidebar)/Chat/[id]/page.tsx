import { loadChat } from "@/app/db/actions";
import ChatClient from "@/app/components/chat/chat-client";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await loadChat(id);
  
  return <ChatClient id={id} initialMessages={messages} />;
}
