"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FilterState {
  search: string;
  layer: string;
  status: string;
  sourceNum: string;
  language: string;
  region: string;
  handling: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const LANGUAGES = [
  { value: "EN", flag: "🇬🇧", label: "英文" },
  { value: "AR", flag: "🇸🇦", label: "阿拉伯文" },
  { value: "ID", flag: "🇮🇩", label: "印尼文" },
  { value: "MS", flag: "🇲🇾", label: "马来文" },
  { value: "FR", flag: "🇫🇷", label: "法文" },
  { value: "DE", flag: "🇩🇪", label: "德文" },
  { value: "ES", flag: "🇪🇸", label: "西班牙文" },
];

const REGIONS = [
  { value: "SA", flag: "🇸🇦", label: "沙特阿拉伯" },
  { value: "ID", flag: "🇮🇩", label: "印度尼西亚" },
  { value: "AE", flag: "🇦🇪", label: "阿联酋" },
  { value: "MY", flag: "🇲🇾", label: "马来西亚" },
  { value: "GB", flag: "🇬🇧", label: "英国" },
  { value: "FR", flag: "🇫🇷", label: "法国" },
  { value: "DE", flag: "🇩🇪", label: "德国" },
  { value: "ES", flag: "🇪🇸", label: "西班牙" },
];

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const update = (key: keyof FilterState, value: string | null) => {
    onFilterChange({ ...filters, [key]: value ?? filters[key] });
  };

  const reset = () => {
    onFilterChange({
      search: "",
      layer: "all",
      status: "all",
      sourceNum: "all",
      language: "all",
      region: "all",
      handling: "all",
    });
  };

  const hasFilters =
    filters.search !== "" ||
    filters.layer !== "all" ||
    filters.status !== "all" ||
    filters.sourceNum !== "all" ||
    filters.language !== "all" ||
    filters.region !== "all" ||
    filters.handling !== "all";

  const selectedLang = LANGUAGES.find((l) => l.value === filters.language);
  const selectedRegion = REGIONS.find((r) => r.value === filters.region);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 min-w-0">
      {/* 层级 */}
      <Select value={filters.layer} onValueChange={(v) => update("layer", v)}>
        <SelectTrigger className="w-32 h-7 shrink-0 bg-white border-gray-300 text-gray-900 text-xs">
          {filters.layer === "all"
            ? <span className="text-xs text-gray-500">层级</span>
            : <SelectValue />}
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 text-gray-900">
          <SelectItem value="all" className="text-xs">全部</SelectItem>
          <SelectItem value="L1" className="text-xs">L1 骨架</SelectItem>
          <SelectItem value="L2" className="text-xs">L2 独立候选</SelectItem>
          <SelectItem value="L3" className="text-xs">L3 附属</SelectItem>
          <SelectItem value="L4" className="text-xs">L4 暂缓</SelectItem>
          <SelectItem value="pending" className="text-xs">待评估</SelectItem>
        </SelectContent>
      </Select>

      {/* 状态 */}
      <Select value={filters.status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="w-32 h-7 shrink-0 bg-white border-gray-300 text-gray-900 text-xs">
          {filters.status === "all"
            ? <span className="text-xs text-gray-500">状态</span>
            : <SelectValue />}
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 text-gray-900">
          <SelectItem value="all" className="text-xs">全部</SelectItem>
          <SelectItem value="pending" className="text-xs">待评估</SelectItem>
          <SelectItem value="evaluated" className="text-xs">已评估</SelectItem>
          <SelectItem value="clustered" className="text-xs">已聚类</SelectItem>
          <SelectItem value="excluded" className="text-xs">已排除</SelectItem>
        </SelectContent>
      </Select>

      {/* 来源 */}
      <Select value={filters.sourceNum} onValueChange={(v) => update("sourceNum", v)}>
        <SelectTrigger className="w-28 h-7 shrink-0 bg-white border-gray-300 text-gray-900 text-xs">
          {filters.sourceNum === "all"
            ? <span className="text-xs text-gray-500">来源</span>
            : <SelectValue />}
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 text-gray-900">
          <SelectItem value="all" className="text-xs">全部</SelectItem>
          {([
            ["0", "第一方数据词"],
            ["1", "内部词根"],
            ["2", "一级竞品词"],
            ["3", "二级竞品词"],
            ["4", "SERP 特征词"],
            ["5", "工具扩展词"],
            ["6", "社交听取词"],
            ["7", "搜索行为词"],
            ["8", "AI 可见度词"],
          ] as [string, string][]).map(([n, label]) => (
            <SelectItem key={n} value={n} className="text-xs">{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 语言（含国旗） */}
      <Select value={filters.language} onValueChange={(v) => update("language", v)}>
        <SelectTrigger className="w-32 h-7 shrink-0 bg-white border-gray-300 text-gray-900 text-xs">
          {filters.language === "all"
            ? <span className="text-xs text-gray-500">语言</span>
            : <span className="flex items-center gap-1.5 text-xs">
                <span>{selectedLang?.flag}</span>
                <span>{selectedLang?.value}</span>
              </span>}
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 text-gray-900">
          <SelectItem value="all" className="text-xs">全部</SelectItem>
          {LANGUAGES.map((l) => (
            <SelectItem key={l.value} value={l.value} className="text-xs">
              <span className="flex items-center gap-2">
                <span>{l.flag}</span>
                <span>{l.value} · {l.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 地区（含国旗） */}
      <Select value={filters.region} onValueChange={(v) => update("region", v)}>
        <SelectTrigger className="w-32 h-7 shrink-0 bg-white border-gray-300 text-gray-900 text-xs">
          {filters.region === "all"
            ? <span className="text-xs text-gray-500">地区</span>
            : <span className="flex items-center gap-1.5 text-xs">
                <span>{selectedRegion?.flag}</span>
                <span>{selectedRegion?.label}</span>
              </span>}
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 text-gray-900">
          <SelectItem value="all" className="text-xs">全部</SelectItem>
          {REGIONS.map((r) => (
            <SelectItem key={r.value} value={r.value} className="text-xs">
              <span className="flex items-center gap-2">
                <span>{r.flag}</span>
                <span>{r.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 承接 */}
      <Select value={filters.handling} onValueChange={(v) => update("handling", v)}>
        <SelectTrigger className="w-32 h-7 shrink-0 bg-white border-gray-300 text-gray-900 text-xs">
          {filters.handling === "all"
            ? <span className="text-xs text-gray-500">承接</span>
            : <SelectValue />}
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 text-gray-900">
          <SelectItem value="all" className="text-xs">全部</SelectItem>
          <SelectItem value="independent" className="text-xs">独立建页</SelectItem>
          <SelectItem value="merge" className="text-xs">附属合并</SelectItem>
          <SelectItem value="defer" className="text-xs">暂缓观察</SelectItem>
          <SelectItem value="exclude" className="text-xs">排除</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          onClick={reset}
        >
          <X size={13} />
          <span className="text-xs ml-1">清空</span>
        </Button>
      )}
    </div>
  );
}
