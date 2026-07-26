import { z } from "zod";

export const BusinessSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Business = z.infer<typeof BusinessSchema>;
