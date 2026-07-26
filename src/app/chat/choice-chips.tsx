"use client";

import type { OfferChoicesPart } from "@/lib/modules/conversation-runtime/extract-offer-choices";

type ChoiceChipsProps = {
  offers: OfferChoicesPart[];
  disabled: boolean;
  consumedToolCallIds: Set<string>;
  onSelect: (offer: OfferChoicesPart, optionId: string, label: string) => void;
};

/** Inline choice chips rendered below Maya's message. */
export function ChoiceChips({
  offers,
  disabled,
  consumedToolCallIds,
  onSelect,
}: ChoiceChipsProps) {
  if (offers.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {offers.map((offer) => {
        const consumed = consumedToolCallIds.has(offer.toolCallId);

        return (
          <div
            key={offer.toolCallId}
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={offer.questionKey}
          >
            {offer.options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={disabled || consumed}
                onClick={() => onSelect(offer, option.id, option.label)}
                className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-900 transition enabled:hover:border-zinc-900 enabled:hover:bg-zinc-900 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {option.label}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
