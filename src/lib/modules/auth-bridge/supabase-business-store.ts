import type { SupabaseClient } from "@supabase/supabase-js";
import type { Business } from "@/lib/domain/business";
import type { BusinessStore, NewBusinessInput } from "./types";

type BusinessRow = {
  id: string;
  name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function rowToBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

const SELECT_COLS = "id, name, created_by, created_at, updated_at";

/** Postgres-backed BusinessStore (service-role client). */
export class SupabaseBusinessStore implements BusinessStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(businessId: string): Promise<Business | null> {
    const { data, error } = await this.supabase
      .from("businesses")
      .select(SELECT_COLS)
      .eq("id", businessId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch business: ${error.message}`);
    }
    if (!data) return null;
    return rowToBusiness(data as BusinessRow);
  }

  async findByCreatedBy(userId: string): Promise<Business | null> {
    const { data, error } = await this.supabase
      .from("businesses")
      .select(SELECT_COLS)
      .eq("created_by", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch business by user: ${error.message}`);
    }
    if (!data) return null;
    return rowToBusiness(data as BusinessRow);
  }

  async insert(business: NewBusinessInput): Promise<Business> {
    const { data, error } = await this.supabase
      .from("businesses")
      .insert({
        id: business.id,
        name: business.name,
        created_by: business.createdBy,
        created_at: business.createdAt.toISOString(),
        updated_at: business.updatedAt.toISOString(),
      })
      .select(SELECT_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to create business: ${error.message}`);
    }
    return rowToBusiness(data as BusinessRow);
  }

  async updateName(
    businessId: string,
    name: string | null,
    updatedAt: Date,
  ): Promise<Business> {
    const { data, error } = await this.supabase
      .from("businesses")
      .update({
        name,
        updated_at: updatedAt.toISOString(),
      })
      .eq("id", businessId)
      .select(SELECT_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to update business: ${error.message}`);
    }
    return rowToBusiness(data as BusinessRow);
  }
}
