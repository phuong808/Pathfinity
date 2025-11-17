"use client"

import { Fragment, useEffect, useMemo, useRef, useCallback, useState } from "react"
import {
  Conversation as AiConversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/app/components/ai-elements/conversation"
import { Message, MessageContent } from "@/app/components/ai-elements/message"
import { Response } from "@/app/components/ai-elements/response"
import { useRouter } from "next/navigation"
import { Loader } from "@/app/components/ai-elements/loader"
import { useTTS } from "@/app/components/ai-elements/tts"
import { Button } from "@/app/components/ui/button"
import { RotateCcwIcon } from "lucide-react"

type ChatPart = { type: "text"; text: string } | unknown
type ChatMessage = { id: string | number; role: string; parts: ChatPart[] }
import { extractPathwayJsonFromText } from "@/lib/pathway-json"

type Props = {
  messages: ChatMessage[]
  status: string
  className?: string
  onSubmit?: (message: { text: string }) => void
}

function isTextPart(p: ChatPart): p is { type: "text"; text: string } {
  return (
    typeof p === "object" &&
    p !== null &&
    (p as Record<string, unknown>).type === "text" &&
    typeof (p as Record<string, unknown>).text === "string"
  )
}

function asRole(r: unknown): "assistant" | "system" | "user" {
  return r === "assistant" || r === "system" || r === "user" ? r : "assistant";
}

// Lazy JSON extractor component to avoid blocking main render when messages are large.
function PathwayJsonActions({ text, messageRole, onOpen }: { text: string; messageRole: string; onOpen: (json: string) => void }) {
  const [json, setJson] = useState<string | null>(null);

  useEffect(() => {
    if (messageRole !== 'assistant') return;
    // Defer heavy parsing until browser is idle or after a short timeout.
    const run = () => {
      try {
        const extracted = extractPathwayJsonFromText(text);
        setJson(extracted);
      } catch {
        // swallow parsing errors
      }
    };
    // narrow window type for requestIdleCallback if present
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => void };
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(run, { timeout: 500 });
    } else {
      const t = setTimeout(run, 50);
      return () => clearTimeout(t);
    }
  }, [text, messageRole]);

  if (!json) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            try {
              sessionStorage.setItem("pathfinity.roadmapDraft", json);
            } catch {
              try { localStorage.setItem("pathfinity.roadmapDraft", json); } catch {}
            }
            onOpen(json);
          }}
        >
          Open in Viewer
        </Button>
      </div>
    </div>
  );
}

export function Conversation({ messages, status, className, onSubmit }: Props) {
  const router = useRouter();
  const { speak, stop } = useTTS();

  // Find the latest assistant message and its concatenated text
  const lastAssistant: ChatMessage | null = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return messages[i];
    }
    return null;
  }, [messages]);

  const lastAssistantText = useMemo(() => {
    if (!lastAssistant) return "";
    try {
      return (lastAssistant.parts || [])
        .filter((p) => isTextPart(p))
        .map((p) => p.text)
        .join("");
    } catch {
      return "";
    }
  }, [lastAssistant]);

  const partsToText = useCallback((parts: ChatPart[]) => {
    try {
      return (parts || [])
        .filter((p) => isTextPart(p))
        .map((p) => p.text)
        .join("");
    } catch {
      return "";
    }
  }, []);

  // Track the last spoken assistant message id and length to avoid repeats
  const spokenRef = useRef<{ id: string | null; len: number }>({ id: null, len: 0 });

  // Auto-speak after streaming finishes (to avoid choppy partial sentences)
  useEffect(() => {
    if (!lastAssistant) return;
    const id = String(lastAssistant.id ?? "");
    const len = lastAssistantText.length;
    if (!len) return;
    if (status === "streaming") return;
    if (spokenRef.current.id === id && spokenRef.current.len === len) return;
    speak(lastAssistantText);
    spokenRef.current = { id, len };
  }, [lastAssistant, lastAssistantText, status, speak]);

  useEffect(() => {
    return () => {
      try { stop(); } catch {}
    };
  }, [stop]);
  return (
    <AiConversation className={className}>
      <ConversationContent>
        {messages.length === 0 ? (
            <ConversationEmptyState
                className="text-left items-start justify-start pt-8"
            >
              <div className="space-y-6 text-base max-w-3xl w-full">
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Welcome! I&apos;m glad you&apos;re here. 🌟
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    I&apos;m Pathfinity, your personal career exploration and academic pathway guide. Whether you&apos;re just starting to think about your future, reconsidering your current direction, or planning a career pivot, I&apos;m here to help you confidently move forward.
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                  <p className="font-semibold text-foreground">With me, you can:</p>
                  <div className="space-y-2">
                    <p className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-xl">✨</span>
                      <span>Explore potential career paths that match your goals</span>
                    </p>
                    <p className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-xl">✨</span>
                      <span>Discover relevant majors, programs, and training options</span>
                    </p>
                    <p className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-xl">✨</span>
                      <span>Learn about courses and skills needed for your dream path</span>
                    </p>
                    <p className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-xl">✨</span>
                      <span>Get personalized guidance — not generic advice</span>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    Before we begin, I&apos;d love to understand where you are in your journey so I can tailor the experience for you. <span className="font-medium text-foreground">Which one best describes you right now?</span>
                  </p>
                  
                  <div className="space-y-2 bg-card border rounded-lg p-4">
                    <button 
                      className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => onSubmit?.({ text: "1" })}
                      disabled={status === "streaming" || status === "submitted"}
                    >
                      <p className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">1️⃣</span>
                        <span className="text-muted-foreground group-hover:text-foreground">I&apos;m a middle or high school student exploring possible majors or careers</span>
                      </p>
                    </button>
                    <button 
                      className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => onSubmit?.({ text: "2" })}
                      disabled={status === "streaming" || status === "submitted"}
                    >
                      <p className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">2️⃣</span>
                        <span className="text-muted-foreground group-hover:text-foreground">I&apos;m currently in college and may be reconsidering my major</span>
                      </p>
                    </button>
                    <button 
                      className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => onSubmit?.({ text: "3" })}
                      disabled={status === "streaming" || status === "submitted"}
                    >
                      <p className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">3️⃣</span>
                        <span className="text-muted-foreground group-hover:text-foreground">I&apos;m already working and interested in career pivoting or upskilling</span>
                      </p>
                    </button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground italic">
                    Just reply with 1, 2, or 3 — or feel free to describe your situation in your own words.
                  </p>
                  <p className="text-lg font-semibold text-foreground mt-3 flex items-center gap-2">
                    Ready when you are! <span className="text-2xl">🚀</span>
                  </p>
                </div>
              </div>
            </ConversationEmptyState>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              {message.parts.map((part, i: number) => {
                if (isTextPart(part)) {
                  const text: string = part.text ?? "";
                  return (
                    <Fragment key={`${message.id}-${i}`}>
                      <Message from={asRole(message.role)}>
                        <MessageContent>
                          <Response>{text}</Response>
                          <PathwayJsonActions
                            text={text}
                            messageRole={String(message.role)}
                            onOpen={() => router.push("/SavedRoadmaps")}
                          />
                        </MessageContent>
                      </Message>
                    </Fragment>
                  );
                }
                return null;
              })}
              {message.role === "assistant" ? (
                <div className="-mt-2 mb-2 flex justify-start px-2 text-xs text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speak(partsToText(message.parts))}
                    aria-label="Replay TTS"
                    title="Replay TTS"
                  >
                    <RotateCcwIcon className="mr-1 size-4" /> Replay
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}

        {(status === "submitted" || status === "streaming") && <Loader />}
      </ConversationContent>
      <ConversationScrollButton />
    </AiConversation>
  )
}

export default Conversation
