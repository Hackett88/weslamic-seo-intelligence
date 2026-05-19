"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, History, Loader2, X, Plus } from "lucide-react";
import type { ProgressState, W10ResultRow } from "./SeoTaskCard";
import { SerpFeatureChips } from "./SerpFeatureChips";
import { HistoryView } from "./HistoryView";
import { SortableTh, useTableSort, type Getter } from "./SortableTable";
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
  // domain_domains: 80u/row (Semrush official). No overhead/base charge exists.
  // The previously included +200 was a fabricated buffer — removed to match real billing.
  const nonWeakCount = gapTypes.filter((t) => t !== "weak").length;
  return competitorCount * nonWeakCount * displayLimit * 80 * marketCount;
}

export function W10Workspace() {
  const searchParams = useSearchParams();
  const isMockUrl = searchParams.get("mock") === "1";

  const [ourDomain, setOurDomain] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitorDomains, setCompetitorDomains] = useState<string[]>([]);
  const [competitorError, setCompetitorError] = useState<string | null>(null);
  const [gapTypes, setGapTypes] = useState<GapType[]>(["missing", "common", "untapped", "weak"]);
  const [markets, setMarkets] = useState<Market[]>(["sa"]);
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
  const [launchPulse, setLaunchPulse] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const recordedRef = useRef(false);
  const submittedOurDomainRef = useRef("");
  const submittedCompetitorDomainsRef = useRef<string[]>([]);
  const submittedGapTypesRef = useRef<GapType[]>([]);
  const submittedMarketsRef = useRef<Market[]>([]);
  const submittedDisplayLimitRef = useRef<number>(DEFAULT_LIMIT);

  useEffect(() => {
    let alive = true;
    loadHistory<W10ResultRow>(ENDPOINT_KEY).then((h) => {
      if (alive) setHistory(h);
    });
    return () => {
      alive = false;
    };
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
  const needsSecondaryAuth = units > UNITS_PASSWORD_THRESHOLD;

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
      appendHistory<W10ResultRow>(ENDPOINT_KEY, {
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
      })
        .then(setHistory)
        .catch(() => {});
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
  let btnExtraCls = "btn-launch-sage";
  if (isRunning) {
    btnLabel = "查询中…";
    btnExtraCls = "bg-manor-brassDim text-manor-bg cursor-not-allowed opacity-80";
  } else if (status === "succeeded") {
    btnLabel = "再查一次";
    btnExtraCls = "btn-launch-sage";
  } else if (status === "failed") {
    btnLabel = "重试";
    btnExtraCls = "bg-manor-bg2 border border-manor-oxbloodHi text-manor-oxbloodHi hover:bg-manor-oxbloodDim/20";
  }

  let statusText: string;
  let statusTextCls = "text-manor-inkDim";
  if (status === "idle") {
    statusText = "静候启动";
  } else if (isRunning) {
    statusText = `处理中… ${progress.nodeName ?? ""} (seq ${progress.seq ?? 0}/${progress.totalEstimated ?? 6})`;
    statusTextCls = "text-manor-brassHi";
  } else if (status === "succeeded") {
    const parts = [`已完成 · 返回 ${rows.length} 行`];
    if (progress.unitsActual != null) parts.push(`实耗 ${progress.unitsActual}u`);
    statusText = parts.join(" · ");
    statusTextCls = "text-manor-brassHi";
  } else {
    statusText = `查询未果 · ${progress.errorMessage ?? "调用失败"}`;
    statusTextCls = "text-manor-oxbloodHi";
  }

  const reachedMaxCompetitors = competitorDomains.length >= MAX_COMPETITORS;

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* 顶部工具栏 */}
      {!toolbarCollapsed && (
      <div className="px-5 py-3 border-b border-manor-brass/25 shrink-0 relative">
        {/* 行 1：our_domain + display_limit */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-9">
            <label className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-manor-inkDim">
              <span aria-hidden="true" style={{ width: 3, height: 3, transform: "rotate(45deg)", background: "linear-gradient(135deg, #EFD89A 0%, #A08850 100%)", boxShadow: "0 0 4px rgba(239,216,154,.55)" }} />
              
              我方域名（our_domain，不带 https:// 或 path）
            </label>
            <input
              type="text"
              value={ourDomain}
              onChange={(e) => setOurDomain(e.target.value)}
              className={[
                "input-brass w-full rounded border px-2 py-1.5 text-xs",
                isOurDomainInvalid && ourDomain.length > 0
                  ? "border-manor-oxbloodDim/60 focus:border-manor-oxbloodHi focus:ring-manor-oxblood/30"
                  : "border-manor-line2 focus:border-manor-brass focus:ring-manor-brass/25",
              ].join(" ")}
              placeholder="weslamic.com"
            />
            {isOurDomainInvalid && ourDomain.length > 0 && (
              <p className="mt-1 text-[11px] text-manor-oxbloodHi">
                请输入纯域名（如 weslamic.com）
              </p>
            )}
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-manor-inkDim">
              <span aria-hidden="true" style={{ width: 3, height: 3, transform: "rotate(45deg)", background: "linear-gradient(135deg, #EFD89A 0%, #A08850 100%)", boxShadow: "0 0 4px rgba(239,216,154,.55)" }} />
              
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
              className="input-brass w-full rounded border border-manor-brass/30 bg-[rgba(8,20,13,.85)] px-2 py-1.5 text-xs text-manor-ink placeholder:text-manor-inkFaint"
            />
          </div>
        </div>

        {/* 行 2：竞品域名列表 */}
        <div className="mt-3">
          <label className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-manor-inkDim">
              <span aria-hidden="true" style={{ width: 3, height: 3, transform: "rotate(45deg)", background: "linear-gradient(135deg, #EFD89A 0%, #A08850 100%)", boxShadow: "0 0 4px rgba(239,216,154,.55)" }} />
              
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
                "input-brass flex-1 rounded border px-2 py-1.5 text-xs",
                reachedMaxCompetitors
                  ? "bg-manor-bg3 text-manor-inkFaint border-manor-line cursor-not-allowed"
                  : competitorError
                    ? "border-manor-oxbloodDim/60 focus:border-manor-oxbloodHi focus:ring-manor-oxblood/30"
                    : "border-manor-line2 focus:border-manor-brass focus:ring-manor-brass/25",
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
                  ? "bg-manor-bg3 text-manor-inkFaint cursor-not-allowed"
                  : "bg-manor-sageDim text-manor-ink hover:bg-manor-sageDim",
              ].join(" ")}
            >
              <Plus size={12} />
              添加
            </button>
          </div>
          {competitorError && (
            <p className="mt-1 text-[11px] text-manor-oxbloodHi">{competitorError}</p>
          )}
          {reachedMaxCompetitors && (
            <p className="mt-1 text-[11px] text-manor-brassDim">已达 4 个竞品域名上限</p>
          )}
          {/* 已添加的竞品 chip 列表 */}
          {competitorDomains.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {competitorDomains.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 rounded-full border border-manor-line2 bg-manor-bg3 px-2 py-0.5 text-[11px] text-manor-brassHi"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => removeCompetitor(d)}
                    className="ml-0.5 rounded-full text-manor-brass hover:text-manor-brassHi"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {noCompetitor && (
            <p className="mt-1 text-[11px] text-manor-oxblood">至少需要 1 个竞品域名</p>
          )}
        </div>

        {/* 行 3：gap_types 多选 + 市场单选 */}
        <div className="mt-3 flex flex-wrap items-start gap-4">
          {/* gap_types chips */}
          <div>
            <p className="mb-1 text-[11px] font-medium text-manor-inkDim">分析维度（可多选）</p>
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
                        ? "border-manor-line bg-manor-bg3 text-manor-inkFaint cursor-not-allowed"
                        : checked
                          ? gapTypeCheckedCls(gt.value)
                          : "border-manor-line2 bg-manor-bg2 text-manor-inkDim hover:border-manor-line2",
                    ].join(" ")}
                  >
                    {checked && !isUntappedDisabled && (
                      <span className="text-current opacity-70">✓</span>
                    )}
                    {gt.cn}
                    {isUntappedDisabled && (
                      <span className="ml-0.5 text-[10px] text-manor-inkFaint">（需≥2竞品）</span>
                    )}
                  </button>
                );
              })}
            </div>
            {noGapTypes && (
              <p className="mt-1 text-[11px] text-manor-oxblood">至少选一个分析维度</p>
            )}
          </div>

          {/* 市场多选 */}
          <div>
            <p className="mb-1 text-[11px] font-medium text-manor-inkDim">市场</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {MARKETS.map((m) => {
                const checked = markets.includes(m.value);
                return (
                  <label
                    key={m.value}
                    className={[
                      "market-chip inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] select-none",
                      checked
                        ? "border-[#EFD89A]/65 bg-[rgba(36,72,50,.85)] text-[#F0DEA0] shadow-[inset_0_1px_0_rgba(240,222,160,.25),0_0_10px_-2px_rgba(123,166,125,.55)]"
                        : "border-manor-brass/25 bg-[rgba(12,26,18,.85)] text-manor-ink/85 hover:border-[#EFD89A]/60 hover:bg-[rgba(20,42,28,.95)] hover:text-manor-brassHi",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMarket(m.value)}
                      className="h-3 w-3 accent-manor-brass"
                    />
                    <span>
                      {m.cn} {m.code}
                    </span>
                  </label>
                );
              })}
            </div>
            {noMarket && (
              <p className="mt-1 text-[11px] text-manor-oxblood">至少选一处市场</p>
            )}
          </div>
        </div>

        {/* 行 4：units 估算 + 操作区 */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-manor-brass/30 bg-[rgba(8,20,13,.85)] px-2 py-0.5 text-[11px] text-manor-brassDim tabnum">
            {competitorDomains.length} 竞品 × {gapTypes.filter((t) => t !== "weak").length} API维度 × {displayLimit} 条 × 80u × {marketCount} 市场 ≈ 预估 {units.toLocaleString()}u
          </span>
          {needsSecondaryAuth && (
            <span className="text-[11px] text-manor-brassDim">高耗 · 需印玺</span>
          )}
          {!limitInRange && (
            <span className="text-[11px] text-manor-oxbloodHi">N 取值 {MIN_LIMIT}-{MAX_LIMIT}</span>
          )}

          {/* 启动 + 历史按钮 */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (canSubmit) {
                  setLaunchPulse(true);
                  setTimeout(() => setLaunchPulse(false), 750);
                }
                handleSubmit();
              }}
              disabled={!canSubmit}
              className={[
                "dispatch-launch inline-flex items-center justify-center gap-1.5 rounded px-4 py-1.5 text-xs font-medium transition-colors",
                launchPulse ? "is-launching" : "",
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
                  ? "border-[#EFD89A]/65 bg-[rgba(36,72,50,.85)] text-[#F0DEA0] shadow-[inset_0_1px_0_rgba(240,222,160,.25),0_0_10px_-2px_rgba(123,166,125,.55)]"
                  : "border-manor-brass/30 text-manor-ink/85 hover:border-manor-brassHi hover:text-manor-brassHi bg-[rgba(12,26,18,.85)] hover:bg-[rgba(20,42,28,.95)]",
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
      )}

      {!historyMode && (<>
      {/* 状态横条 */}
      <div className="px-5 py-2 border-t border-b border-manor-brass/35 shrink-0 bg-[rgba(8,20,13,.85)]">
        <div className="flex items-center gap-3">
          <span className={["text-xs", statusTextCls].join(" ")}>{statusText}</span>
          {isRunning && (
            <div className="progress-track relative h-1 flex-1 max-w-[220px] overflow-hidden rounded-full bg-manor-bg4">
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
            <span className="ml-auto rounded border border-manor-brass bg-manor-brassDim/15 px-2 py-0.5 text-xs text-manor-brassHi">
              Mock 模式
            </span>
          )}
        </div>
      </div></>
      )}

      {!historyMode && (
      <div className="px-3 py-1 border-b border-manor-brass/15 shrink-0 bg-[rgba(8,20,13,.6)] flex justify-end">
        <button
          type="button"
          onClick={() => setToolbarCollapsed((v) => !v)}
          title={toolbarCollapsed ? "展开工具栏" : "收起工具栏 · 让数据区占满"}
          aria-label={toolbarCollapsed ? "展开工具栏" : "收起工具栏"}
          className="inline-flex items-center justify-center rounded border px-1.5 py-0.5 transition-colors border-manor-brass/30 text-manor-brassDim hover:border-manor-brassHi hover:text-manor-brassHi bg-[rgba(12,26,18,.85)] hover:bg-[rgba(20,42,28,.95)]"
        >
          {toolbarCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>
      )}

      {/* 主体结果区 */}
      <div className="flex-1 overflow-auto bg-[rgba(6,16,11,.6)]">
        {historyMode ? (
          <HistoryView<W10ResultRow>
            entries={history}
            renderTable={(rs) => <GapResultTable rows={rs} />}
            extraRightControls={
            <button
              type="button"
              onClick={() => setToolbarCollapsed((v) => !v)}
              title={toolbarCollapsed ? "展开工具栏" : "收起工具栏 · 让数据区占满"}
              aria-label={toolbarCollapsed ? "展开工具栏" : "收起工具栏"}
              className="inline-flex items-center justify-center rounded border px-1.5 py-0.5 transition-colors border-manor-brass/30 text-manor-brassDim hover:border-manor-brassHi hover:text-manor-brassHi bg-[rgba(12,26,18,.85)] hover:bg-[rgba(20,42,28,.95)]"
            >
              {toolbarCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>            }
            onClose={() => setHistoryMode(false)}
            onRemove={(id) =>
              removeHistoryEntry<W10ResultRow>(ENDPOINT_KEY, id)
                .then(setHistory)
                .catch(() => {})
            }
            onClear={() => {
              clearHistory(ENDPOINT_KEY)
                .then(() => setHistory([]))
                .catch(() => setHistory([]));
              setHistoryMode(false);
            }}
          />
        ) : (
          <>
        {status === "idle" && (
          <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-12 text-sm text-manor-inkFaint">
            填写我方域名与竞品域名，选择分析维度后提交，结果将在此展示
          </div>
        )}

        {isRunning && (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-12">
            <Loader2 size={28} className="animate-spin text-manor-brass" />
            <span className="text-sm text-manor-inkDim">
              查询中… 结果表将在完成后显示
            </span>
          </div>
        )}

        {status === "succeeded" &&
          (rows.length > 0 ? (
            <GapResultTable rows={rows} />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-12">
              <div className="rounded border border-manor-line bg-manor-bg px-4 py-3 text-sm text-manor-inkDim">
                查询完成但未返回数据（可能是 NOTHING_FOUND / EMPTY，或 staging 表中暂无该批次的写入）。
              </div>
            </div>
          ))}

        {status === "failed" && (
          <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-12">
            <div className="max-w-md rounded border border-manor-oxbloodDim/40 bg-manor-oxbloodDim/20 px-4 py-3 text-sm text-manor-oxblood">
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
            className="w-80 rounded-lg bg-manor-bg2 p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-2 text-sm font-semibold text-manor-ink">
              二次验证（&gt; {UNITS_PASSWORD_THRESHOLD}u）
            </h4>
            <p className="mb-3 text-xs text-manor-inkDim">
              请输入 8 位数字密码以继续。本次预估约 {units.toLocaleString()}u。
            </p>
            <input
              type="password"
              value={authPwd}
              onChange={(e) => setAuthPwd(e.target.value)}
              maxLength={8}
              className="input-brass w-full rounded border border-manor-brass/30 bg-[rgba(8,20,13,.85)] px-2 py-1.5 text-sm text-manor-ink placeholder:text-manor-inkFaint"
              placeholder="••••••••"
              autoFocus
            />
            {authError && <p className="mt-1 text-xs text-manor-oxbloodHi">{authError}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAuth(false)}
                disabled={authSubmitting}
                className="rounded border border-manor-brass/40 px-3 py-1 text-xs text-manor-ink/85 hover:border-manor-brassHi hover:text-manor-brassHi transition-colors" style={{background:"linear-gradient(180deg, rgba(20,42,28,.92), rgba(8,20,13,.96))"}}
              >
                取消
              </button>
              <button
                type="button"
                onClick={submitAuth}
                disabled={authSubmitting || authPwd.length === 0}
                className="rounded px-3 py-1 text-xs btn-launch-sage disabled:opacity-50"
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
    case "missing":  return "border-manor-oxbloodDim/60 bg-manor-oxbloodDim/20 text-manor-oxblood";
    case "common":   return "border-manor-line2 bg-manor-bg3 text-manor-brassHi";
    case "untapped": return "border-manor-line2 bg-manor-bg3 text-manor-brassHi";
    case "weak":     return "border-manor-brassDim bg-manor-brassDim/15 text-manor-brassHi";
    default:         return "border-manor-line2 bg-manor-bg text-manor-ink";
  }
}

function gapTypeBadgeCls(value: string | null): string {
  switch (value) {
    case "missing":  return "border-manor-oxbloodDim/40 bg-manor-oxbloodDim/20 text-manor-oxblood";
    case "common":   return "border-manor-line2 bg-manor-bg3 text-manor-brassHi";
    case "untapped": return "border-manor-line2 bg-manor-bg3 text-manor-brassHi";
    case "weak":     return "border-manor-brassDim/50 bg-manor-brassDim/15 text-manor-brassHi";
    default:         return "border-manor-line bg-manor-bg text-manor-ink";
  }
}

const GAP_TYPE_LABELS: Record<string, string> = {
  missing:  "缺口词",
  common:   "共有词",
  untapped: "蓝海词",
  weak:     "弱势词",
};

const W10_GETTERS: Record<string, Getter<W10ResultRow>> = {
  gap_type: (r) => r.gap_type,
  keyword: (r) => r.keyword,
  our_position: (r) => r.our_position,
  competitor_position: (r) => r.competitor_position,
  competitor_domain: (r) => r.competitor_domain,
  search_volume: (r) => r.search_volume,
  keyword_difficulty: (r) => r.keyword_difficulty,
  cpc: (r) => r.cpc,
  keyword_serp_features_codes: (r) => r.keyword_serp_features_codes,
  domain_serp_features_codes: (r) => r.domain_serp_features_codes,
};

function GapResultTable({ rows }: { rows: W10ResultRow[] }) {
  // 默认：先 gap_type 字母升序，组内按 search_volume 降序
  const { sortedRows, sortKey, sortDir, toggle } = useTableSort(
    rows,
    W10_GETTERS,
    (rs) =>
      [...rs].sort((a, b) => {
        const ga = a.gap_type ?? "";
        const gb = b.gap_type ?? "";
        if (ga !== gb) return ga.localeCompare(gb);
        const va = a.search_volume ?? 0;
        const vb = b.search_volume ?? 0;
        return vb - va;
      }),
  );
  const sorted = sortedRows;
  const thCls = "px-4 py-2";

  return (
    <div>
      <div className="px-5 py-2 flex items-center justify-between border-b border-manor-brass/25 bg-manor-bg3/40">
        <span className="text-sm font-semibold text-manor-brassHi tracking-[0.06em]" style={{ fontFamily: "var(--font-serif), 'EB Garamond', serif" }}>
          域名差距分析 · 共 {rows.length} 行
        </span>
        <span className="text-[10px] tracking-[0.22em] text-manor-brassDim font-sc" style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif" }}>
          数据源：semrush_gap_staging
        </span>
      </div>

      <table className="w-full text-xs">
        <thead className="thead-sticky-solid text-manor-brassHi tracking-[0.24em] uppercase" style={{backgroundImage:"linear-gradient(180deg, rgba(26,52,36,.97) 0%, rgba(10,24,16,.98) 100%)",boxShadow:"inset 0 1px 0 rgba(224,197,122,.22), inset 0 -1px 0 rgba(0,0,0,.5), 0 1px 0 rgba(224,197,122,.55)"}}>
          <tr className="border-b border-manor-line">
            <SortableTh active={sortKey === "gap_type"} dir={sortDir} onClick={() => toggle("gap_type")} className={thCls}>维度</SortableTh>
            <SortableTh active={sortKey === "keyword"} dir={sortDir} onClick={() => toggle("keyword")} className={thCls}>关键词</SortableTh>
            <SortableTh active={sortKey === "our_position"} dir={sortDir} align="right" onClick={() => toggle("our_position")} className={thCls}>你的排名</SortableTh>
            <SortableTh active={sortKey === "competitor_position"} dir={sortDir} align="right" onClick={() => toggle("competitor_position")} className={thCls}>竞品最优排名</SortableTh>
            <SortableTh active={sortKey === "competitor_domain"} dir={sortDir} onClick={() => toggle("competitor_domain")} className={thCls}>竞品域名</SortableTh>
            <SortableTh active={sortKey === "search_volume"} dir={sortDir} align="right" onClick={() => toggle("search_volume")} className={thCls}>月搜量</SortableTh>
            <SortableTh active={sortKey === "keyword_difficulty"} dir={sortDir} align="right" onClick={() => toggle("keyword_difficulty")} className={thCls}>关键词难度</SortableTh>
            <SortableTh active={sortKey === "cpc"} dir={sortDir} align="right" onClick={() => toggle("cpc")} className={thCls}>CPC</SortableTh>
            <SortableTh active={sortKey === "keyword_serp_features_codes"} dir={sortDir} onClick={() => toggle("keyword_serp_features_codes")} className={thCls}>关键词 SERP 特征</SortableTh>
            <SortableTh active={sortKey === "domain_serp_features_codes"} dir={sortDir} onClick={() => toggle("domain_serp_features_codes")} className={thCls}>域名 SERP 特征</SortableTh>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, idx) => (
            <tr
              key={`${r.gap_type}-${r.keyword}-${idx}`}
              className="row-brass border-b border-manor-brass/8"
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
              <td className="px-4 py-2 text-manor-ink font-medium">{r.keyword || "—"}</td>
              <td className="px-4 py-2 text-right text-manor-ink">
                {r.our_position === null || r.our_position === 0
                  ? <span className="text-manor-inkFaint">未上榜</span>
                  : r.our_position}
              </td>
              <td className="px-4 py-2 text-right text-manor-ink">
                {r.competitor_position != null ? r.competitor_position : "—"}
              </td>
              <td className="px-4 py-2 text-manor-inkDim truncate max-w-[160px]">
                {r.competitor_domain ?? "—"}
              </td>
              <td className="px-4 py-2 text-right text-manor-ink">
                {r.search_volume != null ? r.search_volume.toLocaleString() : "—"}
              </td>
              <td className="px-4 py-2 text-right text-manor-ink">
                {r.keyword_difficulty != null ? r.keyword_difficulty : "—"}
              </td>
              <td className="px-4 py-2 text-right text-manor-ink">
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
