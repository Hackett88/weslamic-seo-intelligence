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
    title: "关键词指标查询",
    description: "输入一批词，秒看搜量、难度、CPC。批量诊断词的商业价值与竞争度，一眼看出哪些词值得投入。",
    available: true,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-6 lg:col-span-6 lg:row-span-2",
    icon: BarChart3,
  },
  {
    endpoint: "W04",
    title: "问句词挖掘",
    description: "围绕主题挖掘 5W1H 长尾问句词",
    available: false,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-3",
    icon: MessageCircleQuestionMark,
  },
  {
    endpoint: "W07",
    title: "跨市场搜量",
    description: "同一组词在多个国家市场的搜量对比",
    available: false,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-3",
    icon: Map,
  },
  {
    endpoint: "W02",
    title: "单词深度查询",
    description: "针对单个核心词拉取完整指标与变体",
    available: false,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-3",
    icon: ZoomIn,
  },
  {
    endpoint: "W10",
    title: "域名差距分析",
    description: "对比自身与竞品域名的关键词覆盖差距",
    available: false,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-3",
    icon: GitCompare,
  },
  {
    endpoint: "W03",
    title: "单词 SERP 透视",
    description: "查看单词搜索结果页的竞争与意图分布",
    available: false,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-4",
    icon: Search,
  },
  {
    endpoint: "W05",
    title: "主题相关词",
    description: "围绕主题扩展语义相关的关键词集合",
    available: false,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-4",
    icon: Network,
  },
  {
    endpoint: "W06",
    title: "全搜索拓词",
    description: "基于种子词跨数据源批量拓展候选词",
    available: false,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-4",
    icon: Globe,
  },
  {
    endpoint: "W08",
    title: "竞品广告词",
    description: "抓取竞品域名当前正在投放的广告词",
    available: false,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-6",
    icon: Megaphone,
  },
  {
    endpoint: "W09",
    title: "竞品广告词历史",
    description: "回溯竞品域名历史投放过的广告词变化",
    available: false,
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
