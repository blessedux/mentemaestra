import type { UIMessage } from "ai";
import {
  OfferChoicesResultSchema,
  type OfferChoicesResult,
} from "@/lib/domain/choice-chip";

export type OfferChoicesPart = OfferChoicesResult & {
  toolCallId: string;
};

/**
 * Reads offerChoices tool parts from an assistant UIMessage for chip rendering.
 */
export function extractOfferChoices(message: UIMessage): OfferChoicesPart[] {
  if (message.role !== "assistant") return [];

  const results: OfferChoicesPart[] = [];

  for (const part of message.parts) {
    if (part.type !== "tool-offerChoices") continue;

    const toolCallId =
      "toolCallId" in part && typeof part.toolCallId === "string"
        ? part.toolCallId
        : null;
    if (!toolCallId) continue;

    const payload =
      part.state === "output-available"
        ? part.output
        : part.state === "input-available" || part.state === "input-streaming"
          ? part.input
          : null;

    const parsed = OfferChoicesResultSchema.safeParse(
      payload && typeof payload === "object" && "offered" in payload
        ? payload
        : payload
          ? { offered: true, ...payload }
          : null,
    );

    if (!parsed.success) continue;

    results.push({ ...parsed.data, toolCallId });
  }

  return results;
}
