"use client";

import { parseSerpFeaturesCodes, type ParsedFp } from "@/lib/fp-dict";

export function SerpFeatureChips({ codes }: { codes: string | null | undefined }) {
  const items: ParsedFp[] = parseSerpFeaturesCodes(codes);
  if (items.length === 0) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((it) => {
        const cls = !it.known
          ? "border-gray-300 bg-gray-50 text-gray-500"
          : it.linking
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-gray-200 bg-gray-50 text-gray-600";
        return (
          <span
            key={it.code}
            title={`FP${it.code}${it.linking ? " · 含外链可抢" : " · 无外链"}`}
            className={[
              "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] leading-none",
              cls,
            ].join(" ")}
          >
            {it.label}
          </span>
        );
      })}
    </div>
  );
}
