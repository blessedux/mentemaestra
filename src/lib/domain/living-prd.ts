import { z } from "zod";
import { CloseoutSchema } from "./closeout";
import { MissionSchema } from "./mission";

/** Compiled Living PRD document (CONTEXT.md). */
export const LivingPrdSchema = z.object({
  business_name: z.string().nullable(),
  mission: MissionSchema.nullable(),
  icp: z.string().nullable(),
  goals: z.array(z.string()),
  pain_points: z.array(z.string()),
  brand_notes: z.string().nullable(),
  visual_preferences: z.string().nullable(),
});

export type LivingPrd = z.infer<typeof LivingPrdSchema>;

/** Persisted compile artifact row. */
export const LivingPrdRecordSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid().nullable(),
  compiledJson: LivingPrdSchema,
  version: z.number().int().positive(),
  createdAt: z.date(),
  nextActions: CloseoutSchema.nullable(),
});

export type LivingPrdRecord = z.infer<typeof LivingPrdRecordSchema>;

/** Serializable PRD + readiness for the chat UI. */
export type LivingPrdPreviewDTO = {
  prd: LivingPrd | null;
  ready: boolean;
  missingCategories: string[];
};
