"use client";

import { useState, useMemo, useEffect } from "react";
import type { Keyword } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { FilterBar, type FilterState } from "./FilterBar";
import { KeywordTable } from "./KeywordTable";
import { DetailDrawer } from "./DetailDrawer";
import { SummaryBar } from "./SummaryBar";
import { intentLabel } from "./_utils";

type Stats = {
  total: number;
  scored: number;
  unscored: number;
  protected: number;
  avgSv: number;
  avgCpc: number;
  lastSync: Date | null;
};

interface KeywordsClientProps {
  initialData: Keyword[];
  stats: Stats;
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  market: [],
  intent: [],
  questionType: [],
  protectedOnly: false,
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const MARKET_FLAGS: Record<string, string> = {
  uk: "🇬🇧", gb: "🇬🇧", us: "🇺🇸", sa: "🇸🇦", ae: "🇦🇪", my: "🇲🇾", id: "🇮🇩",
  fr: "🇫🇷", de: "🇩🇪", es: "🇪🇸", au: "🇦🇺", tr: "🇹🇷",
  eg: "🇪🇬", pk: "🇵🇰", bd: "🇧🇩", ng: "🇳🇬", ma: "🇲🇦",
  dz: "🇩🇿", iq: "🇮🇶", jo: "🇯🇴", kw: "🇰🇼", qa: "🇶🇦", om: "🇴🇲",
  bh: "🇧🇭", lb: "🇱🇧", sy: "🇸🇾", ye: "🇾🇪", tn: "🇹🇳", ly: "🇱🇾",
  sd: "🇸🇩", ca: "🇨🇦", in: "🇮🇳", ph: "🇵🇭", sg: "🇸🇬", th: "🇹🇭",
  vn: "🇻🇳", jp: "🇯🇵", kr: "🇰🇷", cn: "🇨🇳", tw: "🇹🇼", it: "🇮🇹",
  nl: "🇳🇱", pl: "🇵🇱", ru: "🇷🇺", br: "🇧🇷", mx: "🇲🇽", za: "🇿🇦",
};

const MARKET_LABELS: Record<string, string> = {
  uk: "英国", gb: "英国", us: "美国", sa: "沙特", ae: "阿联酋",
  my: "马来西亚", id: "印尼", fr: "法国", de: "德国", es: "西班牙",
  au: "澳大利亚", tr: "土耳其", eg: "埃及", pk: "巴基斯坦", bd: "孟加拉",
  ng: "尼日利亚", ma: "摩洛哥", dz: "阿尔及利亚", iq: "伊拉克", jo: "约旦",
  kw: "科威特", qa: "卡塔尔", om: "阿曼", bh: "巴林", lb: "黎巴嫩",
  sy: "叙利亚", ye: "也门", tn: "突尼斯", ly: "利比亚", sd: "苏丹",
  ca: "加拿大", in: "印度", ph: "菲律宾", sg: "新加坡", th: "泰国",
  vn: "越南", jp: "日本", kr: "韩国", cn: "中国", tw: "台湾",
  it: "意大利", nl: "荷兰", pl: "波兰", ru: "俄罗斯", br: "巴西",
  mx: "墨西哥", za: "南非",
};

export function KeywordsClient({ initialData, stats }: KeywordsClientProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Derive filter options dynamically from data
  const { marketOptions, intentOptions, questionTypeOptions } = useMemo(() => {
    const markets = new Set<string>();
    const intents = new Set<string>();
    const qTypes = new Set<string>();
    initialData.forEach((kw) => {
      if (kw.market) markets.add(kw.market);
      if (kw.intent) intents.add(kw.intent);
      if (kw.questionType) qTypes.add(kw.questionType);
    });
    return {
      marketOptions: [...markets].sort().map((m) => ({
        value: m,
        label: MARKET_LABELS[m.toLowerCase()] ?? m.toUpperCase(),
        flag: MARKET_FLAGS[m.toLowerCase()],
      })),
      intentOptions: [...intents].sort().map((i) => ({ value: i, label: intentLabel(i) ?? i })),
      questionTypeOptions: [...qTypes].sort().map((q) => ({ value: q, label: q })),
    };
  }, [initialData]);

  const filteredData = useMemo(() => {
    return initialData.filter((kw) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!kw.keyword.toLowerCase().includes(q)) return false;
      }
      if (filters.market.length > 0 && !filters.market.includes(kw.market ?? "")) return false;
      if (filters.intent.length > 0 && !filters.intent.includes(kw.intent ?? "")) return false;
      if (filters.questionType.length > 0 && !filters.questionType.includes(kw.questionType ?? "")) return false;
      if (filters.protectedOnly && kw.protected !== true) return false;
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
            <p className="text-xs text-gray-400 mt-0.5">候选词池 · 来源 N8N keywords_pool · 含搜索量 / KD / CPC / 意图 / SERP 特征</p>
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
              if (key === "total") {
                setFilters(DEFAULT_FILTERS);
              } else if (key === "protected") {
                setFilters({ ...DEFAULT_FILTERS, protectedOnly: true });
              }
              // 其他卡片当前不做联动筛选（统计纯展示）
            }}
          />
        </div>

        {/* 筛选条件栏 */}
        <div className="px-4 py-2 border-b border-gray-200 bg-white shrink-0">
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            marketOptions={marketOptions}
            intentOptions={intentOptions}
            questionTypeOptions={questionTypeOptions}
          />
        </div>

        {/* 表格 */}
        <div className="flex-1 overflow-auto bg-white">
          <KeywordTable data={paginatedData} onRowClick={handleRowClick} />
        </div>

        {/* 底部分页栏 */}
        <div className="px-4 py-2 border-t border-gray-200 bg-white shrink-0 flex items-center gap-3 text-xs">
          <span className="text-gray-400 mr-auto">
            {totalCount !== initialData.length
              ? `已筛选 ${totalCount} / ${initialData.length} 条`
              : `共 ${totalCount} 条`}
          </span>

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

          <span className="text-gray-400">
            {rangeStart}–{rangeEnd} / {totalCount}
          </span>

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

      {/* 右侧：内联详情面板 */}
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
