import { randomBytes, randomUUID } from "node:crypto";
import type { Mission } from "@/lib/domain/mission";
import { SESSION_TTL_MS, type Session } from "@/lib/domain/session";
import type { SessionOrchestratorApi, SessionStore } from "./types";

function generateCookieToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Creates Sessions, attaches missions, and resolves cookie tokens.
 * Persistence is injected so Vitest can use MemorySessionStore.
 */
export class SessionOrchestrator implements SessionOrchestratorApi {
  constructor(
    private readonly store: SessionStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async createSession(mission?: Mission): Promise<Session> {
    const createdAt = this.now();
    const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS);

    return this.store.insert({
      id: randomUUID(),
      cookieToken: generateCookieToken(),
      mission: mission ?? null,
      businessId: null,
      createdAt,
      expiresAt,
    });
  }

  async getSession(cookieToken: string): Promise<Session | null> {
    const session = await this.store.findByCookieToken(cookieToken);
    if (!session) return null;

    if (session.expiresAt.getTime() <= this.now().getTime()) {
      return null;
    }

    return session;
  }

  async getSessionById(sessionId: string): Promise<Session | null> {
    const session = await this.store.findById(sessionId);
    if (!session) return null;

    if (session.expiresAt.getTime() <= this.now().getTime()) {
      return null;
    }

    return session;
  }

  async attachMission(sessionId: string, mission: Mission): Promise<void> {
    await this.store.updateMission(sessionId, mission);
  }

  /** Bind an anonymous session to a Business (AuthBridge merge). */
  async bindBusiness(sessionId: string, businessId: string): Promise<void> {
    const session = await this.store.findById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.businessId != null && session.businessId !== businessId) {
      throw new Error(
        `Session ${sessionId} already bound to a different business`,
      );
    }

    if (session.businessId === businessId) {
      return;
    }

    await this.store.updateBusinessId(sessionId, businessId);
  }
}
