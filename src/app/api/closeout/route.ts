import {
  createConversationRuntime,
} from "@/lib/modules/conversation-runtime";
import {
  createLivingPrdCompiler,
  createLivingPrdStore,
} from "@/lib/modules/living-prd-compiler";
import { createOnboardingPolicy } from "@/lib/modules/onboarding-policy";
import { requireBoundSession } from "@/lib/server/require-bound-session";

/**
 * GET /api/closeout — one-shot Maya closeout when ready + authenticated + PRD saved.
 * Idempotent: returns cached next_actions when already generated.
 */
export async function GET() {
  const auth = await requireBoundSession();
  if (!auth.ok) return auth.response;

  const { session } = auth.context;

  try {
    const policy = createOnboardingPolicy();
    const ready = await policy.isReady(session.id);
    if (!ready) {
      return Response.json(
        { error: "Onboarding is not ready yet" },
        { status: 409 },
      );
    }

    const compiler = createLivingPrdCompiler();
    const livingPrdStore = createLivingPrdStore();

    const [prd, latest] = await Promise.all([
      compiler.compile(session.id),
      livingPrdStore.getLatestByBusiness(session.businessId),
    ]);

    if (!prd || !latest) {
      return Response.json(
        { error: "Living PRD must be saved before closeout" },
        { status: 409 },
      );
    }

    const runtime = createConversationRuntime();
    const { closeout, generated } = await runtime.generateCloseout(
      session.id,
      {
        mission: session.mission,
        businessId: session.businessId,
        prd,
        livingPrdStore,
      },
    );

    return Response.json({ closeout, generated });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate closeout";
    return Response.json({ error: message }, { status: 503 });
  }
}
