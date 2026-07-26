import type { LanguageModel, UIMessage } from "ai";
import type { LivingPrd } from "@/lib/domain/living-prd";
import type { Mission } from "@/lib/domain/mission";
import type {
  ConversationRole,
  ConversationTurn,
} from "@/lib/domain/conversation-turn";
import type { LivingPrdStore } from "@/lib/modules/living-prd-compiler";
import type { MemoryWriter } from "@/lib/modules/memory-writer";

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
  /** Optional business binding for facts written this turn. */
  businessId?: string | null;
};

export type GenerateCloseoutOptions = {
  mission: Mission | null;
  businessId: string;
  prd: LivingPrd;
  livingPrdStore: LivingPrdStore;
};

export type ConversationRuntimeDeps = {
  turnStore: ConversationTurnStore;
  model: LanguageModel;
  memoryWriter?: MemoryWriter;
  now?: () => Date;
};
