import Link from "next/link";
import { cookies } from "next/headers";
import { MISSION_LABELS } from "@/lib/domain/mission";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  let missionLabel: string | null = null;
  let hasSession = Boolean(token);
  let sessionNote: string | null = null;

  if (token) {
    try {
      const orchestrator = createSessionOrchestrator();
      const session = await orchestrator.getSession(token);
      if (!session) {
        hasSession = false;
        sessionNote = "La sesión expiró o no es válida.";
      } else if (session.mission) {
        missionLabel = MISSION_LABELS[session.mission];
      }
    } catch {
      // Env/DB may be unset locally — still acknowledge the cookie.
      sessionNote = "Sesión detectada (detalle de misión no disponible sin DB).";
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-zinc-900">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
          Mente Maestra
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Chat coming soon
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-600">
          {missionLabel
            ? `Misión: ${missionLabel}. Maya estará lista en el próximo ticket.`
            : hasSession
              ? "Sesión activa. Maya estará lista en el próximo ticket."
              : "No hay sesión activa. Empieza eligiendo una misión."}
        </p>
        {sessionNote ? (
          <p className="mt-3 text-sm text-zinc-500">{sessionNote}</p>
        ) : null}
        {!hasSession ? (
          <Link
            href="/start"
            className="mt-8 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4"
          >
            Ir a /start
          </Link>
        ) : null}
      </div>
    </main>
  );
}
