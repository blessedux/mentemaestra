import {
  ChoiceChipRequestSchema,
  type ChoiceChipRequest,
} from "@/lib/domain/choice-chip";
import type { MemoryFact } from "@/lib/domain/memory-fact";
import type { MemoryWriter } from "@/lib/modules/memory-writer";

export type ApplyChoiceChipOptions = {
  memoryWriter: MemoryWriter;
  sessionId: string;
  businessId?: string | null;
  request: ChoiceChipRequest;
};

/**
 * Writes a MemoryFact from a chip click (provenance_type=chip).
 * Same MemoryWriter path as typed answers — only provenance differs.
 */
export async function applyChoiceChip(
  options: ApplyChoiceChipOptions,
): Promise<MemoryFact> {
  const request = ChoiceChipRequestSchema.parse(options.request);

  return options.memoryWriter.upsertFact({
    sessionId: options.sessionId,
    businessId: options.businessId ?? null,
    key: request.factKey,
    value: request.value,
    category: request.category,
    provenanceType: "chip",
    provenanceId: request.interactionId,
    confidence: 1,
  });
}
