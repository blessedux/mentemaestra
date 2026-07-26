"use client";

import {
  MEMORY_FACT_CATEGORY_LABELS,
  type MemoryFactCategory,
} from "@/lib/domain/memory-fact";
import type { LivingPrd } from "@/lib/domain/living-prd";
import { MISSION_LABELS } from "@/lib/domain/mission";
import { SAVE_CONTINUE_HASH } from "./save-continue-stub";

type LivingPrdPanelProps = {
  prd: LivingPrd | null;
  ready: boolean;
  missingCategories: string[];
  onSaveContinue: () => void;
  toast: string | null;
};

export function LivingPrdPanel({
  prd,
  ready,
  missingCategories,
  onSaveContinue,
  toast,
}: LivingPrdPanelProps) {
  return (
    <section className="border-b border-zinc-100 px-4 py-3">
      <p className="text-xs font-medium tracking-[0.18em] text-zinc-400 uppercase">
        Living PRD
      </p>

      {!ready || !prd ? (
        <div className="mt-2">
          <p className="text-sm text-zinc-700">
            Aún estamos armando tu PRD
          </p>
          {missingCategories.length > 0 ? (
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Falta:{" "}
              {missingCategories
                .map((category) =>
                  category in MEMORY_FACT_CATEGORY_LABELS
                    ? MEMORY_FACT_CATEGORY_LABELS[
                        category as MemoryFactCategory
                      ]
                    : category,
                )
                .join(", ")}
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-500">
              Sigue conversando con Maya para completar el contexto.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <PrdField label="Negocio" value={prd.business_name} />
          <PrdField
            label="Misión"
            value={prd.mission ? MISSION_LABELS[prd.mission] : null}
          />
          <PrdField label="ICP" value={prd.icp} />
          <PrdField
            label="Metas"
            value={prd.goals.length > 0 ? prd.goals.join(" · ") : null}
          />
          <PrdField
            label="Dolores"
            value={
              prd.pain_points.length > 0 ? prd.pain_points.join(" · ") : null
            }
          />
          <PrdField label="Marca" value={prd.brand_notes} />
          <PrdField label="Visual" value={prd.visual_preferences} />

          <a
            href={SAVE_CONTINUE_HASH}
            onClick={(event) => {
              event.preventDefault();
              onSaveContinue();
            }}
            className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Guardar y continuar
          </a>

          {toast ? (
            <p
              className="rounded-md bg-zinc-100 px-3 py-2 text-xs leading-relaxed text-zinc-700"
              role="status"
            >
              {toast}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function PrdField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm leading-relaxed text-zinc-700">{value}</p>
    </div>
  );
}
