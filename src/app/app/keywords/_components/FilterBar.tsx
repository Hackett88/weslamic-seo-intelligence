"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FilterState {
  search: string;
  market: string[];
  intent: string[];
  questionType: string[];
  protectedOnly: boolean;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  marketOptions: Option[];
  intentOptions: Option[];
  questionTypeOptions: Option[];
}

type Option = { value: string; label: string; flag?: string };

interface MultiSelectProps {
  placeholder: string;
  values: string[];
  options: Option[];
  onChange: (values: string[]) => void;
  width?: string;
  showFlagOnTrigger?: boolean;
  showFlagInItem?: boolean;
}

function MultiSelect({
  placeholder,
  values,
  options,
  onChange,
  width = "w-32",
  showFlagOnTrigger = false,
  showFlagInItem = false,
}: MultiSelectProps) {
  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };

  const selected = options.filter((o) => values.includes(o.value));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={[
          width,
          "h-7 shrink-0 bg-white border border-gray-300 rounded-md px-2.5",
          "flex items-center justify-between gap-1 text-xs text-left",
          "hover:border-gray-400",
          "focus:outline-none",
          "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-emerald-500 focus-visible:border-emerald-500",
          "data-[popup-open]:ring-1 data-[popup-open]:ring-inset data-[popup-open]:ring-emerald-500 data-[popup-open]:border-emerald-500",
        ].join(" ")}
      >
        <span className="truncate flex items-center gap-1.5 min-w-0">
          {selected.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : selected.length === 1 ? (
            showFlagOnTrigger && selected[0].flag ? (
              <>
                <span>{selected[0].flag}</span>
                <span className="text-gray-900 truncate">{selected[0].label}</span>
              </>
            ) : (
              <span className="text-gray-900 truncate">{selected[0].label}</span>
            )
          ) : (
            <span className="text-gray-900">
              {placeholder} · {selected.length}
            </span>
          )}
        </span>
        <ChevronDown size={12} className="text-gray-400 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="bg-white border-gray-200 text-gray-900 w-auto! min-w-(--anchor-width) py-1"
      >
        {options.map((opt) => {
          const checked = values.includes(opt.value);
          return (
            <MenuPrimitive.CheckboxItem
              key={opt.value}
              checked={checked}
              onCheckedChange={() => toggle(opt.value)}
              className={[
                "group relative flex cursor-default items-center gap-2",
                "rounded-md py-1 pl-2 pr-8 text-xs outline-hidden select-none whitespace-nowrap",
                "data-[highlighted]:bg-emerald-50 data-[highlighted]:text-gray-900",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
              ].join(" ")}
            >
              <span className="flex-1">
                {showFlagInItem && opt.flag ? (
                  <span className="flex items-center gap-2">
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </span>
                ) : (
                  opt.label
                )}
              </span>
              <Check
                size={14}
                strokeWidth={2.5}
                className="absolute right-2 text-gray-300 opacity-0 group-data-[highlighted]:opacity-100 group-data-[checked]:opacity-0"
              />
              <MenuPrimitive.CheckboxItemIndicator className="absolute right-2 flex items-center justify-center">
                <Check size={14} strokeWidth={2.5} className="text-emerald-600" />
              </MenuPrimitive.CheckboxItemIndicator>
            </MenuPrimitive.CheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterBar({ filters, onFilterChange, marketOptions, intentOptions, questionTypeOptions }: FilterBarProps) {
  const update = (key: keyof FilterState, value: string[] | boolean) => {
    onFilterChange({ ...filters, [key]: value } as FilterState);
  };

  const reset = () => {
    onFilterChange({
      search: "",
      market: [],
      intent: [],
      questionType: [],
      protectedOnly: false,
    });
  };

  const hasFilters =
    filters.search !== "" ||
    filters.market.length > 0 ||
    filters.intent.length > 0 ||
    filters.questionType.length > 0 ||
    filters.protectedOnly;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 min-w-0">
      <MultiSelect
        placeholder="市场"
        values={filters.market}
        options={marketOptions}
        onChange={(v) => update("market", v)}
        width="w-32"
        showFlagOnTrigger
        showFlagInItem
      />
      <MultiSelect
        placeholder="搜索意图"
        values={filters.intent}
        options={intentOptions}
        onChange={(v) => update("intent", v)}
        width="w-36"
      />
      <MultiSelect
        placeholder="问题类型"
        values={filters.questionType}
        options={questionTypeOptions}
        onChange={(v) => update("questionType", v)}
        width="w-32"
      />

      <label className="h-7 shrink-0 inline-flex items-center gap-1.5 px-2.5 border border-gray-300 rounded-md text-xs text-gray-600 cursor-pointer hover:border-gray-400 select-none">
        <input
          type="checkbox"
          checked={filters.protectedOnly}
          onChange={(e) => update("protectedOnly", e.target.checked)}
          className="accent-emerald-500"
        />
        仅显示受保护
      </label>

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
