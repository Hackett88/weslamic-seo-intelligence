"use client";

import dynamic from "next/dynamic";
import type { Keyword } from "@/db/schema";

type Stats = {
  total: number;
  l1: number;
  l2: number;
  l3: number;
  l4: number;
  pending: number;
  excluded: number;
  lastSync: Date | null;
};

interface KeywordsWrapperProps {
  initialData: Keyword[];
  stats: Stats;
}

const KeywordsClientDynamic = dynamic(
  () => import("./KeywordsClient").then((m) => m.KeywordsClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-gray-400 text-sm">加载中...</span>
      </div>
    ),
  }
);

export function KeywordsWrapper({ initialData, stats }: KeywordsWrapperProps) {
  return <KeywordsClientDynamic initialData={initialData} stats={stats} />;
}
