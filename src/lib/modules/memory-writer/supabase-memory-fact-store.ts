import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MemoryFact,
  MemoryFactCategory,
  ProvenanceType,
} from "@/lib/domain/memory-fact";
import type { MemoryFactStore, StoredMemoryFactInput } from "./types";

type FactRow = {
  id: string;
  business_id: string | null;
  session_id: string;
  key: string;
  value: string;
  category: MemoryFactCategory;
  provenance_type: ProvenanceType;
  provenance_id: string;
  confidence: number | string;
  created_at: string;
  updated_at: string;
};

function rowToFact(row: FactRow): MemoryFact {
  return {
    id: row.id,
    businessId: row.business_id,
    sessionId: row.session_id,
    key: row.key,
    value: row.value,
    category: row.category,
    provenanceType: row.provenance_type,
    provenanceId: row.provenance_id,
    confidence: Number(row.confidence),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

const SELECT_COLS =
  "id, business_id, session_id, key, value, category, provenance_type, provenance_id, confidence, created_at, updated_at";

/** Postgres-backed store via Supabase (service-role client). */
export class SupabaseMemoryFactStore implements MemoryFactStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async findBySessionAndKey(
    sessionId: string,
    key: string,
  ): Promise<MemoryFact | null> {
    const { data, error } = await this.supabase
      .from("memory_facts")
      .select(SELECT_COLS)
      .eq("session_id", sessionId)
      .eq("key", key)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch memory fact: ${error.message}`);
    }
    if (!data) return null;
    return rowToFact(data as FactRow);
  }

  async upsert(fact: StoredMemoryFactInput): Promise<MemoryFact> {
    const existing = await this.findBySessionAndKey(fact.sessionId, fact.key);

    if (existing) {
      const { data, error } = await this.supabase
        .from("memory_facts")
        .update({
          business_id: fact.businessId,
          value: fact.value,
          category: fact.category,
          provenance_type: fact.provenanceType,
          provenance_id: fact.provenanceId,
          confidence: fact.confidence,
          updated_at: fact.updatedAt.toISOString(),
        })
        .eq("id", existing.id)
        .select(SELECT_COLS)
        .single();

      if (error) {
        throw new Error(`Failed to update memory fact: ${error.message}`);
      }
      return rowToFact(data as FactRow);
    }

    const { data, error } = await this.supabase
      .from("memory_facts")
      .insert({
        id: fact.id,
        business_id: fact.businessId,
        session_id: fact.sessionId,
        key: fact.key,
        value: fact.value,
        category: fact.category,
        provenance_type: fact.provenanceType,
        provenance_id: fact.provenanceId,
        confidence: fact.confidence,
        created_at: fact.createdAt.toISOString(),
        updated_at: fact.updatedAt.toISOString(),
      })
      .select(SELECT_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to insert memory fact: ${error.message}`);
    }
    return rowToFact(data as FactRow);
  }

  async listBySession(sessionId: string): Promise<MemoryFact[]> {
    const { data, error } = await this.supabase
      .from("memory_facts")
      .select(SELECT_COLS)
      .eq("session_id", sessionId)
      .order("updated_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list session facts: ${error.message}`);
    }
    return ((data ?? []) as FactRow[]).map(rowToFact);
  }

  async listByBusiness(businessId: string): Promise<MemoryFact[]> {
    const { data, error } = await this.supabase
      .from("memory_facts")
      .select(SELECT_COLS)
      .eq("business_id", businessId)
      .order("updated_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list business facts: ${error.message}`);
    }
    return ((data ?? []) as FactRow[]).map(rowToFact);
  }

  async bindSessionToBusiness(
    sessionId: string,
    businessId: string,
    updatedAt: Date,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("memory_facts")
      .update({
        business_id: businessId,
        updated_at: updatedAt.toISOString(),
      })
      .eq("session_id", sessionId);

    if (error) {
      throw new Error(
        `Failed to bind memory facts to business: ${error.message}`,
      );
    }
  }
}
