import { createMemoryWriter } from "@/lib/modules/memory-writer";
import { OnboardingPolicy } from "./onboarding-policy";

/** Production OnboardingPolicy reading facts via MemoryWriter. */
export function createOnboardingPolicy(): OnboardingPolicy {
  return new OnboardingPolicy({ facts: createMemoryWriter() });
}
