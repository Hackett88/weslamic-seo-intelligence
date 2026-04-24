"use client";

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

const cards = [
  { label: "总词数", key: "total" as const, color: "text-gray-900" },
  { label: "L1 骨架", key: "l1" as const, color: "text-amber-600" },
  { label: "L2 候选", key: "l2" as const, color: "text-blue-600" },
  { label: "L3 附属", key: "l3" as const, color: "text-purple-600" },
  { label: "L4 暂缓", key: "l4" as const, color: "text-gray-500" },
  { label: "待评估", key: "pending" as const, color: "text-yellow-600" },
  { label: "已排除", key: "excluded" as const, color: "text-red-600" },
];

interface SummaryBarProps {
  stats: Stats;
}

export function SummaryBar({ stats }: SummaryBarProps) {
  const syncTime = stats.lastSync
    ? (() => {
        const d = new Date(stats.lastSync!);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      })()
    : "--:--";

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      {cards.map((card) => (
        <div
          key={card.key}
          className="flex-shrink-0 bg-white border border-gray-200 rounded px-3 py-2 min-w-[80px] hover:border-gray-300 transition-colors cursor-pointer"
        >
          <p className="text-gray-400 text-xs mb-1">{card.label}</p>
          <p className={`text-lg font-semibold ${card.color}`}>
            {stats[card.key]}
          </p>
        </div>
      ))}

      {/* 最近同步 */}
      <div className="flex-shrink-0 bg-white border border-gray-200 rounded px-3 py-2 min-w-[96px]">
        <p className="text-gray-400 text-xs mb-1">最近同步</p>
        <p className="text-sm font-medium text-gray-600">{syncTime}</p>
      </div>
    </div>
  );
}
