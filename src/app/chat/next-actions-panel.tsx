"use client";

import type { Closeout } from "@/lib/domain/closeout";

type NextActionsPanelProps = {
  closeout: Closeout | null;
  loading?: boolean;
};

/** Prominent checklist of Maya's personalized next actions after ready closeout. */
export function NextActionsPanel({
  closeout,
  loading = false,
}: NextActionsPanelProps) {
  if (loading || !closeout) {
    return (
      <section
        className="mb-4 rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm"
        aria-busy="true"
        aria-label="Generando próximos pasos"
      >
        <p className="text-xs font-medium tracking-[0.18em] text-zinc-400 uppercase">
          Próximos pasos
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Maya está preparando tus siguientes pasos…
        </p>
      </section>
    );
  }

  return (
    <section
      className="mb-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-zinc-50 px-4 py-4 shadow-sm ring-1 ring-amber-100/60"
      aria-label="Próximos pasos de Maya"
    >
      <p className="text-xs font-medium tracking-[0.18em] text-amber-800/70 uppercase">
        Próximos pasos
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-800">
        {closeout.summary}
      </p>

      <ol className="mt-4 space-y-3">
        {closeout.actions.map((action, index) => (
          <li
            key={`${index}-${action.title}`}
            className="flex gap-3 rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-2.5"
          >
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-xs font-semibold text-white"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900">{action.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-600">
                {action.reason}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-sm leading-relaxed text-zinc-700 italic">
        {closeout.invitation}
      </p>
    </section>
  );
}
