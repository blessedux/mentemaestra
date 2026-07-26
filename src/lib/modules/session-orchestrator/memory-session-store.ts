import type { Mission } from "@/lib/domain/mission";
import type { Session } from "@/lib/domain/session";
import type { NewSessionInput, SessionStore } from "./types";

/** In-memory SessionStore for Vitest and local unit tests. */
export class MemorySessionStore implements SessionStore {
  private readonly byId = new Map<string, Session>();
  private readonly byToken = new Map<string, string>();

  async insert(session: NewSessionInput): Promise<Session> {
    if (this.byId.has(session.id)) {
      throw new Error(`Session already exists: ${session.id}`);
    }
    if (this.byToken.has(session.cookieToken)) {
      throw new Error("cookie_token already exists");
    }

    const stored: Session = { ...session };
    this.byId.set(stored.id, stored);
    this.byToken.set(stored.cookieToken, stored.id);
    return { ...stored };
  }

  async findByCookieToken(cookieToken: string): Promise<Session | null> {
    const id = this.byToken.get(cookieToken);
    if (!id) return null;
    const session = this.byId.get(id);
    return session ? { ...session } : null;
  }

  async findById(sessionId: string): Promise<Session | null> {
    const session = this.byId.get(sessionId);
    return session ? { ...session } : null;
  }

  async updateMission(sessionId: string, mission: Mission): Promise<void> {
    const session = this.byId.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    this.byId.set(sessionId, { ...session, mission });
  }

  async updateBusinessId(
    sessionId: string,
    businessId: string,
  ): Promise<void> {
    const session = this.byId.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    this.byId.set(sessionId, { ...session, businessId });
  }
}
