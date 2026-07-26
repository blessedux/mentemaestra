import { cookies } from "next/headers";
import {
  LivingPrdSchema,
  type LivingPrdPreviewDTO,
} from "@/lib/domain/living-prd";
import {
  applyPrdUserEdits,
  createLivingPrdCompiler,
} from "@/lib/modules/living-prd-compiler";
import { createMemoryWriter } from "@/lib/modules/memory-writer";
import { createOnboardingPolicy } from "@/lib/modules/onboarding-policy";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";
import { requireBoundSession } from "@/lib/server/require-bound-session";
import { toMemoryFactDTO } from "@/lib/domain/memory-fact";

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

/** Save Living PRD edits → MemoryFacts (user_edit) → recompile. */
export async function PATCH(req: Request) {
  const auth = await requireBoundSession();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LivingPrdSchema.safeParse(
    typeof body === "object" && body !== null && "prd" in body
      ? (body as { prd: unknown }).prd
      : body,
  );

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid Living PRD", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const memoryWriter = createMemoryWriter();
    const compiler = createLivingPrdCompiler();
    const policy = createOnboardingPolicy();

    const { facts, prd } = await applyPrdUserEdits({
      memoryWriter,
      compiler,
      sessionId: auth.context.session.id,
      businessId: auth.context.session.businessId,
      prd: parsed.data,
    });

    const [ready, missingCategories] = await Promise.all([
      policy.isReady(auth.context.session.id),
      policy.missingCategories(auth.context.session.id),
    ]);

    const payload: LivingPrdPreviewDTO & {
      facts: ReturnType<typeof toMemoryFactDTO>[];
    } = {
      prd,
      ready,
      missingCategories,
      facts: facts.map(toMemoryFactDTO),
    };

    return Response.json(payload);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save Living PRD";
    return Response.json({ error: message }, { status: 503 });
  }
}
