import { createServiceClient } from "@/lib/supabase/admin";
import { MemoryWriter } from "./memory-writer";
import { SupabaseMemoryFactStore } from "./supabase-memory-fact-store";

/** Production MemoryWriter backed by Supabase (service role). */
export function createMemoryWriter(): MemoryWriter {
  return new MemoryWriter(
    new SupabaseMemoryFactStore(createServiceClient()),
  );
}
