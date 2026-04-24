"use client";

import { Input } from "@/components/ui/input";
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
  handling: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const update = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const reset = () => {
    onFilterChange({
      search: "",
      layer: "all",
      status: "all",
      sourceNum: "all",
      language: "all",
      handling: "all",
    });
  };

  const hasFilters =
    filters.search !== "" ||
    filters.layer !== "all" ||
    filters.status !== "all" ||
    filters.sourceNum !== "all" ||
    filters.language !== "all" ||
    filters.handling !== "all";

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 min-w-0">
      <Input
        className="w-48 h-7 shrink-0 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-xs focus-visible:ring-amber-500 focus-visible:border-amber-500"
        placeholder="搜索关键词..."
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
      />

      <Select value={filters.layer} onValueChange={(v) => update("layer", v)}>
        <SelectTrigger className="w-32 h-7 shrink-0 bg-zinc-800 border-zinc-700 text-white text-xs">
          <SelectValue placeholder="分层级别" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
          <SelectItem value="all" className="text-xs">全部层级</SelectItem>
          <SelectItem value="L1" className="text-xs">L1 骨架</SelectItem>
          <SelectItem value="L2" className="text-xs">L2 独立候选</SelectItem>
          <SelectItem value="L3" className="text-xs">L3 附属</SelectItem>
          <SelectItem value="L4" className="text-xs">L4 暂缓</SelectItem>
          <SelectItem value="pending" className="text-xs">待评估</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="w-32 h-7 shrink-0 bg-zinc-800 border-zinc-700 text-white text-xs">
          <SelectValue placeholder="词条状态" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
          <SelectItem value="all" className="text-xs">全部状态</SelectItem>
          <SelectItem value="pending" className="text-xs">待评估</SelectItem>
          <SelectItem value="evaluated" className="text-xs">已评估</SelectItem>
          <SelectItem value="clustered" className="text-xs">已聚类</SelectItem>
          <SelectItem value="excluded" className="text-xs">已排除</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sourceNum} onValueChange={(v) => update("sourceNum", v)}>
        <SelectTrigger className="w-28 h-7 shrink-0 bg-zinc-800 border-zinc-700 text-white text-xs">
          <SelectValue placeholder="来源" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
          <SelectItem value="all" className="text-xs">全部来源</SelectItem>
          {["0", "1", "2", "3", "4", "5", "6", "7", "8"].map((n) => (
            <SelectItem key={n} value={n} className="text-xs">
              来源 {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.language} onValueChange={(v) => update("language", v)}>
        <SelectTrigger className="w-24 h-7 shrink-0 bg-zinc-800 border-zinc-700 text-white text-xs">
          <SelectValue placeholder="语言" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
          <SelectItem value="all" className="text-xs">全部语言</SelectItem>
          <SelectItem value="EN" className="text-xs">EN</SelectItem>
          <SelectItem value="AR" className="text-xs">AR</SelectItem>
          <SelectItem value="ZH" className="text-xs">ZH</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.handling} onValueChange={(v) => update("handling", v)}>
        <SelectTrigger className="w-32 h-7 shrink-0 bg-zinc-800 border-zinc-700 text-white text-xs">
          <SelectValue placeholder="承接状态" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
          <SelectItem value="all" className="text-xs">全部承接</SelectItem>
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
          className="h-7 px-2 shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={reset}
        >
          <X size={13} />
          <span className="text-xs ml-1">清空</span>
        </Button>
      )}
    </div>
  );
}
