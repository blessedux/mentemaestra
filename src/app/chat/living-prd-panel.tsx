"use client";

import { useEffect, useState } from "react";
import {
  MEMORY_FACT_CATEGORY_LABELS,
  type MemoryFactCategory,
} from "@/lib/domain/memory-fact";
import type { LivingPrd } from "@/lib/domain/living-prd";
import { MISSIONS, MISSION_LABELS, type Mission } from "@/lib/domain/mission";

type LivingPrdPanelProps = {
  prd: LivingPrd | null;
  ready: boolean;
  missingCategories: string[];
  onSaveContinue: () => void;
  notice: string | null;
  editable?: boolean;
  onPrdSaved?: (prd: LivingPrd) => void;
};

export function LivingPrdPanel({
  prd,
  ready,
  missingCategories,
  onSaveContinue,
  notice,
  editable = false,
  onPrdSaved,
}: LivingPrdPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LivingPrd | null>(prd);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(prd);
    }
  }, [prd, editing]);

  async function savePrd() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/living-prd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prd: draft }),
      });
      const data = (await response.json()) as {
        prd?: LivingPrd;
        error?: string;
      };
      if (!response.ok || !data.prd) {
        throw new Error(data.error ?? "No se pudo guardar el PRD");
      }
      onPrdSaved?.(data.prd);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border-b border-zinc-100 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-zinc-400 uppercase">
            Living PRD
          </p>
          {editable ? (
            <p className="mt-0.5 text-xs text-zinc-500">Editable</p>
          ) : null}
        </div>
        {editable && ready && prd && !editing ? (
          <button
            type="button"
            onClick={() => {
              setDraft(prd);
              setEditing(true);
              setError(null);
            }}
            className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
          >
            Editar
          </button>
        ) : null}
      </div>

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
      ) : editing && draft ? (
        <div className="mt-2 space-y-2">
          <EditableField
            label="Negocio"
            value={draft.business_name ?? ""}
            onChange={(value) =>
              setDraft({ ...draft, business_name: value || null })
            }
            disabled={saving}
          />
          <label className="block">
            <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
              Misión
            </span>
            <select
              value={draft.mission ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  mission: (event.target.value || null) as Mission | null,
                })
              }
              disabled={saving}
              className="mt-0.5 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-900"
            >
              <option value="">—</option>
              {MISSIONS.map((mission) => (
                <option key={mission} value={mission}>
                  {MISSION_LABELS[mission]}
                </option>
              ))}
            </select>
          </label>
          <EditableField
            label="ICP"
            value={draft.icp ?? ""}
            onChange={(value) => setDraft({ ...draft, icp: value || null })}
            disabled={saving}
          />
          <EditableField
            label="Metas"
            value={draft.goals.join("\n")}
            onChange={(value) =>
              setDraft({
                ...draft,
                goals: value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
            disabled={saving}
            multiline
          />
          <EditableField
            label="Dolores"
            value={draft.pain_points.join("\n")}
            onChange={(value) =>
              setDraft({
                ...draft,
                pain_points: value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
            disabled={saving}
            multiline
          />
          <EditableField
            label="Marca"
            value={draft.brand_notes ?? ""}
            onChange={(value) =>
              setDraft({ ...draft, brand_notes: value || null })
            }
            disabled={saving}
          />
          <EditableField
            label="Visual"
            value={draft.visual_preferences ?? ""}
            onChange={(value) =>
              setDraft({ ...draft, visual_preferences: value || null })
            }
            disabled={saving}
          />

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => void savePrd()}
              disabled={saving}
              className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(prd);
                setError(null);
              }}
              disabled={saving}
              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700"
            >
              Cancelar
            </button>
          </div>
          {error ? (
            <p className="text-xs text-red-700" role="alert">
              {error}
            </p>
          ) : null}
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

          {!editable ? (
            <button
              type="button"
              onClick={onSaveContinue}
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Guardar y continuar
            </button>
          ) : null}

          {notice ? (
            <p
              className="rounded-md bg-zinc-100 px-3 py-2 text-xs leading-relaxed text-zinc-700"
              role="status"
            >
              {notice}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function EditableField({
  label,
  value,
  onChange,
  disabled,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  multiline?: boolean;
}) {
  const className =
    "mt-0.5 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-900";

  return (
    <label className="block">
      <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          disabled={disabled}
          className={className}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={className}
        />
      )}
    </label>
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
