import { cookies } from "next/headers";
import { z } from "zod";
import {
  MemoryFactCategorySchema,
  toMemoryFactDTO,
} from "@/lib/domain/memory-fact";
import { createLivingPrdCompiler } from "@/lib/modules/living-prd-compiler";
import { applyFactUserEdit } from "@/lib/modules/memory-writer/apply-fact-user-edit";
import { createMemoryWriter } from "@/lib/modules/memory-writer";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";
import { requireBoundSession } from "@/lib/server/require-bound-session";

const PatchFactSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  category: MemoryFactCategorySchema,
});

/** Lists MemoryFacts for the anonymous session cookie. */
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

    const facts = await createMemoryWriter().getFactsBySession(session.id);
    return Response.json({ facts: facts.map(toMemoryFactDTO) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load memory facts";
    return Response.json({ error: message }, { status: 503 });
  }
}

/** Edit a MemoryFact (user_edit) when the session is auth-bound to a Business. */
export async function PATCH(req: Request) {
  const auth = await requireBoundSession();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchFactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid fact edit", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { fact } = await applyFactUserEdit({
      memoryWriter: createMemoryWriter(),
      compiler: createLivingPrdCompiler(),
      sessionId: auth.context.session.id,
      businessId: auth.context.session.businessId,
      key: parsed.data.key,
      value: parsed.data.value,
      category: parsed.data.category,
    });

    return Response.json({ fact: toMemoryFactDTO(fact) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update memory fact";
    return Response.json({ error: message }, { status: 503 });
  }
}
