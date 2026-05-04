"use client";

import {
  BarChart3,
  ZoomIn,
  Search,
  MessageCircleQuestionMark,
  Network,
  Globe,
  Map,
  Megaphone,
  History,
  GitCompare,
  type LucideIcon,
} from "lucide-react";
import { SkillCard } from "./SkillCard";

type Skill = {
  endpoint: string;
  title: string;
  description: string;
  available: boolean;
  /** 响应式 col-span 类名 */
  spanCls: string;
  /** Lucide 图标 */
  icon: LucideIcon;
};

// 真 Bento Grid 布局（lg=12 列）：
//   [W01 大卡 col-span-6 row-span-2] [W04 col-span-3] [W07 col-span-3]
//                                    [W02 col-span-3] [W10 col-span-3]
//   [W03 col-span-4] [W05 col-span-4] [W06 col-span-4]
//   [W08 col-span-6] [W09 col-span-6]
const SKILLS: Skill[] = [
  {
    endpoint: "W01",
    title: "批量关键词指标查询",
    description: "一次投一批词 × 多市场，秒看搜量、难度、CPC、意图、趋势。批量诊断商业价值与竞争度。",
    available: true,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-6 lg:col-span-6 lg:row-span-2",
    icon: BarChart3,
  },
  {
    endpoint: "W04",
    title: "问句词挖掘",
    description: "围绕主题挖掘 5W1H 长尾问句词，附 what / how / why 类型筛选",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-3",
    icon: MessageCircleQuestionMark,
  },
  {
    endpoint: "W07",
    title: "跨市场搜量",
    description: "单词跨库一次拉所有 Semrush 数据库（11+ 国）的月搜量、难度、CPC、Intent",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-3",
    icon: Map,
  },
  {
    endpoint: "W02",
    title: "关键词指标查询",
    description: "单个核心词 × 多市场，秒查该词在每个市场的搜量、难度、CPC、意图、趋势",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-3",
    icon: ZoomIn,
  },
  {
    endpoint: "W10",
    title: "域名差距分析",
    description: "对比自身与竞品域名的关键词覆盖差距，4 种维度（缺口/共有/蓝海/弱势）多选",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-3",
    icon: GitCompare,
  },
  {
    endpoint: "W03",
    title: "关键词排名对手",
    description: "看 Google SERP 前 N 名（1-10）谁在排这个词，列出域名 / URL / 排位 / SERP 特性（中文标注）",
    available: true,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-4",
    icon: Search,
  },
  {
    endpoint: "W05",
    title: "主题相关词",
    description: "围绕主题扩展语义相关的关键词集合，按相关度 + 搜量排序",
    available: true,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-4",
    icon: Network,
  },
  {
    endpoint: "W06",
    title: "全搜索拓词",
    description: "基于种子词跨语料批量拓展候选词，单价 20u/行（W05 一半），适合首轮探词",
    available: true,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-4",
    icon: Globe,
  },
  {
    endpoint: "W08",
    title: "竞品广告词",
    description: "查竞品域名当前在 Google Ads 投放的广告词、排名、落地页与广告文案",
    available: true,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-6",
    icon: Megaphone,
  },
  {
    endpoint: "W09",
    title: "竞品广告词历史",
    description: "回溯竞品域名历史投放的广告词变化，每月 15 日快照，单价 100u/行（单次 ≤ 12 月）",
    available: true,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-6",
    icon: History,
  },
];

export function DataQueryGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 auto-rows-[minmax(7rem,auto)]">
      {SKILLS.map((s) => (
        <div key={s.endpoint} className={s.spanCls}>
          <SkillCard
            title={s.title}
            description={s.description}
            endpoint={s.endpoint}
            available={s.available}
            featured={s.endpoint === "W01"}
            icon={s.icon}
          />
        </div>
      ))}
    </div>
  );
}
