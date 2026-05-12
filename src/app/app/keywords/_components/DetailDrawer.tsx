"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import type { Keyword } from "@/db/schema";
import { SerpFeatureChips } from "../fetch/_components/SerpFeatureChips";
import { bpLabel, csLabel, formatIntent, parseTrends, Sparkline } from "./_utils";

interface DetailDrawerProps {
  keyword: Keyword | null;
  onClose: () => void;
}

// 同月判断：用户 local 月份对比 last_manual_w03_at 的 local 月份（YYYY-MM）。
// 入参为 Date | string | null，统一过 new Date()。
function isSameLocalMonth(ts: Date | string | null | undefined): boolean {
  if (!ts) return false;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// 解析 SSE 流的最小实现：把 ReadableStream 的字节流按 \n\n 切分成 events，
// 抽取 data: 行的 JSON 内容。不区分 event: type —— 调用方按 payload.node_name 自行分发。
async function* readSseEvents(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<{ event: string | null; data: unknown }> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buf.indexOf("\n\n")) !== -1) {
        const block = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        let evName: string | null = null;
        const dataLines: string[] = [];
        for (const line of block.split("\n")) {
          if (line.startsWith(":")) continue;
          if (line.startsWith("event:")) evName = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
        }
        if (dataLines.length === 0) continue;
        try {
          yield { event: evName, data: JSON.parse(dataLines.join("\n")) };
        } catch {
          /* skip invalid */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

interface SerpFeaturesRowProps {
  rowKey: string | null;
  market: string | null;
  keywordText: string;
  initialCodes: string | null;
  initialLastManualW03At: Date | string | null;
}

// SERP 特征行：根据本地状态机决定显示 chips 和 🔍 按钮。
// 点击按钮 → 调 W03 SSE，监听 Refresh Pool 事件后乐观更新本地 state。
// 若用户重开 drawer，会从 server 重新拿到真实状态。
function SerpFeaturesRow({
  rowKey,
  market,
  keywordText,
  initialCodes,
  initialLastManualW03At,
}: SerpFeaturesRowProps) {
  const [codes, setCodes] = useState<string | null>(initialCodes);
  const [lastManualW03At, setLastManualW03At] = useState<Date | string | null>(
    initialLastManualW03At
  );
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // keyword 切换（drawer 切到另一行）时同步初始值
  useEffect(() => {
    setCodes(initialCodes);
    setLastManualW03At(initialLastManualW03At);
    setLoading(false);
    setErrMsg(null);
  }, [rowKey, initialCodes, initialLastManualW03At]);

  const hasCodes = !!codes && codes.trim() !== "";
  const usedThisMonth = isSameLocalMonth(lastManualW03At);
  const showButton = !hasCodes;
  const buttonDisabled = usedThisMonth || loading;

  async function handleClick() {
    if (!rowKey || !market || !keywordText || buttonDisabled) return;
    setLoading(true);
    setErrMsg(null);

    const params = new URLSearchParams({
      endpoint: "W03",
      keyword: keywordText,
      markets: market,
      display_limit: "3",
      refresh_pool: "1",
      row_key: rowKey,
    });
    const url = `/api/keywords/fetch?${params.toString()}`;

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 90_000);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { accept: "text/event-stream" },
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }
      for await (const ev of readSseEvents(res.body)) {
        const data = ev.data as { node_name?: string; node_status?: string; payload?: { codes?: string | null; pg_updated?: boolean } } | null;
        if (!data) continue;
        if (data.node_name === "Refresh Pool") {
          const payload = data.payload ?? {};
          if (payload.pg_updated === true) {
            setLastManualW03At(new Date());
          }
          if (payload.codes !== null && payload.codes !== undefined) {
            setCodes(payload.codes);
          }
          if (data.node_status === "warning") {
            setErrMsg("实时查询出错，请稍后重试");
          }
        }
        if (data.node_name === "_done") break;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrMsg(`实时查询失败：${msg}`);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <SerpFeatureChips codes={codes} />
        </div>
        {showButton && (
          <button
            type="button"
            onClick={handleClick}
            disabled={buttonDisabled}
            title={
              loading
                ? undefined
                : usedThisMonth
                  ? undefined
                  : "实时查询 SERP 特征"
            }
            className={[
              "shrink-0 inline-flex items-center justify-center w-6 h-6 rounded border transition-colors",
              buttonDisabled
                ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                : "border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 cursor-pointer bg-white",
            ].join(" ")}
            aria-label="实时查询 SERP 特征"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
          </button>
        )}
      </div>
      {errMsg && (
        <div className="text-[10px] text-red-500 leading-tight">{errMsg}</div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-400 uppercase tracking-wider leading-none">{label}</span>
      <div className="text-gray-800 text-sm font-medium leading-snug break-all">
        {value === null || value === undefined || value === "" ? <span className="text-gray-300 font-normal">—</span> : value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-emerald-50 px-3 py-1.5 border-b border-emerald-100">
        <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs bg-white">
        {children}
      </div>
    </div>
  );
}

function KdBar({ kd }: { kd: number | null }) {
  if (kd === null || kd === undefined) return <span className="text-gray-300">—</span>;
  const color = kd >= 70 ? "bg-red-500" : kd >= 40 ? "bg-amber-400" : "bg-emerald-500";
  const textCls = kd >= 70 ? "text-red-500" : kd >= 40 ? "text-amber-500" : "text-emerald-600";
  const diffLabel = kd >= 70 ? "高难" : kd >= 40 ? "中等" : "较易";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(kd, 100)}%` }} />
      </div>
      <span className={`text-xs font-semibold w-5 text-right ${textCls}`}>{kd}</span>
      <span className={`text-[10px] ${textCls} w-7`}>{diffLabel}</span>
    </div>
  );
}

function ScorePills({
  value,
  kind,
  max = 3,
}: {
  value: number | null;
  kind: "bp" | "cs";
  max?: number;
}) {
  if (value === null || value === undefined) return <span className="text-gray-300">—</span>;
  const dotCls = ["bg-gray-200", "bg-amber-400", "bg-blue-400", "bg-emerald-500"][value] ?? "bg-gray-200";
  const label = kind === "bp" ? bpLabel(value) : csLabel(value);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i < value ? dotCls : "bg-gray-200"}`} />
        ))}
      </div>
      <span className="text-sm font-medium text-gray-800">{value} / {max}</span>
      {label && <span className="text-xs text-gray-500">{label}</span>}
    </div>
  );
}

function TrendsBig({ trends }: { trends: string | null }) {
  const data = parseTrends(trends);
  if (!data) return <span className="text-gray-300">—</span>;
  return (
    <div className="flex items-center gap-2">
      <Sparkline data={data} width={300} height={80} variant="bar" />
      <span className="text-[10px] text-gray-400">{data.length} 月</span>
    </div>
  );
}

function PipeList({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-300">—</span>;
  const parts = value.split("|").filter((s) => s.trim());
  if (parts.length === 0) return <span className="text-gray-300">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs border bg-gray-50 text-gray-700 border-gray-200">
          {p}
        </span>
      ))}
    </div>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  const d = new Date(date);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yy}/${mm}/${dd} ${hh}:${min}`;
}

const MARKET_LABELS: Record<string, string> = {
  uk: "🇬🇧 英国", gb: "🇬🇧 英国", us: "🇺🇸 美国", sa: "🇸🇦 沙特", ae: "🇦🇪 阿联酋",
  my: "🇲🇾 马来西亚", id: "🇮🇩 印尼", fr: "🇫🇷 法国", de: "🇩🇪 德国", es: "🇪🇸 西班牙",
  au: "🇦🇺 澳大利亚", tr: "🇹🇷 土耳其", eg: "🇪🇬 埃及", pk: "🇵🇰 巴基斯坦", bd: "🇧🇩 孟加拉",
  ng: "🇳🇬 尼日利亚", ma: "🇲🇦 摩洛哥", dz: "🇩🇿 阿尔及利亚", iq: "🇮🇶 伊拉克", jo: "🇯🇴 约旦",
  kw: "🇰🇼 科威特", qa: "🇶🇦 卡塔尔", om: "🇴🇲 阿曼", bh: "🇧🇭 巴林", lb: "🇱🇧 黎巴嫩",
  sy: "🇸🇾 叙利亚", ye: "🇾🇪 也门", tn: "🇹🇳 突尼斯", ly: "🇱🇾 利比亚", sd: "🇸🇩 苏丹",
  ca: "🇨🇦 加拿大", in: "🇮🇳 印度", ph: "🇵🇭 菲律宾", sg: "🇸🇬 新加坡", th: "🇹🇭 泰国",
  vn: "🇻🇳 越南", jp: "🇯🇵 日本", kr: "🇰🇷 韩国", cn: "🇨🇳 中国", tw: "🇹🇼 台湾",
  it: "🇮🇹 意大利", nl: "🇳🇱 荷兰", pl: "🇵🇱 波兰", ru: "🇷🇺 俄罗斯", br: "🇧🇷 巴西",
  mx: "🇲🇽 墨西哥", za: "🇿🇦 南非",
};

export function DetailDrawer({ keyword, onClose }: DetailDrawerProps) {
  if (!keyword) return null;

  return (
    <div className="flex flex-col min-w-[440px]">
      {/* 面板顶部 */}
      <div className="px-5 py-4 border-b border-gray-200 sticky top-0 bg-gray-100 z-10 flex items-start justify-between">
        <div className="min-w-0">
          <h2 className="text-gray-900 text-base font-semibold leading-tight break-all">
            {keyword.keyword}
          </h2>
          <p className="text-gray-400 text-[10px] font-mono mt-2">
            #{keyword.id} · row_key {keyword.rowKey ?? "—"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition-colors mt-0.5 shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* 区块1 - 基本信息 */}
        <Section title="基本信息">
          <Field label="市场" value={keyword.market ? (MARKET_LABELS[keyword.market.toLowerCase()] ?? keyword.market.toUpperCase()) : null} />
          <Field label="月份" value={keyword.month} />
          <Field label="问题类型" value={keyword.questionType} />
          <Field label="受保护" value={keyword.protected === true ? "是" : keyword.protected === false ? "否" : null} />
        </Section>

        {/* 区块2 - 量化指标 */}
        <Section title="量化指标">
          <Field label="搜索量" value={keyword.searchVolume != null ? keyword.searchVolume.toLocaleString() : null} />
          <Field label="CPC ($)" value={keyword.cpc != null ? `$${keyword.cpc.toFixed(2)}` : null} />
          <div className="col-span-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">关键词难度 KD</span>
              <KdBar kd={keyword.keywordDifficulty} />
            </div>
          </div>
          <Field label="SERP 结果总数" value={keyword.numberOfResults != null ? keyword.numberOfResults.toLocaleString() : null} />
          <Field label="搜索意图" value={formatIntent(keyword.intent)} />
        </Section>

        {/* 区块3 - 评分 */}
        <Section title="评分">
          <Field label="BP 业务价值" value={<ScorePills value={keyword.bp} kind="bp" />} />
          <Field label="CS 商业信号" value={<ScorePills value={keyword.cs} kind="cs" />} />
        </Section>

        {/* 区块4 - 趋势 */}
        <Section title="12 月趋势">
          <div className="col-span-2">
            <TrendsBig trends={keyword.trends} />
          </div>
        </Section>

        {/* 区块5 - SERP 特征 */}
        <Section title="SERP 特征">
          <div className="col-span-2">
            <SerpFeaturesRow
              rowKey={keyword.rowKey ?? null}
              market={keyword.market ?? null}
              keywordText={keyword.keyword}
              initialCodes={keyword.serpFeaturesKeyword}
              initialLastManualW03At={keyword.lastManualW03At}
            />
          </div>
        </Section>

        {/* 区块6 - 来源链路 */}
        <Section title="来源链路">
          <div className="col-span-2">
            <Field label="上游 row_keys" value={<PipeList value={keyword.sourceRowKeys} />} />
          </div>
        </Section>

        {/* 时间信息 */}
        <div className="text-xs text-gray-300 border-t border-gray-100 pt-3 flex gap-4">
          <span>创建：{formatDate(keyword.createdAt)}</span>
          <span>更新：{formatDate(keyword.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
