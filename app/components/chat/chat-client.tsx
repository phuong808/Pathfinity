"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useRouter } from "next/navigation";
import Conversation from "@/app/components/chat/conversation";
import PromptBox from "@/app/components/chat/prompt-box";

const models = [
  { id: "gpt-5.1", name: "GPT-5.1" },
  { id: "gpt-5.1-mini", name: "GPT-5.1 Mini" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
];

interface ChatClientProps {
  id: string;
  initialMessages: UIMessage[];
  userId?: string;
}

export default function ChatClient({ id, initialMessages, userId }: ChatClientProps) {
  const [model, setModel] = useState(models[0].id);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(id);
  const router = useRouter();
  
  const { messages, sendMessage, status, setMessages } = useChat({
    id: currentChatId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            id: currentChatId,
            userId: userId,
            model,
          }
        };
      },
    }),
  });

  // Set mounted state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set initial messages from database on mount
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages, messages.length]);

  const handleSubmit = async (message: any) => {
    if (!message.text) {
      return;
    }
    
    // If this is a new chat, create it first then redirect
    if (currentChatId === "new") {
      try {
        // Create the chat via server action
        const response = await fetch('/api/chat/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const { chatId } = await response.json();
        
        // Redirect to the new chat with the message as a query param
        router.push(`/Chat/${chatId}?initialMessage=${encodeURIComponent(message.text)}`);
      } catch (error) {
        console.error('Failed to create chat:', error);
      }
    } else {
      sendMessage({
        text: message.text,
      });
      setInput("");
    }
  };
  
  // Check for initial message in URL params and send it
  useEffect(() => {
    if (typeof window !== 'undefined' && currentChatId !== "new") {
      const params = new URLSearchParams(window.location.search);
      const initialMessage = params.get('initialMessage');
      if (initialMessage && messages.length === 0) {
        sendMessage({ text: initialMessage });
        // Clean up URL
        window.history.replaceState({}, '', `/Chat/${currentChatId}`);
      }
    }
  }, [currentChatId, messages.length, sendMessage]);

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto p-6 relative size-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative size-full h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col px-4 sm:px-6 lg:px-8">
          <Conversation 
            messages={messages} 
            status={status} 
            className="flex-1 min-h-0 scrollbar-hide" 
            onSubmit={handleSubmit}
          />
          
          <div className="sticky bottom-0 pt-4 pb-6 bg-gradient-to-t from-background via-background to-transparent">
            <PromptBox
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              models={models}
              model={model}
              setModel={setModel}
              status={status}
              className="shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
