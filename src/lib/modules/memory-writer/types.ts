import type { MemoryFact, MemoryFactInput } from "@/lib/domain/memory-fact";

export type StoredMemoryFactInput = {
  id: string;
  businessId: string | null;
  sessionId: string;
  key: string;
  value: string;
  category: MemoryFact["category"];
  provenanceType: MemoryFact["provenanceType"];
  provenanceId: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
};

/** Persistence boundary for MemoryWriter (injectable for tests). */
export interface MemoryFactStore {
  upsert(fact: StoredMemoryFactInput): Promise<MemoryFact>;
  findBySessionAndKey(
    sessionId: string,
    key: string,
  ): Promise<MemoryFact | null>;
  listBySession(sessionId: string): Promise<MemoryFact[]>;
  listByBusiness(businessId: string): Promise<MemoryFact[]>;
}

export interface MemoryWriterApi {
  upsertFact(fact: MemoryFactInput): Promise<MemoryFact>;
  getFactsBySession(sessionId: string): Promise<MemoryFact[]>;
  getFactsByBusiness(businessId: string): Promise<MemoryFact[]>;
}
