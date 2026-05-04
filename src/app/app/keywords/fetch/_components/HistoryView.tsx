"use client";

import { useState, type ReactNode } from "react";
import { History, X } from "lucide-react";
import {
  formatHistoryTime,
  type HistoryEntry,
} from "@/lib/query-history";

type Props<R> = {
  entries: HistoryEntry<R>[];
  renderTable: (rows: R[]) => ReactNode;
  onClose: () => void;
  onClear?: () => void;
  onRemove?: (id: string) => void;
};

export function HistoryView<R>({
  entries,
  renderTable,
  onClose,
  onClear,
  onRemove,
}: Props<R>) {
  const [activeId, setActiveId] = useState<string | null>(
    entries[0]?.id ?? null
  );

  if (entries.length === 0) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-12">
        <History size={28} className="text-gray-300" />
        <span className="text-sm text-gray-400">暂无历史记录</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-emerald-700 hover:underline"
        >
          返回当前结果
        </button>
      </div>
    );
  }

  const active = entries.find((e) => e.id === activeId) ?? entries[0];

  return (
    <div className="flex h-full flex-col">
      {/* tabs 切换条 */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-3 py-1.5">
        <span className="mr-2 shrink-0 text-[11px] text-gray-500">
          历史查询：
        </span>
        {entries.map((e) => {
          const isActive = e.id === active.id;
          return (
            <div
              key={e.id}
              className={[
                "inline-flex shrink-0 items-stretch overflow-hidden rounded border transition-colors",
                isActive
                  ? "border-emerald-400 bg-white"
                  : "border-gray-200 bg-white hover:border-emerald-300",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => setActiveId(e.id)}
                title={`${e.tooltip ?? e.label} · ${formatHistoryTime(e.submittedAt)}`}
                className={[
                  "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px]",
                  isActive ? "text-emerald-700" : "text-gray-600",
                ].join(" ")}
              >
                <span className="max-w-[160px] truncate">{e.label}</span>
                <span className="text-[10px] text-gray-400">
                  {formatHistoryTime(e.submittedAt)}
                </span>
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onRemove(e.id);
                  }}
                  title="删除该条记录"
                  aria-label="删除该条记录"
                  className="inline-flex items-center justify-center border-l border-gray-200 px-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
          {onClear && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("确定清空该端点的历史记录？")) onClear();
              }}
              className="text-[11px] text-gray-500 hover:text-red-600"
            >
              清空
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50"
          >
            <X size={11} />
            关闭历史
          </button>
        </div>
      </div>

      {/* 选中记录的元信息 */}
      <div className="shrink-0 border-b border-gray-100 px-5 py-1.5 text-[11px] text-gray-500">
        提交于 {formatHistoryTime(active.submittedAt)} · 返回{" "}
        {active.summary.rowsTotal} 行
        {active.summary.unitsActual != null &&
          ` · 实耗 ${active.summary.unitsActual}u`}
        {active.summary.totalBatches != null &&
          ` · ${active.summary.totalBatches} 批`}
        {active.summary.failedBatches != null &&
          active.summary.failedBatches > 0 &&
          ` · 失败 ${active.summary.failedBatches}`}
        {active.dataSource && (
          <span className="ml-2 text-gray-400">
            数据源：{active.dataSource}
          </span>
        )}
      </div>

      {/* 历史结果表 */}
      <div className="flex-1 overflow-auto bg-white">
        {active.rows.length > 0 ? (
          renderTable(active.rows)
        ) : (
          <div className="flex h-full min-h-[160px] items-center justify-center px-6 py-12 text-sm text-gray-400">
            该次查询未返回数据
          </div>
        )}
      </div>
    </div>
  );
}
