import { randomUUID } from "node:crypto";
import { convertToModelMessages, streamText } from "ai";
import type {
  ConversationRole,
  ConversationTurn,
} from "@/lib/domain/conversation-turn";
import { buildMayaSystemPrompt } from "./maya-prompt";
import type {
  ConversationRuntimeDeps,
  ConversationTurnStore,
  StreamTurnOptions,
} from "./types";

/**
 * Wraps the Vercel AI SDK streaming chat with Maya's prompt and turn persistence.
 */
export class ConversationRuntime {
  private readonly turnStore: ConversationTurnStore;
  private readonly model: ConversationRuntimeDeps["model"];
  private readonly now: () => Date;

  constructor(deps: ConversationRuntimeDeps) {
    this.turnStore = deps.turnStore;
    this.model = deps.model;
    this.now = deps.now ?? (() => new Date());
  }

  async listTurns(sessionId: string): Promise<ConversationTurn[]> {
    return this.turnStore.listBySession(sessionId);
  }

  async persistTurn(
    sessionId: string,
    role: ConversationRole,
    content: string,
    toolCalls?: unknown,
  ): Promise<ConversationTurn> {
    return this.turnStore.insert({
      id: randomUUID(),
      sessionId,
      role,
      content,
      toolCalls: toolCalls ?? null,
      createdAt: this.now(),
    });
  }

  /**
   * Persists the user message, then streams Maya's reply via `streamText`.
   * Returns an AI SDK result suitable for `toUIMessageStreamResponse()`.
   */
  async streamTurn(
    sessionId: string,
    userMessage: string,
    options: StreamTurnOptions,
  ) {
    await this.persistTurn(sessionId, "user", userMessage);

    return streamText({
      model: this.model,
      system: buildMayaSystemPrompt(options.mission),
      messages: await convertToModelMessages(options.messages),
      onFinish: async ({ text, toolCalls }) => {
        const serializedToolCalls =
          toolCalls.length > 0 ? toolCalls : null;
        await this.persistTurn(
          sessionId,
          "assistant",
          text,
          serializedToolCalls,
        );
      },
    });
  }
}
