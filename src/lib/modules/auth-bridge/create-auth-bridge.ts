import { createLivingPrdCompiler } from "@/lib/modules/living-prd-compiler";
import { createMemoryWriter } from "@/lib/modules/memory-writer";
import { createSessionOrchestrator } from "@/lib/modules/session-orchestrator";
import { createServiceClient } from "@/lib/supabase/admin";
import { AuthBridge } from "./auth-bridge";
import { SupabaseBusinessStore } from "./supabase-business-store";
import type { AuthGateway } from "./types";

/** Production AuthBridge (service-role stores). Optional auth gateway for UX. */
export function createAuthBridge(authGateway?: AuthGateway): AuthBridge {
  return new AuthBridge({
    businesses: new SupabaseBusinessStore(createServiceClient()),
    sessions: createSessionOrchestrator(),
    memoryWriter: createMemoryWriter(),
    livingPrdCompiler: createLivingPrdCompiler(),
    authGateway,
  });
}
