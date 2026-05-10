"use client";

type Stats = {
  total: number;
  scored: number;
  unscored: number;
  protected: number;
  avgSv: number;
  avgCpc: number;
  lastSync: Date | null;
};

const cards = [
  { label: "总词数",   key: "total" as const,     color: "text-gray-900",     fmt: (v: number) => v.toLocaleString() },
  { label: "已打分",   key: "scored" as const,    color: "text-emerald-600",  fmt: (v: number) => v.toLocaleString() },
  { label: "未打分",   key: "unscored" as const,  color: "text-amber-600",    fmt: (v: number) => v.toLocaleString() },
  { label: "受保护",   key: "protected" as const, color: "text-blue-600",     fmt: (v: number) => v.toLocaleString() },
  { label: "平均搜索量", key: "avgSv" as const,   color: "text-purple-600",   fmt: (v: number) => v.toLocaleString() },
  { label: "平均 CPC",  key: "avgCpc" as const,   color: "text-teal-600",     fmt: (v: number) => `$${v.toFixed(2)}` },
];

interface SummaryBarProps {
  stats: Stats;
  onCardClick?: (key: string) => void;
}

export function SummaryBar({ stats, onCardClick }: SummaryBarProps) {
  const syncTime = stats.lastSync
    ? (() => {
        const d = new Date(stats.lastSync!);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      })()
    : "--:--";

  return (
    <div className="flex items-stretch gap-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 hover:border-emerald-400 hover:shadow-sm transition-colors cursor-pointer select-none"
          onClick={() => onCardClick?.(card.key)}
        >
          <p className="text-gray-400 text-xs mb-1">{card.label}</p>
          <p className={`text-lg font-semibold ${card.color}`}>
            {card.fmt(stats[card.key])}
          </p>
        </div>
      ))}

      {/* 最近同步 */}
      <div className="flex-1 bg-white border border-gray-200 rounded px-3 py-2">
        <p className="text-gray-400 text-xs mb-1">最近同步</p>
        <p className="text-sm font-medium text-gray-600">{syncTime}</p>
      </div>
    </div>
  );
}
