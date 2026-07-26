import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { createServiceClient } from "@/lib/supabase/admin";
import { ConversationRuntime } from "./conversation-runtime";
import { SupabaseConversationTurnStore } from "./supabase-conversation-turn-store";
import type { ConversationTurnStore } from "./types";

/** Supabase turn store (service role). Safe for history reads without OpenAI. */
export function createConversationTurnStore(): ConversationTurnStore {
  return new SupabaseConversationTurnStore(createServiceClient());
}

function getOpenAIModel(): LanguageModel {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  const modelId = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  return openai(modelId);
}

/** Production runtime: Supabase turns + OpenAI model. */
export function createConversationRuntime(
  model?: LanguageModel,
): ConversationRuntime {
  return new ConversationRuntime({
    turnStore: createConversationTurnStore(),
    model: model ?? getOpenAIModel(),
  });
}
