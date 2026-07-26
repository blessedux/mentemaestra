import { createServiceClient } from "@/lib/supabase/admin";
import { SessionOrchestrator } from "./session-orchestrator";
import { SupabaseSessionStore } from "./supabase-session-store";

/** Production orchestrator backed by Supabase (service role). */
export function createSessionOrchestrator(): SessionOrchestrator {
  const supabase = createServiceClient();
  return new SessionOrchestrator(new SupabaseSessionStore(supabase));
}
