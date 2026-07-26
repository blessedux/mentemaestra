import { describe, expect, it } from "vitest";
import { InMemoryLivingPrdStore } from "@/lib/modules/living-prd-compiler";
import { LivingPrdCompiler } from "@/lib/modules/living-prd-compiler";
import { InMemoryFactStore, MemoryWriter } from "@/lib/modules/memory-writer";
import {
  MemorySessionStore,
  SessionOrchestrator,
} from "@/lib/modules/session-orchestrator";
import { AuthBridge } from "./auth-bridge";
import { InMemoryBusinessStore } from "./in-memory-business-store";
import type { AuthGateway, AuthResult } from "./types";

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function createBridge(gateway?: AuthGateway) {
  const sessions = new SessionOrchestrator(new MemorySessionStore());
  const memoryWriter = new MemoryWriter(new InMemoryFactStore());
  const livingPrdStore = new InMemoryLivingPrdStore();
  const livingPrdCompiler = new LivingPrdCompiler({
    facts: memoryWriter,
    store: livingPrdStore,
  });
  const businesses = new InMemoryBusinessStore();

  const bridge = new AuthBridge({
    businesses,
    sessions,
    memoryWriter,
    livingPrdCompiler,
    authGateway: gateway,
  });

  return { bridge, sessions, memoryWriter, businesses, livingPrdStore };
}

describe("AuthBridge.triggerAuth", () => {
  it("sends a magic link through the gateway", async () => {
    const calls: string[] = [];
    const gateway: AuthGateway = {
      getUserId: async () => null,
      signInWithMagicLink: async (email) => {
        calls.push(email);
      },
      signInWithGoogle: async () => ({ url: "https://example.com" }),
    };

    const { bridge } = createBridge(gateway);
    const result: AuthResult = await bridge.triggerAuth({
      method: "magic_link",
      email: "founder@example.com",
      redirectTo: "http://localhost:3000/auth/callback",
    });

    expect(result).toEqual({
      status: "magic_link_sent",
      email: "founder@example.com",
    });
    expect(calls).toEqual(["founder@example.com"]);
  });

  it("returns authenticated when a user already exists", async () => {
    const gateway: AuthGateway = {
      getUserId: async () => USER_A,
      signInWithMagicLink: async () => undefined,
      signInWithGoogle: async () => ({ url: "https://example.com" }),
    };

    const { bridge } = createBridge(gateway);
    await expect(
      bridge.triggerAuth({
        method: "google",
        redirectTo: "http://localhost:3000/auth/callback",
      }),
    ).resolves.toEqual({ status: "authenticated", userId: USER_A });
  });
});

describe("AuthBridge.mergeSession", () => {
  it("creates a business, binds session + facts, and saves a Living PRD", async () => {
    const { bridge, sessions, memoryWriter, livingPrdStore } = createBridge();
    const session = await sessions.createSession("leads");

    await memoryWriter.upsertFact({
      sessionId: session.id,
      key: "business_name",
      value: "Café Andes",
      category: "business",
      provenanceType: "message",
      provenanceId: "t1",
    });
    await memoryWriter.upsertFact({
      sessionId: session.id,
      key: "icp",
      value: "PYMEs",
      category: "customers",
      provenanceType: "chip",
      provenanceId: "c1",
    });

    const business = await bridge.mergeSession(session.id, USER_A);

    expect(business.createdBy).toBe(USER_A);
    expect(business.name).toBe("Café Andes");

    const rebound = await sessions.getSessionById(session.id);
    expect(rebound?.businessId).toBe(business.id);

    const facts = await memoryWriter.getFactsByBusiness(business.id);
    expect(facts).toHaveLength(2);
    expect(facts.every((fact) => fact.businessId === business.id)).toBe(true);

    const prd = await livingPrdStore.getLatestByBusiness(business.id);
    expect(prd?.version).toBe(1);
    expect(prd?.compiledJson.business_name).toBe("Café Andes");
  });

  it("is idempotent for the same session and user", async () => {
    const { bridge, sessions, memoryWriter, businesses, livingPrdStore } =
      createBridge();
    const session = await sessions.createSession("sales");

    await memoryWriter.upsertFact({
      sessionId: session.id,
      key: "business_name",
      value: "Studio Norte",
      category: "business",
      provenanceType: "message",
      provenanceId: "t1",
    });

    const first = await bridge.mergeSession(session.id, USER_A);
    const second = await bridge.mergeSession(session.id, USER_A);

    expect(second.id).toBe(first.id);
    expect(await businesses.findByCreatedBy(USER_A)).toMatchObject({
      id: first.id,
    });

    const latest = await livingPrdStore.getLatestByBusiness(first.id);
    expect(latest?.version).toBe(2);
  });

  it("reuses an existing business for the user across sessions", async () => {
    const { bridge, sessions, memoryWriter, businesses } = createBridge();

    const firstSession = await sessions.createSession("leads");
    await memoryWriter.upsertFact({
      sessionId: firstSession.id,
      key: "business_name",
      value: "Acme",
      category: "business",
      provenanceType: "message",
      provenanceId: "t1",
    });
    const firstBusiness = await bridge.mergeSession(firstSession.id, USER_A);

    const secondSession = await sessions.createSession("marketing");
    await memoryWriter.upsertFact({
      sessionId: secondSession.id,
      key: "primary_goal",
      value: "Más leads",
      category: "goals",
      provenanceType: "message",
      provenanceId: "t2",
    });
    const secondBusiness = await bridge.mergeSession(
      secondSession.id,
      USER_A,
    );

    expect(secondBusiness.id).toBe(firstBusiness.id);
    expect(await businesses.findByCreatedBy(USER_A)).toMatchObject({
      id: firstBusiness.id,
    });
  });

  it("rejects merge when the session belongs to another user", async () => {
    const { bridge, sessions, memoryWriter } = createBridge();
    const session = await sessions.createSession();

    await memoryWriter.upsertFact({
      sessionId: session.id,
      key: "business_name",
      value: "Solo A",
      category: "business",
      provenanceType: "message",
      provenanceId: "t1",
    });

    await bridge.mergeSession(session.id, USER_A);

    await expect(bridge.mergeSession(session.id, USER_B)).rejects.toThrow(
      /different user/,
    );
  });
});
