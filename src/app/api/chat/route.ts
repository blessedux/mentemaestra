import { cookies } from "next/headers";
import type { UIMessage } from "ai";
import {
  createConversationRuntime,
  uiMessageText,
} from "@/lib/modules/conversation-runtime";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";

export const maxDuration = 30;

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  let session;
  try {
    const sessions = createSessionOrchestrator();
    session = await sessions.getSession(token);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Session lookup failed";
    return new Response(message, { status: 503 });
  }

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as { messages?: UIMessage[] };
  const messages = body.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userMessage = uiMessageText(lastUser).trim();

  if (!userMessage) {
    return new Response("Missing user message", { status: 400 });
  }

  try {
    const runtime = createConversationRuntime();
    const result = await runtime.streamTurn(session.id, userMessage, {
      messages,
      mission: session.mission,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Chat stream failed";
    return new Response(message, { status: 503 });
  }
}
