import { z } from "zod";
import { MemoryFactCategorySchema } from "./memory-fact";

export const ChoiceOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export type ChoiceOption = z.infer<typeof ChoiceOptionSchema>;

export const OfferChoicesInputSchema = z.object({
  questionKey: z
    .string()
    .min(1)
    .describe(
      "Stable question id, e.g. mission, industry, team_size, primary_goal_priority",
    ),
  options: z
    .array(ChoiceOptionSchema)
    .min(2)
    .max(6)
    .describe("Chip options shown to the founder"),
  factKey: z
    .string()
    .min(1)
    .describe("MemoryFact key to write when a chip is chosen"),
  category: MemoryFactCategorySchema.describe(
    "MemoryFact category for the chosen value",
  ),
});

export type OfferChoicesInput = z.infer<typeof OfferChoicesInputSchema>;

export const OfferChoicesResultSchema = OfferChoicesInputSchema.extend({
  offered: z.literal(true),
});

export type OfferChoicesResult = z.infer<typeof OfferChoicesResultSchema>;

export const ChoiceChipRequestSchema = z.object({
  interactionId: z.string().min(1),
  factKey: z.string().min(1),
  category: MemoryFactCategorySchema,
  value: z.string().min(1),
  optionId: z.string().min(1),
});

export type ChoiceChipRequest = z.infer<typeof ChoiceChipRequestSchema>;
