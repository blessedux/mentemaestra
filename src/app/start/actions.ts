"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { parseMission, type Mission } from "@/lib/domain/mission";
import {
  createSessionOrchestrator,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";

export async function startSession(mission?: Mission): Promise<void> {
  const orchestrator = createSessionOrchestrator();
  const session = await orchestrator.createSession(mission);

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    session.cookieToken,
    getSessionCookieOptions(),
  );

  redirect("/chat");
}

/** Form action: reads `mission` from FormData. */
export async function startSessionFromForm(
  formData: FormData,
): Promise<void> {
  const mission = parseMission(formData.get("mission"));
  await startSession(mission ?? undefined);
}
