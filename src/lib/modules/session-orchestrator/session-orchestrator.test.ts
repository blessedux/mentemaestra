import { describe, expect, it } from "vitest";
import { MemorySessionStore } from "./memory-session-store";
import { SessionOrchestrator } from "./session-orchestrator";

describe("SessionOrchestrator", () => {
  it("creates a session without a mission", async () => {
    const now = new Date("2026-07-26T12:00:00.000Z");
    const orchestrator = new SessionOrchestrator(
      new MemorySessionStore(),
      () => now,
    );

    const session = await orchestrator.createSession();

    expect(session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(session.cookieToken.length).toBeGreaterThan(20);
    expect(session.mission).toBeNull();
    expect(session.businessId).toBeNull();
    expect(session.createdAt).toEqual(now);
    expect(session.expiresAt).toEqual(
      new Date("2026-08-02T12:00:00.000Z"),
    );
  });

  it("creates a session with a mission", async () => {
    const orchestrator = new SessionOrchestrator(new MemorySessionStore());

    const session = await orchestrator.createSession("leads");

    expect(session.mission).toBe("leads");
  });

  it("attaches a mission to an existing session", async () => {
    const store = new MemorySessionStore();
    const orchestrator = new SessionOrchestrator(store);

    const session = await orchestrator.createSession();
    expect(session.mission).toBeNull();

    await orchestrator.attachMission(session.id, "marketing");

    const fetched = await orchestrator.getSession(session.cookieToken);
    expect(fetched?.mission).toBe("marketing");
  });

  it("fetches a session by cookie token", async () => {
    const orchestrator = new SessionOrchestrator(new MemorySessionStore());
    const created = await orchestrator.createSession("website");

    const found = await orchestrator.getSession(created.cookieToken);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.mission).toBe("website");
    expect(found?.cookieToken).toBe(created.cookieToken);
  });

  it("returns null for an unknown cookie token", async () => {
    const orchestrator = new SessionOrchestrator(new MemorySessionStore());

    await expect(orchestrator.getSession("missing-token")).resolves.toBeNull();
  });

  it("returns null for an expired session", async () => {
    let now = new Date("2026-07-26T12:00:00.000Z");
    const orchestrator = new SessionOrchestrator(
      new MemorySessionStore(),
      () => now,
    );

    const session = await orchestrator.createSession("sales");

    now = new Date("2026-08-02T12:00:01.000Z");

    await expect(
      orchestrator.getSession(session.cookieToken),
    ).resolves.toBeNull();
  });

  it("throws when attaching a mission to a missing session", async () => {
    const orchestrator = new SessionOrchestrator(new MemorySessionStore());

    await expect(
      orchestrator.attachMission(
        "00000000-0000-4000-8000-000000000000",
        "strategy",
      ),
    ).rejects.toThrow(/Session not found/);
  });

  it("binds a business idempotently", async () => {
    const orchestrator = new SessionOrchestrator(new MemorySessionStore());
    const session = await orchestrator.createSession("leads");
    const businessId = "22222222-2222-4222-8222-222222222222";

    await orchestrator.bindBusiness(session.id, businessId);
    await orchestrator.bindBusiness(session.id, businessId);

    const fetched = await orchestrator.getSessionById(session.id);
    expect(fetched?.businessId).toBe(businessId);
  });
});

