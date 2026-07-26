import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { InMemoryFactStore, MemoryWriter } from "@/lib/modules/memory-writer";
import { applyChoiceChip } from "./apply-choice-chip";
import { extractOfferChoices } from "./extract-offer-choices";
import { createOfferChoicesTool } from "./offer-choices-tool";
import { buildMayaSystemPrompt } from "./maya-prompt";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

describe("createOfferChoicesTool", () => {
  it("returns the offered options payload", async () => {
    const tool = createOfferChoicesTool();
    const result = await tool.execute!(
      {
        questionKey: "industry",
        options: [
          { id: "services", label: "Servicios" },
          { id: "product", label: "Producto" },
        ],
        factKey: "industry",
        category: "business",
      },
      {
        toolCallId: "call-1",
        messages: [],
        abortSignal: new AbortController().signal,
        context: undefined as never,
      },
    );

    expect(result).toEqual({
      offered: true,
      questionKey: "industry",
      options: [
        { id: "services", label: "Servicios" },
        { id: "product", label: "Producto" },
      ],
      factKey: "industry",
      category: "business",
    });
  });
});

describe("applyChoiceChip", () => {
  it("upserts a MemoryFact with chip provenance", async () => {
    const writer = new MemoryWriter(new InMemoryFactStore());

    const fact = await applyChoiceChip({
      memoryWriter: writer,
      sessionId: SESSION_ID,
      request: {
        interactionId: "call-1:services",
        factKey: "industry",
        category: "business",
        value: "Servicios",
        optionId: "services",
      },
    });

    expect(fact.key).toBe("industry");
    expect(fact.value).toBe("Servicios");
    expect(fact.provenanceType).toBe("chip");
    expect(fact.provenanceId).toBe("call-1:services");
    expect(fact.confidence).toBe(1);

    const listed = await writer.getFactsBySession(SESSION_ID);
    expect(listed).toHaveLength(1);
  });
});

describe("extractOfferChoices", () => {
  it("reads offerChoices tool parts from an assistant message", () => {
    const message = {
      id: "a1",
      role: "assistant",
      parts: [
        { type: "text", text: "¿En qué industria estás?" },
        {
          type: "tool-offerChoices",
          toolCallId: "call-9",
          state: "output-available",
          input: {
            questionKey: "industry",
            options: [
              { id: "a", label: "A" },
              { id: "b", label: "B" },
            ],
            factKey: "industry",
            category: "business",
          },
          output: {
            offered: true,
            questionKey: "industry",
            options: [
              { id: "a", label: "A" },
              { id: "b", label: "B" },
            ],
            factKey: "industry",
            category: "business",
          },
        },
      ],
    } as UIMessage;

    const offers = extractOfferChoices(message);
    expect(offers).toHaveLength(1);
    expect(offers[0]?.toolCallId).toBe("call-9");
    expect(offers[0]?.options[0]?.label).toBe("A");
  });
});

describe("buildMayaSystemPrompt chips guidance", () => {
  it("instructs Maya to offer chips for high-signal questions", () => {
    const prompt = buildMayaSystemPrompt("leads");
    expect(prompt).toContain("offerChoices");
    expect(prompt).toContain("industria");
    expect(prompt).toContain("tamaño de equipo");
    expect(prompt).toContain("prioridad de meta");
  });
});
