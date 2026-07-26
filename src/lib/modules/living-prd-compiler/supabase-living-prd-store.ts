import type { SupabaseClient } from "@supabase/supabase-js";
import type { Closeout } from "@/lib/domain/closeout";
import { CloseoutSchema } from "@/lib/domain/closeout";
import type { LivingPrd, LivingPrdRecord } from "@/lib/domain/living-prd";
import { LivingPrdSchema } from "@/lib/domain/living-prd";
import type { LivingPrdStore, NewLivingPrdRecordInput } from "./types";

type PrdRow = {
  id: string;
  business_id: string | null;
  compiled_json: unknown;
  version: number;
  created_at: string;
  next_actions: unknown | null;
};

function rowToRecord(row: PrdRow): LivingPrdRecord {
  const nextActions =
    row.next_actions == null
      ? null
      : CloseoutSchema.parse(row.next_actions);

  return {
    id: row.id,
    businessId: row.business_id,
    compiledJson: LivingPrdSchema.parse(row.compiled_json) as LivingPrd,
    version: row.version,
    createdAt: new Date(row.created_at),
    nextActions,
  };
}

const SELECT_COLS =
  "id, business_id, compiled_json, version, created_at, next_actions";

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
        next_actions: record.nextActions ?? null,
      })
      .select(SELECT_COLS)
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
      .select(SELECT_COLS)
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

  async updateNextActions(
    businessId: string,
    nextActions: Closeout,
  ): Promise<LivingPrdRecord> {
    const latest = await this.getLatestByBusiness(businessId);
    if (!latest) {
      throw new Error(`No Living PRD for business ${businessId}`);
    }

    const { data, error } = await this.supabase
      .from("living_prds")
      .update({ next_actions: nextActions })
      .eq("id", latest.id)
      .select(SELECT_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to save next actions: ${error.message}`);
    }

    return rowToRecord(data as PrdRow);
  }
}
