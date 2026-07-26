import { describe, expect, it } from "vitest";
import type { MemoryFactCategory } from "@/lib/domain/memory-fact";
import { InMemoryFactStore, MemoryWriter } from "@/lib/modules/memory-writer";
import { OnboardingPolicy } from "./onboarding-policy";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

async function addCategory(
  writer: MemoryWriter,
  category: MemoryFactCategory,
  key: string,
) {
  await writer.upsertFact({
    sessionId: SESSION_ID,
    key,
    value: `value-${key}`,
    category,
    provenanceType: "message",
    provenanceId: key,
  });
}

describe("OnboardingPolicy", () => {
  it("lists all categories as missing when there are no facts", async () => {
    const policy = new OnboardingPolicy({
      facts: new MemoryWriter(new InMemoryFactStore()),
    });

    const missing = await policy.missingCategories(SESSION_ID);

    expect(missing).toEqual([
      "business",
      "customers",
      "goals",
      "pain",
      "brand",
      "visual",
    ]);
    await expect(policy.isReady(SESSION_ID)).resolves.toBe(false);
  });

  it("is ready when facts cover at least 4 categories", async () => {
    const writer = new MemoryWriter(new InMemoryFactStore());
    const policy = new OnboardingPolicy({ facts: writer });

    await addCategory(writer, "business", "business_name");
    await addCategory(writer, "customers", "icp");
    await addCategory(writer, "goals", "primary_goal");

    await expect(policy.isReady(SESSION_ID)).resolves.toBe(false);

    await addCategory(writer, "pain", "pain");

    await expect(policy.isReady(SESSION_ID)).resolves.toBe(true);
    await expect(policy.missingCategories(SESSION_ID)).resolves.toEqual([
      "brand",
      "visual",
    ]);
  });

  it("prioritizes the next high-signal missing category", async () => {
    const writer = new MemoryWriter(new InMemoryFactStore());
    const policy = new OnboardingPolicy({ facts: writer });

    await addCategory(writer, "business", "business_name");

    await expect(policy.nextPriorityCategory(SESSION_ID)).resolves.toBe(
      "customers",
    );
  });
});
