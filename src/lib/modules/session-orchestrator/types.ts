import type { Mission } from "@/lib/domain/mission";
import type { Session } from "@/lib/domain/session";

export type NewSessionInput = {
  id: string;
  cookieToken: string;
  mission: Mission | null;
  businessId: string | null;
  createdAt: Date;
  expiresAt: Date;
};

/** Persistence boundary for SessionOrchestrator (injectable for tests). */
export interface SessionStore {
  insert(session: NewSessionInput): Promise<Session>;
  findByCookieToken(cookieToken: string): Promise<Session | null>;
  findById(sessionId: string): Promise<Session | null>;
  updateMission(sessionId: string, mission: Mission): Promise<void>;
}

export interface SessionOrchestratorApi {
  createSession(mission?: Mission): Promise<Session>;
  getSession(cookieToken: string): Promise<Session | null>;
  attachMission(sessionId: string, mission: Mission): Promise<void>;
}
