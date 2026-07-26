import {
  MEMORY_FACT_CATEGORIES,
  type MemoryFactCategory,
} from "@/lib/domain/memory-fact";
import type { MemoryWriter } from "@/lib/modules/memory-writer";

/** High-signal order — keep the path under ~5 minutes conceptually. */
export const HIGH_SIGNAL_CATEGORY_ORDER: MemoryFactCategory[] = [
  "business",
  "customers",
  "goals",
  "pain",
  "brand",
  "visual",
];

const DEFAULT_MIN_CATEGORIES = 4;

export type OnboardingPolicyDeps = {
  facts: Pick<MemoryWriter, "getFactsBySession">;
  /** Ready when facts cover at least this many of the 6 categories. */
  minCategories?: number;
};

/**
 * Decides when the Living PRD is ready and which categories are still missing.
 */
export class OnboardingPolicy {
  private readonly facts: Pick<MemoryWriter, "getFactsBySession">;
  private readonly minCategories: number;

  constructor(deps: OnboardingPolicyDeps) {
    this.facts = deps.facts;
    this.minCategories = deps.minCategories ?? DEFAULT_MIN_CATEGORIES;
  }

  async missingCategories(sessionId: string): Promise<MemoryFactCategory[]> {
    const facts = await this.facts.getFactsBySession(sessionId);
    const present = new Set(facts.map((fact) => fact.category));

    return HIGH_SIGNAL_CATEGORY_ORDER.filter(
      (category) => !present.has(category),
    );
  }

  async isReady(sessionId: string): Promise<boolean> {
    const missing = await this.missingCategories(sessionId);
    const covered = MEMORY_FACT_CATEGORIES.length - missing.length;
    return covered >= this.minCategories;
  }

  /** Soft guidance: ask about the next high-signal gap first. */
  async nextPriorityCategory(
    sessionId: string,
  ): Promise<MemoryFactCategory | null> {
    const missing = await this.missingCategories(sessionId);
    return missing[0] ?? null;
  }
}
