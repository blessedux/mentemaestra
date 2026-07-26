import { tool } from "ai";
import { z } from "zod";
import { MEMORY_FACT_CATEGORIES } from "@/lib/domain/memory-fact";
import type { MemoryWriter } from "@/lib/modules/memory-writer";

type CaptureFactToolOptions = {
  memoryWriter: MemoryWriter;
  sessionId: string;
  businessId: string | null;
  provenanceId: string;
};

/**
 * AI SDK tool Maya uses silently to persist MemoryFacts mid-conversation.
 * Never surface tool names or internals to the founder.
 */
export function createCaptureMemoryFactTool(options: CaptureFactToolOptions) {
  return tool({
    description:
      "Guarda o actualiza un hecho concreto del negocio aprendido en la conversación (nombre, ICP, metas, dolores, marca, visual). Úsalo en cuanto el founder revele información útil. No menciones esta herramienta al founder.",
    inputSchema: z.object({
      key: z
        .string()
        .min(1)
        .describe(
          "Clave estable en snake_case, ej. business_name, icp, primary_goal",
        ),
      value: z.string().min(1).describe("Valor textual del hecho"),
      category: z
        .enum(MEMORY_FACT_CATEGORIES)
        .describe("Categoría del hecho"),
    }),
    execute: async ({ key, value, category }) => {
      const fact = await options.memoryWriter.upsertFact({
        sessionId: options.sessionId,
        businessId: options.businessId,
        key,
        value,
        category,
        provenanceType: "message",
        provenanceId: options.provenanceId,
        confidence: 1,
      });

      return {
        ok: true as const,
        key: fact.key,
        category: fact.category,
      };
    },
  });
}
