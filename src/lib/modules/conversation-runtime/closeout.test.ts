import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import type { Closeout } from "@/lib/domain/closeout";
import type { LivingPrd } from "@/lib/domain/living-prd";
import { InMemoryLivingPrdStore } from "@/lib/modules/living-prd-compiler";
import {
  buildCloseoutPrompt,
  closeoutTurnPayload,
  findCloseoutInTurns,
  formatCloseoutMessage,
  parseCloseout,
} from "./closeout";
import { ConversationRuntime } from "./conversation-runtime";
import { MemoryConversationTurnStore } from "./memory-conversation-turn-store";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const BUSINESS_ID = "22222222-2222-4222-8222-222222222222";

const samplePrd: LivingPrd = {
  business_name: "Café Andino",
  mission: "leads",
  icp: "Dueños de cafeterías boutique en Bogotá",
  goals: ["Llenar la lista de espera del taller"],
  pain_points: ["Pocos leads calificados cada semana"],
  brand_notes: "Cálido, artesanal, local",
  visual_preferences: "Tonos tierra y tipografía serif",
};

const sampleCloseout: Closeout = {
  summary:
    "Aprendí que Café Andino busca leads de dueños de cafeterías boutique y siente la falta de leads calificados.",
  actions: [
    {
      title: "Definir oferta del taller en una página",
      reason: "Sin una oferta clara, los leads de Bogotá no se convierten.",
    },
    {
      title: "Listar 20 cafeterías ICP en un CRM simple",
      reason: "Tu dolor es volumen de leads calificados — empieza con una lista propia.",
    },
    {
      title: "Probar un mensaje de outreach artesanal",
      reason: "Tu marca es cálida y local; el tono importa más que el volumen.",
    },
  ],
  invitation: "Cuando quieras, seguimos afinando el outreach juntos.",
};

describe("closeout prompt/parser", () => {
  it("builds a prompt grounded in the PRD and mission", () => {
    const prompt = buildCloseoutPrompt(samplePrd, "leads");
    expect(prompt).toContain("Café Andino");
    expect(prompt).toContain("leads");
    expect(prompt).toContain("Dueños de cafeterías boutique");
    expect(prompt).toContain("3 y 5");
  });

  it("formats a warm closeout message with numbered actions", () => {
    const text = formatCloseoutMessage(sampleCloseout);
    expect(text).toContain(sampleCloseout.summary);
    expect(text).toContain("1. Definir oferta del taller");
    expect(text).toContain("Por qué:");
    expect(text).toContain(sampleCloseout.invitation);
  });

  it("parses closeout JSON and finds it on assistant turns", () => {
    const parsed = parseCloseout(sampleCloseout);
    expect(parsed.actions).toHaveLength(3);

    const turns = [
      {
        id: "t1",
        sessionId: SESSION_ID,
        role: "assistant" as const,
        content: formatCloseoutMessage(parsed),
        toolCalls: closeoutTurnPayload(parsed),
        createdAt: new Date(),
      },
    ];

    expect(findCloseoutInTurns(turns)).toEqual(parsed);
    expect(findCloseoutInTurns([])).toBeNull();
  });
});

describe("ConversationRuntime.generateCloseout", () => {
  it("returns cached next_actions without calling the model", async () => {
    const doGenerate = vi.fn();
    const livingPrdStore = new InMemoryLivingPrdStore();
    await livingPrdStore.insert({
      id: "33333333-3333-4333-8333-333333333333",
      businessId: BUSINESS_ID,
      compiledJson: samplePrd,
      version: 1,
      createdAt: new Date(),
      nextActions: sampleCloseout,
    });

    const runtime = new ConversationRuntime({
      turnStore: new MemoryConversationTurnStore(),
      model: new MockLanguageModelV4({ doGenerate }),
    });

    const result = await runtime.generateCloseout(SESSION_ID, {
      mission: "leads",
      businessId: BUSINESS_ID,
      prd: samplePrd,
      livingPrdStore,
    });

    expect(result.generated).toBe(false);
    expect(result.closeout).toEqual(sampleCloseout);
    expect(doGenerate).not.toHaveBeenCalled();
  });

  it("generates, persists turn + next_actions, and skips on second call", async () => {
    const livingPrdStore = new InMemoryLivingPrdStore();
    await livingPrdStore.insert({
      id: "33333333-3333-4333-8333-333333333333",
      businessId: BUSINESS_ID,
      compiledJson: samplePrd,
      version: 1,
      createdAt: new Date(),
      nextActions: null,
    });

    const doGenerate = vi.fn(async () => ({
      content: [{ type: "text" as const, text: JSON.stringify(sampleCloseout) }],
      finishReason: { unified: "stop" as const, raw: undefined },
      usage: {
        inputTokens: {
          total: 10,
          noCache: 10,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: {
          total: 20,
          text: 20,
          reasoning: undefined,
        },
      },
      warnings: [],
    }));

    const runtime = new ConversationRuntime({
      turnStore: new MemoryConversationTurnStore(),
      model: new MockLanguageModelV4({ doGenerate }),
    });

    const first = await runtime.generateCloseout(SESSION_ID, {
      mission: "leads",
      businessId: BUSINESS_ID,
      prd: samplePrd,
      livingPrdStore,
    });

    expect(first.generated).toBe(true);
    expect(first.closeout.actions.length).toBeGreaterThanOrEqual(3);
    expect(doGenerate).toHaveBeenCalledTimes(1);

    const turns = await runtime.listTurns(SESSION_ID);
    expect(turns).toHaveLength(1);
    expect(turns[0]?.role).toBe("assistant");
    expect(findCloseoutInTurns(turns)).toEqual(first.closeout);

    const latest = await livingPrdStore.getLatestByBusiness(BUSINESS_ID);
    expect(latest?.nextActions).toEqual(first.closeout);

    const second = await runtime.generateCloseout(SESSION_ID, {
      mission: "leads",
      businessId: BUSINESS_ID,
      prd: samplePrd,
      livingPrdStore,
    });

    expect(second.generated).toBe(false);
    expect(doGenerate).toHaveBeenCalledTimes(1);
  });
});
