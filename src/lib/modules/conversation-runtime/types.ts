import type { LanguageModel, UIMessage } from "ai";
import type { Mission } from "@/lib/domain/mission";
import type {
  ConversationRole,
  ConversationTurn,
} from "@/lib/domain/conversation-turn";

export type NewConversationTurnInput = {
  id: string;
  sessionId: string;
  role: ConversationRole;
  content: string;
  toolCalls: unknown | null;
  createdAt: Date;
};

/** Persistence boundary for conversation turns (injectable for tests). */
export interface ConversationTurnStore {
  insert(turn: NewConversationTurnInput): Promise<ConversationTurn>;
  listBySession(sessionId: string): Promise<ConversationTurn[]>;
}

export type StreamTurnOptions = {
  messages: UIMessage[];
  mission: Mission | null;
};

export type ConversationRuntimeDeps = {
  turnStore: ConversationTurnStore;
  model: LanguageModel;
  now?: () => Date;
};
