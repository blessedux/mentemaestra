import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConversationRole,
  ConversationTurn,
} from "@/lib/domain/conversation-turn";
import type {
  ConversationTurnStore,
  NewConversationTurnInput,
} from "./types";

type TurnRow = {
  id: string;
  session_id: string;
  role: ConversationRole;
  content: string;
  tool_calls: unknown | null;
  created_at: string;
};

function rowToTurn(row: TurnRow): ConversationTurn {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    toolCalls: row.tool_calls,
    createdAt: new Date(row.created_at),
  };
}

/** Postgres-backed turn store via Supabase (service-role client). */
export class SupabaseConversationTurnStore implements ConversationTurnStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(turn: NewConversationTurnInput): Promise<ConversationTurn> {
    const { data, error } = await this.supabase
      .from("conversation_turns")
      .insert({
        id: turn.id,
        session_id: turn.sessionId,
        role: turn.role,
        content: turn.content,
        tool_calls: turn.toolCalls,
        created_at: turn.createdAt.toISOString(),
      })
      .select("id, session_id, role, content, tool_calls, created_at")
      .single();

    if (error) {
      throw new Error(`Failed to persist turn: ${error.message}`);
    }

    return rowToTurn(data as TurnRow);
  }

  async listBySession(sessionId: string): Promise<ConversationTurn[]> {
    const { data, error } = await this.supabase
      .from("conversation_turns")
      .select("id, session_id, role, content, tool_calls, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list turns: ${error.message}`);
    }

    return ((data ?? []) as TurnRow[]).map(rowToTurn);
  }
}
