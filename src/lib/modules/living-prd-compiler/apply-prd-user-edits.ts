import { randomUUID } from "node:crypto";
import type { LivingPrd } from "@/lib/domain/living-prd";
import type { MemoryFact } from "@/lib/domain/memory-fact";
import type { MemoryWriter } from "@/lib/modules/memory-writer";
import { decomposeLivingPrdToFacts } from "./decompose-prd-edits";
import type { LivingPrdCompiler } from "./living-prd-compiler";

export type ApplyPrdUserEditsOptions = {
  memoryWriter: MemoryWriter;
  compiler: LivingPrdCompiler;
  sessionId: string;
  businessId: string;
  prd: LivingPrd;
  provenanceId?: string;
};

/**
 * Persists PRD field edits as MemoryFacts (user_edit) then recompiles.
 */
export async function applyPrdUserEdits(
  options: ApplyPrdUserEditsOptions,
): Promise<{ facts: MemoryFact[]; prd: LivingPrd }> {
  const provenanceId = options.provenanceId ?? `prd_edit_${randomUUID()}`;
  const decomposed = decomposeLivingPrdToFacts(options.prd);

  const facts: MemoryFact[] = [];
  for (const edit of decomposed) {
    const fact = await options.memoryWriter.upsertFact({
      sessionId: options.sessionId,
      businessId: options.businessId,
      key: edit.key,
      value: edit.value,
      category: edit.category,
      provenanceType: "user_edit",
      provenanceId,
      confidence: 1,
    });
    facts.push(fact);
  }

  const prd = await options.compiler.recompile(options.businessId);
  return { facts, prd };
}
