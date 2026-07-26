import { createMemoryWriter } from "@/lib/modules/memory-writer";
import { SupabaseSessionStore } from "@/lib/modules/session-orchestrator";
import { createServiceClient } from "@/lib/supabase/admin";
import { LivingPrdCompiler } from "./living-prd-compiler";
import { SupabaseLivingPrdStore } from "./supabase-living-prd-store";
import type { LivingPrdStore } from "./types";

/** Production Living PRD store (service role). */
export function createLivingPrdStore(): LivingPrdStore {
  return new SupabaseLivingPrdStore(createServiceClient());
}

/** Production compiler: MemoryWriter facts + Supabase PRD store. */
export function createLivingPrdCompiler(): LivingPrdCompiler {
  const supabase = createServiceClient();
  const sessions = new SupabaseSessionStore(supabase);

  return new LivingPrdCompiler({
    facts: createMemoryWriter(),
    store: new SupabaseLivingPrdStore(supabase),
    getSessionMission: async (sessionId) => {
      const session = await sessions.findById(sessionId);
      return session?.mission ?? null;
    },
  });
}
