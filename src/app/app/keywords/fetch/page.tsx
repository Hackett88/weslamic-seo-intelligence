import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FetchTabs } from "./_components/FetchTabs";

export default async function KeywordFetchPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-6 pt-5 pb-2 shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">关键词功能库</h1>
      </div>
      <FetchTabs />
    </div>
  );
}
