import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { W01Workspace } from "../_components/W01Workspace";
import { W03Workspace } from "../_components/W03Workspace";

type SkillMeta = {
  title: string;
  description: string;
  available: boolean;
};

const SKILL_META: Record<string, SkillMeta> = {
  w01: {
    title: "关键词指标查询",
    description: "输入一批词，秒看搜量、难度、CPC",
    available: true,
  },
  w02: {
    title: "单词深度查询",
    description: "针对单个核心词拉取完整指标与变体",
    available: false,
  },
  w03: {
    title: "单词 SERP 透视",
    description: "查看单词搜索结果页的竞争与意图分布",
    available: true,
  },
  w04: {
    title: "问句词挖掘",
    description: "围绕主题挖掘 5W1H 长尾问句词",
    available: false,
  },
  w05: {
    title: "主题相关词",
    description: "围绕主题扩展语义相关的关键词集合",
    available: false,
  },
  w06: {
    title: "全搜索拓词",
    description: "基于种子词跨数据源批量拓展候选词",
    available: false,
  },
  w07: {
    title: "跨市场搜量",
    description: "同一组词在多个国家市场的搜量对比",
    available: false,
  },
  w08: {
    title: "竞品广告词",
    description: "抓取竞品域名当前正在投放的广告词",
    available: false,
  },
  w09: {
    title: "竞品广告词历史",
    description: "回溯竞品域名历史投放过的广告词变化",
    available: false,
  },
  w10: {
    title: "域名差距分析",
    description: "对比自身与竞品域名的关键词覆盖差距",
    available: false,
  },
};

type PageProps = {
  params: Promise<{ endpoint: string }>;
};

export default async function SkillDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { endpoint } = await params;
  const slug = endpoint.toLowerCase();
  const meta = SKILL_META[slug];
  if (!meta) notFound();

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* 标题栏（参照关键词库 page-header：白底 / 下边框 / 紧凑三行：面包屑 / 标题 / 描述） */}
      <div className="px-5 py-4 border-b border-gray-200 bg-white shrink-0">
        {/* 面包屑 */}
        <div className="text-[11px] text-gray-400">
          <Link
            href="/app/keywords/fetch"
            className="transition-colors hover:text-emerald-700"
          >
            关键词功能库
          </Link>
          <span className="mx-1.5 text-gray-300">/</span>
          <span className="text-gray-500">{slug.toUpperCase()}</span>
        </div>
        <h1 className="mt-1 text-base font-semibold text-gray-900">
          {meta.title}
        </h1>
        <p className="mt-0.5 max-w-prose text-xs text-gray-400">
          {meta.description}
        </p>
      </div>

      {/* 主体：available 走完整 workspace；未上线走占位 */}
      {meta.available && slug === "w01" ? (
        <W01Workspace />
      ) : meta.available && slug === "w03" ? (
        <W03Workspace />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500">
            该功能即将上线
          </div>
        </div>
      )}
    </div>
  );
}
