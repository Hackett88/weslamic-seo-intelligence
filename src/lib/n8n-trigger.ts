import { randomUUID } from "node:crypto";

const W01_WEBHOOK_PATH = "/webhook/w01-phrase-these";
const W02_WEBHOOK_PATH = "/webhook/w02-phrase-this";
const W03_WEBHOOK_PATH = "/webhook/w03-phrase-organic";
const STAGING_TABLE_ID = "4tzNtqRC3683ZoBy";
const W03_STAGING_TABLE_ID = "0gqbKO9OzoSJBjZV";

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
