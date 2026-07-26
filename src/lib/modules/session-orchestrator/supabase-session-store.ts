import type { SupabaseClient } from "@supabase/supabase-js";
import type { Mission } from "@/lib/domain/mission";
import type { Session } from "@/lib/domain/session";
import type { NewSessionInput, SessionStore } from "./types";

type SessionRow = {
  id: string;
  cookie_token: string;
  mission: Mission | null;
  business_id: string | null;
  created_at: string;
  expires_at: string;
};

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    cookieToken: row.cookie_token,
    mission: row.mission,
    businessId: row.business_id,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
  };
}

/** Postgres-backed store via Supabase (server/service-role client). */
export class SupabaseSessionStore implements SessionStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(session: NewSessionInput): Promise<Session> {
    const { data, error } = await this.supabase
      .from("sessions")
      .insert({
        id: session.id,
        cookie_token: session.cookieToken,
        mission: session.mission,
        business_id: session.businessId,
        created_at: session.createdAt.toISOString(),
        expires_at: session.expiresAt.toISOString(),
      })
      .select(
        "id, cookie_token, mission, business_id, created_at, expires_at",
      )
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return rowToSession(data as SessionRow);
  }

  async findByCookieToken(cookieToken: string): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from("sessions")
      .select("id, cookie_token, mission, business_id, created_at, expires_at")
      .eq("cookie_token", cookieToken)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch session: ${error.message}`);
    }
    if (!data) return null;
    return rowToSession(data as SessionRow);
  }

  async findById(sessionId: string): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from("sessions")
      .select("id, cookie_token, mission, business_id, created_at, expires_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch session: ${error.message}`);
    }
    if (!data) return null;
    return rowToSession(data as SessionRow);
  }

  async updateMission(sessionId: string, mission: Mission): Promise<void> {
    const { data, error } = await this.supabase
      .from("sessions")
      .update({ mission })
      .eq("id", sessionId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to attach mission: ${error.message}`);
    }
    if (!data) {
      throw new Error(`Session not found: ${sessionId}`);
    }
  }
}
