"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { LivingPrd, LivingPrdPreviewDTO } from "@/lib/domain/living-prd";
import type { MemoryFactDTO } from "@/lib/domain/memory-fact";
import {
  extractOfferChoices,
  type OfferChoicesPart,
} from "@/lib/modules/conversation-runtime/extract-offer-choices";
import { saveAndContinue } from "@/app/auth/actions";
import { ChoiceChips } from "./choice-chips";
import { LivingPrdPanel } from "./living-prd-panel";
import { MemoryFactsPanel } from "./memory-facts-panel";

type ChatClientProps = {
  initialMessages: UIMessage[];
  initialFacts: MemoryFactDTO[];
  initialPrdPreview: LivingPrdPreviewDTO;
  missionLabel: string | null;
  initialNotice?: string | null;
  editable?: boolean;
};

export function ChatClient({
  initialMessages,
  initialFacts,
  initialPrdPreview,
  missionLabel,
  initialNotice = null,
  editable = false,
}: ChatClientProps) {
  const [input, setInput] = useState("");
  const [facts, setFacts] = useState(initialFacts);
  const [prdPreview, setPrdPreview] = useState(initialPrdPreview);
  const [factsOpen, setFactsOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(initialNotice);
  const [chipError, setChipError] = useState<string | null>(null);
  const [consumedToolCallIds, setConsumedToolCallIds] = useState(
    () => new Set<string>(),
  );
  const [chipPending, setChipPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const previousStatus = useRef<string>("ready");

  const handleSaveContinue = useCallback(() => {
    setSaveNotice("Abriendo el soft gate…");
    void saveAndContinue();
  }, []);

  const refreshSidePanels = useCallback(async () => {
    try {
      const [factsRes, prdRes] = await Promise.all([
        fetch("/api/memory-facts"),
        fetch("/api/living-prd"),
      ]);

      if (factsRes.ok) {
        const data = (await factsRes.json()) as { facts?: MemoryFactDTO[] };
        if (data.facts) setFacts(data.facts);
      }

      if (prdRes.ok) {
        const data = (await prdRes.json()) as LivingPrdPreviewDTO;
        setPrdPreview(data);
      }
    } catch {
      // Keep existing panels if refresh fails.
    }
  }, []);

  const handleFactSaved = useCallback(
    (fact: MemoryFactDTO) => {
      setFacts((prev) => {
        const index = prev.findIndex((item) => item.key === fact.key);
        if (index === -1) return [...prev, fact];
        const next = [...prev];
        next[index] = fact;
        return next;
      });
      setSaveNotice("Hecho actualizado.");
      void refreshSidePanels();
    },
    [refreshSidePanels],
  );

  const handlePrdSaved = useCallback(
    (prd: LivingPrd) => {
      setPrdPreview((prev) => ({ ...prev, prd, ready: true }));
      setSaveNotice("PRD actualizado.");
      void refreshSidePanels();
    },
    [refreshSidePanels],
  );

  const { messages, sendMessage, status, error } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (previousStatus.current === "streaming" && status === "ready") {
      void refreshSidePanels();
    }
    previousStatus.current = status;
  }, [status, refreshSidePanels]);

  const busy =
    status === "submitted" || status === "streaming" || chipPending;

  const handleChipSelect = useCallback(
    async (offer: OfferChoicesPart, optionId: string, label: string) => {
      if (busy || consumedToolCallIds.has(offer.toolCallId)) return;

      setChipError(null);
      setChipPending(true);
      setConsumedToolCallIds((prev) => new Set(prev).add(offer.toolCallId));

      const interactionId = `${offer.toolCallId}:${optionId}`;

      try {
        const response = await fetch("/api/choice-chip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interactionId,
            factKey: offer.factKey,
            category: offer.category,
            value: label,
            optionId,
          }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "No se pudo registrar la opción");
        }

        await sendMessage({ text: label });
        void refreshSidePanels();
      } catch (err) {
        setConsumedToolCallIds((prev) => {
          const next = new Set(prev);
          next.delete(offer.toolCallId);
          return next;
        });
        setChipError(
          err instanceof Error ? err.message : "No se pudo usar el chip",
        );
      } finally {
        setChipPending(false);
      }
    },
    [busy, consumedToolCallIds, refreshSidePanels, sendMessage],
  );

  const sidePanel = (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <LivingPrdPanel
        prd={prdPreview.prd}
        ready={prdPreview.ready}
        missingCategories={prdPreview.missingCategories}
        onSaveContinue={handleSaveContinue}
        notice={saveNotice}
        editable={editable}
        onPrdSaved={handlePrdSaved}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <MemoryFactsPanel
          facts={facts}
          open
          onToggle={() => undefined}
          editable={editable}
          onFactSaved={handleFactSaved}
        />
      </div>
    </div>
  );

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
              const offers = extractOfferChoices(message);
              const isUser = message.role === "user";

              if (!text && offers.length === 0) return null;

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
                    {!isUser ? (
                      <ChoiceChips
                        offers={offers}
                        disabled={busy}
                        consumedToolCallIds={consumedToolCallIds}
                        onSelect={handleChipSelect}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {error || chipError ? (
            <p className="mb-2 text-sm text-red-700" role="alert">
              {chipError ?? error?.message}
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

        <div className="hidden w-80 shrink-0 border-l border-zinc-200 lg:block">
          {sidePanel}
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-white lg:hidden">
        <LivingPrdPanel
          prd={prdPreview.prd}
          ready={prdPreview.ready}
          missingCategories={prdPreview.missingCategories}
          onSaveContinue={handleSaveContinue}
          notice={saveNotice}
          editable={editable}
          onPrdSaved={handlePrdSaved}
        />
        <MemoryFactsPanel
          facts={facts}
          open={factsOpen}
          onToggle={() => setFactsOpen((value) => !value)}
          editable={editable}
          onFactSaved={handleFactSaved}
        />
      </div>
    </div>
  );
}
