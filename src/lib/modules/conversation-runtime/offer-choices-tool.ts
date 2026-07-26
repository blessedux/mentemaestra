import { tool } from "ai";
import { OfferChoicesInputSchema } from "@/lib/domain/choice-chip";

/**
 * Tool Maya uses to offer structured choice chips in the chat UI.
 * Does not write MemoryFacts — that happens on chip click via /api/choice-chip.
 */
export function createOfferChoicesTool() {
  return tool({
    description:
      "Ofrece opciones en chips para una pregunta categórica de alto valor (misión, industria, tamaño de equipo, prioridad de meta). El founder verá botones; no digas que usaste una herramienta. Usa esto en lugar de listar opciones solo en texto cuando haya 2–6 alternativas claras.",
    inputSchema: OfferChoicesInputSchema,
    execute: async (input) => ({
      offered: true as const,
      questionKey: input.questionKey,
      options: input.options,
      factKey: input.factKey,
      category: input.category,
    }),
  });
}
