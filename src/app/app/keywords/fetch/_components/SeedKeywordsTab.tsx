"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { SeedKeyword } from "@/contracts/seed-keyword";
import { SwitchInline } from "./SwitchInline";
import { SeedKeywordEditDialog } from "./SeedKeywordEditDialog";
import { SecondaryAuthDialog } from "./SecondaryAuthDialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EnabledFilter = "all" | "enabled" | "disabled";

interface Filters {
  search: string;
  enabledFilter: EnabledFilter;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQueryString(
  filters: Filters,
  limit: number,
  cursor: string | undefined
): string {
  const p = new URLSearchParams();
  if (filters.search) p.set("search", filters.search);
  if (filters.enabledFilter === "enabled") p.set("enabled", "true");
  if (filters.enabledFilter === "disabled") p.set("enabled", "false");
  p.set("limit", String(limit));
  if (cursor) p.set("cursor", cursor);
  return p.toString();
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SeedKeywordsTab() {
  const [rows, setRows] = useState<SeedKeyword[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Cursor-based pagination
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    enabledFilter: "all",
  });
  const [searchInput, setSearchInput] = useState("");

  // Dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<SeedKeyword | undefined>();

  // Switch-triggered secondary auth
  const [switchAuthOpen, setSwitchAuthOpen] = useState(false);
  const pendingSwitchRef = useRef<{ row: SeedKeyword; newVal: boolean } | null>(null);

  // Delete confirmation + secondary auth
  const [deleteTarget, setDeleteTarget] = useState<SeedKeyword | null>(null);
  const [deleteAuthOpen, setDeleteAuthOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Debounce search — reset pagination on change
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setCursorStack([]);
      setCurrentCursor(undefined);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch rows
  const fetchRows = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setFetchError("");
      try {
        const qs = buildQueryString(filters, PAGE_SIZE, currentCursor);
        const res = await fetch(`/api/seed-keywords?${qs}`, { signal });
        if (signal?.aborted) return;
        if (!res.ok) {
          const d = (await res.json()) as { message?: string };
          setFetchError(d.message ?? "加载失败");
          return;
        }
        const data = (await res.json()) as {
          rows: SeedKeyword[];
          total?: number;
          nextCursor?: string;
          is_mock?: boolean;
        };
        setRows(data.rows);
        setTotal(data.total);
        setNextCursor(data.nextCursor);
        if (data.is_mock !== undefined) setIsMock(data.is_mock);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setFetchError("网络错误");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [filters, currentCursor]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchRows(controller.signal);
    return () => controller.abort();
  }, [fetchRows]);

  // Pagination handlers
  function handleNextPage() {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, currentCursor ?? ""]);
    setCurrentCursor(nextCursor);
  }

  function handlePrevPage() {
    const stack = [...cursorStack];
    const prev = stack.pop();
    setCursorStack(stack);
    setCurrentCursor(prev === "" ? undefined : prev);
  }

  const currentPage = cursorStack.length + 1;
  const hasPrev = cursorStack.length > 0 || currentCursor !== undefined;
  const hasNext = !!nextCursor;

  // Inline switch handler
  function handleSwitchClick(row: SeedKeyword, newVal: boolean) {
    pendingSwitchRef.current = { row, newVal };
    setSwitchAuthOpen(true);
  }

  async function doSwitchUpdate() {
    const pending = pendingSwitchRef.current;
    if (!pending) return;
    try {
      const res = await fetch(`/api/seed-keywords/${pending.row.seed_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: pending.newVal }),
      });
      if (!res.ok) return;
      const updated = (await res.json()) as SeedKeyword;
      setRows((prev) =>
        prev.map((r) => (r.seed_id === updated.seed_id ? updated : r))
      );
    } catch {
      /* silent; re-fetch will reconcile */
    }
    pendingSwitchRef.current = null;
  }

  // Delete handler — open custom centered confirmation dialog
  function handleDelete(row: SeedKeyword) {
    setDeleteTarget(row);
    setDeleteError("");
  }

  // 删除是破坏性操作 — 每次都强制弹密码门，不复用 cookie
  function doDelete() {
    if (!deleteTarget) return;
    setDeleteError("");
    setDeleteAuthOpen(true);
  }

  async function executeDelete() {
    const target = deleteTarget;
    if (!target) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/seed-keywords/${target.seed_id}`, {
        method: "DELETE",
      });

      if (res.status === 401) {
        const data = (await res.json().catch(() => ({}))) as { code?: string };
        if (
          data.code === "SECONDARY_AUTH_EXPIRED" ||
          data.code === "SECONDARY_AUTH_REQUIRED"
        ) {
          setDeleteAuthOpen(true);
          return;
        }
        setDeleteError("登录已过期，请刷新页面");
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setDeleteError(data.message ?? "删除失败");
        return;
      }

      setRows((prev) => prev.filter((r) => r.seed_id !== target.seed_id));
      if (total !== undefined) setTotal((t) => (t !== undefined ? t - 1 : undefined));
      setDeleteTarget(null);
    } catch {
      setDeleteError("网络错误，请重试");
    } finally {
      setDeleteLoading(false);
    }
  }

  function openCreate() {
    setEditMode("create");
    setEditTarget(undefined);
    setEditOpen(true);
  }

  function openEdit(row: SeedKeyword) {
    setEditMode("edit");
    setEditTarget(row);
    setEditOpen(true);
  }

  function handleSaved(saved: SeedKeyword) {
    if (editMode === "create") {
      setRows((prev) => [saved, ...prev]);
      if (total !== undefined) setTotal((t) => (t !== undefined ? t + 1 : undefined));
    } else {
      setRows((prev) => prev.map((r) => (r.seed_id === saved.seed_id ? saved : r)));
    }
  }

  // Reset pagination when filters change (except search — handled by debounce)
  function handleFilterChange(update: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...update }));
    setCursorStack([]);
    setCurrentCursor(undefined);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mock banner */}
      {isMock && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          当前为 Mock 数据，D8 切真 N8N
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索关键词..."
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
          />

          {/* Enabled filter */}
          <select
            value={filters.enabledFilter}
            onChange={(e) =>
              handleFilterChange({ enabledFilter: e.target.value as EnabledFilter })
            }
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="all">全部状态</option>
            <option value="enabled">启用</option>
            <option value="disabled">禁用</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch import (v1 placeholder) */}
          <button
            type="button"
            disabled
            title="v1.1 支持批量 CSV 导入"
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed"
          >
            批量导入 CSV
          </button>

          {/* New */}
          <button
            type="button"
            onClick={openCreate}
            className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
          >
            + 新增种子词
          </button>
        </div>
      </div>

      {/* Error */}
      {fetchError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-auto max-h-[calc(100vh-320px)] min-h-[320px]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                keyword
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                language
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                layer_main
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                enabled
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                fetch_count
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                fetch_history
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                anchor
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                disabled_reason
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs whitespace-nowrap">
                seed_id
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 10 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-gray-200 w-full" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center text-gray-400 text-sm"
                >
                  没有找到符合条件的种子词。点击「新增种子词」开始添加。
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row) => (
                <tr
                  key={row.seed_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.keyword}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {row.language || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {row.layer_main || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <SwitchInline
                      checked={row.enabled}
                      onChange={(v) => handleSwitchClick(row, v)}
                      label={`${row.keyword} 启用状态`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {row.fetch_count}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                    <span title={row.fetch_history}>{row.fetch_history}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[140px] truncate">
                    <span title={row.anchor}>{row.anchor || "-"}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                    <span title={row.disabled_reason}>
                      {row.disabled_reason || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {row.seed_id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        title="编辑"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        title="删除"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          本页 {rows.length} 条
          {total !== undefined && ` · 共 ${total} 条`}
          {` · 第 ${currentPage} 页`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={!hasPrev || loading}
            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <span className="px-2">第 {currentPage} 页</span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={!hasNext || loading}
            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      </div>

      {/* Edit / Create dialog */}
      <SeedKeywordEditDialog
        open={editOpen}
        mode={editMode}
        initial={editTarget}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
      />

      {/* Switch secondary auth */}
      <SecondaryAuthDialog
        open={switchAuthOpen}
        onSuccess={() => {
          setSwitchAuthOpen(false);
          doSwitchUpdate();
        }}
        onCancel={() => {
          setSwitchAuthOpen(false);
          pendingSwitchRef.current = null;
        }}
      />

      {/* Delete confirmation (centered) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !deleteLoading && setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white shadow-2xl"
          >
            <div className="p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">确认删除</h2>
                <p className="text-sm text-gray-600 mt-2">
                  确认删除「
                  <span className="font-medium text-gray-900">
                    {deleteTarget.keyword}
                  </span>
                  」？
                </p>
                <p className="text-xs text-gray-400 mt-1">此操作不可撤销。</p>
              </div>

              {deleteError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                  {deleteError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={doDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteLoading ? "删除中..." : "确认删除"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete secondary auth */}
      <SecondaryAuthDialog
        open={deleteAuthOpen}
        onSuccess={() => {
          setDeleteAuthOpen(false);
          executeDelete();
        }}
        onCancel={() => {
          setDeleteAuthOpen(false);
        }}
      />
    </div>
  );
}
