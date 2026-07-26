import type { SupabaseClient } from "@supabase/supabase-js";
import type { LivingPrd, LivingPrdRecord } from "@/lib/domain/living-prd";
import { LivingPrdSchema } from "@/lib/domain/living-prd";
import type { LivingPrdStore, NewLivingPrdRecordInput } from "./types";

type PrdRow = {
  id: string;
  business_id: string | null;
  compiled_json: unknown;
  version: number;
  created_at: string;
};

function rowToRecord(row: PrdRow): LivingPrdRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    compiledJson: LivingPrdSchema.parse(row.compiled_json) as LivingPrd,
    version: row.version,
    createdAt: new Date(row.created_at),
  };
}

/** Postgres-backed Living PRD store (service-role client). */
export class SupabaseLivingPrdStore implements LivingPrdStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(record: NewLivingPrdRecordInput): Promise<LivingPrdRecord> {
    const { data, error } = await this.supabase
      .from("living_prds")
      .insert({
        id: record.id,
        business_id: record.businessId,
        compiled_json: record.compiledJson,
        version: record.version,
        created_at: record.createdAt.toISOString(),
      })
      .select("id, business_id, compiled_json, version, created_at")
      .single();

    if (error) {
      throw new Error(`Failed to save Living PRD: ${error.message}`);
    }

    return rowToRecord(data as PrdRow);
  }

  async getLatestByBusiness(
    businessId: string,
  ): Promise<LivingPrdRecord | null> {
    const { data, error } = await this.supabase
      .from("living_prds")
      .select("id, business_id, compiled_json, version, created_at")
      .eq("business_id", businessId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch Living PRD: ${error.message}`);
    }
    if (!data) return null;
    return rowToRecord(data as PrdRow);
  }
}
