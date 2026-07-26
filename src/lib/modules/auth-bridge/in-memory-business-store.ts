import type { Business } from "@/lib/domain/business";
import type { BusinessStore, NewBusinessInput } from "./types";

/** In-memory BusinessStore for Vitest. */
export class InMemoryBusinessStore implements BusinessStore {
  private readonly byId = new Map<string, Business>();

  async findById(businessId: string): Promise<Business | null> {
    const business = this.byId.get(businessId);
    return business ? { ...business } : null;
  }

  async findByCreatedBy(userId: string): Promise<Business | null> {
    for (const business of this.byId.values()) {
      if (business.createdBy === userId) {
        return { ...business };
      }
    }
    return null;
  }

  async insert(business: NewBusinessInput): Promise<Business> {
    if (this.byId.has(business.id)) {
      throw new Error(`Business already exists: ${business.id}`);
    }
    const stored: Business = { ...business };
    this.byId.set(stored.id, stored);
    return { ...stored };
  }

  async updateName(
    businessId: string,
    name: string | null,
    updatedAt: Date,
  ): Promise<Business> {
    const existing = this.byId.get(businessId);
    if (!existing) {
      throw new Error(`Business not found: ${businessId}`);
    }
    const updated = { ...existing, name, updatedAt };
    this.byId.set(businessId, updated);
    return { ...updated };
  }
}
