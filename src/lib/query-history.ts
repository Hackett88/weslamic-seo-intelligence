"use client";

const MAX_ENTRIES = 5;

export type HistorySummary = {
  rowsTotal: number;
  rowsNew?: number;
  rowsCached?: number;
  unitsActual?: number;
  totalBatches?: number;
  failedBatches?: number;
};

export type HistorySource = "workspace" | "drawer";

export type HistoryEntry<TRows = unknown> = {
  id: string;
  endpoint: string;
  submittedAt: number;
  source: HistorySource;
  label: string;
  tooltip?: string;
  rows: TRows[];
  summary: HistorySummary;
  dataSource?: string;
  params?: unknown;
};

function apiUrl(endpoint: string, extra?: Record<string, string>): string {
  const sp = new URLSearchParams({ endpoint });
  if (extra) {
    for (const [k, v] of Object.entries(extra)) sp.set(k, v);
  }
  return `/api/query-history?${sp.toString()}`;
}

// 服务端响应统一以数组形式返回（最多 MAX_ENTRIES 条，已按 submittedAt 倒序）。
// 出错（401 / 5xx / 网络异常）一律 console.error + 返回空数组，不阻塞 UI。
async function readEntries<R>(res: Response): Promise<HistoryEntry<R>[]> {
  if (!res.ok) {
    // 401 / 4xx / 5xx 一律降级
    console.error(`[query-history] HTTP ${res.status} ${res.statusText}`);
    return [];
  }
  try {
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];
    return data as HistoryEntry<R>[];
  } catch (err) {
    console.error("[query-history] parse error:", err);
    return [];
  }
}

export async function loadHistory<R = unknown>(
  endpoint: string
): Promise<HistoryEntry<R>[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch(apiUrl(endpoint), {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    return await readEntries<R>(res);
  } catch (err) {
    console.error("[query-history] loadHistory failed:", err);
    return [];
  }
}

export async function appendHistory<R = unknown>(
  endpoint: string,
  entry: Omit<HistoryEntry<R>, "id" | "submittedAt" | "endpoint" | "source">,
  source: HistorySource = "workspace"
): Promise<HistoryEntry<R>[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/query-history", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint, source, ...entry }),
    });
    return await readEntries<R>(res);
  } catch (err) {
    console.error("[query-history] appendHistory failed:", err);
    return [];
  }
}

export async function clearHistory(endpoint: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch(apiUrl(endpoint), {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!res.ok) {
      console.error(`[query-history] clearHistory HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("[query-history] clearHistory failed:", err);
  }
}

export async function removeHistoryEntry<R = unknown>(
  endpoint: string,
  id: string
): Promise<HistoryEntry<R>[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch(apiUrl(endpoint, { id }), {
      method: "DELETE",
      credentials: "same-origin",
    });
    return await readEntries<R>(res);
  } catch (err) {
    console.error("[query-history] removeHistoryEntry failed:", err);
    return [];
  }
}

export function formatHistoryTime(submittedAt: number): string {
  const d = new Date(submittedAt);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}-${day} ${h}:${min}`;
}

export const HISTORY_MAX_ENTRIES = MAX_ENTRIES;
