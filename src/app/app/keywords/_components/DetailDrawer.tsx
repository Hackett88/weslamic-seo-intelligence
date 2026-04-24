"use client";

import { X } from "lucide-react";
import type { Keyword } from "@/db/schema";

interface DetailDrawerProps {
  keyword: Keyword | null;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-400 uppercase tracking-wider leading-none">{label}</span>
      <div className="text-gray-800 text-sm font-medium leading-snug">
        {value ?? <span className="text-gray-300 font-normal">—</span>}
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

function LayerBadgeLarge({ layer }: { layer: string | null }) {
  if (!layer) return <span className="text-gray-300">—</span>;
  const colorMap: Record<string, string> = {
    L1: "bg-amber-50 text-amber-700 border-amber-200",
    L2: "bg-blue-50 text-blue-700 border-blue-200",
    L3: "bg-purple-50 text-purple-700 border-purple-200",
    L4: "bg-gray-100 text-gray-500 border-gray-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-semibold border ${colorMap[layer] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}
    >
      {layer}
    </span>
  );
}

function HandlingBadgeLarge({ handling }: { handling: string | null }) {
  if (!handling) return <span className="text-gray-300">—</span>;
  const colorMap: Record<string, string> = {
    independent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    merge: "bg-blue-50 text-blue-700 border-blue-200",
    defer: "bg-gray-100 text-gray-500 border-gray-200",
    exclude: "bg-red-50 text-red-700 border-red-200",
  };
  const labelMap: Record<string, string> = {
    independent: "独立建页",
    merge: "附属合并",
    defer: "暂缓观察",
    exclude: "排除",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-semibold border ${colorMap[handling] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}
    >
      {labelMap[handling] ?? handling}
    </span>
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

function GrowthBadge({ growth }: { growth: string | null }) {
  if (!growth) return <span className="text-gray-300">—</span>;
  const map: Record<string, { label: string; cls: string; arrow: string }> = {
    rising:   { label: "上升", cls: "text-emerald-700 bg-emerald-50 border-emerald-200", arrow: "↑" },
    stable:   { label: "稳定", cls: "text-gray-500 bg-gray-100 border-gray-200",         arrow: "→" },
    declining:{ label: "下降", cls: "text-red-600 bg-red-50 border-red-200",             arrow: "↓" },
  };
  const cfg = map[growth];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${cfg?.cls ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
      <span>{cfg?.arrow}</span>
      <span>{cfg?.label ?? growth}</span>
    </span>
  );
}

function BpBadge({ bp }: { bp: string | null }) {
  const level = bp ? parseInt(bp) : 0;
  const dotCls = ["bg-gray-200", "bg-blue-400", "bg-amber-400", "bg-red-400"][level] ?? "bg-gray-200";
  const labels: Record<string, string> = { "0": "无优先", "1": "低", "2": "中", "3": "高" };
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i <= level ? dotCls : "bg-gray-200"}`} />
        ))}
      </div>
      <span className="text-sm font-medium text-gray-800">{labels[bp ?? ""] ?? "—"}</span>
    </div>
  );
}

function MiniTag({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

const SOURCE_NUM_LABELS: Record<string, string> = {
  "0": "第一方数据词",
  "1": "内部词根",
  "2": "一级竞品词",
  "3": "二级竞品词",
  "4": "SERP 特征词",
  "5": "工具扩展词",
  "6": "社交听取词",
  "7": "搜索行为词",
  "8": "AI 可见度词",
};

const WORD_TYPE_LABELS: Record<string, string> = {
  brand: "品牌词",
  category: "品类词",
  attribute: "属性词",
  scene: "场景词",
  audience: "受众词",
  knowledge: "知识词",
  comparison: "对比词",
  geo: "地域词",
  tool: "工具词",
  competitor: "竞品词",
};

const BEHAVIOR_INTENT_LABELS: Record<string, string> = {
  buy: "购买",
  compare: "比较",
  learn: "学习",
  navigate: "导航",
  tool: "工具使用",
};

const PAGE_PLAN_INTENT_LABELS: Record<string, string> = {
  product: "产品页",
  category: "分类页",
  content: "内容页",
  tool: "工具页",
  landing: "落地页",
};

const BP_LABELS: Record<string, string> = {
  "0": "0 - 无优先",
  "1": "1 - 低优先",
  "2": "2 - 中优先",
  "3": "3 - 高优先",
};

const CP_LABELS: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const CS_LABELS: Record<string, string> = {
  commercial: "商业意图",
  mixed: "混合意图",
  informational: "信息意图",
};

const SA_LABELS: Record<string, string> = {
  enterable: "可进入",
  cautious: "谨慎",
  blocked: "受阻",
};

const CANNIB_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

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

export function DetailDrawer({ keyword, onClose }: DetailDrawerProps) {
  if (!keyword) return null;

  return (
    <div className="flex flex-col min-w-[440px]">
      {/* 面板顶部 */}
      <div className="px-5 py-4 border-b border-gray-200 sticky top-0 bg-gray-100 z-10 flex items-start justify-between">
        <div>
          <h2 className="text-gray-900 text-base font-semibold leading-tight">
            {keyword.rawKeyword}
          </h2>
          <p className="text-gray-400 text-[10px] font-mono mt-2">{keyword.kwId}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition-colors mt-0.5 shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* 区块1 - 标准化信息 */}
        <Section title="标准化信息">
          <Field label="原文" value={keyword.rawKeyword} />
          <Field label="标准形" value={keyword.normalizedKeyword} />
          <Field label="语言" value={keyword.language} />
          <Field label="批次" value={keyword.batchId} />
          <Field label="词类" value={WORD_TYPE_LABELS[keyword.wordType ?? ""] ?? keyword.wordType} />
        </Section>

        {/* 区块2 - 来源链路 */}
        <Section title="来源链路">
          <Field
            label="来源序号"
            value={SOURCE_NUM_LABELS[keyword.sourceNum ?? ""] ?? keyword.sourceNum}
          />
          <Field label="来源名称" value={keyword.sourceName} />
          <div className="col-span-2">
            <Field label="来源说明" value={keyword.sourceDesc} />
          </div>
        </Section>

        {/* 区块3 - 量化判断 */}
        <Section title="量化判断">
          <Field label="BP 优先级" value={<BpBadge bp={keyword.bp} />} />
          <Field label="月均 SV" value={keyword.sv != null ? keyword.sv.toLocaleString() : null} />
          <Field label="流量潜力 TP" value={keyword.tp != null ? keyword.tp.toLocaleString() : null} />
          <Field label="CPC ($)" value={keyword.cpc != null ? `$${keyword.cpc.toFixed(2)}` : null} />
          <div className="col-span-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">关键词难度 KD</span>
              <KdBar kd={keyword.kd} />
            </div>
          </div>
          <Field label="增长趋势" value={<GrowthBadge growth={keyword.growth} />} />
          <Field label="竞争程度 CP" value={
            keyword.cp
              ? <MiniTag label={CP_LABELS[keyword.cp] ?? keyword.cp} cls={
                  keyword.cp === "high" ? "text-red-600 bg-red-50 border-red-200" :
                  keyword.cp === "medium" ? "text-amber-600 bg-amber-50 border-amber-200" :
                  "text-emerald-600 bg-emerald-50 border-emerald-200"
                } />
              : null
          } />
          <Field label="搜索意图 CS" value={
            keyword.cs
              ? <MiniTag label={CS_LABELS[keyword.cs] ?? keyword.cs} cls={
                  keyword.cs === "commercial" ? "text-purple-700 bg-purple-50 border-purple-200" :
                  keyword.cs === "mixed" ? "text-blue-600 bg-blue-50 border-blue-200" :
                  "text-teal-600 bg-teal-50 border-teal-200"
                } />
              : null
          } />
          <Field label="攻入难度 SA" value={
            keyword.sa
              ? <MiniTag label={SA_LABELS[keyword.sa] ?? keyword.sa} cls={
                  keyword.sa === "enterable" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                  keyword.sa === "cautious" ? "text-amber-600 bg-amber-50 border-amber-200" :
                  "text-red-600 bg-red-50 border-red-200"
                } />
              : null
          } />
        </Section>

        {/* 区块4 - 聚类判断 */}
        <Section title="聚类判断">
          <Field label="词群编号" value={keyword.clusterCode} />
          <Field label="主词" value={keyword.headKeyword} />
          <Field label="词项角色" value={keyword.clusterRole} />
          <Field label="附属词数量" value={keyword.memberCount?.toString() ?? "—"} />
        </Section>

        {/* 区块5 - 意图判断 */}
        <Section title="意图判断">
          <Field
            label="行为意图"
            value={BEHAVIOR_INTENT_LABELS[keyword.behaviorIntent ?? ""] ?? keyword.behaviorIntent}
          />
          <Field
            label="页面规划意图"
            value={PAGE_PLAN_INTENT_LABELS[keyword.pagePlanIntent ?? ""] ?? keyword.pagePlanIntent}
          />
          <Field label="SERP 内容类型" value={keyword.serpContentType} />
          <Field label="SERP 内容格式" value={keyword.serpContentFormat} />
          <div className="col-span-2">
            <Field label="混合意图说明" value={keyword.mixedIntentNote} />
          </div>
        </Section>

        {/* 区块6 - 分层判断 */}
        <Section title="分层判断">
          <div className="col-span-2 flex items-center gap-3 mb-1">
            <LayerBadgeLarge layer={keyword.layer} />
            <span className="text-gray-400 text-xs">{keyword.layerBasis ?? ""}</span>
          </div>
          <Field label="L2 规模依据" value={keyword.l2ScaleBasis} />
          <Field label="建设批次" value={keyword.buildBatch} />
          <Field label="L4 子类型" value={keyword.l4SubType} />
          <Field label="复审时机" value={keyword.reviewTiming} />
        </Section>

        {/* 区块7 - 页面承接 */}
        <Section title="页面承接">
          <Field label="主攻页面" value={keyword.mainPage} />
          <Field label="并入目标页面" value={keyword.mergeTargetPage} />
          <Field label="覆盖方式" value={keyword.coverageMethod} />
          <Field label="蚕食风险" value={
            keyword.cannibalization
              ? <MiniTag label={CANNIB_LABELS[keyword.cannibalization] ?? keyword.cannibalization} cls={
                  keyword.cannibalization === "high" ? "text-red-600 bg-red-50 border-red-200" :
                  keyword.cannibalization === "medium" ? "text-amber-600 bg-amber-50 border-amber-200" :
                  "text-emerald-600 bg-emerald-50 border-emerald-200"
                } />
              : null
          } />
        </Section>

        {/* 区块8 - 处理建议 */}
        <Section title="处理建议">
          <div className="col-span-2 flex items-center gap-3 mb-1">
            <HandlingBadgeLarge handling={keyword.handling} />
          </div>
          <div className="col-span-2">
            <Field label="备注" value={keyword.notes} />
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
