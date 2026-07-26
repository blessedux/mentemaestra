import type { UIMessage } from "ai";
import type { ConversationTurn } from "@/lib/domain/conversation-turn";

export function uiMessageText(message: UIMessage | undefined): string {
  if (!message) return "";
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function turnsToUIMessages(turns: ConversationTurn[]): UIMessage[] {
  return turns.map((turn) => ({
    id: turn.id,
    role: turn.role,
    parts: [{ type: "text" as const, text: turn.content }],
  }));
}
