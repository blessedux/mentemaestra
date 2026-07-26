import { describe, expect, it } from "vitest";
import { InMemoryFactStore } from "./memory-fact-store";
import { MemoryWriter } from "./memory-writer";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const BUSINESS_ID = "22222222-2222-4222-8222-222222222222";

describe("MemoryWriter", () => {
  it("upserts a new fact", async () => {
    const writer = new MemoryWriter(new InMemoryFactStore());

    const fact = await writer.upsertFact({
      sessionId: SESSION_ID,
      key: "business_name",
      value: "Acme Café",
      category: "business",
      provenanceType: "message",
      provenanceId: "turn-1",
    });

    expect(fact.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(fact.key).toBe("business_name");
    expect(fact.value).toBe("Acme Café");
    expect(fact.category).toBe("business");
    expect(fact.provenanceType).toBe("message");
    expect(fact.provenanceId).toBe("turn-1");
    expect(fact.confidence).toBe(1);
    expect(fact.businessId).toBeNull();
  });

  it("deduplicates by session key and updates value", async () => {
    let now = new Date("2026-07-26T12:00:00.000Z");
    const writer = new MemoryWriter(new InMemoryFactStore(), () => now);

    const first = await writer.upsertFact({
      sessionId: SESSION_ID,
      key: "icp",
      value: "PYMEs locales",
      category: "customers",
      provenanceType: "message",
      provenanceId: "turn-1",
      confidence: 0.8,
    });

    now = new Date("2026-07-26T12:05:00.000Z");

    const second = await writer.upsertFact({
      sessionId: SESSION_ID,
      key: "icp",
      value: "Dueños de restaurantes en Bogotá",
      category: "customers",
      provenanceType: "chip",
      provenanceId: "chip-2",
      confidence: 1,
    });

    expect(second.id).toBe(first.id);
    expect(second.value).toBe("Dueños de restaurantes en Bogotá");
    expect(second.provenanceType).toBe("chip");
    expect(second.provenanceId).toBe("chip-2");
    expect(second.confidence).toBe(1);
    expect(second.createdAt).toEqual(first.createdAt);
    expect(second.updatedAt).toEqual(now);

    const listed = await writer.getFactsBySession(SESSION_ID);
    expect(listed).toHaveLength(1);
  });

  it("fetches facts by session", async () => {
    const writer = new MemoryWriter(new InMemoryFactStore());

    await writer.upsertFact({
      sessionId: SESSION_ID,
      key: "goal",
      value: "Más leads",
      category: "goals",
      provenanceType: "message",
      provenanceId: "t1",
    });
    await writer.upsertFact({
      sessionId: "33333333-3333-4333-8333-333333333333",
      key: "goal",
      value: "Otro",
      category: "goals",
      provenanceType: "message",
      provenanceId: "t2",
    });

    const facts = await writer.getFactsBySession(SESSION_ID);
    expect(facts).toHaveLength(1);
    expect(facts[0]?.value).toBe("Más leads");
  });

  it("fetches facts by business and preserves provenance", async () => {
    const writer = new MemoryWriter(new InMemoryFactStore());

    await writer.upsertFact({
      sessionId: SESSION_ID,
      businessId: BUSINESS_ID,
      key: "brand_tone",
      value: "Cálido y directo",
      category: "brand",
      provenanceType: "user_edit",
      provenanceId: "edit-9",
      confidence: 0.9,
    });

    const facts = await writer.getFactsByBusiness(BUSINESS_ID);
    expect(facts).toHaveLength(1);
    expect(facts[0]?.provenanceType).toBe("user_edit");
    expect(facts[0]?.provenanceId).toBe("edit-9");
    expect(facts[0]?.confidence).toBe(0.9);
  });
});
