"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, History, Loader2 } from "lucide-react";
import type { ProgressState, W01ResultRow } from "./SeoTaskCard";
import { ResultTable } from "./W01Workspace";
import { HistoryView } from "./HistoryView";
import {
  appendHistory,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
  type HistoryEntry,
} from "@/lib/query-history";

const ENDPOINT_KEY = "W02";
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

const UNITS_PER_MARKET = 10;
const UNITS_PASSWORD_THRESHOLD = 100;

export function W02Workspace() {
  const searchParams = useSearchParams();
  const isMockUrl = searchParams.get("mock") === "1";

  const [keyword, setKeyword] = useState("");
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
  const [launchPulse, setLaunchPulse] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const recordedRef = useRef(false);
  const submittedKeywordRef = useRef("");
  const submittedMarketsRef = useRef<Market[]>([]);

  useEffect(() => {
    let alive = true;
    loadHistory<W01ResultRow>(ENDPOINT_KEY).then((h) => {
      if (alive) setHistory(h);
    });
    return () => {
      alive = false;
    };
  }, []);

  const trimmedKeyword = keyword.trim();
  const noKeyword = trimmedKeyword.length === 0;
  const marketCount = markets.length;
  const noMarket = marketCount === 0;
  const units = marketCount * UNITS_PER_MARKET;
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
      appendHistory<W01ResultRow>(ENDPOINT_KEY, {
        label: submittedKeywordRef.current || "(空关键词)",
        tooltip: `${submittedKeywordRef.current} · ${submittedMarketsRef.current.join(",").toUpperCase()}`,
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
          keyword: submittedKeywordRef.current,
          markets: submittedMarketsRef.current,
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

  function startStream() {
    const params = new URLSearchParams({
      endpoint: "W02",
      keyword: trimmedKeyword,
      markets: markets.join(","),
    });
    if (isMockUrl) params.set("mock", "1");
    const url = `/api/keywords/fetch?${params.toString()}`;
    setProgress({ status: "submitting" });
    setRows([]);
    setHistoryMode(false);
    recordedRef.current = false;
    submittedKeywordRef.current = trimmedKeyword;
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
    if (noKeyword || noMarket) return;
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
    !noKeyword &&
    !noMarket &&
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
    btnExtraCls =
      "bg-manor-bg2 border border-manor-oxbloodHi text-manor-oxbloodHi hover:bg-manor-oxbloodDim/20";
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
        ? "text-manor-brassDim"
        : "text-manor-brassHi";
  } else {
    statusText = `查询未果 · ${progress.errorMessage ?? "调用失败"}`;
    statusTextCls = "text-manor-oxbloodHi";
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* 顶部工具栏 */}
      {!toolbarCollapsed && (
      <div className="px-5 py-3 border-b border-manor-brass/25 shrink-0 relative">
        <label className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-manor-inkDim">
              <span aria-hidden="true" style={{ width: 3, height: 3, transform: "rotate(45deg)", background: "linear-gradient(135deg, #EFD89A 0%, #A08850 100%)", boxShadow: "0 0 4px rgba(239,216,154,.55)" }} />
              
          关键词（单词 / 短语）
        </label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="input-brass w-full rounded border border-manor-brass/30 bg-[rgba(8,20,13,.85)] px-2 py-1.5 text-xs text-manor-ink placeholder:text-manor-inkFaint"
          placeholder="zikr ring"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* 市场多选 */}
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

          {/* units 估算 */}
          <span className="inline-flex items-center rounded-full border border-manor-brass/30 bg-[rgba(8,20,13,.85)] px-2 py-0.5 text-[11px] text-manor-brassDim tabnum">
            1 词 × {marketCount} 市场 · 预估 {units}u
          </span>
          {needsSecondaryAuth && (
            <span className="text-[11px] text-manor-brassDim">高耗 · 需印玺</span>
          )}
          {noMarket && (
            <span className="text-[11px] text-manor-oxbloodHi">至少选一处市场</span>
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
          <span className={["text-xs", statusTextCls].join(" ")}>
            {statusText}
          </span>
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
          <HistoryView<W01ResultRow>
            entries={history}
            renderTable={(rs) => <ResultTable rows={rs} />}
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
              removeHistoryEntry<W01ResultRow>(ENDPOINT_KEY, id)
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
            提交后这里展示该关键词在各市场的指标对比
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

        {status === "succeeded" && (
          rows.length > 0 ? (
            <ResultTable rows={rows} />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-12">
              <div className="rounded border border-manor-line bg-manor-bg px-4 py-3 text-sm text-manor-inkDim">
                查询完成但未返回数据（可能是 NOTHING_FOUND / EMPTY，或 staging 表中暂无该批次的写入）。
              </div>
            </div>
          )
        )}

        {status === "failed" && (
          <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-12">
            <div className="max-w-md rounded border border-manor-oxbloodDim/40 bg-manor-oxbloodDim/20 px-4 py-3 text-sm text-manor-oxblood">
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
            className="w-80 rounded-lg bg-manor-bg2 p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-2 text-sm font-semibold text-manor-ink">
              二次验证（&gt; {UNITS_PASSWORD_THRESHOLD}u）
            </h4>
            <p className="mb-3 text-xs text-manor-inkDim">
              请输入 8 位数字密码以继续。
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
            {authError && (
              <p className="mt-1 text-xs text-manor-oxbloodHi">{authError}</p>
            )}
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
