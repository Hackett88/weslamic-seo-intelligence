"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { History, Loader2, X, Plus } from "lucide-react";
import type { ProgressState, W10ResultRow } from "./SeoTaskCard";
import { SerpFeatureChips } from "./SerpFeatureChips";
import { HistoryView } from "./HistoryView";
import {
  appendHistory,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
  type HistoryEntry,
} from "@/lib/query-history";

const ENDPOINT_KEY = "W10";
const DATA_SOURCE = "semrush_gap_staging";

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

const GAP_TYPES = [
  { value: "missing",  cn: "缺口词",  hint: "竞品有，你没有" },
  { value: "common",   cn: "共有词",  hint: "你和竞品都有" },
  { value: "untapped", cn: "蓝海词",  hint: "任一竞品有你没有（需 ≥2 个竞品）" },
  { value: "weak",     cn: "弱势词",  hint: "你有但排名 >20" },
] as const;

type GapType = typeof GAP_TYPES[number]["value"];

const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const MAX_COMPETITORS = 4;
const UNITS_PASSWORD_THRESHOLD = 100;

function isDomainValid(domain: string): boolean {
  return (
    domain.length > 0 &&
    !domain.includes("/") &&
    !domain.includes(" ") &&
    domain.includes(".")
  );
}

function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

function calcUnits(
  competitorCount: number,
  gapTypes: GapType[],
  displayLimit: number,
  marketCount: number
): number {
  const nonWeakCount = gapTypes.filter((t) => t !== "weak").length;
  return competitorCount * nonWeakCount * displayLimit * 80 * marketCount + 200;
}

export function W10Workspace() {
  const searchParams = useSearchParams();
  const isMockUrl = searchParams.get("mock") === "1";

  const [ourDomain, setOurDomain] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitorDomains, setCompetitorDomains] = useState<string[]>([]);
  const [competitorError, setCompetitorError] = useState<string | null>(null);
  const [gapTypes, setGapTypes] = useState<GapType[]>(["missing", "common", "untapped", "weak"]);
  const [markets, setMarkets] = useState<Market[]>(["us"]);
  const [displayLimit, setDisplayLimit] = useState<number>(DEFAULT_LIMIT);
  const [progress, setProgress] = useState<ProgressState>({ status: "idle" });
  const [rows, setRows] = useState<W10ResultRow[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [authPwd, setAuthPwd] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const [history, setHistory] = useState<HistoryEntry<W10ResultRow>[]>([]);
  const [historyMode, setHistoryMode] = useState(false);
  const recordedRef = useRef(false);
  const submittedOurDomainRef = useRef("");
  const submittedCompetitorDomainsRef = useRef<string[]>([]);
  const submittedGapTypesRef = useRef<GapType[]>([]);
  const submittedMarketsRef = useRef<Market[]>([]);
  const submittedDisplayLimitRef = useRef<number>(DEFAULT_LIMIT);

  useEffect(() => {
    setHistory(loadHistory<W10ResultRow>(ENDPOINT_KEY));
  }, []);

  const trimmedOurDomain = ourDomain.trim().toLowerCase();
  const isOurDomainInvalid = !isDomainValid(trimmedOurDomain);

  // untapped 需要 ≥2 个竞品，自动移除
  useEffect(() => {
    if (competitorDomains.length < 2 && gapTypes.includes("untapped")) {
      setGapTypes((prev) => prev.filter((t) => t !== "untapped"));
    }
  }, [competitorDomains.length, gapTypes]);

  const noCompetitor = competitorDomains.length === 0;
  const noGapTypes = gapTypes.length === 0;
  const marketCount = markets.length;
  const noMarket = marketCount === 0;
  const limitInRange = displayLimit >= MIN_LIMIT && displayLimit <= MAX_LIMIT;
  const units = calcUnits(
    Math.max(competitorDomains.length, 1),
    gapTypes.length > 0 ? gapTypes : ["missing"],
    displayLimit,
    Math.max(marketCount, 1)
  );
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
      const label = `${submittedOurDomainRef.current} vs ${submittedCompetitorDomainsRef.current.length} 个竞品`;
      const next = appendHistory<W10ResultRow>(ENDPOINT_KEY, {
        label,
        tooltip: `${submittedOurDomainRef.current} · ${submittedMarketsRef.current.map(m => m.toUpperCase()).join(",")}`,
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
          ourDomain: submittedOurDomainRef.current,
          competitorDomains: submittedCompetitorDomainsRef.current,
          gapTypes: submittedGapTypesRef.current,
          markets: submittedMarketsRef.current,
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

  function addCompetitor() {
    const normalized = normalizeDomain(competitorInput);
    if (!normalized) return;
    if (!isDomainValid(normalized)) {
      setCompetitorError("请输入纯域名（如 amazon.com）");
      return;
    }
    if (competitorDomains.includes(normalized)) {
      setCompetitorError("该域名已添加");
      return;
    }
    if (competitorDomains.length >= MAX_COMPETITORS) return;
    setCompetitorDomains((prev) => [...prev, normalized]);
    setCompetitorInput("");
    setCompetitorError(null);
  }

  function removeCompetitor(domain: string) {
    setCompetitorDomains((prev) => prev.filter((d) => d !== domain));
  }

  function toggleGapType(value: GapType) {
    if (value === "untapped" && competitorDomains.length < 2) return;
    setGapTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  }

  function startStream() {
    const params = new URLSearchParams({
      endpoint: "W10",
      our_domain: trimmedOurDomain,
      competitor_domains: competitorDomains.join(","),
      gap_types: gapTypes.join(","),
      markets: markets.join(","),
      display_limit: String(displayLimit),
    });
    if (isMockUrl) params.set("mock", "1");
    const url = `/api/keywords/fetch?${params.toString()}`;
    setProgress({ status: "submitting" });
    setRows([]);
    setHistoryMode(false);
    recordedRef.current = false;
    submittedOurDomainRef.current = trimmedOurDomain;
    submittedCompetitorDomainsRef.current = [...competitorDomains];
    submittedGapTypesRef.current = [...gapTypes];
    submittedMarketsRef.current = [...markets];
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
        const data = JSON.parse((ev as MessageEvent).data) as { rows: W10ResultRow[] };
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
          if (typeof payload.rows_new === "number") next.rowsNew = payload.rows_new;
          if (typeof payload.rows_cached === "number") next.rowsCached = payload.rows_cached;
          if (typeof payload.units_actual === "number") next.unitsActual = payload.units_actual;
          if (typeof payload.total_batches === "number") next.totalBatches = payload.total_batches;
          if (typeof payload.failed_batches === "number") next.failedBatches = payload.failed_batches;
          if (evt.node_status === "failed") {
            const errObj = payload?.error;
            const msg =
              typeof errObj === "string"
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
    if (isOurDomainInvalid || noCompetitor || noGapTypes || noMarket || !limitInRange) return;
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
    !isOurDomainInvalid &&
    !noCompetitor &&
    !noGapTypes &&
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
    btnExtraCls = "bg-white border border-red-400 text-red-600 hover:bg-red-50";
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
    if (progress.unitsActual != null) parts.push(`实耗 ${progress.unitsActual}u`);
    statusText = parts.join(" · ");
    statusTextCls = "text-emerald-700";
  } else {
    statusText = `查询失败：${progress.errorMessage ?? "调用失败"}`;
    statusTextCls = "text-red-600";
  }

  const reachedMaxCompetitors = competitorDomains.length >= MAX_COMPETITORS;

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* 顶部工具栏 */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white shrink-0">
        {/* 行 1：our_domain + display_limit */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-9">
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              我方域名（our_domain，不带 https:// 或 path）
            </label>
            <input
              type="text"
              value={ourDomain}
              onChange={(e) => setOurDomain(e.target.value)}
              className={[
                "w-full rounded border px-2 py-1.5 text-xs outline-none focus:ring-2",
                isOurDomainInvalid && ourDomain.length > 0
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-300 focus:border-emerald-400 focus:ring-emerald-100",
              ].join(" ")}
              placeholder="weslamic.com"
            />
            {isOurDomainInvalid && ourDomain.length > 0 && (
              <p className="mt-1 text-[11px] text-red-600">
                请输入纯域名（如 weslamic.com）
              </p>
            )}
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              每维度取词数 N（{MIN_LIMIT}-{MAX_LIMIT}）
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

        {/* 行 2：竞品域名列表 */}
        <div className="mt-3">
          <label className="mb-1 block text-[11px] font-medium text-gray-500">
            竞品域名列表（最多 {MAX_COMPETITORS} 个，不带 https://）
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={competitorInput}
              onChange={(e) => {
                setCompetitorInput(e.target.value);
                setCompetitorError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCompetitor();
                }
              }}
              disabled={reachedMaxCompetitors}
              className={[
                "flex-1 rounded border px-2 py-1.5 text-xs outline-none focus:ring-2",
                reachedMaxCompetitors
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : competitorError
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-300 focus:border-emerald-400 focus:ring-emerald-100",
              ].join(" ")}
              placeholder={reachedMaxCompetitors ? "已达 4 个上限" : "amazon.com"}
            />
            <button
              type="button"
              onClick={addCompetitor}
              disabled={reachedMaxCompetitors || !competitorInput.trim()}
              className={[
                "inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                reachedMaxCompetitors || !competitorInput.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700",
              ].join(" ")}
            >
              <Plus size={12} />
              添加
            </button>
          </div>
          {competitorError && (
            <p className="mt-1 text-[11px] text-red-600">{competitorError}</p>
          )}
          {reachedMaxCompetitors && (
            <p className="mt-1 text-[11px] text-amber-600">已达 4 个竞品域名上限</p>
          )}
          {/* 已添加的竞品 chip 列表 */}
          {competitorDomains.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {competitorDomains.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => removeCompetitor(d)}
                    className="ml-0.5 rounded-full text-indigo-400 hover:text-indigo-700"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {noCompetitor && (
            <p className="mt-1 text-[11px] text-red-500">至少需要 1 个竞品域名</p>
          )}
        </div>

        {/* 行 3：gap_types 多选 + 市场单选 */}
        <div className="mt-3 flex flex-wrap items-start gap-4">
          {/* gap_types chips */}
          <div>
            <p className="mb-1 text-[11px] font-medium text-gray-500">分析维度（可多选）</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {GAP_TYPES.map((gt) => {
                const isUntappedDisabled = gt.value === "untapped" && competitorDomains.length < 2;
                const checked = gapTypes.includes(gt.value);
                return (
                  <button
                    key={gt.value}
                    type="button"
                    title={isUntappedDisabled ? "需至少 2 个竞品域名" : gt.hint}
                    disabled={isUntappedDisabled}
                    onClick={() => toggleGapType(gt.value)}
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors select-none",
                      isUntappedDisabled
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : checked
                          ? gapTypeCheckedCls(gt.value)
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400",
                    ].join(" ")}
                  >
                    {checked && !isUntappedDisabled && (
                      <span className="text-current opacity-70">✓</span>
                    )}
                    {gt.cn}
                    {isUntappedDisabled && (
                      <span className="ml-0.5 text-[10px] text-gray-400">（需≥2竞品）</span>
                    )}
                  </button>
                );
              })}
            </div>
            {noGapTypes && (
              <p className="mt-1 text-[11px] text-red-500">至少选一个分析维度</p>
            )}
          </div>

          {/* 市场多选 */}
          <div>
            <p className="mb-1 text-[11px] font-medium text-gray-500">市场</p>
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
            {noMarket && (
              <p className="mt-1 text-[11px] text-red-500">至少选 1 个市场</p>
            )}
          </div>
        </div>

        {/* 行 4：units 估算 + 操作区 */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
            {competitorDomains.length} 竞品 × {gapTypes.filter((t) => t !== "weak").length} API维度 × {displayLimit} 条 × 80u × {marketCount} 市场 ≈ 预估 {units.toLocaleString()}u
          </span>
          {needsSecondaryAuth && (
            <span className="text-[11px] text-amber-600">需密码门</span>
          )}
          {!limitInRange && (
            <span className="text-[11px] text-red-600">N 取值 {MIN_LIMIT}-{MAX_LIMIT}</span>
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
                !canSubmit && !isRunning ? "disabled:opacity-50 disabled:cursor-not-allowed" : "",
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
          <span className={["text-xs", statusTextCls].join(" ")}>{statusText}</span>
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
          <HistoryView<W10ResultRow>
            entries={history}
            renderTable={(rs) => <GapResultTable rows={rs} />}
            onClose={() => setHistoryMode(false)}
            onRemove={(id) =>
              setHistory(removeHistoryEntry<W10ResultRow>(ENDPOINT_KEY, id))
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
            填写我方域名与竞品域名，选择分析维度后提交，结果将在此展示
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

        {status === "succeeded" &&
          (rows.length > 0 ? (
            <GapResultTable rows={rows} />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-12">
              <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                查询完成但未返回数据（可能是 NOTHING_FOUND / EMPTY，或 staging 表中暂无该批次的写入）。
              </div>
            </div>
          ))}

        {status === "failed" && (
          <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-12">
            <div className="max-w-md rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-medium">查询失败</p>
              <p className="mt-1 text-xs">{progress.errorMessage ?? "调用失败"}</p>
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
              请输入 8 位数字密码以继续。本次预估约 {units.toLocaleString()}u。
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
            {authError && <p className="mt-1 text-xs text-red-600">{authError}</p>}
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

// 辅助：gap_type chip 颜色
function gapTypeCheckedCls(value: string): string {
  switch (value) {
    case "missing":  return "border-red-300 bg-red-50 text-red-700";
    case "common":   return "border-blue-300 bg-blue-50 text-blue-700";
    case "untapped": return "border-purple-300 bg-purple-50 text-purple-700";
    case "weak":     return "border-yellow-300 bg-yellow-50 text-yellow-700";
    default:         return "border-gray-300 bg-gray-50 text-gray-700";
  }
}

function gapTypeBadgeCls(value: string | null): string {
  switch (value) {
    case "missing":  return "border-red-200 bg-red-50 text-red-700";
    case "common":   return "border-blue-200 bg-blue-50 text-blue-700";
    case "untapped": return "border-purple-200 bg-purple-50 text-purple-700";
    case "weak":     return "border-yellow-200 bg-yellow-50 text-yellow-700";
    default:         return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

const GAP_TYPE_LABELS: Record<string, string> = {
  missing:  "缺口词",
  common:   "共有词",
  untapped: "蓝海词",
  weak:     "弱势词",
};

function GapResultTable({ rows }: { rows: W10ResultRow[] }) {
  // 排序：先 gap_type 字母升序，组内按 search_volume 降序
  const sorted = [...rows].sort((a, b) => {
    const ga = a.gap_type ?? "";
    const gb = b.gap_type ?? "";
    if (ga !== gb) return ga.localeCompare(gb);
    const va = a.search_volume ?? 0;
    const vb = b.search_volume ?? 0;
    return vb - va;
  });

  return (
    <div>
      <div className="px-5 py-2 flex items-center justify-between border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          域名差距分析 · 共 {rows.length} 行
        </span>
        <span className="text-[11px] text-gray-400">
          数据源：semrush_gap_staging
        </span>
      </div>

      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-gray-50 text-gray-500">
          <tr className="border-b border-gray-200">
            <th className="px-4 py-2 text-left font-medium">维度</th>
            <th className="px-4 py-2 text-left font-medium">关键词</th>
            <th className="px-4 py-2 text-right font-medium">你的排名</th>
            <th className="px-4 py-2 text-right font-medium">竞品最优排名</th>
            <th className="px-4 py-2 text-left font-medium">竞品域名</th>
            <th className="px-4 py-2 text-right font-medium">月搜量</th>
            <th className="px-4 py-2 text-right font-medium">KD</th>
            <th className="px-4 py-2 text-right font-medium">CPC</th>
            <th className="px-4 py-2 text-left font-medium">关键词 SERP 特征</th>
            <th className="px-4 py-2 text-left font-medium">域名 SERP 特征</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, idx) => (
            <tr
              key={`${r.gap_type}-${r.keyword}-${idx}`}
              className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors"
            >
              <td className="px-4 py-2">
                <span
                  className={[
                    "inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    gapTypeBadgeCls(r.gap_type),
                  ].join(" ")}
                >
                  {GAP_TYPE_LABELS[r.gap_type ?? ""] ?? r.gap_type ?? "—"}
                </span>
              </td>
              <td className="px-4 py-2 text-gray-900 font-medium">{r.keyword || "—"}</td>
              <td className="px-4 py-2 text-right text-gray-700">
                {r.our_position === null || r.our_position === 0
                  ? <span className="text-gray-400">未上榜</span>
                  : r.our_position}
              </td>
              <td className="px-4 py-2 text-right text-gray-700">
                {r.competitor_position != null ? r.competitor_position : "—"}
              </td>
              <td className="px-4 py-2 text-gray-600 truncate max-w-[160px]">
                {r.competitor_domain ?? "—"}
              </td>
              <td className="px-4 py-2 text-right text-gray-700">
                {r.search_volume != null ? r.search_volume.toLocaleString() : "—"}
              </td>
              <td className="px-4 py-2 text-right text-gray-700">
                {r.keyword_difficulty != null ? r.keyword_difficulty : "—"}
              </td>
              <td className="px-4 py-2 text-right text-gray-700">
                {r.cpc != null ? `$${r.cpc.toFixed(2)}` : "—"}
              </td>
              <td className="px-4 py-2 align-top max-w-[260px]">
                <SerpFeatureChips codes={r.keyword_serp_features_codes} />
              </td>
              <td className="px-4 py-2 align-top max-w-[260px]">
                <SerpFeatureChips codes={r.domain_serp_features_codes} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
