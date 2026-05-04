"use client";

import { useState } from "react";
import { DataQueryGrid } from "./DataQueryGrid";
import { ScenarioGrid } from "./ScenarioGrid";
import { SeedKeywordsTab } from "./SeedKeywordsTab";

type TabKey = "query" | "scenario" | "data";

const TABS: { key: TabKey; label: string }[] = [
  { key: "query", label: "功能" },
  { key: "scenario", label: "场景" },
  { key: "data", label: "种子词库" },
];

export function FetchTabs() {
  const [active, setActive] = useState<TabKey>("query");

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex gap-1 border-b border-gray-200 px-6 shrink-0">
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={[
                "px-4 py-2 text-sm transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-emerald-500 text-emerald-700 font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-900",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        {active === "query" && <DataQueryGrid />}

        {active === "scenario" && <ScenarioGrid />}

        {active === "data" && <SeedKeywordsTab />}
      </div>
    </div>
  );
}
