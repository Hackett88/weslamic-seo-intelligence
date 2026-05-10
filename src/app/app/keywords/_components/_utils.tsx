"use client";

import * as React from "react";

const BP_LABELS: Record<number, string> = {
  3: "产品不可替代",
  2: "产品明显有助",
  1: "可顺带提及",
  0: "无关联",
};

const CS_LABELS: Record<number, string> = {
  3: "商业型",
  2: "混合型",
  1: "信息型",
  0: "无商业信号",
};

const SCORE_COLOR: Record<number, string> = {
  3: "bg-emerald-50 text-emerald-700 border-emerald-200",
  2: "bg-blue-50 text-blue-700 border-blue-200",
  1: "bg-amber-50 text-amber-700 border-amber-200",
  0: "bg-gray-50 text-gray-500 border-gray-200",
};

const INTENT_LABELS: Record<string, string> = {
  informational: "信息型",
  commercial: "商业型",
  mixed: "混合型",
  navigational: "导航型",
  transactional: "交易型",
};

const INTENT_COLOR: Record<string, string> = {
  informational: "bg-teal-50 text-teal-700 border-teal-200",
  commercial: "bg-purple-50 text-purple-700 border-purple-200",
  mixed: "bg-blue-50 text-blue-700 border-blue-200",
  navigational: "bg-amber-50 text-amber-700 border-amber-200",
  transactional: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function bpLabel(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return BP_LABELS[value] ?? null;
}

export function csLabel(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return CS_LABELS[value] ?? null;
}

export function formatBP(value: number | null | undefined): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-300">—</span>;
  }
  const label = BP_LABELS[value] ?? "";
  const cls = SCORE_COLOR[value] ?? SCORE_COLOR[0];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${cls}`}>
      <span className="font-semibold mr-1">{value}</span>
      {label}
    </span>
  );
}

export function formatCS(value: number | null | undefined): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-300">—</span>;
  }
  const label = CS_LABELS[value] ?? "";
  const cls = SCORE_COLOR[value] ?? SCORE_COLOR[0];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${cls}`}>
      <span className="font-semibold mr-1">{value}</span>
      {label}
    </span>
  );
}

function translateIntentToken(token: string): string | null {
  const key = token.trim().toLowerCase();
  if (!key) return null;
  return INTENT_LABELS[key] ?? null;
}

export function intentLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const tokens = value.split(/[,、|/]/).map(translateIntentToken).filter(Boolean) as string[];
  if (tokens.length === 0) return null;
  return tokens.join(" / ");
}

export function formatIntent(value: string | null | undefined): React.ReactNode {
  if (!value) return <span className="text-gray-300">—</span>;
  const tokens = value.split(/[,、|/]/);
  const labels = tokens.map(translateIntentToken).filter(Boolean) as string[];
  if (labels.length === 0) return <span className="text-gray-300">—</span>;
  const primaryKey = tokens[0].trim().toLowerCase();
  const cls = INTENT_COLOR[primaryKey] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${cls}`}>
      {labels.join(" / ")}
    </span>
  );
}

export function parseTrends(value: string | null | undefined): number[] | null {
  if (!value) return null;
  const parts = value
    .split(",")
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));
  if (parts.length !== 12) return null;
  return parts;
}

interface SparklineProps {
  data: number[] | null;
  width?: number;
  height?: number;
  variant?: "bar" | "line";
}

export function Sparkline({
  data,
  width = 100,
  height = 24,
  variant = "bar",
}: SparklineProps) {
  if (!data || data.length === 0) {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  const max = Math.max(...data, 0.0001);
  const n = data.length;

  if (variant === "line") {
    const step = n > 1 ? width / (n - 1) : 0;
    const path = data
      .map((v, i) => {
        const x = i * step;
        const y = height - (v / max) * (height - 2) - 1;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return (
      <svg
        width={width}
        height={height}
        className="text-emerald-500 inline-block align-middle"
        aria-hidden
      >
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  const gap = 1;
  const barW = Math.max(1, (width - gap * (n - 1)) / n);
  return (
    <svg
      width={width}
      height={height}
      className="text-emerald-500 inline-block align-middle"
      aria-hidden
    >
      {data.map((v, i) => {
        const h = Math.max(1, (v / max) * height);
        const x = i * (barW + gap);
        const y = height - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={h}
            fill="currentColor"
            rx={0.5}
          />
        );
      })}
    </svg>
  );
}
