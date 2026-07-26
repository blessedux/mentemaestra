import { randomUUID } from "node:crypto";
import type {
  MemoryFact,
  MemoryFactCategory,
} from "@/lib/domain/memory-fact";
import type { LivingPrdCompiler } from "@/lib/modules/living-prd-compiler";
import type { MemoryWriter } from "./memory-writer";

export type ApplyFactUserEditOptions = {
  memoryWriter: MemoryWriter;
  compiler: LivingPrdCompiler;
  sessionId: string;
  businessId: string;
  key: string;
  value: string;
  category: MemoryFactCategory;
  provenanceId?: string;
};

/**
 * Upserts a single MemoryFact with user_edit provenance and recompiles the PRD.
 */
export async function applyFactUserEdit(
  options: ApplyFactUserEditOptions,
): Promise<{ fact: MemoryFact }> {
  const provenanceId = options.provenanceId ?? `fact_edit_${randomUUID()}`;

  const fact = await options.memoryWriter.upsertFact({
    sessionId: options.sessionId,
    businessId: options.businessId,
    key: options.key,
    value: options.value,
    category: options.category,
    provenanceType: "user_edit",
    provenanceId,
    confidence: 1,
  });

  await options.compiler.recompile(options.businessId);
  return { fact };
}
