"use client";

import dynamic from "next/dynamic";
import type { Keyword } from "@/db/schema";

const KeywordsClientDynamic = dynamic(
  () => import("./KeywordsClient").then((m) => m.KeywordsClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-zinc-600 text-sm">加载中...</span>
      </div>
    ),
  }
);

export function KeywordsWrapper({ initialData }: { initialData: Keyword[] }) {
  return <KeywordsClientDynamic initialData={initialData} />;
}
