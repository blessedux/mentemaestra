import { describe, expect, it } from "vitest";
import { InMemoryFactStore } from "@/lib/modules/memory-writer";
import { MemoryWriter } from "@/lib/modules/memory-writer";
import { compileFromFacts } from "./compile-from-facts";
import { InMemoryLivingPrdStore } from "./in-memory-living-prd-store";
import { LivingPrdCompiler } from "./living-prd-compiler";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const BUSINESS_ID = "22222222-2222-4222-8222-222222222222";

async function seedFacts(writer: MemoryWriter) {
  await writer.upsertFact({
    sessionId: SESSION_ID,
    businessId: BUSINESS_ID,
    key: "business_name",
    value: "Café Andes",
    category: "business",
    provenanceType: "message",
    provenanceId: "t1",
  });
  await writer.upsertFact({
    sessionId: SESSION_ID,
    businessId: BUSINESS_ID,
    key: "icp",
    value: "Emprendedores en Bogotá",
    category: "customers",
    provenanceType: "message",
    provenanceId: "t2",
  });
  await writer.upsertFact({
    sessionId: SESSION_ID,
    businessId: BUSINESS_ID,
    key: "primary_goal",
    value: "Conseguir más leads",
    category: "goals",
    provenanceType: "message",
    provenanceId: "t3",
  });
  await writer.upsertFact({
    sessionId: SESSION_ID,
    businessId: BUSINESS_ID,
    key: "pain",
    value: "Poco tiempo para marketing",
    category: "pain",
    provenanceType: "message",
    provenanceId: "t4",
  });
}

describe("compileFromFacts", () => {
  it("returns null for an empty fact list", () => {
    expect(compileFromFacts([])).toBeNull();
  });

  it("groups facts into a Living PRD", async () => {
    const writer = new MemoryWriter(new InMemoryFactStore());
    await seedFacts(writer);
    const facts = await writer.getFactsBySession(SESSION_ID);

    const prd = compileFromFacts(facts, "leads");

    expect(prd).not.toBeNull();
    expect(prd?.business_name).toBe("Café Andes");
    expect(prd?.icp).toBe("Emprendedores en Bogotá");
    expect(prd?.goals).toEqual(["Conseguir más leads"]);
    expect(prd?.pain_points).toEqual(["Poco tiempo para marketing"]);
    expect(prd?.mission).toBe("leads");
  });
});

describe("LivingPrdCompiler", () => {
  it("compiles a session PRD and returns null without facts", async () => {
    const writer = new MemoryWriter(new InMemoryFactStore());
    const compiler = new LivingPrdCompiler({
      facts: writer,
      store: new InMemoryLivingPrdStore(),
      getSessionMission: async () => "marketing",
    });

    await expect(compiler.compile(SESSION_ID)).resolves.toBeNull();

    await seedFacts(writer);
    const prd = await compiler.compile(SESSION_ID);

    expect(prd?.business_name).toBe("Café Andes");
    expect(prd?.mission).toBe("marketing");
  });

  it("recompiles and versions a business PRD", async () => {
    const writer = new MemoryWriter(new InMemoryFactStore());
    const store = new InMemoryLivingPrdStore();
    const compiler = new LivingPrdCompiler({ facts: writer, store });

    await seedFacts(writer);

    const first = await compiler.recompile(BUSINESS_ID);
    const second = await compiler.recompile(BUSINESS_ID);

    expect(first.business_name).toBe("Café Andes");
    expect(second.business_name).toBe("Café Andes");

    const latest = await store.getLatestByBusiness(BUSINESS_ID);
    expect(latest?.version).toBe(2);
    expect(latest?.compiledJson.icp).toBe("Emprendedores en Bogotá");
  });

  it("throws when recompiling a business with no facts", async () => {
    const compiler = new LivingPrdCompiler({
      facts: new MemoryWriter(new InMemoryFactStore()),
      store: new InMemoryLivingPrdStore(),
    });

    await expect(compiler.recompile(BUSINESS_ID)).rejects.toThrow(
      /no MemoryFacts/,
    );
  });
});
