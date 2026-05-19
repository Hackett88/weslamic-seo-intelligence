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
  spanCls: string;
  icon: LucideIcon;
};

// Bento C — 12 列 × 2 行：双 hero（左主右副），其余小卡平铺
//   Row 1: [W01 c3 hero主] [W02 c3] [W03 c2] [W04 c2] [W05 c2]   = 12
//   Row 2: [W06 c2] [W07 c2] [W08 c2] [W09 c2] [W10 c4 hero副]   = 12
const SKILLS: Skill[] = [
  {
    endpoint: "W01",
    title: "批量关键词指标查询",
    description: "一次投入一批词，跨多个市场齐查搜量、难度、CPC、意图与趋势。适合批量筛词、定调。",
    available: true,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3",
    icon: BarChart3,
  },
  {
    endpoint: "W02",
    title: "关键词指标查询",
    description: "聚焦一个核心词，在多个市场分别查搜量、难度、CPC、意图与趋势。",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-3",
    icon: ZoomIn,
  },
  {
    endpoint: "W03",
    title: "关键词排名对手",
    description: "看 Google 前十名谁在排这个词，逐条列出域名、链接、位次与 SERP 特征。",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2",
    icon: Search,
  },
  {
    endpoint: "W04",
    title: "问句词挖掘",
    description: "围绕一个主题挖出 5W1H 长尾问句，what / how / why 三类可单独筛选。",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2",
    icon: MessageCircleQuestionMark,
  },
  {
    endpoint: "W05",
    title: "主题相关词",
    description: "顺着一个主题向外扩展语义相关的词，按相关度与搜量排序。",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2",
    icon: Network,
  },
  {
    endpoint: "W06",
    title: "全搜索拓词",
    description: "以种子词为入口，跨语料批量拓展候选词，单条消耗约为相关词扩展的一半。",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2",
    icon: Globe,
  },
  {
    endpoint: "W07",
    title: "跨市场搜量",
    description: "一次取得单个关键词在 120 多个国家的月搜量、难度、CPC 与搜索意图。",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2",
    icon: Map,
  },
  {
    endpoint: "W08",
    title: "竞品广告词",
    description: "调出竞品当前在 Google Ads 上投放的关键词、排位、落地页与广告文案。",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2",
    icon: Megaphone,
  },
  {
    endpoint: "W09",
    title: "竞品广告词历史",
    description: "回溯竞品在 Google Ads 历史投放的关键词变化，按月快照查阅，单次最长 12 月。",
    available: true,
    spanCls: "col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2",
    icon: History,
  },
  {
    endpoint: "W10",
    title: "域名差距分析",
    description: "把自家域名与竞品摆一起看：缺口、共有、蓝海、弱势四种视角任选。",
    available: true,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-4",
    icon: GitCompare,
  },
];

export function DataQueryGrid() {
  return (
    <div
      className="flex-1 min-h-0 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 overflow-hidden"
      style={{ gridTemplateRows: "repeat(2, minmax(0, 1fr))" }}
    >
      {SKILLS.map((s, i) => (
        <div
          key={s.endpoint}
          className={`${s.spanCls} min-h-0`}
          style={{ ["--skill-i" as string]: String(i + 1) }}
        >
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
