import { describe, expect, it } from "vitest";
import type { LivingPrd } from "@/lib/domain/living-prd";
import { InMemoryFactStore, MemoryWriter } from "@/lib/modules/memory-writer";
import { applyFactUserEdit } from "@/lib/modules/memory-writer/apply-fact-user-edit";
import { applyPrdUserEdits } from "./apply-prd-user-edits";
import { compileFromFacts } from "./compile-from-facts";
import { decomposeLivingPrdToFacts } from "./decompose-prd-edits";
import { InMemoryLivingPrdStore } from "./in-memory-living-prd-store";
import { LivingPrdCompiler } from "./living-prd-compiler";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const BUSINESS_ID = "22222222-2222-4222-8222-222222222222";

function createHarness() {
  const memoryWriter = new MemoryWriter(new InMemoryFactStore());
  const store = new InMemoryLivingPrdStore();
  const compiler = new LivingPrdCompiler({ facts: memoryWriter, store });
  return { memoryWriter, compiler, store };
}

describe("decomposeLivingPrdToFacts", () => {
  it("maps PRD fields to MemoryFact upserts", () => {
    const prd: LivingPrd = {
      business_name: "Café Andes",
      mission: "leads",
      icp: "PYMEs en Bogotá",
      goals: ["Más leads", "Mejor web"],
      pain_points: ["Poco tiempo"],
      brand_notes: "Cálida",
      visual_preferences: "Tipografía serif",
    };

    const facts = decomposeLivingPrdToFacts(prd);

    expect(facts).toEqual(
      expect.arrayContaining([
        {
          key: "business_name",
          value: "Café Andes",
          category: "business",
        },
        { key: "mission", value: "leads", category: "goals" },
        { key: "icp", value: "PYMEs en Bogotá", category: "customers" },
        {
          key: "goals",
          value: "Más leads\nMejor web",
          category: "goals",
        },
        {
          key: "pain_points",
          value: "Poco tiempo",
          category: "pain",
        },
      ]),
    );
  });

  it("round-trips through compileFromFacts", () => {
    const prd: LivingPrd = {
      business_name: "Studio Norte",
      mission: "marketing",
      icp: "Fundadores",
      goals: ["Awareness", "Leads"],
      pain_points: ["Presupuesto", "Tiempo"],
      brand_notes: "Directa",
      visual_preferences: "Oscuro",
    };

    const decomposed = decomposeLivingPrdToFacts(prd);
    const asFacts = decomposed.map((edit, index) => ({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      businessId: BUSINESS_ID,
      sessionId: SESSION_ID,
      key: edit.key,
      value: edit.value,
      category: edit.category,
      provenanceType: "user_edit" as const,
      provenanceId: "edit-1",
      confidence: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const compiled = compileFromFacts(asFacts);
    expect(compiled?.business_name).toBe("Studio Norte");
    expect(compiled?.mission).toBe("marketing");
    expect(compiled?.goals).toEqual(["Awareness", "Leads"]);
    expect(compiled?.pain_points).toEqual(["Presupuesto", "Tiempo"]);
  });
});

describe("applyFactUserEdit / applyPrdUserEdits", () => {
  it("writes user_edit provenance for a fact and recompiles", async () => {
    const { memoryWriter, compiler, store } = createHarness();

    await memoryWriter.upsertFact({
      sessionId: SESSION_ID,
      businessId: BUSINESS_ID,
      key: "business_name",
      value: "Old Name",
      category: "business",
      provenanceType: "message",
      provenanceId: "t1",
    });

    const { fact } = await applyFactUserEdit({
      memoryWriter,
      compiler,
      sessionId: SESSION_ID,
      businessId: BUSINESS_ID,
      key: "business_name",
      value: "New Name",
      category: "business",
      provenanceId: "fact_edit_test",
    });

    expect(fact.value).toBe("New Name");
    expect(fact.provenanceType).toBe("user_edit");
    expect(fact.provenanceId).toBe("fact_edit_test");

    const prd = await store.getLatestByBusiness(BUSINESS_ID);
    expect(prd?.compiledJson.business_name).toBe("New Name");
  });

  it("decomposes PRD edits into facts with shared user_edit provenance", async () => {
    const { memoryWriter, compiler, store } = createHarness();

    const { facts, prd } = await applyPrdUserEdits({
      memoryWriter,
      compiler,
      sessionId: SESSION_ID,
      businessId: BUSINESS_ID,
      provenanceId: "prd_edit_test",
      prd: {
        business_name: "Mente Lab",
        mission: "strategy",
        icp: "Consultores",
        goals: ["Claridad"],
        pain_points: ["Caos operativo"],
        brand_notes: null,
        visual_preferences: null,
      },
    });

    expect(facts.length).toBeGreaterThan(0);
    expect(facts.every((fact) => fact.provenanceType === "user_edit")).toBe(
      true,
    );
    expect(facts.every((fact) => fact.provenanceId === "prd_edit_test")).toBe(
      true,
    );
    expect(prd.business_name).toBe("Mente Lab");
    expect(prd.mission).toBe("strategy");

    const latest = await store.getLatestByBusiness(BUSINESS_ID);
    expect(latest?.version).toBe(1);
    expect(latest?.compiledJson.icp).toBe("Consultores");
  });
});
