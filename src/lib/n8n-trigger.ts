import { randomUUID } from "node:crypto";

const W01_WEBHOOK_PATH = "/webhook/w01-phrase-these";
const W02_WEBHOOK_PATH = "/webhook/w02-phrase-this";
const W03_WEBHOOK_PATH = "/webhook/w03-phrase-organic";
const W04_WEBHOOK_PATH = "/webhook/w04-phrase-questions";
const W05_WEBHOOK_PATH = "/webhook/w05-phrase-related";
const W06_WEBHOOK_PATH = "/webhook/w06-phrase-fullsearch";
const W07_WEBHOOK_PATH = "/webhook/w07-phrase-all";
const W08_WEBHOOK_PATH = "/webhook/w08-domain-adwords";
const W09_WEBHOOK_PATH = "/webhook/w09-domain-adwords-historical";
const W10_WEBHOOK_PATH = "/webhook/w10-domain-domains";
const STAGING_TABLE_ID = "4tzNtqRC3683ZoBy";
const W03_STAGING_TABLE_ID = "0gqbKO9OzoSJBjZV";
const W04_STAGING_TABLE_ID = "hqfErV8GT9Ko0T4Z";
const W05_STAGING_TABLE_ID = "mYl4WTuyGHb5gqTk";
const W06_STAGING_TABLE_ID = "mYl4WTuyGHb5gqTk";
const W07_STAGING_TABLE_ID = "mYl4WTuyGHb5gqTk";
const W08_STAGING_TABLE_ID = "mJK5wkSrRN9v8rbG";
const W09_STAGING_TABLE_ID = "mJK5wkSrRN9v8rbG";
const W10_STAGING_TABLE_ID = "vlIhVlkOZwrnAMUW";

function n8nBase(): string {
  const raw = process.env.N8N_BASE_URL?.trim();
  if (!raw) throw Object.assign(new Error("N8N_BASE_URL 未配置"), { status: 500 });
  return raw.replace(/\/$/, "");
}

function appPublicUrl(): string {
  const raw = process.env.APP_PUBLIC_URL?.trim();
  if (!raw) throw Object.assign(new Error("APP_PUBLIC_URL 未配置（本地开发请填 cloudflared trycloudflare 隧道 URL）"), { status: 500 });
  return raw.replace(/\/$/, "");
}

function n8nApiHeaders(): Record<string, string> {
  const apiKey = process.env.N8N_API_KEY?.trim();
  if (!apiKey) throw Object.assign(new Error("N8N_API_KEY 未配置"), { status: 500 });
  return { "Content-Type": "application/json", "X-N8N-API-KEY": apiKey };
}

export type W01Market =
  | "sa" | "id" | "my" | "ae" | "uk" | "fr" | "de" | "es" | "us";

export interface W01TriggerInput {
  batchId: string;
  keywords: string[];
  market: W01Market;
  displayLimit?: number;
}

export interface W01TriggerResult {
  batchId: string;
  market: W01Market;
  webhookStatus: number;
  webhookOk: boolean;
}

export function buildBatchId(market: W01Market): string {
  return `W01-${market}-${randomUUID().slice(0, 8)}`;
}

export function buildW02BatchId(market: W01Market): string {
  return `W02-${market}-${randomUUID().slice(0, 8)}`;
}

export function buildW03BatchId(market: W01Market): string {
  return `W03-${market}-${randomUUID().slice(0, 8)}`;
}

export function buildW04BatchId(market: W01Market): string {
  return `W04-${market}-${randomUUID().slice(0, 8)}`;
}

export function buildW05BatchId(market: W01Market): string {
  return `W05-${market}-${randomUUID().slice(0, 8)}`;
}

export function buildW06BatchId(market: W01Market): string {
  return `W06-${market}-${randomUUID().slice(0, 8)}`;
}

export function buildW07BatchId(): string {
  return `W07-${randomUUID().slice(0, 8)}`;
}

export function buildW08BatchId(market: W01Market): string {
  return `W08-${market}-${randomUUID().slice(0, 8)}`;
}

export function buildW09BatchId(market: W01Market): string {
  return `W09-${market}-${randomUUID().slice(0, 8)}`;
}

export function buildW10BatchId(market: W01Market): string {
  return `W10-${market}-${randomUUID().slice(0, 8)}`;
}

export async function triggerW01PhraseThese(
  input: W01TriggerInput
): Promise<W01TriggerResult> {
  const url = `${n8nBase()}${W01_WEBHOOK_PATH}`;
  const callbackUrl = `${appPublicUrl()}/api/n8n/callback`;
  const body = {
    batch_id: input.batchId,
    workflow_id: "W01",
    callback_url: callbackUrl,
    keywords: input.keywords,
    market: input.market,
    database: input.market,
    display_limit: input.displayLimit ?? 100,
    display_offset: 0,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N webhook network error: ${msg}`), { status: 503 });
  }

  return {
    batchId: input.batchId,
    market: input.market,
    webhookStatus: res.status,
    webhookOk: res.status >= 200 && res.status < 300,
  };
}

export interface W02TriggerInput {
  batchId: string;
  keyword: string;
  market: W01Market;
}

export interface W02TriggerResult {
  batchId: string;
  market: W01Market;
  webhookStatus: number;
  webhookOk: boolean;
}

export async function triggerW02PhraseThis(
  input: W02TriggerInput
): Promise<W02TriggerResult> {
  const url = `${n8nBase()}${W02_WEBHOOK_PATH}`;
  const callbackUrl = `${appPublicUrl()}/api/n8n/callback`;
  const body = {
    batch_id: input.batchId,
    workflow_id: "W02",
    callback_url: callbackUrl,
    keyword: input.keyword,
    market: input.market,
    database: input.market,
    display_limit: 1,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N webhook network error: ${msg}`), { status: 503 });
  }

  return {
    batchId: input.batchId,
    market: input.market,
    webhookStatus: res.status,
    webhookOk: res.status >= 200 && res.status < 300,
  };
}

export interface W03TriggerInput {
  batchId: string;
  keyword: string;
  market: W01Market;
  seedKeyword?: string;
  displayLimit?: number;
}

export interface W03TriggerResult {
  batchId: string;
  market: W01Market;
  webhookStatus: number;
  webhookOk: boolean;
}

export async function triggerW03PhraseOrganic(
  input: W03TriggerInput
): Promise<W03TriggerResult> {
  const url = `${n8nBase()}${W03_WEBHOOK_PATH}`;
  const callbackUrl = `${appPublicUrl()}/api/n8n/callback`;
  const body = {
    batch_id: input.batchId,
    workflow_id: "W03",
    callback_url: callbackUrl,
    keyword: input.keyword,
    market: input.market,
    database: input.market,
    seed_keyword: input.seedKeyword ?? input.keyword,
    display_limit: input.displayLimit ?? 3,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N webhook network error: ${msg}`), { status: 503 });
  }

  return {
    batchId: input.batchId,
    market: input.market,
    webhookStatus: res.status,
    webhookOk: res.status >= 200 && res.status < 300,
  };
}

export interface StagingRow {
  keyword: string;
  market: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  trends: string | null;
  intent: string | null;
  source_flow: string | null;
  batch_id: string;
}

interface RawStagingRow {
  keyword?: unknown;
  market?: unknown;
  search_volume?: unknown;
  keyword_difficulty?: unknown;
  cpc?: unknown;
  competition?: unknown;
  number_of_results?: unknown;
  trends?: unknown;
  intent?: unknown;
  source_flow?: unknown;
  batch_id?: unknown;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}
function strOrNull(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v);
}

export async function getStagingRowsByBatch(
  batchId: string
): Promise<StagingRow[]> {
  const url = new URL(`${n8nBase()}/api/v1/data-tables/${STAGING_TABLE_ID}/rows`);
  url.searchParams.set("limit", "250");
  url.searchParams.set(
    "filter",
    JSON.stringify({
      filters: [{ columnName: "batch_id", condition: "eq", value: batchId }],
    })
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: n8nApiHeaders(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N DataTable network error: ${msg}`), { status: 503 });
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw Object.assign(new Error(`N8N DataTable ${res.status}: ${txt}`), { status: res.status });
  }
  const data = (await res.json()) as { data?: RawStagingRow[] };
  const rows = data.data ?? [];
  return rows.map<StagingRow>((r) => ({
    keyword:            str(r.keyword),
    market:             str(r.market),
    search_volume:      num(r.search_volume),
    keyword_difficulty: num(r.keyword_difficulty),
    cpc:                num(r.cpc),
    competition:        num(r.competition),
    number_of_results:  num(r.number_of_results),
    trends:             strOrNull(r.trends),
    intent:             strOrNull(r.intent),
    source_flow:        strOrNull(r.source_flow),
    batch_id:           str(r.batch_id),
  }));
}

export interface W04TriggerInput {
  batchId: string;
  seedKeyword: string;
  market: W01Market;
  displayLimit?: number;
}

export interface W04TriggerResult {
  batchId: string;
  market: W01Market;
  webhookStatus: number;
  webhookOk: boolean;
}

export async function triggerW04PhraseQuestions(
  input: W04TriggerInput
): Promise<W04TriggerResult> {
  const url = `${n8nBase()}${W04_WEBHOOK_PATH}`;
  const callbackUrl = `${appPublicUrl()}/api/n8n/callback`;
  const body = {
    batch_id: input.batchId,
    workflow_id: "W04",
    callback_url: callbackUrl,
    seed_keyword: input.seedKeyword,
    market: input.market,
    database: input.market,
    display_limit: input.displayLimit ?? 25,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N webhook network error: ${msg}`), { status: 503 });
  }

  return {
    batchId: input.batchId,
    market: input.market,
    webhookStatus: res.status,
    webhookOk: res.status >= 200 && res.status < 300,
  };
}

export interface W04StagingRow {
  keyword: string;
  market: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  trends: string | null;
  intent: string | null;
  question_type: string | null;
  batch_id: string;
}

interface RawW04StagingRow {
  keyword?: unknown;
  market?: unknown;
  search_volume?: unknown;
  keyword_difficulty?: unknown;
  cpc?: unknown;
  competition?: unknown;
  number_of_results?: unknown;
  trends?: unknown;
  intent?: unknown;
  question_type?: unknown;
  batch_id?: unknown;
}

export async function getW04StagingRowsByBatch(
  batchId: string
): Promise<W04StagingRow[]> {
  const url = new URL(`${n8nBase()}/api/v1/data-tables/${W04_STAGING_TABLE_ID}/rows`);
  url.searchParams.set("limit", "250");
  url.searchParams.set(
    "filter",
    JSON.stringify({
      filters: [{ columnName: "batch_id", condition: "eq", value: batchId }],
    })
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: n8nApiHeaders(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N DataTable network error: ${msg}`), { status: 503 });
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw Object.assign(new Error(`N8N DataTable ${res.status}: ${txt}`), { status: res.status });
  }
  const data = (await res.json()) as { data?: RawW04StagingRow[] };
  const rows = data.data ?? [];
  return rows.map<W04StagingRow>((r) => ({
    keyword:            str(r.keyword),
    market:             str(r.market),
    search_volume:      num(r.search_volume),
    keyword_difficulty: num(r.keyword_difficulty),
    cpc:                num(r.cpc),
    competition:        num(r.competition),
    number_of_results:  num(r.number_of_results),
    trends:             strOrNull(r.trends),
    intent:             strOrNull(r.intent),
    question_type:      strOrNull(r.question_type),
    batch_id:           str(r.batch_id),
  }));
}

export interface W05TriggerInput {
  batchId: string;
  seedKeyword: string;
  market: W01Market;
  displayLimit?: number;
}

export interface W05TriggerResult {
  batchId: string;
  market: W01Market;
  webhookStatus: number;
  webhookOk: boolean;
}

export async function triggerW05PhraseRelated(
  input: W05TriggerInput
): Promise<W05TriggerResult> {
  const url = `${n8nBase()}${W05_WEBHOOK_PATH}`;
  const callbackUrl = `${appPublicUrl()}/api/n8n/callback`;
  const body = {
    batch_id: input.batchId,
    workflow_id: "W05",
    callback_url: callbackUrl,
    seed_keyword: input.seedKeyword,
    market: input.market,
    database: input.market,
    display_limit: input.displayLimit ?? 25,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N webhook network error: ${msg}`), { status: 503 });
  }

  return {
    batchId: input.batchId,
    market: input.market,
    webhookStatus: res.status,
    webhookOk: res.status >= 200 && res.status < 300,
  };
}

export interface W05StagingRow {
  keyword: string;
  market: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  trends: string | null;
  intent: string | null;
  relevance_rate: number | null;
  keyword_serp_features_codes: string | null;
  batch_id: string;
}

interface RawW05StagingRow {
  keyword?: unknown;
  market?: unknown;
  search_volume?: unknown;
  keyword_difficulty?: unknown;
  cpc?: unknown;
  competition?: unknown;
  number_of_results?: unknown;
  trends?: unknown;
  intent?: unknown;
  relevance_rate?: unknown;
  keyword_serp_features_codes?: unknown;
  batch_id?: unknown;
}

export async function getW05StagingRowsByBatch(
  batchId: string
): Promise<W05StagingRow[]> {
  const url = new URL(`${n8nBase()}/api/v1/data-tables/${W05_STAGING_TABLE_ID}/rows`);
  url.searchParams.set("limit", "250");
  url.searchParams.set(
    "filter",
    JSON.stringify({
      filters: [{ columnName: "batch_id", condition: "eq", value: batchId }],
    })
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: n8nApiHeaders(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N DataTable network error: ${msg}`), { status: 503 });
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw Object.assign(new Error(`N8N DataTable ${res.status}: ${txt}`), { status: res.status });
  }
  const data = (await res.json()) as { data?: RawW05StagingRow[] };
  const rows = data.data ?? [];
  return rows.map<W05StagingRow>((r) => ({
    keyword:                     str(r.keyword),
    market:                      str(r.market),
    search_volume:               num(r.search_volume),
    keyword_difficulty:          num(r.keyword_difficulty),
    cpc:                         num(r.cpc),
    competition:                 num(r.competition),
    number_of_results:           num(r.number_of_results),
    trends:                      strOrNull(r.trends),
    intent:                      strOrNull(r.intent),
    relevance_rate:              num(r.relevance_rate),
    keyword_serp_features_codes: strOrNull(r.keyword_serp_features_codes),
    batch_id:                    str(r.batch_id),
  }));
}

export interface W07TriggerInput {
  batchId: string;
  keyword: string;
  displayLimit?: number;
}

export interface W07TriggerResult {
  batchId: string;
  webhookStatus: number;
  webhookOk: boolean;
}

export async function triggerW07PhraseAll(
  input: W07TriggerInput
): Promise<W07TriggerResult> {
  const url = `${n8nBase()}${W07_WEBHOOK_PATH}`;
  const callbackUrl = `${appPublicUrl()}/api/n8n/callback`;
  const body = {
    batch_id: input.batchId,
    workflow_id: "W07",
    callback_url: callbackUrl,
    keyword: input.keyword,
    display_limit: input.displayLimit ?? 9,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N webhook network error: ${msg}`), { status: 503 });
  }

  return {
    batchId: input.batchId,
    webhookStatus: res.status,
    webhookOk: res.status >= 200 && res.status < 300,
  };
}

export interface W07StagingRow {
  keyword: string;
  market: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  intent: string | null;
  batch_id: string;
}

interface RawW07StagingRow {
  keyword?: unknown;
  market?: unknown;
  database?: unknown;
  search_volume?: unknown;
  keyword_difficulty?: unknown;
  cpc?: unknown;
  competition?: unknown;
  number_of_results?: unknown;
  intent?: unknown;
  batch_id?: unknown;
}

export async function getW07StagingRowsByBatch(
  batchId: string
): Promise<W07StagingRow[]> {
  const url = new URL(`${n8nBase()}/api/v1/data-tables/${W07_STAGING_TABLE_ID}/rows`);
  url.searchParams.set("limit", "250");
  url.searchParams.set(
    "filter",
    JSON.stringify({
      filters: [{ columnName: "batch_id", condition: "eq", value: batchId }],
    })
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: n8nApiHeaders(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N DataTable network error: ${msg}`), { status: 503 });
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw Object.assign(new Error(`N8N DataTable ${res.status}: ${txt}`), { status: res.status });
  }
  const data = (await res.json()) as { data?: RawW07StagingRow[] };
  const rows = data.data ?? [];
  return rows.map<W07StagingRow>((r) => ({
    keyword:            str(r.keyword),
    market:             str(r.market ?? r.database),
    search_volume:      num(r.search_volume),
    keyword_difficulty: num(r.keyword_difficulty),
    cpc:                num(r.cpc),
    competition:        num(r.competition),
    number_of_results:  num(r.number_of_results),
    intent:             strOrNull(r.intent),
    batch_id:           str(r.batch_id),
  }));
}

export interface W08TriggerInput {
  batchId: string;
  advertiserDomain: string;
  market: W01Market;
  displayLimit?: number;
}

export interface W08TriggerResult {
  batchId: string;
  market: W01Market;
  webhookStatus: number;
  webhookOk: boolean;
}

export async function triggerW08DomainAdwords(
  input: W08TriggerInput
): Promise<W08TriggerResult> {
  const url = `${n8nBase()}${W08_WEBHOOK_PATH}`;
  const callbackUrl = `${appPublicUrl()}/api/n8n/callback`;
  const body = {
    batch_id: input.batchId,
    workflow_id: "W08",
    callback_url: callbackUrl,
    advertiser_domain: input.advertiserDomain,
    market: input.market,
    database: input.market,
    display_limit: input.displayLimit ?? 25,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N webhook network error: ${msg}`), { status: 503 });
  }

  return {
    batchId: input.batchId,
    market: input.market,
    webhookStatus: res.status,
    webhookOk: res.status >= 200 && res.status < 300,
  };
}

export interface W08StagingRow {
  keyword: string;
  market: string;
  advertiser_domain: string;
  position: number | null;
  visible_url: string | null;
  ad_title: string | null;
  ad_description: string | null;
  batch_id: string;
}

interface RawW08StagingRow {
  keyword?: unknown;
  market?: unknown;
  database?: unknown;
  advertiser_domain?: unknown;
  position?: unknown;
  visible_url?: unknown;
  visibleUrl?: unknown;
  ad_title?: unknown;
  adTitle?: unknown;
  ad_description?: unknown;
  adDescription?: unknown;
  batch_id?: unknown;
}

export async function getW08StagingRowsByBatch(
  batchId: string
): Promise<W08StagingRow[]> {
  const url = new URL(`${n8nBase()}/api/v1/data-tables/${W08_STAGING_TABLE_ID}/rows`);
  url.searchParams.set("limit", "250");
  url.searchParams.set(
    "filter",
    JSON.stringify({
      filters: [{ columnName: "batch_id", condition: "eq", value: batchId }],
    })
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: n8nApiHeaders(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N DataTable network error: ${msg}`), { status: 503 });
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw Object.assign(new Error(`N8N DataTable ${res.status}: ${txt}`), { status: res.status });
  }
  const data = (await res.json()) as { data?: RawW08StagingRow[] };
  const rows = data.data ?? [];
  return rows.map<W08StagingRow>((r) => ({
    keyword:          str(r.keyword),
    market:           str(r.market ?? r.database),
    advertiser_domain: str(r.advertiser_domain),
    position:         num(r.position),
    visible_url:      strOrNull(r.visible_url ?? r.visibleUrl),
    ad_title:         strOrNull(r.ad_title ?? r.adTitle),
    ad_description:   strOrNull(r.ad_description ?? r.adDescription),
    batch_id:         str(r.batch_id),
  }));
}

export interface W03StagingRow {
  keyword: string;
  market: string;
  position: number | null;
  position_type: string | null;
  domain: string | null;
  url: string | null;
  keyword_serp_features_codes: string | null;
  domain_serp_features_codes: string | null;
  batch_id: string;
}

interface RawW03StagingRow {
  keyword?: unknown;
  market?: unknown;
  database?: unknown;
  position?: unknown;
  position_type?: unknown;
  domain?: unknown;
  url?: unknown;
  keyword_serp_features_codes?: unknown;
  domain_serp_features_codes?: unknown;
  batch_id?: unknown;
}

export interface W10TriggerInput {
  batchId: string;
  ourDomain: string;
  competitorDomains: string[];
  gapTypes: string[];
  market: W01Market;
  displayLimit?: number;
}

export interface W10TriggerResult {
  batchId: string;
  market: W01Market;
  webhookStatus: number;
  webhookOk: boolean;
}

export async function triggerW10DomainDomains(
  input: W10TriggerInput
): Promise<W10TriggerResult> {
  const url = `${n8nBase()}${W10_WEBHOOK_PATH}`;
  const callbackUrl = `${appPublicUrl()}/api/n8n/callback`;
  const body = {
    batch_id: input.batchId,
    workflow_id: "W10",
    callback_url: callbackUrl,
    our_domain: input.ourDomain,
    competitor_domains: input.competitorDomains,
    gap_types: input.gapTypes,
    market: input.market,
    database: input.market,
    display_limit: input.displayLimit ?? 25,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N webhook network error: ${msg}`), { status: 503 });
  }

  return {
    batchId: input.batchId,
    market: input.market,
    webhookStatus: res.status,
    webhookOk: res.status >= 200 && res.status < 300,
  };
}

export interface W10StagingRow {
  keyword: string;
  market: string;
  gap_type: string | null;
  our_domain: string | null;
  competitor_domain: string | null;
  our_position: number | null;
  competitor_position: number | null;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  trends: string | null;
  keyword_serp_features_codes: string | null;
  domain_serp_features_codes: string | null;
  batch_id: string;
}

interface RawW10StagingRow {
  keyword?: unknown;
  market?: unknown;
  gap_type?: unknown;
  our_domain?: unknown;
  competitor_domain?: unknown;
  our_position?: unknown;
  competitor_position?: unknown;
  search_volume?: unknown;
  keyword_difficulty?: unknown;
  cpc?: unknown;
  competition?: unknown;
  number_of_results?: unknown;
  trends?: unknown;
  keyword_serp_features_codes?: unknown;
  domain_serp_features_codes?: unknown;
  batch_id?: unknown;
}

export async function getW10StagingRowsByBatch(
  batchId: string
): Promise<W10StagingRow[]> {
  const url = new URL(`${n8nBase()}/api/v1/data-tables/${W10_STAGING_TABLE_ID}/rows`);
  url.searchParams.set("limit", "250");
  url.searchParams.set(
    "filter",
    JSON.stringify({
      filters: [{ columnName: "batch_id", condition: "eq", value: batchId }],
    })
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: n8nApiHeaders(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N DataTable network error: ${msg}`), { status: 503 });
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw Object.assign(new Error(`N8N DataTable ${res.status}: ${txt}`), { status: res.status });
  }
  const data = (await res.json()) as { data?: RawW10StagingRow[] };
  const rows = data.data ?? [];
  return rows.map<W10StagingRow>((r) => ({
    keyword:                     str(r.keyword),
    market:                      str(r.market),
    gap_type:                    strOrNull(r.gap_type),
    our_domain:                  strOrNull(r.our_domain),
    competitor_domain:           strOrNull(r.competitor_domain),
    our_position:                num(r.our_position),
    competitor_position:         num(r.competitor_position),
    search_volume:               num(r.search_volume),
    keyword_difficulty:          num(r.keyword_difficulty),
    cpc:                         num(r.cpc),
    competition:                 num(r.competition),
    number_of_results:           num(r.number_of_results),
    trends:                      strOrNull(r.trends),
    keyword_serp_features_codes: strOrNull(r.keyword_serp_features_codes),
    domain_serp_features_codes:  strOrNull(r.domain_serp_features_codes),
    batch_id:                    str(r.batch_id),
  }));
}

export async function getW03StagingRowsByBatch(
  batchId: string
): Promise<W03StagingRow[]> {
  const url = new URL(`${n8nBase()}/api/v1/data-tables/${W03_STAGING_TABLE_ID}/rows`);
  url.searchParams.set("limit", "250");
  url.searchParams.set(
    "filter",
    JSON.stringify({
      filters: [{ columnName: "batch_id", condition: "eq", value: batchId }],
    })
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: n8nApiHeaders(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N DataTable network error: ${msg}`), { status: 503 });
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw Object.assign(new Error(`N8N DataTable ${res.status}: ${txt}`), { status: res.status });
  }
  const data = (await res.json()) as { data?: RawW03StagingRow[] };
  const rows = data.data ?? [];
  return rows.map<W03StagingRow>((r) => ({
    keyword:                     str(r.keyword),
    market:                      str(r.market ?? r.database),
    position:                    num(r.position),
    position_type:               strOrNull(r.position_type),
    domain:                      strOrNull(r.domain),
    url:                         strOrNull(r.url),
    keyword_serp_features_codes: strOrNull(r.keyword_serp_features_codes),
    domain_serp_features_codes:  strOrNull(r.domain_serp_features_codes),
    batch_id:                    str(r.batch_id),
  }));
}

export interface W06TriggerInput {
  batchId: string;
  seedKeyword: string;
  market: W01Market;
  displayLimit?: number;
}

export interface W06TriggerResult {
  batchId: string;
  market: W01Market;
  webhookStatus: number;
  webhookOk: boolean;
}

export async function triggerW06PhraseFullsearch(
  input: W06TriggerInput
): Promise<W06TriggerResult> {
  const url = `${n8nBase()}${W06_WEBHOOK_PATH}`;
  const callbackUrl = `${appPublicUrl()}/api/n8n/callback`;
  const body = {
    batch_id: input.batchId,
    workflow_id: "W06",
    callback_url: callbackUrl,
    seed_keyword: input.seedKeyword,
    market: input.market,
    database: input.market,
    display_limit: input.displayLimit ?? 25,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N webhook network error: ${msg}`), { status: 503 });
  }

  return {
    batchId: input.batchId,
    market: input.market,
    webhookStatus: res.status,
    webhookOk: res.status >= 200 && res.status < 300,
  };
}

export interface W06StagingRow {
  keyword: string;
  market: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  trends: string | null;
  intent: string | null;
  relevance_rate: number | null;
  batch_id: string;
}

interface RawW06StagingRow {
  keyword?: unknown;
  market?: unknown;
  search_volume?: unknown;
  keyword_difficulty?: unknown;
  cpc?: unknown;
  competition?: unknown;
  number_of_results?: unknown;
  trends?: unknown;
  intent?: unknown;
  relevance_rate?: unknown;
  batch_id?: unknown;
}

export interface W09TriggerInput {
  batchId: string;
  advertiserDomain: string;
  market: W01Market;
  displayLimit?: number;
}

export interface W09TriggerResult {
  batchId: string;
  market: W01Market;
  webhookStatus: number;
  webhookOk: boolean;
}

export async function triggerW09DomainAdwordsHistorical(
  input: W09TriggerInput
): Promise<W09TriggerResult> {
  const url = `${n8nBase()}${W09_WEBHOOK_PATH}`;
  const callbackUrl = `${appPublicUrl()}/api/n8n/callback`;
  const body = {
    batch_id: input.batchId,
    workflow_id: "W09",
    callback_url: callbackUrl,
    advertiser_domain: input.advertiserDomain,
    market: input.market,
    database: input.market,
    display_limit: input.displayLimit ?? 12,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N webhook network error: ${msg}`), { status: 503 });
  }

  return {
    batchId: input.batchId,
    market: input.market,
    webhookStatus: res.status,
    webhookOk: res.status >= 200 && res.status < 300,
  };
}

export interface W09StagingRow {
  keyword: string;
  market: string;
  advertiser_domain: string;
  fetch_date: string | null;
  position: number | null;
  visible_url: string | null;
  ad_title: string | null;
  ad_description: string | null;
  batch_id: string;
}

interface RawW09StagingRow {
  keyword?: unknown;
  market?: unknown;
  database?: unknown;
  advertiser_domain?: unknown;
  fetch_date?: unknown;
  fetchDate?: unknown;
  position?: unknown;
  visible_url?: unknown;
  visibleUrl?: unknown;
  ad_title?: unknown;
  adTitle?: unknown;
  ad_description?: unknown;
  adDescription?: unknown;
  batch_id?: unknown;
}

export async function getW09StagingRowsByBatch(
  batchId: string
): Promise<W09StagingRow[]> {
  const url = new URL(`${n8nBase()}/api/v1/data-tables/${W09_STAGING_TABLE_ID}/rows`);
  url.searchParams.set("limit", "250");
  url.searchParams.set(
    "filter",
    JSON.stringify({
      filters: [{ columnName: "batch_id", condition: "eq", value: batchId }],
    })
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: n8nApiHeaders(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N DataTable network error: ${msg}`), { status: 503 });
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw Object.assign(new Error(`N8N DataTable ${res.status}: ${txt}`), { status: res.status });
  }
  const data = (await res.json()) as { data?: RawW09StagingRow[] };
  const rows = data.data ?? [];
  return rows.map<W09StagingRow>((r) => ({
    keyword:           str(r.keyword),
    market:            str(r.market ?? r.database),
    advertiser_domain: str(r.advertiser_domain),
    fetch_date:        strOrNull(r.fetch_date ?? r.fetchDate),
    position:          num(r.position),
    visible_url:       strOrNull(r.visible_url ?? r.visibleUrl),
    ad_title:          strOrNull(r.ad_title ?? r.adTitle),
    ad_description:    strOrNull(r.ad_description ?? r.adDescription),
    batch_id:          str(r.batch_id),
  }));
}

export async function getW06StagingRowsByBatch(
  batchId: string
): Promise<W06StagingRow[]> {
  const url = new URL(`${n8nBase()}/api/v1/data-tables/${W06_STAGING_TABLE_ID}/rows`);
  url.searchParams.set("limit", "250");
  url.searchParams.set(
    "filter",
    JSON.stringify({
      filters: [{ columnName: "batch_id", condition: "eq", value: batchId }],
    })
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: n8nApiHeaders(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N DataTable network error: ${msg}`), { status: 503 });
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw Object.assign(new Error(`N8N DataTable ${res.status}: ${txt}`), { status: res.status });
  }
  const data = (await res.json()) as { data?: RawW06StagingRow[] };
  const rows = data.data ?? [];
  return rows.map<W06StagingRow>((r) => ({
    keyword:            str(r.keyword),
    market:             str(r.market),
    search_volume:      num(r.search_volume),
    keyword_difficulty: num(r.keyword_difficulty),
    cpc:                num(r.cpc),
    competition:        num(r.competition),
    number_of_results:  num(r.number_of_results),
    trends:             strOrNull(r.trends),
    intent:             strOrNull(r.intent),
    relevance_rate:     num(r.relevance_rate),
    batch_id:           str(r.batch_id),
  }));
}
