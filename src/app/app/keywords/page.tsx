import { getKeywords, getKeywordStats } from "@/actions/keywords";
import { KeywordsWrapper } from "./_components/KeywordsWrapper";

export default async function KeywordsPage() {
  const [keywordsData, stats] = await Promise.all([
    getKeywords(),
    getKeywordStats(),
  ]);
  return <KeywordsWrapper initialData={keywordsData} stats={stats} />;
}
