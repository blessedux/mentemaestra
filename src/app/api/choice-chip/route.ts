import { cookies } from "next/headers";
import { ChoiceChipRequestSchema } from "@/lib/domain/choice-chip";
import { toMemoryFactDTO } from "@/lib/domain/memory-fact";
import { applyChoiceChip } from "@/lib/modules/conversation-runtime";
import { createMemoryWriter } from "@/lib/modules/memory-writer";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";

/**
 * Records a chip selection as a MemoryFact (provenance_type=chip).
 * Client then sendMessage()'s the label to continue the conversation.
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ChoiceChipRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid choice chip payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const sessions = createSessionOrchestrator();
    const session = await sessions.getSession(token);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fact = await applyChoiceChip({
      memoryWriter: createMemoryWriter(),
      sessionId: session.id,
      businessId: session.businessId,
      request: parsed.data,
    });

    return Response.json({ fact: toMemoryFactDTO(fact) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to apply choice chip";
    return Response.json({ error: message }, { status: 503 });
  }
}
