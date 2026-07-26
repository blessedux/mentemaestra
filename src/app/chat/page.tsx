import Link from "next/link";
import { cookies } from "next/headers";
import { MISSION_LABELS } from "@/lib/domain/mission";
import { toMemoryFactDTO } from "@/lib/domain/memory-fact";
import {
  createConversationTurnStore,
  turnsToUIMessages,
} from "@/lib/modules/conversation-runtime";
import { createMemoryWriter } from "@/lib/modules/memory-writer";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";
import { ChatClient } from "./chat-client";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return <NoSessionState />;
  }

  try {
    const sessions = createSessionOrchestrator();
    const session = await sessions.getSession(token);

    if (!session) {
      return <NoSessionState detail="Tu sesión expiró o no es válida." />;
    }

    const [turns, facts] = await Promise.all([
      createConversationTurnStore().listBySession(session.id),
      createMemoryWriter().getFactsBySession(session.id),
    ]);
    const initialMessages = turnsToUIMessages(turns);
    const missionLabel = session.mission
      ? MISSION_LABELS[session.mission]
      : null;

    return (
      <ChatClient
        initialMessages={initialMessages}
        initialFacts={facts.map(toMemoryFactDTO)}
        missionLabel={missionLabel}
      />
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo cargar el chat";
    return <NoSessionState detail={message} />;
  }
}

function NoSessionState({ detail }: { detail?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-zinc-900">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
          Mente Maestra
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Necesitas una sesión
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-600">
          {detail ??
            "Elige una misión para empezar a hablar con Maya."}
        </p>
        <Link
          href="/start"
          className="mt-8 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4"
        >
          Ir a /start
        </Link>
      </div>
    </main>
  );
}
