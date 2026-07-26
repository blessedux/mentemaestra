import { z } from "zod";

export const CloseoutActionSchema = z.object({
  title: z.string().min(1),
  reason: z.string().min(1),
});

export type CloseoutAction = z.infer<typeof CloseoutActionSchema>;

/** Maya's ready-state closeout: summary + highest-leverage next actions. */
export const CloseoutSchema = z.object({
  summary: z.string().min(1),
  actions: z.array(CloseoutActionSchema).min(3).max(5),
  invitation: z.string().min(1),
});

export type Closeout = z.infer<typeof CloseoutSchema>;

export const CLOSEOUT_TOOL_KIND = "closeout" as const;

export const CloseoutTurnPayloadSchema = z.object({
  kind: z.literal(CLOSEOUT_TOOL_KIND),
  closeout: CloseoutSchema,
});

export type CloseoutTurnPayload = z.infer<typeof CloseoutTurnPayloadSchema>;

export function parseCloseoutTurnPayload(
  value: unknown,
): CloseoutTurnPayload | null {
  const parsed = CloseoutTurnPayloadSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
