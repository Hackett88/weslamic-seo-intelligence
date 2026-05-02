import {
  pgTable, text, integer, real, timestamp, pgEnum, serial, boolean, jsonb, index
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
export const regionEnum = pgEnum("region", ["SA","ID","AE","MY","GB","FR","DE","ES"]);

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

  // Region targeting
  region:            regionEnum("region"),

  // Status
  status:            statusEnum("keyword_status").default("pending"),
  notes:             text("notes"),
  updatedAt:         timestamp("updated_at").defaultNow(),
  createdAt:         timestamp("created_at").defaultNow(),
});

export type Keyword = typeof keywords.$inferSelect;
export type NewKeyword = typeof keywords.$inferInsert;

// ---- N8N callback events (idempotency) ----
export const n8nCallbackEvents = pgTable(
  "n8n_callback_events",
  {
    eventId:     text("event_id").primaryKey(),
    seq:         integer("seq").notNull(),
    ts:          timestamp("ts", { withTimezone: true }).notNull(),
    batchId:     text("batch_id").notNull(),
    workflowId:  text("workflow_id").notNull(),
    executionId: text("execution_id").notNull(),
    nodeName:    text("node_name").notNull(),
    nodeStatus:  text("node_status").notNull(),
    payload:     jsonb("payload"),
    createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    batchSeqIdx: index("n8n_cb_events_batch_seq_idx").on(t.batchId, t.seq),
    wfTsIdx:     index("n8n_cb_events_wf_ts_idx").on(t.workflowId, t.ts),
  })
);

// ---- N8N callback projections ----
export const n8nCallbackProjections = pgTable("n8n_callback_projections", {
  batchId:      text("batch_id").primaryKey(),
  expectedSeq:  integer("expected_seq").notNull().default(0),
  lastEventTs:  timestamp("last_event_ts", { withTimezone: true }),
  status:       text("status"),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---- Batch logs ----
export const batchLogs = pgTable("batch_logs", {
  batchId:         text("batch_id").primaryKey(),
  startedAt:       timestamp("started_at", { withTimezone: true }),
  finishedAt:      timestamp("finished_at", { withTimezone: true }),
  workflowName:    text("workflow_name"),
  userId:          text("user_id"),
  status:          text("status"),
  unitsEstimated:  integer("units_estimated"),
  unitsActual:     integer("units_actual"),
  rowsWritten:     integer("rows_written"),
  paramsSummary:   jsonb("params_summary"),
  errorMsg:        text("error_msg"),
});

export type N8nCallbackEventRow = typeof n8nCallbackEvents.$inferSelect;
export type NewN8nCallbackEventRow = typeof n8nCallbackEvents.$inferInsert;
export type N8nCallbackProjection = typeof n8nCallbackProjections.$inferSelect;
export type BatchLog = typeof batchLogs.$inferSelect;
