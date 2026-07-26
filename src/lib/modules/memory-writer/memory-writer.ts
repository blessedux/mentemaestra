import { randomUUID } from "node:crypto";
import {
  MemoryFactInputSchema,
  type MemoryFact,
  type MemoryFactInput,
} from "@/lib/domain/memory-fact";
import type { MemoryFactStore, MemoryWriterApi } from "./types";

/**
 * Upserts MemoryFacts with provenance and deduplicates by (sessionId, key).
 */
export class MemoryWriter implements MemoryWriterApi {
  constructor(
    private readonly store: MemoryFactStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async upsertFact(fact: MemoryFactInput): Promise<MemoryFact> {
    const parsed = MemoryFactInputSchema.parse(fact);
    const now = this.now();
    const existing = await this.store.findBySessionAndKey(
      parsed.sessionId,
      parsed.key,
    );

    return this.store.upsert({
      id: existing?.id ?? randomUUID(),
      businessId: parsed.businessId ?? null,
      sessionId: parsed.sessionId,
      key: parsed.key,
      value: parsed.value,
      category: parsed.category,
      provenanceType: parsed.provenanceType,
      provenanceId: parsed.provenanceId,
      confidence: parsed.confidence ?? 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async getFactsBySession(sessionId: string): Promise<MemoryFact[]> {
    return this.store.listBySession(sessionId);
  }

  async getFactsByBusiness(businessId: string): Promise<MemoryFact[]> {
    return this.store.listByBusiness(businessId);
  }
}
