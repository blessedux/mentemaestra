import { randomUUID } from "node:crypto";
import type { LivingPrd } from "@/lib/domain/living-prd";
import { compileFromFacts } from "./compile-from-facts";
import type { LivingPrdCompilerDeps, LivingPrdStore } from "./types";
import type { FactsReader } from "./types";

/**
 * Reads MemoryFacts, validates/compiles a Living PRD, and persists business versions.
 */
export class LivingPrdCompiler {
  private readonly facts: FactsReader;
  private readonly store: LivingPrdStore;
  private readonly getSessionMission:
    | LivingPrdCompilerDeps["getSessionMission"]
    | undefined;
  private readonly now: () => Date;

  constructor(deps: LivingPrdCompilerDeps) {
    this.facts = deps.facts;
    this.store = deps.store;
    this.getSessionMission = deps.getSessionMission;
    this.now = deps.now ?? (() => new Date());
  }

  /** Compile a session-scoped PRD (ephemeral — not persisted until business save). */
  async compile(sessionId: string): Promise<LivingPrd | null> {
    const [facts, mission] = await Promise.all([
      this.facts.getFactsBySession(sessionId),
      this.getSessionMission?.(sessionId) ?? Promise.resolve(null),
    ]);

    return compileFromFacts(facts, mission);
  }

  /** Recompile from business facts and persist a new versioned row. */
  async recompile(businessId: string): Promise<LivingPrd> {
    const facts = await this.facts.getFactsByBusiness(businessId);
    const prd = compileFromFacts(facts);

    if (!prd) {
      throw new Error(
        `Cannot recompile Living PRD: no MemoryFacts for business ${businessId}`,
      );
    }

    const latest = await this.store.getLatestByBusiness(businessId);
    const version = (latest?.version ?? 0) + 1;

    await this.store.insert({
      id: randomUUID(),
      businessId,
      compiledJson: prd,
      version,
      createdAt: this.now(),
      // Keep an existing closeout across recompiles until regenerated.
      nextActions: latest?.nextActions ?? null,
    });

    return prd;
  }
}
