import { z } from "zod";
import { MissionSchema } from "./mission";

export const SessionSchema = z.object({
  id: z.string().uuid(),
  cookieToken: z.string().min(1),
  mission: MissionSchema.nullable(),
  businessId: z.string().uuid().nullable(),
  createdAt: z.date(),
  expiresAt: z.date(),
});

export type Session = z.infer<typeof SessionSchema>;

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = "mm_session";
export const SESSION_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
