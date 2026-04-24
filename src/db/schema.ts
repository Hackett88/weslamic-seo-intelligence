import {
  pgTable, text, integer, real, timestamp, pgEnum, serial, boolean
} from "drizzle-orm/pg-core";

// ---- Enums ----
export const layerEnum = pgEnum("layer", ["L1", "L2", "L3", "L4", "pending"]);
export const wordTypeEnum = pgEnum("word_type", [
  "brand", "category", "attribute", "scene", "audience",
  "knowledge", "comparison", "geo", "tool", "competitor"
]);
export const sourceNumEnum = pgEnum("source_num", ["0","1","2","3","4","5","6","7","8"]);
export const bpEnum = pgEnum("bp", ["0","1","2","3"]);
export const growthEnum = pgEnum("growth", ["rising","stable","declining"]);
export const cpEnum = pgEnum("cp_level", ["high","medium","low"]);
export const csEnum = pgEnum("cs_level", ["commercial","mixed","informational"]);
export const saEnum = pgEnum("sa_level", ["enterable","cautious","blocked"]);
export const statusEnum = pgEnum("keyword_status", ["pending","evaluated","clustered","excluded"]);
export const handlingEnum = pgEnum("handling", ["independent","merge","defer","exclude"]);
export const cannibalizationEnum = pgEnum("cannibalization_risk", ["low","medium","high"]);
export const clusterRoleEnum = pgEnum("cluster_role", ["head","modifier","variant"]);
export const behaviorIntentEnum = pgEnum("behavior_intent", ["buy","compare","learn","navigate","tool"]);
export const pagePlanIntentEnum = pgEnum("page_plan_intent", ["product","category","content","tool","landing"]);

// ---- Main keyword table ----
export const keywords = pgTable("keywords", {
  id:                serial("id").primaryKey(),
  kwId:              text("kw_id").notNull().unique(),          // KW-YYYYMM-001
  rawKeyword:        text("raw_keyword").notNull(),
  normalizedKeyword: text("normalized_keyword").notNull(),
  language:          text("language").notNull().default("EN"),
  batchId:           text("batch_id").notNull(),               // BATCH-YYYYMM

  // Source fields
  sourceNum:         sourceNumEnum("source_num"),
  sourceName:        text("source_name"),
  sourceDesc:        text("source_desc"),

  // Word type
  wordType:          wordTypeEnum("word_type"),

  // Scoring fields
  bp:                bpEnum("bp"),
  sv:                integer("sv"),                            // monthly search vol
  tp:                integer("tp"),                            // traffic potential
  kd:                integer("kd"),                            // 0-100
  cpc:               real("cpc"),
  growth:            growthEnum("growth"),
  cp:                cpEnum("cp_level"),
  cs:                csEnum("cs_level"),
  sa:                saEnum("sa_level"),

  // Clustering
  clusterCode:       text("cluster_code"),                    // CL-0001
  headKeyword:       text("head_keyword"),
  clusterRole:       clusterRoleEnum("cluster_role"),
  memberCount:       integer("member_count"),

  // Intent
  behaviorIntent:    behaviorIntentEnum("behavior_intent"),
  pagePlanIntent:    pagePlanIntentEnum("page_plan_intent"),
  serpContentType:   text("serp_content_type"),
  serpContentFormat: text("serp_content_format"),
  mixedIntentNote:   text("mixed_intent_note"),

  // Layering
  layer:             layerEnum("layer"),
  l2ScaleBasis:      text("l2_scale_basis"),
  l4SubType:         text("l4_sub_type"),                     // L4-new / L4-low / L4-reserve
  buildBatch:        text("build_batch"),
  reviewTiming:      text("review_timing"),
  layerBasis:        text("layer_basis"),

  // Page handling
  mainPage:          text("main_page"),
  mergeTargetPage:   text("merge_target_page"),
  coverageMethod:    text("coverage_method"),
  cannibalization:   cannibalizationEnum("cannibalization_risk"),
  handling:          handlingEnum("handling"),

  // Status
  status:            statusEnum("keyword_status").default("pending"),
  notes:             text("notes"),
  updatedAt:         timestamp("updated_at").defaultNow(),
  createdAt:         timestamp("created_at").defaultNow(),
});

export type Keyword = typeof keywords.$inferSelect;
export type NewKeyword = typeof keywords.$inferInsert;
