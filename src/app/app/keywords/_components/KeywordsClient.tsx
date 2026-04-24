"use client";

import { useState, useMemo, useEffect } from "react";
import type { Keyword } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { FilterBar, type FilterState } from "./FilterBar";
import { KeywordTable } from "./KeywordTable";
import { DetailDrawer } from "./DetailDrawer";
import { SummaryBar } from "./SummaryBar";

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

interface KeywordsClientProps {
  initialData: Keyword[];
  stats: Stats;
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  layer: "all",
  status: "all",
  sourceNum: "all",
  language: "all",
  region: "all",
  handling: "all",
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function KeywordsClient({ initialData, stats }: KeywordsClientProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

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
      if (filters.region !== "all" && kw.region !== filters.region) return false;
      if (filters.handling !== "all" && kw.handling !== filters.handling) return false;
      return true;
    });
  }, [initialData, filters]);

  // 筛选条件变化时重置到第 1 页
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData]);

  const totalCount = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(
    () => filteredData.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredData, safePage, pageSize]
  );

  const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalCount);

  const handleRowClick = (keyword: Keyword) => {
    setSelectedKeyword(keyword);
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
  };

  const btnCls = (disabled: boolean) =>
    [
      "h-6 w-6 flex items-center justify-center rounded border text-xs transition-colors",
      disabled
        ? "border-gray-100 text-gray-300 cursor-not-allowed"
        : "border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600",
    ].join(" ");

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* 左侧：标题栏 + 统计 + 筛选 + 表格 + 分页 */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        {/* 标题栏（含搜索） */}
        <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900">关键词库</h1>
            <p className="text-xs text-gray-400 mt-0.5">统一管理 SEO 关键词分层、聚类、承接与来源追踪</p>
          </div>
          <Input
            className="w-52 h-7 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 text-xs focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
            placeholder="搜索关键词..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>

        {/* 统计指标栏 */}
        <div className="px-5 py-3 border-b border-gray-200 bg-white shrink-0">
          <SummaryBar
            stats={stats}
            onCardClick={(key) => {
              const map: Record<string, Partial<FilterState>> = {
                total: DEFAULT_FILTERS,
                l1: { ...DEFAULT_FILTERS, layer: "L1" },
                l2: { ...DEFAULT_FILTERS, layer: "L2" },
                l3: { ...DEFAULT_FILTERS, layer: "L3" },
                l4: { ...DEFAULT_FILTERS, layer: "L4" },
                pending: { ...DEFAULT_FILTERS, layer: "pending" },
                excluded: { ...DEFAULT_FILTERS, status: "excluded" },
              };
              setFilters(map[key] as FilterState ?? DEFAULT_FILTERS);
            }}
          />
        </div>

        {/* 筛选条件栏 */}
        <div className="px-4 py-2 border-b border-gray-200 bg-white shrink-0">
          <FilterBar filters={filters} onFilterChange={setFilters} />
        </div>

        {/* 表格（懒加载：仅渲染当前页行） */}
        <div className="flex-1 overflow-auto bg-white">
          <KeywordTable data={paginatedData} onRowClick={handleRowClick} />
        </div>

        {/* 底部分页栏 */}
        <div className="px-4 py-2 border-t border-gray-200 bg-white shrink-0 flex items-center gap-3 text-xs">
          {/* 左侧：筛选提示 */}
          <span className="text-gray-400 mr-auto">
            {totalCount !== initialData.length
              ? `已筛选 ${totalCount} / ${initialData.length} 条`
              : `共 ${totalCount} 条`}
          </span>

          {/* 每页条数选择 */}
          <div className="flex items-center gap-1.5 text-gray-400">
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="h-6 border border-gray-200 rounded px-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>条</span>
          </div>

          {/* 当前范围 */}
          <span className="text-gray-400">
            {rangeStart}–{rangeEnd} / {totalCount}
          </span>

          {/* 翻页按钮 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className={btnCls(safePage === 1)}
              title="第一页"
            >«</button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className={btnCls(safePage === 1)}
              title="上一页"
            >‹</button>
            <span className="px-2 text-gray-500 select-none">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className={btnCls(safePage >= totalPages)}
              title="下一页"
            >›</button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              className={btnCls(safePage >= totalPages)}
              title="最后一页"
            >»</button>
          </div>
        </div>
      </div>

      {/* 右侧：内联详情面板（全高推挤，无覆盖层） */}
      <div
        style={{ scrollbarGutter: "stable" }}
        className={[
          "flex-shrink-0 border-l border-gray-200 bg-gray-50 overflow-y-auto",
          "transition-[width] duration-300 ease-in-out",
          drawerOpen ? "w-[440px]" : "w-0 overflow-hidden",
        ].join(" ")}
      >
        {selectedKeyword && (
          <DetailDrawer keyword={selectedKeyword} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}
