import type { LivingPrd, LivingPrdRecord } from "@/lib/domain/living-prd";
import type { Mission } from "@/lib/domain/mission";
import type { MemoryWriter } from "@/lib/modules/memory-writer";

export type NewLivingPrdRecordInput = {
  id: string;
  businessId: string | null;
  compiledJson: LivingPrd;
  version: number;
  createdAt: Date;
};

export interface LivingPrdStore {
  insert(record: NewLivingPrdRecordInput): Promise<LivingPrdRecord>;
  getLatestByBusiness(businessId: string): Promise<LivingPrdRecord | null>;
}

export type FactsReader = Pick<
  MemoryWriter,
  "getFactsBySession" | "getFactsByBusiness"
>;

export type SessionMissionReader = {
  getMission(sessionId: string): Promise<Mission | null>;
};

export type LivingPrdCompilerDeps = {
  facts: FactsReader;
  store: LivingPrdStore;
  getSessionMission?: SessionMissionReader["getMission"];
  now?: () => Date;
};
