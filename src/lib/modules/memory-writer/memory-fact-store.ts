import type { MemoryFact } from "@/lib/domain/memory-fact";
import type { MemoryFactStore, StoredMemoryFactInput } from "./types";

/** In-memory MemoryFactStore for Vitest. Dedupes by (sessionId, key). */
export class InMemoryFactStore implements MemoryFactStore {
  private readonly facts = new Map<string, MemoryFact>();

  private sessionKey(sessionId: string, key: string): string {
    return `${sessionId}::${key}`;
  }

  async findBySessionAndKey(
    sessionId: string,
    key: string,
  ): Promise<MemoryFact | null> {
    const fact = this.facts.get(this.sessionKey(sessionId, key));
    return fact ? { ...fact } : null;
  }

  async upsert(fact: StoredMemoryFactInput): Promise<MemoryFact> {
    const existing = await this.findBySessionAndKey(fact.sessionId, fact.key);
    const stored: MemoryFact = existing
      ? {
          ...existing,
          businessId: fact.businessId,
          value: fact.value,
          category: fact.category,
          provenanceType: fact.provenanceType,
          provenanceId: fact.provenanceId,
          confidence: fact.confidence,
          updatedAt: fact.updatedAt,
        }
      : { ...fact };

    this.facts.set(this.sessionKey(stored.sessionId, stored.key), stored);
    return { ...stored };
  }

  async listBySession(sessionId: string): Promise<MemoryFact[]> {
    return [...this.facts.values()]
      .filter((fact) => fact.sessionId === sessionId)
      .map((fact) => ({ ...fact }))
      .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
  }

  async listByBusiness(businessId: string): Promise<MemoryFact[]> {
    return [...this.facts.values()]
      .filter((fact) => fact.businessId === businessId)
      .map((fact) => ({ ...fact }))
      .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
  }
}
