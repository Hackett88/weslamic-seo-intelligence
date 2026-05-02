"use client";

import type { ReactNode } from "react";

export type CardStatus =
  | "idle"
  | "submitting"
  | "running"
  | "succeeded"
  | "failed";

export type ProgressState = {
  status: CardStatus;
  nodeName?: string;
  nodeStatus?: string;
  seq?: number;
  totalEstimated?: number;
  rowsNew?: number;
  rowsCached?: number;
  unitsActual?: number;
  errorMessage?: string;
  mock?: boolean;
};

type Props = {
  title: string;
  description?: string;
  disabled?: boolean;
  progress?: ProgressState;
  children?: ReactNode;
};

const STATUS_LABEL: Record<CardStatus, string> = {
  idle: "就绪",
  submitting: "提交中",
  running: "运行中",
  succeeded: "已完成",
  failed: "失败",
};

const STATUS_COLOR: Record<CardStatus, string> = {
  idle: "bg-gray-100 text-gray-600",
  submitting: "bg-blue-100 text-blue-700",
  running: "bg-amber-100 text-amber-700",
  succeeded: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export function SeoTaskCard({
  title,
  description,
  disabled,
  progress,
  children,
}: Props) {
  const state: ProgressState = progress ?? { status: "idle" };
  const status = state.status;
  const isFailed = status === "failed";
  const isRunning = status === "running" || status === "submitting";

  return (
    <div
      className={[
        "col-span-1 rounded-lg border bg-white p-4 shadow-sm md:col-span-2 lg:col-span-2",
        isFailed ? "border-red-300" : "border-gray-200",
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.mock && (
            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
              Mock 模式
            </span>
          )}
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              STATUS_COLOR[status],
            ].join(" ")}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      {children}

      {isRunning && (
        <div className="mt-3 space-y-1.5">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-emerald-500 animate-[indeterminate_1.4s_linear_infinite]" />
          </div>
          <div className="text-[11px] text-gray-500">处理中…</div>
          {(state.nodeName || state.seq != null) && (
            <details className="text-[11px] text-gray-400">
              <summary className="cursor-pointer select-none hover:text-gray-600">
                详情
              </summary>
              <div className="mt-1 flex items-center justify-between">
                <span>
                  {state.nodeName ?? "（等待节点）"}
                  {state.nodeStatus ? ` · ${state.nodeStatus}` : ""}
                </span>
                <span>
                  seq {state.seq ?? 0}
                  {state.totalEstimated ? ` / ${state.totalEstimated}` : ""}
                </span>
              </div>
            </details>
          )}
        </div>
      )}

      {status === "succeeded" && (
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full w-full bg-emerald-500" />
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
            完成 · 写入 {state.rowsNew ?? 0} 行
            {state.rowsCached != null
              ? ` · 命中缓存 ${state.rowsCached} 行`
              : ""}
            {state.unitsActual != null ? ` · 实耗 ${state.unitsActual}u` : ""}
          </div>
        </div>
      )}

      {status === "failed" && (
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-red-100">
            <div className="h-full w-full bg-red-500" />
          </div>
          <div className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
            {state.errorMessage ?? "调用失败"}
          </div>
        </div>
      )}
    </div>
  );
}
