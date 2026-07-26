import { z } from "zod";

export const ConversationRoleSchema = z.enum(["user", "assistant"]);
export type ConversationRole = z.infer<typeof ConversationRoleSchema>;

export const ConversationTurnSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  role: ConversationRoleSchema,
  content: z.string(),
  toolCalls: z.unknown().nullable(),
  createdAt: z.date(),
});

export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;
