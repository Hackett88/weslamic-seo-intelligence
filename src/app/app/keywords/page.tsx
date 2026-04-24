import { getKeywords, getKeywordStats } from "@/actions/keywords";
import { SummaryBar } from "./_components/SummaryBar";
import { KeywordsWrapper } from "./_components/KeywordsWrapper";

export default async function KeywordsPage() {
  const [keywordsData, stats] = await Promise.all([
    getKeywords(),
    getKeywordStats(),
  ]);
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-sm font-semibold text-white">关键词库</h1>
      </div>
      <div className="p-4 border-b border-zinc-800">
        <SummaryBar stats={stats} />
      </div>
      <KeywordsWrapper initialData={keywordsData} />
    </div>
  );
}
