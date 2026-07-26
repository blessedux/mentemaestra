import { z } from "zod";

/** Founder's immediate goal for the session (CONTEXT.md). */
export const MISSIONS = [
  "leads",
  "website",
  "marketing",
  "sales",
  "strategy",
] as const;

export const MissionSchema = z.enum(MISSIONS);
export type Mission = z.infer<typeof MissionSchema>;

export const MISSION_LABELS: Record<Mission, string> = {
  leads: "Leads",
  website: "Sitio web",
  marketing: "Marketing",
  sales: "Ventas",
  strategy: "Estrategia",
};

export function parseMission(value: unknown): Mission | null {
  const result = MissionSchema.safeParse(value);
  return result.success ? result.data : null;
}
