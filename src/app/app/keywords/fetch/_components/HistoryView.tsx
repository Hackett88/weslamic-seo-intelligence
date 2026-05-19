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
  /** Extra controls rendered in the tabs row, next to 清空 / 关闭历史 */
  extraRightControls?: ReactNode;
};

export function HistoryView<R>({
  entries,
  renderTable,
  onClose,
  onClear,
  onRemove,
  extraRightControls,
}: Props<R>) {
  const [activeId, setActiveId] = useState<string | null>(
    entries[0]?.id ?? null
  );

  if (entries.length === 0) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-12">
        <History size={28} className="text-manor-inkGhost" />
        <span className="text-sm text-manor-inkFaint">暂无历史记录</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-manor-brassHi hover:underline"
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
      <div
        className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-manor-brass/35 px-4 py-2"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,42,28,.92) 0%, rgba(8,20,13,.96) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(239,216,154,.18), inset 0 -1px 0 rgba(0,0,0,.45)",
        }}
      >
        <span
          className="mr-2 shrink-0 font-sc tracking-[0.28em] text-manor-brassHi"
          style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif", fontSize: 9 }}
        >
          ◆ ANNALES · 历史查询
        </span>
        {entries.map((e, i) => {
          const isActive = e.id === active.id;
          return (
            <div
              key={e.id}
              className="history-tab inline-flex shrink-0 items-stretch overflow-hidden rounded"
              style={{
                ["--hist-i" as string]: String(i + 1),
                ...(isActive
                  ? {
                      background:
                        "linear-gradient(180deg, rgba(40,80,55,.55) 0%, rgba(18,42,28,.5) 60%, rgba(8,19,13,.6) 100%)",
                      border: "1px solid rgba(239,216,154,.5)",
                      boxShadow:
                        "inset 0 1px 0 rgba(239,216,154,.22), 0 0 8px -2px rgba(212,179,111,.45)",
                    }
                  : {
                      background:
                        "linear-gradient(180deg, rgba(12,26,18,.85) 0%, rgba(6,16,11,.92) 100%)",
                      border: "1px solid rgba(212,179,111,.22)",
                    }),
              }}
            >
              <button
                type="button"
                onClick={() => setActiveId(e.id)}
                title={`${e.tooltip ?? e.label} · ${formatHistoryTime(e.submittedAt)}`}
                className={[
                  "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px]",
                  isActive ? "text-manor-brassHi" : "text-manor-ink/80 hover:text-manor-brassHi",
                ].join(" ")}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 9999,
                      background:
                        "radial-gradient(circle at 30% 30%, #F8E6B0, #D4B36F 55%, #A08850)",
                      boxShadow: "0 0 5px rgba(239,216,154,.7)",
                    }}
                  />
                )}
                <span className="max-w-[160px] truncate">{e.label}</span>
                <span className="text-[10px] text-manor-inkFaint tabnum">
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
                  className="history-remove inline-flex items-center justify-center border-l border-manor-brass/20 px-1.5 text-manor-inkGhost"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
          {extraRightControls}
          {onClear && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("确定清空该端点的历史记录？")) onClear();
              }}
              className="text-[11px] text-manor-inkDim hover:text-manor-oxbloodHi transition-colors font-sc tracking-[0.22em]"
              style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif" }}
            >
              清空
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] text-manor-ink/85 hover:text-manor-brassHi transition-colors"
            style={{
              border: "1px solid rgba(212,179,111,.4)",
              background:
                "linear-gradient(180deg, rgba(20,42,28,.92) 0%, rgba(8,20,13,.96) 100%)",
            }}
          >
            <X size={11} />
            关闭历史
          </button>
        </div>
      </div>

      {/* 选中记录的元信息 */}
      <div
        className="shrink-0 border-b border-manor-brass/25 px-5 py-2 text-[11px] text-manor-ink/80 flex items-center gap-2"
        style={{
          background: "rgba(8,20,13,.7)",
          fontFamily: "var(--font-serif), 'EB Garamond', serif",
        }}
      >
        <span className="brass-dot shrink-0" />
        <span>
          提交于 <span className="text-manor-brassHi tabnum">{formatHistoryTime(active.submittedAt)}</span> · 返回{" "}
          <span className="text-manor-brassHi tabnum">{active.summary.rowsTotal}</span> 行
          {active.summary.unitsActual != null && (
            <> · 实耗 <span className="text-manor-brassHi tabnum">{active.summary.unitsActual}u</span></>
          )}
          {active.summary.totalBatches != null && (
            <> · <span className="text-manor-brassHi tabnum">{active.summary.totalBatches}</span> 批</>
          )}
          {active.summary.failedBatches != null && active.summary.failedBatches > 0 && (
            <> · 失败 <span className="text-manor-oxbloodHi tabnum">{active.summary.failedBatches}</span></>
          )}
        </span>
        {active.dataSource && (
          <span className="ml-auto text-manor-inkFaint">
            数据源：<span className="text-manor-brassHi">{active.dataSource}</span>
          </span>
        )}
      </div>

      {/* 历史结果表 */}
      <div className="flex-1 overflow-auto bg-[rgba(6,16,11,.6)]">
        {active.rows.length > 0 ? (
          renderTable(active.rows)
        ) : (
          <div className="flex h-full min-h-[160px] items-center justify-center px-6 py-12 text-sm text-manor-inkFaint">
            该次查询未返回数据
          </div>
        )}
      </div>
    </div>
  );
}
