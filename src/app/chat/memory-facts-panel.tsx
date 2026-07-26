"use client";

import { useState } from "react";
import {
  MEMORY_FACT_CATEGORY_LABELS,
  type MemoryFactDTO,
} from "@/lib/domain/memory-fact";

type MemoryFactsPanelProps = {
  facts: MemoryFactDTO[];
  open: boolean;
  onToggle: () => void;
  editable?: boolean;
  onFactSaved?: (fact: MemoryFactDTO) => void;
};

export function MemoryFactsPanel({
  facts,
  open,
  onToggle,
  editable = false,
  onFactSaved,
}: MemoryFactsPanelProps) {
  return (
    <aside className="flex h-full flex-col border-zinc-200 bg-white lg:border-l">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left lg:cursor-default"
        aria-expanded={open}
      >
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-zinc-400 uppercase">
            Memoria
          </p>
          <p className="mt-0.5 text-sm text-zinc-700">
            {facts.length === 0
              ? "Sin hechos aún"
              : `${facts.length} hecho${facts.length === 1 ? "" : "s"}`}
            {editable ? " · editable" : ""}
          </p>
        </div>
        <span className="text-xs text-zinc-400 lg:hidden">
          {open ? "Ocultar" : "Ver"}
        </span>
      </button>

      <div
        className={`${open ? "block" : "hidden"} flex-1 overflow-y-auto px-4 pb-4 lg:block`}
      >
        {facts.length === 0 ? (
          <p className="text-sm leading-relaxed text-zinc-500">
            Maya irá capturando hechos del negocio a medida que conversen.
          </p>
        ) : (
          <ul className="space-y-3">
            {facts.map((fact) => (
              <FactRow
                key={fact.id}
                fact={fact}
                editable={editable}
                onSaved={onFactSaved}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function FactRow({
  fact,
  editable,
  onSaved,
}: {
  fact: MemoryFactDTO;
  editable: boolean;
  onSaved?: (fact: MemoryFactDTO) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fact.value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const value = draft.trim();
    if (!value || value === fact.value) {
      setEditing(false);
      setDraft(fact.value);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/memory-facts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: fact.key,
          value,
          category: fact.category,
        }),
      });
      const data = (await response.json()) as {
        fact?: MemoryFactDTO;
        error?: string;
      };
      if (!response.ok || !data.fact) {
        throw new Error(data.error ?? "No se pudo guardar");
      }
      onSaved?.(data.fact);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="border-b border-zinc-100 pb-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
            {MEMORY_FACT_CATEGORY_LABELS[fact.category]}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-900">
            {humanizeKey(fact.key)}
          </p>
        </div>
        {editable && !editing ? (
          <button
            type="button"
            onClick={() => {
              setDraft(fact.value);
              setEditing(true);
              setError(null);
            }}
            className="shrink-0 text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
            aria-label={`Editar ${fact.key}`}
          >
            Editar
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-900"
            disabled={saving}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !draft.trim()}
              className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(fact.value);
                setError(null);
              }}
              disabled={saving}
              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700"
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
        <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">
          {fact.value}
        </p>
      )}
    </li>
  );
}

function humanizeKey(key: string): string {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
