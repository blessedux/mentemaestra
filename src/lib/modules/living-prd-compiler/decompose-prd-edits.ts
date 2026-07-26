import type { LivingPrd } from "@/lib/domain/living-prd";
import type { MemoryFactCategory } from "@/lib/domain/memory-fact";

export type DecomposedFactEdit = {
  key: string;
  value: string;
  category: MemoryFactCategory;
};

/**
 * Inverse of compile-from-facts: maps Living PRD field edits into MemoryFact upserts.
 */
export function decomposeLivingPrdToFacts(
  prd: LivingPrd,
): DecomposedFactEdit[] {
  const facts: DecomposedFactEdit[] = [];

  const businessName = prd.business_name?.trim();
  if (businessName) {
    facts.push({
      key: "business_name",
      value: businessName,
      category: "business",
    });
  }

  if (prd.mission) {
    facts.push({
      key: "mission",
      value: prd.mission,
      category: "goals",
    });
  }

  const icp = prd.icp?.trim();
  if (icp) {
    facts.push({
      key: "icp",
      value: icp,
      category: "customers",
    });
  }

  const goals = prd.goals.map((goal) => goal.trim()).filter(Boolean);
  if (goals.length > 0) {
    facts.push({
      key: "goals",
      value: goals.join("\n"),
      category: "goals",
    });
  }

  const pains = prd.pain_points.map((pain) => pain.trim()).filter(Boolean);
  if (pains.length > 0) {
    facts.push({
      key: "pain_points",
      value: pains.join("\n"),
      category: "pain",
    });
  }

  const brand = prd.brand_notes?.trim();
  if (brand) {
    facts.push({
      key: "brand_notes",
      value: brand,
      category: "brand",
    });
  }

  const visual = prd.visual_preferences?.trim();
  if (visual) {
    facts.push({
      key: "visual_preferences",
      value: visual,
      category: "visual",
    });
  }

  return facts;
}

/** Split stored list values written by decomposeLivingPrdToFacts. */
export function splitFactListValue(value: string): string[] {
  return value
    .split(/\n|·/)
    .map((part) => part.trim())
    .filter(Boolean);
}
