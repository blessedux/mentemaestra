import { z } from "zod";

export const MEMORY_FACT_CATEGORIES = [
  "business",
  "customers",
  "brand",
  "goals",
  "pain",
  "visual",
] as const;

export const MemoryFactCategorySchema = z.enum(MEMORY_FACT_CATEGORIES);
export type MemoryFactCategory = z.infer<typeof MemoryFactCategorySchema>;

export const PROVENANCE_TYPES = ["message", "chip", "user_edit"] as const;
export const ProvenanceTypeSchema = z.enum(PROVENANCE_TYPES);
export type ProvenanceType = z.infer<typeof ProvenanceTypeSchema>;

export const MemoryFactSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid().nullable(),
  sessionId: z.string().uuid(),
  key: z.string().min(1),
  value: z.string(),
  category: MemoryFactCategorySchema,
  provenanceType: ProvenanceTypeSchema,
  provenanceId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MemoryFact = z.infer<typeof MemoryFactSchema>;

export const MemoryFactInputSchema = z.object({
  sessionId: z.string().uuid(),
  businessId: z.string().uuid().nullable().optional(),
  key: z.string().min(1),
  value: z.string(),
  category: MemoryFactCategorySchema,
  provenanceType: ProvenanceTypeSchema,
  provenanceId: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
});

export type MemoryFactInput = z.infer<typeof MemoryFactInputSchema>;

export const MEMORY_FACT_CATEGORY_LABELS: Record<MemoryFactCategory, string> = {
  business: "Negocio",
  customers: "Clientes",
  brand: "Marca",
  goals: "Metas",
  pain: "Dolores",
  visual: "Visual",
};

/** Serializable fact for client components / API responses. */
export type MemoryFactDTO = {
  id: string;
  key: string;
  value: string;
  category: MemoryFactCategory;
  confidence: number;
  updatedAt: string;
};

export function toMemoryFactDTO(fact: MemoryFact): MemoryFactDTO {
  return {
    id: fact.id,
    key: fact.key,
    value: fact.value,
    category: fact.category,
    confidence: fact.confidence,
    updatedAt: fact.updatedAt.toISOString(),
  };
}
