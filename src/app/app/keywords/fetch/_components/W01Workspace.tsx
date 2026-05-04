"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { History, Loader2 } from "lucide-react";
import type { ProgressState, W01ResultRow } from "./SeoTaskCard";
import { HistoryView } from "./HistoryView";
import {
  appendHistory,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
  type HistoryEntry,
} from "@/lib/query-history";

const ENDPOINT_KEY = "W01";
const DATA_SOURCE = "semrush_keywords_staging";

type Market =
  | "sa"
  | "id"
  | "my"
  | "ae"
  | "uk"
  | "fr"
  | "de"
  | "es"
  | "us";

const MARKETS: { value: Market; cn: string; code: string }[] = [
  { value: "sa", cn: "沙特", code: "SA" },
  { value: "id", cn: "印尼", code: "ID" },
  { value: "my", cn: "马来西亚", code: "MY" },
  { value: "ae", cn: "阿联酋", code: "AE" },
  { value: "uk", cn: "英国", code: "UK" },
  { value: "fr", cn: "法国", code: "FR" },
  { value: "de", cn: "德国", code: "DE" },
  { value: "es", cn: "西班牙", code: "ES" },
  { value: "us", cn: "美国", code: "US" },
];
const UNITS_PER_LINE = 10;
const MAX_LINES = 100;
const UNITS_PASSWORD_THRESHOLD = 100;

export function W01Workspace() {
  const searchParams = useSearchParams();
  const isMockUrl = searchParams.get("mock") === "1";

  const [keywords, setKeywords] = useState("");
  const [markets, setMarkets] = useState<Market[]>(["sa"]);
  const [progress, setProgress] = useState<ProgressState>({ status: "idle" });
  const [rows, setRows] = useState<W01ResultRow[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [authPwd, setAuthPwd] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const [history, setHistory] = useState<HistoryEntry<W01ResultRow>[]>([]);
  const [historyMode, setHistoryMode] = useState(false);
  const recordedRef = useRef(false);
  const submittedKeywordsRef = useRef("");
  const submittedMarketsRef = useRef<Market[]>([]);

  useEffect(() => {
    setHistory(loadHistory<W01ResultRow>(ENDPOINT_KEY));
  }, []);

  const lines = keywords
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const lineCount = lines.length;
  const overLimit = lineCount > MAX_LINES;
  const marketCount = markets.length;
  const noMarket = marketCount === 0;
  const units = lineCount * UNITS_PER_LINE * marketCount;
  const needsSecondaryAuth = units >= UNITS_PASSWORD_THRESHOLD;

  function toggleMarket(value: Market) {
    setMarkets((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (
      progress.status === "succeeded" &&
      !progress.mock &&
      !recordedRef.current
    ) {
      recordedRef.current = true;
      const kws = submittedKeywordsRef.current
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const label =
        kws.length === 0
          ? "(空关键词)"
          : kws.length === 1
          ? kws[0]
          : `${kws[0]} 等 ${kws.length} 个`;
      const next = appendHistory<W01ResultRow>(ENDPOINT_KEY, {
        label,
        tooltip: `${kws.join(", ")} · ${submittedMarketsRef.current.join(",").toUpperCase()}`,
        rows,
        summary: {
          rowsTotal: rows.length,
          rowsNew: progress.rowsNew,
          rowsCached: progress.rowsCached,
          unitsActual: progress.unitsActual,
          totalBatches: progress.totalBatches,
          failedBatches: progress.failedBatches,
        },
        dataSource: DATA_SOURCE,
        params: {
          keywords: submittedKeywordsRef.current,
          markets: submittedMarketsRef.current,
        },
      });
      setHistory(next);
    }
  }, [
    progress.status,
    progress.mock,
    progress.rowsNew,
    progress.rowsCached,
    progress.unitsActual,
    progress.totalBatches,
    progress.failedBatches,
    rows,
  ]);

  function startStream() {
    const params = new URLSearchParams({
      endpoint: "W01",
      keywords: lines.join("\n"),
      markets: markets.join(","),
    });
    if (isMockUrl) params.set("mock", "1");
    const url = `/api/keywords/fetch?${params.toString()}`;
    setProgress({ status: "submitting" });
    setRows([]);
    setHistoryMode(false);
    recordedRef.current = false;
    submittedKeywordsRef.current = keywords;
    submittedMarketsRef.current = [...markets];
    esRef.current?.close();
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("banner", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        setProgress((p) => ({ ...p, mock: !!data.mock }));
      } catch {
        /* ignore */
      }
    });

    es.addEventListener("rows", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as { rows: W01ResultRow[] };
        setRows(Array.isArray(data.rows) ? data.rows : []);
      } catch {
        /* ignore */
      }
    });

    es.onmessage = (ev) => {
      try {
        const evt = JSON.parse(ev.data);
        const payload = evt.payload ?? {};
        setProgress((p) => {
          const next: ProgressState = {
            ...p,
            status:
              evt.node_name === "_done"
                ? evt.node_status === "failed"
                  ? "failed"
                  : "succeeded"
                : evt.node_status === "failed"
                  ? p.status === "submitting"
                    ? "running"
                    : p.status
                  : "running",
            nodeName: evt.node_name,
            nodeStatus: evt.node_status,
            seq: typeof evt.seq === "number" ? evt.seq : p.seq,
            totalEstimated: 6,
          };
          if (typeof payload.rows_new === "number")
            next.rowsNew = payload.rows_new;
          if (typeof payload.rows_cached === "number")
            next.rowsCached = payload.rows_cached;
          if (typeof payload.units_actual === "number")
            next.unitsActual = payload.units_actual;
          if (typeof payload.total_batches === "number")
            next.totalBatches = payload.total_batches;
          if (typeof payload.failed_batches === "number")
            next.failedBatches = payload.failed_batches;
          if (evt.node_status === "failed") {
            const errObj = payload?.error;
            const msg = typeof errObj === "string"
              ? errObj
              : errObj && typeof errObj === "object" && "message" in errObj
                ? String((errObj as { message: unknown }).message)
                : "节点失败";
            next.errorMessage = msg;
          }
          return next;
        });
        if (evt.node_name === "_done") {
          es.close();
          esRef.current = null;
        }
      } catch {
        /* ignore parse */
      }
    };

    es.onerror = () => {
      setProgress((p) =>
        p.status === "succeeded"
          ? p
          : { ...p, status: "failed", errorMessage: "SSE 连接中断" }
      );
      es.close();
      esRef.current = null;
    };
  }

  async function handleSubmit() {
    if (overLimit || lineCount === 0 || noMarket) return;
    if (needsSecondaryAuth) {
      const checkRes = await fetch("/api/n8n/secondary-auth/check");
      if (!checkRes.ok) {
        setShowAuth(true);
        return;
      }
    }
    startStream();
  }

  async function submitAuth() {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/n8n/secondary-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: authPwd }),
      });
      if (!res.ok) {
        setAuthError("密码错误");
        return;
      }
      setShowAuth(false);
      setAuthPwd("");
      startStream();
    } catch {
      setAuthError("网络错误");
    } finally {
      setAuthSubmitting(false);
    }
  }

  const status = progress.status;
  const isRunning = status === "running" || status === "submitting";
  const canSubmit =
    !overLimit &&
    lineCount > 0 &&
    !noMarket &&
    (status === "idle" || status === "succeeded" || status === "failed");

  // 按钮态
  let btnLabel = "开始查询";
  let btnExtraCls = "bg-emerald-600 hover:bg-emerald-700 text-white";
  if (isRunning) {
    btnLabel = "查询中…";
    btnExtraCls = "bg-emerald-300 text-white cursor-not-allowed";
  } else if (status === "succeeded") {
    btnLabel = "再查一次";
    btnExtraCls = "bg-emerald-600 hover:bg-emerald-700 text-white";
  } else if (status === "failed") {
    btnLabel = "重试";
    btnExtraCls =
      "bg-white border border-red-400 text-red-600 hover:bg-red-50";
  }

  // 状态横条文案
  let statusText: string;
  let statusTextCls = "text-gray-500";
  if (status === "idle") {
    statusText = "等待提交";
  } else if (isRunning) {
    statusText = `处理中… ${progress.nodeName ?? ""} (seq ${progress.seq ?? 0}/${progress.totalEstimated ?? 6})`;
    statusTextCls = "text-emerald-700";
  } else if (status === "succeeded") {
    const parts = [`已完成 · 返回 ${rows.length} 行`];
    if (progress.totalBatches != null) {
      parts.push(`${progress.totalBatches} 个市场`);
    }
    if (progress.failedBatches != null && progress.failedBatches > 0) {
      parts.push(`其中 ${progress.failedBatches} 个失败`);
    }
    if (progress.unitsActual != null)
      parts.push(`实耗 ${progress.unitsActual}u`);
    statusText = parts.join(" · ");
    statusTextCls =
      progress.failedBatches && progress.failedBatches > 0
        ? "text-amber-600"
        : "text-emerald-700";
  } else {
    statusText = `查询失败：${progress.errorMessage ?? "调用失败"}`;
    statusTextCls = "text-red-600";
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* 顶部工具栏：第 1 行 textarea 占满整行；第 2 行 market + 徽章 + 启动 */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white shrink-0">
        <label className="mb-1 block text-[11px] font-medium text-gray-500">
          关键词（每行 1 词，最多 {MAX_LINES} 行）
        </label>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="w-full min-h-[180px] rounded border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          placeholder="hijab&#10;abaya&#10;ramadan dates"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* 市场多选（平铺一排，9 个市场） */}
          <div className="flex flex-wrap items-center gap-1.5">
            {MARKETS.map((m) => {
              const checked = markets.includes(m.value);
              return (
                <label
                  key={m.value}
                  className={[
                    "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors select-none",
                    checked
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-emerald-300",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMarket(m.value)}
                    className="h-3 w-3 accent-emerald-600"
                  />
                  <span>
                    {m.cn} {m.code}
                  </span>
                </label>
              );
            })}
          </div>

          {/* units 估算徽章 */}
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
            {lineCount} 行 × {marketCount} 市场 · 预估 {units}u
          </span>
          {needsSecondaryAuth && (
            <span className="text-[11px] text-amber-600">需密码门</span>
          )}
          {overLimit && (
            <span className="text-[11px] text-red-600">超出 {MAX_LINES}</span>
          )}
          {noMarket && (
            <span className="text-[11px] text-red-600">至少选 1 个市场</span>
          )}

          {/* 启动 + 历史按钮 */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={[
                "inline-flex items-center justify-center gap-1.5 rounded px-4 py-1.5 text-xs font-medium transition-colors",
                btnExtraCls,
                !canSubmit && status !== "running" && status !== "submitting"
                  ? "disabled:opacity-50 disabled:cursor-not-allowed"
                  : "",
              ].join(" ")}
            >
              {isRunning && <Loader2 size={13} className="animate-spin" />}
              {btnLabel}
            </button>
            <button
              type="button"
              onClick={() => setHistoryMode((v) => !v)}
              disabled={history.length === 0}
              title={
                history.length === 0
                  ? "暂无历史记录"
                  : `查看最近 ${history.length} 次查询`
              }
              className={[
                "inline-flex items-center justify-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors",
                historyMode
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-emerald-400 hover:text-emerald-700",
                history.length === 0
                  ? "disabled:opacity-50 disabled:cursor-not-allowed"
                  : "",
              ].join(" ")}
            >
              <History size={13} />
              历史 {history.length > 0 && `(${history.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* 状态横条（结果区顶部）：灰底 + 4 状态文字 + amber Mock chip */}
      <div className="px-5 py-2 border-t border-b border-gray-200 bg-gray-50/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className={["text-xs", statusTextCls].join(" ")}>
            {statusText}
          </span>
          {isRunning && (
            <div className="relative h-1 flex-1 max-w-[220px] overflow-hidden rounded-full bg-gray-200">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, rgba(16,185,129,0.45) 25%, transparent 25%, transparent 50%, rgba(16,185,129,0.45) 50%, rgba(16,185,129,0.45) 75%, transparent 75%, transparent 100%)",
                  backgroundSize: "10px 10px",
                  animation: "progress-stripes 1.1s linear infinite",
                }}
              />
            </div>
          )}
          {progress.mock && (
            <span className="ml-auto rounded border border-amber-500 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
              Mock 模式
            </span>
          )}
        </div>
      </div>

      {/* 主体结果区（参照 KeywordTable 区：白底 / 可滚动 / 表格化） */}
      <div className="flex-1 overflow-auto bg-white">
        {historyMode ? (
          <HistoryView<W01ResultRow>
            entries={history}
            renderTable={(rs) => <ResultTable rows={rs} />}
            onClose={() => setHistoryMode(false)}
            onRemove={(id) =>
              setHistory(removeHistoryEntry<W01ResultRow>(ENDPOINT_KEY, id))
            }
            onClear={() => {
              clearHistory(ENDPOINT_KEY);
              setHistory([]);
              setHistoryMode(false);
            }}
          />
        ) : (
          <>
        {status === "idle" && (
          <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-12 text-sm text-gray-400">
            提交后这里展示返回的关键词指标表
          </div>
        )}

        {isRunning && (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-12">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
            <span className="text-sm text-gray-500">
              查询中… 结果表将在完成后显示
            </span>
          </div>
        )}

        {status === "succeeded" && (
          rows.length > 0 ? (
            <ResultTable rows={rows} />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-12">
              <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                查询完成但未返回数据（可能是 NOTHING_FOUND / EMPTY，或 staging 表中暂无该批次的写入）。
              </div>
            </div>
          )
        )}

        {status === "failed" && (
          <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-12">
            <div className="max-w-md rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-medium">查询失败</p>
              <p className="mt-1 text-xs">
                {progress.errorMessage ?? "调用失败"}
              </p>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* 二次验证弹窗 */}
      {showAuth && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !authSubmitting && setShowAuth(false)}
        >
          <div
            className="w-80 rounded-lg bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              二次验证（≥ {UNITS_PASSWORD_THRESHOLD}u）
            </h4>
            <p className="mb-3 text-xs text-gray-500">
              请输入 8 位数字密码以继续。
            </p>
            <input
              type="password"
              value={authPwd}
              onChange={(e) => setAuthPwd(e.target.value)}
              maxLength={8}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-400"
              placeholder="••••••••"
              autoFocus
            />
            {authError && (
              <p className="mt-1 text-xs text-red-600">{authError}</p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAuth(false)}
                disabled={authSubmitting}
                className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={submitAuth}
                disabled={authSubmitting || authPwd.length === 0}
                className="rounded bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {authSubmitting ? "校验中..." : "确认"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 结果表：N8N staging 表的真实数据，按 (market, keyword) 排序
// W02 与 W01 同表同列，复用此组件
export function ResultTable({ rows }: { rows: W01ResultRow[] }) {
  const sorted = [...rows].sort((a, b) => {
    if (a.market !== b.market) return a.market.localeCompare(b.market);
    return a.keyword.localeCompare(b.keyword);
  });
  return (
    <div>
      <div className="px-5 py-2 flex items-center justify-between border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          返回结果 · 共 {rows.length} 行
        </span>
        <span className="text-[11px] text-gray-400">
          数据源：semrush_keywords_staging
        </span>
      </div>

      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-gray-50 text-gray-500">
          <tr className="border-b border-gray-200">
            <th className="px-5 py-2 text-left font-medium">市场</th>
            <th className="px-5 py-2 text-left font-medium">关键词</th>
            <th className="px-5 py-2 text-right font-medium">月搜量</th>
            <th className="px-5 py-2 text-right font-medium">KD</th>
            <th className="px-5 py-2 text-right font-medium">CPC</th>
            <th className="px-5 py-2 text-right font-medium">竞争度</th>
            <th className="px-5 py-2 text-right font-medium">结果数</th>
            <th className="px-5 py-2 text-left font-medium">Intent</th>
            <th className="px-5 py-2 text-left font-medium">Trends</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={`${r.market}-${r.keyword}`}
              className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors"
            >
              <td className="px-5 py-2 text-gray-700 uppercase">{r.market}</td>
              <td className="px-5 py-2 text-gray-900">{r.keyword}</td>
              <td className="px-5 py-2 text-right text-gray-700">
                {r.search_volume != null ? r.search_volume.toLocaleString() : "—"}
              </td>
              <td className="px-5 py-2 text-right text-gray-700">
                {r.keyword_difficulty != null ? r.keyword_difficulty : "—"}
              </td>
              <td className="px-5 py-2 text-right text-gray-700">
                {r.cpc != null ? r.cpc.toFixed(2) : "—"}
              </td>
              <td className="px-5 py-2 text-right text-gray-700">
                {r.competition != null ? r.competition.toFixed(2) : "—"}
              </td>
              <td className="px-5 py-2 text-right text-gray-700">
                {r.number_of_results != null
                  ? r.number_of_results.toLocaleString()
                  : "—"}
              </td>
              <td className="px-5 py-2 text-gray-700">{r.intent ?? "—"}</td>
              <td className="px-5 py-2 text-gray-500 truncate max-w-[160px]">
                {r.trends ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
