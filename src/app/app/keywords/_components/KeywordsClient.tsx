"use client";

import { useState, useMemo } from "react";
import type { Keyword } from "@/db/schema";
import { FilterBar, type FilterState } from "./FilterBar";
import { KeywordTable } from "./KeywordTable";
import { DetailDrawer } from "./DetailDrawer";

interface KeywordsClientProps {
  initialData: Keyword[];
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  layer: "all",
  status: "all",
  sourceNum: "all",
  language: "all",
  handling: "all",
};

export function KeywordsClient({ initialData }: KeywordsClientProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredData = useMemo(() => {
    return initialData.filter((kw) => {
      if (
        filters.search &&
        !kw.rawKeyword.toLowerCase().includes(filters.search.toLowerCase()) &&
        !kw.normalizedKeyword.toLowerCase().includes(filters.search.toLowerCase()) &&
        !(kw.kwId ?? "").toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.layer !== "all" && kw.layer !== filters.layer) return false;
      if (filters.status !== "all" && kw.status !== filters.status) return false;
      if (filters.sourceNum !== "all" && kw.sourceNum !== filters.sourceNum) return false;
      if (filters.language !== "all" && kw.language !== filters.language) return false;
      if (filters.handling !== "all" && kw.handling !== filters.handling) return false;
      return true;
    });
  }, [initialData, filters]);

  const handleRowClick = (keyword: Keyword) => {
    setSelectedKeyword(keyword);
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 筛选栏 */}
      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950">
        <FilterBar filters={filters} onFilterChange={setFilters} />
      </div>

      {/* 数据统计行 */}
      <div className="px-4 py-1.5 border-b border-zinc-800 bg-zinc-900/50">
        <span className="text-xs text-zinc-500">
          共 <span className="text-zinc-300">{filteredData.length}</span> 条
          {filteredData.length !== initialData.length && (
            <span>（已筛选，总计 {initialData.length} 条）</span>
          )}
        </span>
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto">
        <KeywordTable data={filteredData} onRowClick={handleRowClick} />
      </div>

      {/* 详情抽屉 */}
      <DetailDrawer
        keyword={selectedKeyword}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
