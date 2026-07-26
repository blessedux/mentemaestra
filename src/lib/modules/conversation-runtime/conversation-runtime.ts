import { randomUUID } from "node:crypto";
import {
  convertToModelMessages,
  generateText,
  isStepCount,
  Output,
  streamText,
} from "ai";
import type { Closeout } from "@/lib/domain/closeout";
import { CloseoutSchema } from "@/lib/domain/closeout";
import type {
  ConversationRole,
  ConversationTurn,
} from "@/lib/domain/conversation-turn";
import type { MemoryWriter } from "@/lib/modules/memory-writer";
import { createCaptureMemoryFactTool } from "./capture-fact-tool";
import {
  buildCloseoutPrompt,
  closeoutTurnPayload,
  findCloseoutInTurns,
  formatCloseoutMessage,
} from "./closeout";
import { createOfferChoicesTool } from "./offer-choices-tool";
import { buildMayaSystemPrompt } from "./maya-prompt";
import type {
  ConversationRuntimeDeps,
  ConversationTurnStore,
  GenerateCloseoutOptions,
  StreamTurnOptions,
} from "./types";

/**
 * Wraps the Vercel AI SDK streaming chat with Maya's prompt,
 * turn persistence, MemoryFact write-back, and choice chips.
 */
export class ConversationRuntime {
  private readonly turnStore: ConversationTurnStore;
  private readonly model: ConversationRuntimeDeps["model"];
  private readonly memoryWriter: MemoryWriter | undefined;
  private readonly now: () => Date;

  constructor(deps: ConversationRuntimeDeps) {
    this.turnStore = deps.turnStore;
    this.model = deps.model;
    this.memoryWriter = deps.memoryWriter;
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
   * One-shot closeout when onboarding is ready and Living PRD is saved.
   * Idempotent: returns existing next_actions / closeout turn if present.
   */
  async generateCloseout(
    sessionId: string,
    options: GenerateCloseoutOptions,
  ): Promise<{ closeout: Closeout; generated: boolean }> {
    const latest = await options.livingPrdStore.getLatestByBusiness(
      options.businessId,
    );
    if (latest?.nextActions) {
      return { closeout: latest.nextActions, generated: false };
    }

    const turns = await this.turnStore.listBySession(sessionId);
    const fromTurn = findCloseoutInTurns(turns);
    if (fromTurn) {
      if (latest) {
        await options.livingPrdStore.updateNextActions(
          options.businessId,
          fromTurn,
        );
      }
      return { closeout: fromTurn, generated: false };
    }

    const { output } = await generateText({
      model: this.model,
      system: [
        buildMayaSystemPrompt(options.mission),
        "Ahora estás cerrando el onboarding con próximos pasos de alto apalancamiento.",
        "Responde solo con el objeto estructurado pedido (summary, actions, invitation).",
      ].join("\n"),
      prompt: buildCloseoutPrompt(options.prd, options.mission),
      output: Output.object({ schema: CloseoutSchema }),
    });

    if (!output) {
      throw new Error("Closeout generation returned no structured output");
    }

    const closeout = CloseoutSchema.parse(output);
    const content = formatCloseoutMessage(closeout);

    await this.persistTurn(
      sessionId,
      "assistant",
      content,
      closeoutTurnPayload(closeout),
    );

    const record =
      latest ??
      (await options.livingPrdStore.getLatestByBusiness(options.businessId));
    if (record) {
      await options.livingPrdStore.updateNextActions(
        options.businessId,
        closeout,
      );
    }

    return { closeout, generated: true };
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
    const userTurn = await this.persistTurn(sessionId, "user", userMessage);

    const tools = {
      offerChoices: createOfferChoicesTool(),
      ...(this.memoryWriter != null
        ? {
            captureMemoryFact: createCaptureMemoryFactTool({
              memoryWriter: this.memoryWriter,
              sessionId,
              businessId: options.businessId ?? null,
              provenanceId: userTurn.id,
            }),
          }
        : {}),
    };

    return streamText({
      model: this.model,
      system: buildMayaSystemPrompt(options.mission),
      messages: await convertToModelMessages(options.messages),
      tools,
      stopWhen: isStepCount(5),
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
