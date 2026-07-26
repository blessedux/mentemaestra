"use client";

import {
  MEMORY_FACT_CATEGORY_LABELS,
  type MemoryFactDTO,
} from "@/lib/domain/memory-fact";

type MemoryFactsPanelProps = {
  facts: MemoryFactDTO[];
  open: boolean;
  onToggle: () => void;
};

export function MemoryFactsPanel({
  facts,
  open,
  onToggle,
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
              <li key={fact.id} className="border-b border-zinc-100 pb-3 last:border-0">
                <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                  {MEMORY_FACT_CATEGORY_LABELS[fact.category]}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {humanizeKey(fact.key)}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">
                  {fact.value}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function humanizeKey(key: string): string {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
