"use client";

import { X } from "lucide-react";
import type { Keyword } from "@/db/schema";

interface DetailDrawerProps {
  keyword: Keyword | null;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="text-gray-900 text-xs">{value ?? "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
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
  const color = kd >= 70 ? "bg-red-500" : kd >= 40 ? "bg-yellow-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${Math.min(kd, 100)}%` }}
        />
      </div>
      <span className="text-gray-700 text-xs w-6">{kd}</span>
    </div>
  );
}

function growthBadge(growth: string | null) {
  if (!growth) return <span className="text-gray-300">—</span>;
  const map: Record<string, { label: string; cls: string }> = {
    rising: { label: "上升", cls: "text-emerald-600" },
    stable: { label: "稳定", cls: "text-gray-500" },
    declining: { label: "下降", cls: "text-red-500" },
  };
  const cfg = map[growth];
  return <span className={`text-xs ${cfg?.cls ?? "text-gray-500"}`}>{cfg?.label ?? growth}</span>;
}

const SOURCE_NUM_LABELS: Record<string, string> = {
  "0": "手动录入",
  "1": "Ahrefs 关键词",
  "2": "Ahrefs 竞品",
  "3": "Google SC",
  "4": "Google Ads",
  "5": "用户调研",
  "6": "SEMrush",
  "7": "内容规划",
  "8": "其他工具",
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
      <div className="px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10 flex items-start justify-between">
        <div>
          <h2 className="text-gray-900 text-sm font-semibold leading-tight">
            {keyword.rawKeyword}
          </h2>
          <p className="text-gray-400 text-xs font-mono mt-0.5">{keyword.kwId}</p>
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
          <Field label="BP 优先级" value={BP_LABELS[keyword.bp ?? ""] ?? keyword.bp} />
          <Field label="月均 SV" value={keyword.sv != null ? String(keyword.sv) : "—"} />
          <Field label="流量潜力 TP" value={keyword.tp != null ? String(keyword.tp) : "—"} />
          <div className="col-span-2">
            <span className="text-gray-400 text-xs block mb-1">关键词难度 KD</span>
            <KdBar kd={keyword.kd} />
          </div>
          <Field label="CPC ($)" value={keyword.cpc?.toFixed(2) ?? "—"} />
          <Field label="增长趋势" value={growthBadge(keyword.growth)} />
          <Field label="竞争程度 CP" value={CP_LABELS[keyword.cp ?? ""] ?? keyword.cp} />
          <Field label="搜索意图 CS" value={CS_LABELS[keyword.cs ?? ""] ?? keyword.cs} />
          <Field label="攻入难度 SA" value={SA_LABELS[keyword.sa ?? ""] ?? keyword.sa} />
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
          <Field
            label="蚕食风险"
            value={CANNIB_LABELS[keyword.cannibalization ?? ""] ?? keyword.cannibalization}
          />
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
