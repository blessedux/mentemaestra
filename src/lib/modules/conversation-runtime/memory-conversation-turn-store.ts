import type { ConversationTurn } from "@/lib/domain/conversation-turn";
import type {
  ConversationTurnStore,
  NewConversationTurnInput,
} from "./types";

/** In-memory turn store for Vitest. */
export class MemoryConversationTurnStore implements ConversationTurnStore {
  private readonly bySession = new Map<string, ConversationTurn[]>();

  async insert(turn: NewConversationTurnInput): Promise<ConversationTurn> {
    const stored: ConversationTurn = { ...turn };
    const list = this.bySession.get(turn.sessionId) ?? [];
    list.push(stored);
    this.bySession.set(turn.sessionId, list);
    return { ...stored };
  }

  async listBySession(sessionId: string): Promise<ConversationTurn[]> {
    const list = this.bySession.get(sessionId) ?? [];
    return list.map((turn) => ({ ...turn }));
  }
}
