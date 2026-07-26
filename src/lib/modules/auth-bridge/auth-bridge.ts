import { randomUUID } from "node:crypto";
import type { Business } from "@/lib/domain/business";
import type { LivingPrdCompiler } from "@/lib/modules/living-prd-compiler";
import type { MemoryWriter } from "@/lib/modules/memory-writer";
import type { SessionOrchestrator } from "@/lib/modules/session-orchestrator";
import type {
  AuthBridgeDeps,
  AuthGateway,
  AuthResult,
  BusinessStore,
  TriggerAuthInput,
} from "./types";

/**
 * Soft-gates Save & Continue with Supabase Auth and merges anonymous
 * Sessions into durable Business ownership.
 */
export class AuthBridge {
  private readonly businesses: BusinessStore;
  private readonly sessions: SessionOrchestrator;
  private readonly memoryWriter: MemoryWriter;
  private readonly livingPrdCompiler: LivingPrdCompiler;
  private readonly authGateway: AuthGateway | undefined;
  private readonly now: () => Date;

  constructor(deps: AuthBridgeDeps) {
    this.businesses = deps.businesses;
    this.sessions = deps.sessions;
    this.memoryWriter = deps.memoryWriter;
    this.livingPrdCompiler = deps.livingPrdCompiler;
    this.authGateway = deps.authGateway;
    this.now = deps.now ?? (() => new Date());
  }

  /**
   * Soft-gate entry: magic link and/or Google OAuth via injectable gateway.
   */
  async triggerAuth(input: TriggerAuthInput): Promise<AuthResult> {
    if (!this.authGateway) {
      return {
        status: "error",
        message: "Auth gateway is not configured",
      };
    }

    try {
      const existingUserId = await this.authGateway.getUserId();
      if (existingUserId) {
        return { status: "authenticated", userId: existingUserId };
      }

      if (input.method === "magic_link") {
        const email = input.email?.trim();
        if (!email) {
          return { status: "error", message: "Email is required" };
        }
        await this.authGateway.signInWithMagicLink(email, input.redirectTo);
        return { status: "magic_link_sent", email };
      }

      const { url } = await this.authGateway.signInWithGoogle(
        input.redirectTo,
      );
      return { status: "oauth_redirect", url };
    } catch (err) {
      return {
        status: "error",
        message: err instanceof Error ? err.message : "Auth failed",
      };
    }
  }

  /**
   * Create/fetch the user's Business, bind the anonymous session + facts,
   * and persist a Living PRD version. Idempotent for the same session/user.
   */
  async mergeSession(sessionId: string, userId: string): Promise<Business> {
    const session = await this.sessions.getSessionById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.businessId) {
      const existingBound = await this.businesses.findById(session.businessId);
      if (!existingBound) {
        throw new Error(
          `Session bound to missing business ${session.businessId}`,
        );
      }
      if (existingBound.createdBy !== userId) {
        throw new Error("Session is owned by a different user");
      }
      // Idempotent re-merge: refresh facts/PRD binding.
      await this.finishMerge(sessionId, existingBound);
      return existingBound;
    }

    let business = await this.businesses.findByCreatedBy(userId);
    const compiled = await this.livingPrdCompiler.compile(sessionId);
    const name = compiled?.business_name ?? null;
    const now = this.now();

    if (!business) {
      business = await this.businesses.insert({
        id: randomUUID(),
        name,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    } else if (name && business.name !== name) {
      business = await this.businesses.updateName(business.id, name, now);
    }

    await this.finishMerge(sessionId, business);
    return business;
  }

  private async finishMerge(
    sessionId: string,
    business: Business,
  ): Promise<void> {
    await this.sessions.bindBusiness(sessionId, business.id);
    await this.memoryWriter.bindSessionToBusiness(sessionId, business.id);

    const facts = await this.memoryWriter.getFactsByBusiness(business.id);
    if (facts.length > 0) {
      await this.livingPrdCompiler.recompile(business.id);
    }
  }
}
