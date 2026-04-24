import { getKeywords, getKeywordStats } from "@/actions/keywords";
import { SummaryBar } from "./_components/SummaryBar";
import { KeywordsWrapper } from "./_components/KeywordsWrapper";

export default async function KeywordsPage() {
  const [keywordsData, stats] = await Promise.all([
    getKeywords(),
    getKeywordStats(),
  ]);
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-sm font-semibold text-gray-900">关键词库</h1>
        <p className="text-xs text-gray-400 mt-0.5">统一管理 SEO 关键词分层、聚类、承接与来源追踪</p>
      </div>
      <div className="px-5 py-3 border-b border-gray-200 bg-white">
        <SummaryBar stats={stats} />
      </div>
      <KeywordsWrapper initialData={keywordsData} />
    </div>
  );
}
