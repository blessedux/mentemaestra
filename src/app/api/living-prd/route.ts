import { cookies } from "next/headers";
import type { LivingPrdPreviewDTO } from "@/lib/domain/living-prd";
import { createLivingPrdCompiler } from "@/lib/modules/living-prd-compiler";
import { createOnboardingPolicy } from "@/lib/modules/onboarding-policy";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";

/** Compiles the session Living PRD and returns readiness for the chat UI. */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = createSessionOrchestrator();
    const session = await sessions.getSession(token);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const compiler = createLivingPrdCompiler();
    const policy = createOnboardingPolicy();

    const [prd, ready, missingCategories] = await Promise.all([
      compiler.compile(session.id),
      policy.isReady(session.id),
      policy.missingCategories(session.id),
    ]);

    const payload: LivingPrdPreviewDTO = {
      prd,
      ready,
      missingCategories,
    };

    return Response.json(payload);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to compile Living PRD";
    return Response.json({ error: message }, { status: 503 });
  }
}
