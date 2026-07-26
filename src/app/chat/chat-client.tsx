"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { MemoryFactDTO } from "@/lib/domain/memory-fact";
import { MemoryFactsPanel } from "./memory-facts-panel";

type ChatClientProps = {
  initialMessages: UIMessage[];
  initialFacts: MemoryFactDTO[];
  missionLabel: string | null;
};

export function ChatClient({
  initialMessages,
  initialFacts,
  missionLabel,
}: ChatClientProps) {
  const [input, setInput] = useState("");
  const [facts, setFacts] = useState(initialFacts);
  const [factsOpen, setFactsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const previousStatus = useRef<string>("ready");

  const refreshFacts = useCallback(async () => {
    try {
      const response = await fetch("/api/memory-facts");
      if (!response.ok) return;
      const data = (await response.json()) as { facts?: MemoryFactDTO[] };
      if (data.facts) setFacts(data.facts);
    } catch {
      // Keep existing facts if refresh fails.
    }
  }, []);

  const { messages, sendMessage, status, error } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (previousStatus.current === "streaming" && status === "ready") {
      void refreshFacts();
    }
    previousStatus.current = status;
  }, [status, refreshFacts]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 text-zinc-900">
      <header className="shrink-0 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-4">
          <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
            Mente Maestra
          </p>
          {missionLabel ? (
            <p className="truncate text-sm text-zinc-600">
              Misión: {missionLabel}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col px-4">
          <div className="flex-1 space-y-3 overflow-y-auto py-6">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">
                Escribe un mensaje para hablar con Maya.
              </p>
            ) : null}

            {messages.map((message) => {
              const text = message.parts
                .filter(
                  (part): part is { type: "text"; text: string } =>
                    part.type === "text",
                )
                .map((part) => part.text)
                .join("");

              if (!text) return null;

              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-zinc-900 text-white"
                        : "bg-white text-zinc-900 ring-1 ring-zinc-200"
                    }`}
                  >
                    {!isUser ? (
                      <p className="mb-1 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                        Maya
                      </p>
                    ) : null}
                    {text}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {error ? (
            <p className="mb-2 text-sm text-red-700" role="alert">
              {error.message}
            </p>
          ) : null}

          <form
            className="shrink-0 border-t border-zinc-200 bg-zinc-50 py-4"
            onSubmit={(event) => {
              event.preventDefault();
              const text = input.trim();
              if (!text || busy) return;
              setInput("");
              void sendMessage({ text });
            }}
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={busy}
                placeholder="Escribe a Maya…"
                className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
                aria-label="Mensaje"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition enabled:hover:bg-zinc-800 disabled:opacity-40"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>

        <div className="hidden w-72 shrink-0 lg:block">
          <MemoryFactsPanel
            facts={facts}
            open
            onToggle={() => undefined}
          />
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-white lg:hidden">
        <MemoryFactsPanel
          facts={facts}
          open={factsOpen}
          onToggle={() => setFactsOpen((value) => !value)}
        />
      </div>
    </div>
  );
}
