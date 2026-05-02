"use client";

import {
  Stethoscope,
  Target,
  Lightbulb,
  TrendingUp,
  Layers,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { SkillCard } from "./SkillCard";

type Scenario = {
  endpoint: string;
  title: string;
  description: string;
  available: boolean;
  spanCls: string;
  icon: LucideIcon;
};

// Bento Grid（lg=12 列）：
//   [一键体检 col-span-6 row-span-2]   [找竞品空隙 col-span-6]
//                                      [发现博客选题 col-span-6]
//   [SEM 投放 col-span-4] [跨市场扩库 col-span-4] [内容形态 col-span-4]
const SCENARIOS: Scenario[] = [
  {
    endpoint: "checkup",
    title: "一键关键词体检",
    description:
      "输入一组词，自动跑搜量、难度、SERP、跨市场分布四项检查，一份报告告诉你每个词值不值得投入。",
    available: false,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-6 lg:col-span-6 lg:row-span-2",
    icon: Stethoscope,
  },
  {
    endpoint: "competitor-gap",
    title: "找竞品流量空隙",
    description: "竞品有流量你没有的词，挑出可以抢的机会词，含问句长尾与 SERP 透视。",
    available: false,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-6 lg:col-span-6",
    icon: Target,
  },
  {
    endpoint: "blog-topics",
    title: "发现博客选题",
    description: "围绕主题挖出 5W1H 长尾问句 + 语义相关词，铺给写作团队当选题池。",
    available: false,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-6 lg:col-span-6",
    icon: Lightbulb,
  },
  {
    endpoint: "sem-opportunity",
    title: "SEM 投放机会",
    description: "竞品当前在投 + 历史投过的广告词一起捞，挖出值得我方投放的关键词。",
    available: false,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-4",
    icon: TrendingUp,
  },
  {
    endpoint: "multi-market",
    title: "跨市场扩库评估",
    description: "把一批词在多个国家市场扫一遍，快速定位高搜量低竞争的目标地区词。",
    available: false,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-4",
    icon: Layers,
  },
  {
    endpoint: "content-form",
    title: "内容形态决策",
    description: "一个词到底是写博客还是建产品页？看 SERP 意图分布 + 长尾问句给出建议。",
    available: false,
    spanCls: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-4",
    icon: Workflow,
  },
];

export function ScenarioGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 auto-rows-[minmax(7rem,auto)]">
      {SCENARIOS.map((s) => (
        <div key={s.endpoint} className={s.spanCls}>
          <SkillCard
            title={s.title}
            description={s.description}
            endpoint={s.endpoint}
            available={s.available}
            featured={s.endpoint === "checkup"}
            icon={s.icon}
          />
        </div>
      ))}
    </div>
  );
}
