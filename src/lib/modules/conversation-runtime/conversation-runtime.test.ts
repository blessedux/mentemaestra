import { describe, expect, it, vi } from "vitest";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { UIMessage } from "ai";
import { ConversationRuntime } from "./conversation-runtime";
import { MemoryConversationTurnStore } from "./memory-conversation-turn-store";
import { buildMayaSystemPrompt } from "./maya-prompt";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

function userMessage(text: string): UIMessage {
  return {
    id: "msg-user-1",
    role: "user",
    parts: [{ type: "text", text }],
  };
}

function mockStreamingModel(chunks: string[]) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        initialDelayInMs: null,
        chunkDelayInMs: null,
        chunks: [
          { type: "text-start", id: "text-1" },
          ...chunks.map((delta) => ({
            type: "text-delta" as const,
            id: "text-1",
            delta,
          })),
          { type: "text-end", id: "text-1" },
          {
            type: "finish",
            finishReason: { unified: "stop" as const, raw: undefined },
            usage: {
              inputTokens: {
                total: 3,
                noCache: 3,
                cacheRead: undefined,
                cacheWrite: undefined,
              },
              outputTokens: {
                total: 10,
                text: 10,
                reasoning: undefined,
              },
            },
          },
        ],
      }),
    }),
  });
}

describe("buildMayaSystemPrompt", () => {
  it("names Maya and includes the mission", () => {
    const prompt = buildMayaSystemPrompt("leads");
    expect(prompt).toContain("Maya");
    expect(prompt).toContain("leads");
    expect(prompt).toContain("Leads");
    expect(prompt.toLowerCase()).not.toContain("openai");
  });
});

describe("ConversationRuntime", () => {
  it("persists a turn and lists by session", async () => {
    const runtime = new ConversationRuntime({
      turnStore: new MemoryConversationTurnStore(),
      model: mockStreamingModel(["ok"]),
    });

    const turn = await runtime.persistTurn(SESSION_ID, "user", "Hola");
    expect(turn.sessionId).toBe(SESSION_ID);
    expect(turn.role).toBe("user");
    expect(turn.content).toBe("Hola");
    expect(turn.toolCalls).toBeNull();

    const listed = await runtime.listTurns(SESSION_ID);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(turn.id);
  });

  it("streams a turn and persists user + assistant messages", async () => {
    const runtime = new ConversationRuntime({
      turnStore: new MemoryConversationTurnStore(),
      model: mockStreamingModel(["Hola", ", ", "soy Maya."]),
    });

    const result = await runtime.streamTurn(SESSION_ID, "Hola Maya", {
      messages: [userMessage("Hola Maya")],
      mission: "leads",
    });

    const text = await result.text;
    expect(text).toBe("Hola, soy Maya.");

    // onFinish is async — give it a tick to persist the assistant turn
    await vi.waitFor(async () => {
      const turns = await runtime.listTurns(SESSION_ID);
      expect(turns).toHaveLength(2);
    });

    const turns = await runtime.listTurns(SESSION_ID);
    expect(turns[0]?.role).toBe("user");
    expect(turns[0]?.content).toBe("Hola Maya");
    expect(turns[1]?.role).toBe("assistant");
    expect(turns[1]?.content).toBe("Hola, soy Maya.");
  });
});
