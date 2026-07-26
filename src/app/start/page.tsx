import { redirect } from "next/navigation";
import {
  MISSION_LABELS,
  MISSIONS,
  parseMission,
} from "@/lib/domain/mission";
import { startSessionFromForm } from "./actions";

type StartPageProps = {
  searchParams: Promise<{ mission?: string; error?: string }>;
};

export default async function StartPage({ searchParams }: StartPageProps) {
  const params = await searchParams;
  const mission = parseMission(params.mission);

  if (mission) {
    redirect(`/start/begin?mission=${mission}`);
  }

  const error = params.error ? params.error : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-zinc-900">
      <div className="w-full max-w-lg text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
          Mente Maestra
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          ¿Cuál es tu misión?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Elige el objetivo de esta sesión. Maya enfocará la conversación ahí.
        </p>

        {error ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <ul className="mt-10 flex flex-wrap justify-center gap-3">
          {MISSIONS.map((value) => (
            <li key={value}>
              <form action={startSessionFromForm}>
                <input type="hidden" name="mission" value={value} />
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                >
                  {MISSION_LABELS[value]}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
