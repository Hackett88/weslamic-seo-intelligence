"use client";

const MAX_ENTRIES = 5;
const KEY_PREFIX = "weslamic:history:";

export type HistorySummary = {
  rowsTotal: number;
  rowsNew?: number;
  rowsCached?: number;
  unitsActual?: number;
  totalBatches?: number;
  failedBatches?: number;
};

export type HistoryEntry<TRows = unknown> = {
  id: string;
  endpoint: string;
  submittedAt: number;
  label: string;
  tooltip?: string;
  rows: TRows[];
  summary: HistorySummary;
  dataSource?: string;
  params?: unknown;
};

function storageKey(endpoint: string) {
  return `${KEY_PREFIX}${endpoint.toLowerCase()}`;
}

export function loadHistory<R = unknown>(endpoint: string): HistoryEntry<R>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(endpoint));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is HistoryEntry<R> =>
        x &&
        typeof x === "object" &&
        typeof (x as HistoryEntry<R>).id === "string" &&
        Array.isArray((x as HistoryEntry<R>).rows)
    );
  } catch {
    return [];
  }
}

export function appendHistory<R = unknown>(
  endpoint: string,
  entry: Omit<HistoryEntry<R>, "id" | "submittedAt" | "endpoint">
): HistoryEntry<R>[] {
  if (typeof window === "undefined") return [];
  const list = loadHistory<R>(endpoint);
  const full: HistoryEntry<R> = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    endpoint,
    submittedAt: Date.now(),
    ...entry,
  };
  const next = [full, ...list].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(storageKey(endpoint), JSON.stringify(next));
  } catch {
    // localStorage 写入失败（quota / 隐私模式），降级返回内存值不持久化
  }
  return next;
}

export function clearHistory(endpoint: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(endpoint));
  } catch {
    /* ignore */
  }
}

export function removeHistoryEntry<R = unknown>(
  endpoint: string,
  id: string
): HistoryEntry<R>[] {
  if (typeof window === "undefined") return [];
  const list = loadHistory<R>(endpoint);
  const next = list.filter((e) => e.id !== id);
  try {
    if (next.length === 0) {
      window.localStorage.removeItem(storageKey(endpoint));
    } else {
      window.localStorage.setItem(storageKey(endpoint), JSON.stringify(next));
    }
  } catch {
    /* ignore */
  }
  return next;
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
