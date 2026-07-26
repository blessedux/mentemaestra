import { cookies } from "next/headers";
import { toMemoryFactDTO } from "@/lib/domain/memory-fact";
import { createMemoryWriter } from "@/lib/modules/memory-writer";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";

/** Lists MemoryFacts for the anonymous session cookie (read-only UI). */
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
