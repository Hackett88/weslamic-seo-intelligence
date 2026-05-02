"use client";

// 兼容保留：详情页已切换到 W01Workspace，本组件暂不被引用，保留为后续可能的卡片化嵌入复用。
import { useEffect, useRef, useState } from "react";
import { SeoTaskCard, type ProgressState } from "./SeoTaskCard";

const MARKETS = [
  { value: "sa", cn: "沙特", code: "SA" },
  { value: "id", cn: "印尼", code: "ID" },
  { value: "my", cn: "马来西亚", code: "MY" },
  { value: "ae", cn: "阿联酋", code: "AE" },
  { value: "uk", cn: "英国", code: "UK" },
] as const;
const UNITS_PER_LINE = 10;
const MAX_LINES = 100;
const UNITS_PASSWORD_THRESHOLD = 500;

type Market = (typeof MARKETS)[number]["value"];

export function KeywordMetricsCard() {
  const [keywords, setKeywords] = useState("");
  const [market, setMarket] = useState<Market>("sa");
  const [progress, setProgress] = useState<ProgressState>({ status: "idle" });
  const [showAuth, setShowAuth] = useState(false);
  const [authPwd, setAuthPwd] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const lines = keywords
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const lineCount = lines.length;
  const overLimit = lineCount > MAX_LINES;
  const units = lineCount * UNITS_PER_LINE;
  const needsSecondaryAuth = units >= UNITS_PASSWORD_THRESHOLD;

  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  function startStream() {
    const params = new URLSearchParams({
      endpoint: "W01",
      keywords: lines.join("\n"),
      market,
    });
    const url = `/api/keywords/fetch?${params.toString()}`;
    setProgress({ status: "submitting" });
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

    es.onmessage = (ev) => {
      try {
        const evt = JSON.parse(ev.data);
        const payload = evt.payload ?? {};
        setProgress((p) => {
          const next: ProgressState = {
            ...p,
            status:
              evt.node_status === "failed"
                ? "failed"
                : evt.node_name === "_done" ||
                    (evt.node_status === "succeeded" &&
                      evt.node_name === "_done")
                  ? "succeeded"
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
          if (evt.node_status === "failed") {
            next.errorMessage =
              (payload && payload.error) || "节点失败";
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
    if (overLimit || lineCount === 0) return;

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

  const canSubmit =
    !overLimit &&
    lineCount > 0 &&
    (progress.status === "idle" ||
      progress.status === "succeeded" ||
      progress.status === "failed");

  return (
    <>
      <SeoTaskCard
        title="关键词指标查询"
        description="输入一批词，秒看搜量、难度、CPC"
        progress={progress}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              关键词（每行 1 词，最多 {MAX_LINES} 行）
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={4}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="hijab&#10;abaya&#10;ramadan dates"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
              <span>
                {lineCount} 行 · 预估 {units}u
                {needsSecondaryAuth && (
                  <span className="ml-1 text-amber-600">
                    （≥ {UNITS_PASSWORD_THRESHOLD}u 需密码门）
                  </span>
                )}
              </span>
              {overLimit && (
                <span className="text-red-600">超出上限 {MAX_LINES}</span>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              市场
            </label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value as Market)}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-emerald-400"
            >
              {MARKETS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.cn} {m.code}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            开始查询
          </button>
        </div>
      </SeoTaskCard>

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
    </>
  );
}
