import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FetchTabs } from "./_components/FetchTabs";

export default async function KeywordFetchPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">关键词功能库</h1>
      <FetchTabs />
    </div>
  );
}
