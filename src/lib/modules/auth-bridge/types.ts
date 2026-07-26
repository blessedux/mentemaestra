import type { Business } from "@/lib/domain/business";
import type { LivingPrdCompiler } from "@/lib/modules/living-prd-compiler";
import type { MemoryWriter } from "@/lib/modules/memory-writer";
import type { SessionOrchestrator } from "@/lib/modules/session-orchestrator";

export type NewBusinessInput = {
  id: string;
  name: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface BusinessStore {
  findById(businessId: string): Promise<Business | null>;
  findByCreatedBy(userId: string): Promise<Business | null>;
  insert(business: NewBusinessInput): Promise<Business>;
  updateName(
    businessId: string,
    name: string | null,
    updatedAt: Date,
  ): Promise<Business>;
}

export type AuthMethod = "magic_link" | "google";

export type TriggerAuthInput = {
  method: AuthMethod;
  email?: string;
  redirectTo: string;
};

export type AuthResult =
  | { status: "authenticated"; userId: string }
  | { status: "magic_link_sent"; email: string }
  | { status: "oauth_redirect"; url: string }
  | { status: "error"; message: string };

/** Injectable auth gateway (browser Supabase or test double). */
export interface AuthGateway {
  getUserId(): Promise<string | null>;
  signInWithMagicLink(email: string, redirectTo: string): Promise<void>;
  signInWithGoogle(redirectTo: string): Promise<{ url: string }>;
}

export type AuthBridgeDeps = {
  businesses: BusinessStore;
  sessions: SessionOrchestrator;
  memoryWriter: MemoryWriter;
  livingPrdCompiler: LivingPrdCompiler;
  authGateway?: AuthGateway;
  now?: () => Date;
};
