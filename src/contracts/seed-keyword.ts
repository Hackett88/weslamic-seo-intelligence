import { z } from "zod";

export const SeedKeywordSchema = z.object({
  seed_id: z.string(),
  keyword: z.string().min(1),
  language: z.string().default(""),
  layer_main: z.string().default(""),
  enabled: z.boolean(),
  fetch_count: z.number().int().nonnegative().default(0),
  fetch_history: z.string().default("[]"),
  anchor: z.string().default(""),
  disabled_reason: z.string().default(""),
});

export type SeedKeyword = z.infer<typeof SeedKeywordSchema>;

export const SeedKeywordInputSchema = z.object({
  keyword: z.string().min(1, "关键词不能为空"),
  enabled: z.boolean().default(true),
  anchor: z.string().default(""),
  disabled_reason: z.string().default(""),
});

export type SeedKeywordInput = z.infer<typeof SeedKeywordInputSchema>;

export const SeedKeywordPatchSchema = SeedKeywordInputSchema.partial();
export type SeedKeywordPatch = z.infer<typeof SeedKeywordPatchSchema>;
