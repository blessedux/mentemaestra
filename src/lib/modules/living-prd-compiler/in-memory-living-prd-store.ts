import type { Closeout } from "@/lib/domain/closeout";
import type { LivingPrdRecord } from "@/lib/domain/living-prd";
import type { LivingPrdStore, NewLivingPrdRecordInput } from "./types";

/** In-memory LivingPrdStore for Vitest. */
export class InMemoryLivingPrdStore implements LivingPrdStore {
  private readonly byBusiness = new Map<string, LivingPrdRecord[]>();

  async insert(record: NewLivingPrdRecordInput): Promise<LivingPrdRecord> {
    const stored: LivingPrdRecord = {
      ...record,
      nextActions: record.nextActions ?? null,
    };
    if (stored.businessId) {
      const list = this.byBusiness.get(stored.businessId) ?? [];
      list.push(stored);
      this.byBusiness.set(stored.businessId, list);
    }
    return { ...stored };
  }

  async getLatestByBusiness(
    businessId: string,
  ): Promise<LivingPrdRecord | null> {
    const list = this.byBusiness.get(businessId) ?? [];
    if (list.length === 0) return null;
    const latest = [...list].sort((a, b) => b.version - a.version)[0];
    return latest ? { ...latest } : null;
  }

  async updateNextActions(
    businessId: string,
    nextActions: Closeout,
  ): Promise<LivingPrdRecord> {
    const latest = await this.getLatestByBusiness(businessId);
    if (!latest) {
      throw new Error(`No Living PRD for business ${businessId}`);
    }

    const updated = { ...latest, nextActions };
    const list = this.byBusiness.get(businessId) ?? [];
    const index = list.findIndex((record) => record.id === latest.id);
    if (index >= 0) {
      list[index] = updated;
      this.byBusiness.set(businessId, list);
    }
    return { ...updated };
  }
}
