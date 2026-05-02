import { randomUUID } from "node:crypto";
import type {
  SeedKeyword,
  SeedKeywordInput,
  SeedKeywordPatch,
} from "@/contracts/seed-keyword";

// ---------------------------------------------------------------------------
// Mock store (in-memory; resets on server restart)
// ---------------------------------------------------------------------------

const globalForMock = globalThis as unknown as {
  __seedKeywordsMap?: Map<string, SeedKeyword>;
};

function getMockMap(): Map<string, SeedKeyword> {
  if (!globalForMock.__seedKeywordsMap) {
    const rows: SeedKeyword[] = [
      {
        seed_id: "seed-001",
        keyword: "ramadan kareem",
        language: "en",
        layer_main: "brand",
        enabled: true,
        fetch_count: 12,
        fetch_history: "[]",
        anchor: "",
        disabled_reason: "",
      },
      {
        seed_id: "seed-002",
        keyword: "eid mubarak",
        language: "en",
        layer_main: "category",
        enabled: true,
        fetch_count: 8,
        fetch_history: "[]",
        anchor: "",
        disabled_reason: "",
      },
      {
        seed_id: "seed-003",
        keyword: "حلال food",
        language: "ar",
        layer_main: "product",
        enabled: false,
        fetch_count: 3,
        fetch_history: "[]",
        anchor: "",
        disabled_reason: "产品线暂停",
      },
      {
        seed_id: "seed-004",
        keyword: "muslim travel",
        language: "en",
        layer_main: "geo",
        enabled: true,
        fetch_count: 5,
        fetch_history: "[]",
        anchor: "travel hub",
        disabled_reason: "",
      },
      {
        seed_id: "seed-005",
        keyword: "quran download",
        language: "en",
        layer_main: "intent",
        enabled: true,
        fetch_count: 0,
        fetch_history: "[]",
        anchor: "",
        disabled_reason: "",
      },
      {
        seed_id: "seed-006",
        keyword: "hajj guide",
        language: "ar",
        layer_main: "topical",
        enabled: false,
        fetch_count: 1,
        fetch_history: "[]",
        anchor: "",
        disabled_reason: "季节性关键词，暂停采集",
      },
    ];
    const m = new Map<string, SeedKeyword>();
    for (const r of rows) m.set(r.seed_id, r);
    globalForMock.__seedKeywordsMap = m;
  }
  return globalForMock.__seedKeywordsMap;
}

function isMockMode(): boolean {
  return (
    process.env.USE_MOCK === "1" ||
    !process.env.N8N_API_KEY ||
    process.env.N8N_API_KEY.trim() === ""
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GetSeedKeywordsQuery {
  search?: string;
  language?: string;
  layer?: string;
  enabled?: boolean;
  limit?: number;
  cursor?: string;
}

export interface GetSeedKeywordsResult {
  rows: SeedKeyword[];
  total?: number;
  nextCursor?: string;
}

// ---------------------------------------------------------------------------
// N8N REST helpers
// ---------------------------------------------------------------------------

function n8nUrl(path: string): string {
  const raw = process.env.N8N_BASE_URL?.trim();
  if (!raw) {
    throw Object.assign(
      new Error("环境变量 N8N_BASE_URL 未配置（.env.local 缺这一行）"),
      { status: 500 }
    );
  }
  const base = raw.replace(/\/$/, "");
  return `${base}${path}`;
}

function n8nHeaders(): Record<string, string> {
  const apiKey = process.env.N8N_API_KEY?.trim();
  if (!apiKey) {
    throw Object.assign(
      new Error("环境变量 N8N_API_KEY 未配置"),
      { status: 500 }
    );
  }
  return {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": apiKey,
  };
}

function tableRowsUrl(): string {
  const tableId = process.env.N8N_DATATABLE_SEED_ID?.trim();
  if (!tableId) {
    throw Object.assign(
      new Error("环境变量 N8N_DATATABLE_SEED_ID 未配置"),
      { status: 500 }
    );
  }
  return n8nUrl(`/api/v1/data-tables/${tableId}/rows`);
}

async function n8nFetch(
  url: string,
  init: RequestInit
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`N8N network error: ${msg}`), {
      status: 503,
    });
  }
  if (!res.ok) {
    let body = "";
    try {
      const raw = await res.json() as { message?: string };
      body = raw.message ?? JSON.stringify(raw);
    } catch {
      try {
        body = await res.text();
      } catch {
        /* ignore */
      }
    }
    throw Object.assign(
      new Error(`N8N ${res.status}: ${body}`),
      { status: res.status }
    );
  }
  return res;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getSeedKeywords(
  query: GetSeedKeywordsQuery = {}
): Promise<GetSeedKeywordsResult> {
  if (isMockMode()) {
    const { search, language, layer, enabled, limit = 50, cursor } = query;
    let rows = Array.from(getMockMap().values());
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.keyword.toLowerCase().includes(q));
    }
    if (language) rows = rows.filter((r) => r.language === language);
    if (layer) rows = rows.filter((r) => r.layer_main === layer);
    if (enabled !== undefined) rows = rows.filter((r) => r.enabled === enabled);
    const total = rows.length;
    // Mock cursor: encode as numeric offset string
    const skip = cursor ? parseInt(cursor, 10) || 0 : 0;
    const sliced = rows.slice(skip, skip + limit);
    const nextOffset = skip + sliced.length;
    const nextCursor = nextOffset < total ? String(nextOffset) : undefined;
    return { rows: sliced, total, nextCursor };
  }

  // Real N8N
  const { search, language, layer, enabled, limit = 50, cursor } = query;
  const url = new URL(tableRowsUrl());
  url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);
  url.searchParams.set("sortBy", "keyword:asc");

  const filters: Record<string, unknown> = {};
  if (language) filters["language"] = language;
  if (layer) filters["layer_main"] = layer;
  if (enabled !== undefined) filters["enabled"] = enabled;
  if (search) filters["keyword"] = search;
  if (Object.keys(filters).length > 0) {
    url.searchParams.set("filter", JSON.stringify(filters));
  }

  const res = await n8nFetch(url.toString(), {
    method: "GET",
    headers: n8nHeaders(),
  });
  const data = (await res.json()) as { data?: SeedKeyword[]; nextCursor?: string };
  return {
    rows: data.data ?? [],
    nextCursor: data.nextCursor,
  };
}

export async function createSeedKeyword(
  input: SeedKeywordInput
): Promise<SeedKeyword> {
  if (isMockMode()) {
    const newRow: SeedKeyword = {
      seed_id: `seed-${randomUUID().slice(0, 8)}`,
      keyword: input.keyword,
      language: input.language,
      layer_main: input.layer_main,
      enabled: input.enabled ?? true,
      fetch_count: 0,
      fetch_history: "[]",
      anchor: input.anchor ?? "",
      disabled_reason: input.disabled_reason ?? "",
    };
    getMockMap().set(newRow.seed_id, newRow);
    return newRow;
  }

  const url = new URL(tableRowsUrl());
  url.searchParams.set("returnType", "full");
  const res = await n8nFetch(url.toString(), {
    method: "POST",
    headers: n8nHeaders(),
    body: JSON.stringify({ data: [input] }),
  });
  const data = (await res.json()) as { data?: SeedKeyword[] };
  const row = data.data?.[0];
  if (!row) throw new Error("N8N returned empty data on create");
  return row;
}

export async function updateSeedKeyword(
  id: string,
  patch: SeedKeywordPatch
): Promise<SeedKeyword> {
  if (isMockMode()) {
    const map = getMockMap();
    const existing = map.get(id);
    if (!existing) throw Object.assign(new Error("Row not found"), { status: 404 });
    const updated: SeedKeyword = { ...existing, ...patch };
    map.set(id, updated);
    return updated;
  }

  const res = await n8nFetch(`${tableRowsUrl()}/update`, {
    method: "PATCH",
    headers: n8nHeaders(),
    body: JSON.stringify({ filter: { id }, data: patch, returnData: true, dryRun: false }),
  });
  const data = (await res.json()) as { data?: SeedKeyword[] };
  const row = data.data?.[0];
  if (!row) throw new Error("N8N returned empty data on update");
  return row;
}

export async function deleteSeedKeyword(
  id: string
): Promise<{ ok: true }> {
  if (isMockMode()) {
    const map = getMockMap();
    if (!map.has(id)) throw Object.assign(new Error("Row not found"), { status: 404 });
    map.delete(id);
    return { ok: true };
  }

  const url = new URL(`${tableRowsUrl()}/delete`);
  url.searchParams.set("filter", JSON.stringify({ id }));
  url.searchParams.set("returnData", "false");
  await n8nFetch(url.toString(), {
    method: "DELETE",
    headers: n8nHeaders(),
  });
  return { ok: true };
}
