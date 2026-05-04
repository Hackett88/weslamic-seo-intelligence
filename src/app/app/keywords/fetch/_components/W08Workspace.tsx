"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { History, Loader2 } from "lucide-react";
import type { ProgressState, W08ResultRow } from "./SeoTaskCard";
import { HistoryView } from "./HistoryView";
import {
  appendHistory,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
  type HistoryEntry,
} from "@/lib/query-history";

const ENDPOINT_KEY = "W08";
const DATA_SOURCE = "semrush_sem_advertisers_staging（mode='adwords'）";

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

const UNITS_PER_ROW = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const UNITS_PASSWORD_THRESHOLD = 100;

export function W08Workspace() {
  const searchParams = useSearchParams();
  const isMockUrl = searchParams.get("mock") === "1";

  const [advertiserDomain, setAdvertiserDomain] = useState("");
  const [market, setMarket] = useState<Market>("us");
  const [displayLimit, setDisplayLimit] = useState<number>(DEFAULT_LIMIT);
  const [progress, setProgress] = useState<ProgressState>({ status: "idle" });
  const [rows, setRows] = useState<W08ResultRow[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [authPwd, setAuthPwd] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const [history, setHistory] = useState<HistoryEntry<W08ResultRow>[]>([]);
  const [historyMode, setHistoryMode] = useState(false);
  const recordedRef = useRef(false);
  const submittedDomainRef = useRef("");
  const submittedMarketRef = useRef<Market>("us");
  const submittedDisplayLimitRef = useRef<number>(DEFAULT_LIMIT);

  useEffect(() => {
    setHistory(loadHistory<W08ResultRow>(ENDPOINT_KEY));
  }, []);

  const trimmedDomain = advertiserDomain.trim().toLowerCase();
  const isDomainInvalid =
    trimmedDomain.length === 0 ||
    trimmedDomain.includes("/") ||
    trimmedDomain.includes(" ") ||
    !trimmedDomain.includes(".");
  const noMarket = !market;
  const limitInRange = displayLimit >= MIN_LIMIT && displayLimit <= MAX_LIMIT;
  const units = displayLimit * UNITS_PER_ROW;
  const needsSecondaryAuth = units >= UNITS_PASSWORD_THRESHOLD;

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
      const next = appendHistory<W08ResultRow>(ENDPOINT_KEY, {
        label: submittedDomainRef.current || "(空域名)",
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
          advertiserDomain: submittedDomainRef.current,
          market: submittedMarketRef.current,
          displayLimit: submittedDisplayLimitRef.current,
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
      endpoint: "W08",
      advertiser_domain: trimmedDomain,
      market,
      display_limit: String(displayLimit),
    });
    if (isMockUrl) params.set("mock", "1");
    const url = `/api/keywords/fetch?${params.toString()}`;
    setProgress({ status: "submitting" });
    setRows([]);
    setHistoryMode(false);
    recordedRef.current = false;
    submittedDomainRef.current = trimmedDomain;
    submittedMarketRef.current = market;
    submittedDisplayLimitRef.current = displayLimit;
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
        const data = JSON.parse((ev as MessageEvent).data) as { rows: W08ResultRow[] };
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
    if (isDomainInvalid || noMarket || !limitInRange) return;
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
    !isDomainInvalid &&
    !noMarket &&
    limitInRange &&
    (status === "idle" || status === "succeeded" || status === "failed");

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

  let statusText: string;
  let statusTextCls = "text-gray-500";
  if (status === "idle") {
    statusText = "等待提交";
  } else if (isRunning) {
    statusText = `处理中… ${progress.nodeName ?? ""} (seq ${progress.seq ?? 0}/${progress.totalEstimated ?? 6})`;
    statusTextCls = "text-emerald-700";
  } else if (status === "succeeded") {
    const parts = [`已完成 · 返回 ${rows.length} 行`];
    if (progress.unitsActual != null)
      parts.push(`实耗 ${progress.unitsActual}u`);
    statusText = parts.join(" · ");
    statusTextCls = "text-emerald-700";
  } else {
    statusText = `查询失败：${progress.errorMessage ?? "调用失败"}`;
    statusTextCls = "text-red-600";
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* 顶部工具栏 */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* 竞品域名主输入 */}
          <div className="lg:col-span-9">
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              竞品域名（不带 https:// 或 path）
            </label>
            <input
              type="text"
              value={advertiserDomain}
              onChange={(e) => setAdvertiserDomain(e.target.value)}
              className={[
                "w-full rounded border px-2 py-1.5 text-xs outline-none focus:ring-2",
                isDomainInvalid && advertiserDomain.length > 0
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-300 focus:border-emerald-400 focus:ring-emerald-100",
              ].join(" ")}
              placeholder="amazon.com"
            />
            {isDomainInvalid && advertiserDomain.length > 0 && (
              <p className="mt-1 text-[11px] text-red-600">
                请输入纯域名（如 amazon.com）
              </p>
            )}
          </div>

          {/* display_limit */}
          <div className="lg:col-span-3">
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              取广告词数 N（{MIN_LIMIT}-{MAX_LIMIT}）
            </label>
            <input
              type="number"
              min={MIN_LIMIT}
              max={MAX_LIMIT}
              value={displayLimit}
              onChange={(e) => {
                const n = Number(e.target.value);
                setDisplayLimit(Number.isFinite(n) ? n : DEFAULT_LIMIT);
              }}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* 市场单选 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {MARKETS.map((m) => {
              const checked = market === m.value;
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
                    type="radio"
                    name="w08-market"
                    checked={checked}
                    onChange={() => setMarket(m.value)}
                    className="h-3 w-3 accent-emerald-600"
                  />
                  <span>
                    {m.cn} {m.code}
                  </span>
                </label>
              );
            })}
          </div>

          {/* units 估算 */}
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
            {displayLimit} 行 × 1 市场 · 预估 {units}u
          </span>
          {needsSecondaryAuth && (
            <span className="text-[11px] text-amber-600">需密码门</span>
          )}
          {!limitInRange && (
            <span className="text-[11px] text-red-600">
              N 取值 {MIN_LIMIT}-{MAX_LIMIT}
            </span>
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

      {/* 状态横条 */}
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

      {/* 主体结果区 */}
      <div className="flex-1 overflow-auto bg-white">
        {historyMode ? (
          <HistoryView<W08ResultRow>
            entries={history}
            renderTable={(rs) => <AdwordsResultTable rows={rs} />}
            onClose={() => setHistoryMode(false)}
            onRemove={(id) =>
              setHistory(removeHistoryEntry<W08ResultRow>(ENDPOINT_KEY, id))
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
            提交后这里展示该竞品当前在投的广告词
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
            <AdwordsResultTable rows={rows} />
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

function AdwordsResultTable({ rows }: { rows: W08ResultRow[] }) {
  const sorted = [...rows].sort((a, b) => {
    // 按 position 升序，null 排末尾
    const pa = a.position ?? Infinity;
    const pb = b.position ?? Infinity;
    return pa - pb;
  });

  return (
    <div>
      <div className="px-5 py-2 flex items-center justify-between border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          竞品广告词 · 共 {rows.length} 行
        </span>
        <span className="text-[11px] text-gray-400">
          数据源：semrush_sem_advertisers_staging（mode=&apos;adwords&apos;）
        </span>
      </div>

      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-gray-50 text-gray-500">
          <tr className="border-b border-gray-200">
            <th className="px-5 py-2 text-right font-medium">排名</th>
            <th className="px-5 py-2 text-left font-medium">广告词</th>
            <th className="px-5 py-2 text-left font-medium">落地展示 URL</th>
            <th className="px-5 py-2 text-left font-medium">广告标题</th>
            <th className="px-5 py-2 text-left font-medium">广告描述</th>
            <th className="px-5 py-2 text-left font-medium">市场</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, idx) => (
            <tr
              key={`${r.market}-${r.keyword}-${idx}`}
              className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors"
            >
              <td className="px-5 py-2 text-right text-gray-700">
                {r.position != null ? r.position : "—"}
              </td>
              <td className="px-5 py-2 text-gray-900">{r.keyword || "—"}</td>
              <td className="px-5 py-2 text-gray-700 truncate max-w-[180px]">
                {r.visible_url ?? "—"}
              </td>
              <td className="px-5 py-2 text-gray-700 truncate max-w-[240px]">
                {r.ad_title ?? "—"}
              </td>
              <td className="px-5 py-2 text-gray-500 truncate max-w-[320px]">
                {r.ad_description ?? "—"}
              </td>
              <td className="px-5 py-2 text-gray-700 uppercase">{r.market || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
