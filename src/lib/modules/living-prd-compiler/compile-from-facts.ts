import {
  LivingPrdSchema,
  type LivingPrd,
} from "@/lib/domain/living-prd";
import type { MemoryFact } from "@/lib/domain/memory-fact";
import type { MemoryFactCategory } from "@/lib/domain/memory-fact";
import { parseMission, type Mission } from "@/lib/domain/mission";

function groupByCategory(
  facts: MemoryFact[],
): Record<MemoryFactCategory, MemoryFact[]> {
  const groups = {
    business: [],
    customers: [],
    brand: [],
    goals: [],
    pain: [],
    visual: [],
  } as Record<MemoryFactCategory, MemoryFact[]>;

  for (const fact of facts) {
    groups[fact.category].push(fact);
  }
  return groups;
}

function byKey(facts: MemoryFact[]): Map<string, MemoryFact> {
  const map = new Map<string, MemoryFact>();
  for (const fact of facts) {
    map.set(fact.key, fact);
  }
  return map;
}

function firstValue(facts: MemoryFact[]): string | null {
  return facts[0]?.value ?? null;
}

function collectValues(
  facts: MemoryFact[],
  preferredKeys: string[],
): string[] {
  const preferred = preferredKeys
    .map((key) => facts.find((fact) => fact.key === key)?.value)
    .filter((value): value is string => Boolean(value));

  if (preferred.length > 0) {
    return [...new Set(preferred)];
  }

  return [...new Set(facts.map((fact) => fact.value).filter(Boolean))];
}

/**
 * Maps MemoryFacts into a Living PRD document.
 * Returns null when there is nothing to compile.
 */
export function compileFromFacts(
  facts: MemoryFact[],
  missionHint: Mission | null = null,
): LivingPrd | null {
  if (facts.length === 0) return null;

  const keys = byKey(facts);
  const categories = groupByCategory(facts);

  const missionFromFact = parseMission(keys.get("mission")?.value);

  return LivingPrdSchema.parse({
    business_name:
      keys.get("business_name")?.value ??
      keys.get("name")?.value ??
      firstValue(categories.business),
    mission: missionFromFact ?? missionHint,
    icp:
      keys.get("icp")?.value ??
      keys.get("ideal_customer")?.value ??
      firstValue(categories.customers),
    goals: collectValues(categories.goals, [
      "primary_goal",
      "goal",
      "goals",
    ]),
    pain_points: collectValues(categories.pain, [
      "pain_points",
      "pain_point",
      "pain",
    ]),
    brand_notes:
      keys.get("brand_notes")?.value ??
      keys.get("brand_tone")?.value ??
      firstValue(categories.brand),
    visual_preferences:
      keys.get("visual_preferences")?.value ??
      keys.get("visual")?.value ??
      firstValue(categories.visual),
  });
}
