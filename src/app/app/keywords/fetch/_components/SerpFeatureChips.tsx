"use client";

import { parseSerpFeaturesCodes, type ParsedFp } from "@/lib/fp-dict";

export function SerpFeatureChips({ codes }: { codes: string | null | undefined }) {
  const items: ParsedFp[] = parseSerpFeaturesCodes(codes);
  if (items.length === 0) {
    return <span className="text-manor-inkFaint">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const baseStyle =
          !it.known
            ? {
                border: "1px solid rgba(155, 147, 132, .35)",
                background:
                  "linear-gradient(180deg, rgba(12,26,18,.85) 0%, rgba(6,16,11,.92) 100%)",
                color: "#9B9384",
                boxShadow: "inset 0 1px 0 rgba(155,147,132,.12)",
              }
            : it.linking
              ? {
                  border: "1px solid rgba(123, 166, 125, .55)",
                  background:
                    "linear-gradient(180deg, rgba(36,72,50,.88) 0%, rgba(14,32,22,.95) 100%)",
                  color: "#F0DEA0",
                  boxShadow:
                    "inset 0 1px 0 rgba(189,230,177,.2), 0 0 6px -1px rgba(92,138,107,.4)",
                }
              : {
                  border: "1px solid rgba(212, 179, 111, .35)",
                  background:
                    "linear-gradient(180deg, rgba(20,42,28,.85) 0%, rgba(8,20,13,.95) 100%)",
                  color: "#E0C77F",
                  boxShadow: "inset 0 1px 0 rgba(239,216,154,.15)",
                };
        return (
          <span
            key={it.code}
            title={`FP${it.code}${it.linking ? " · 含外链可抢" : " · 无外链"}`}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] leading-none transition-all hover:brightness-110"
            style={baseStyle}
          >
            {it.linking && (
              <span
                aria-hidden="true"
                className="mr-1 inline-block"
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 9999,
                  background:
                    "radial-gradient(circle at 30% 30%, #BDE6B1, #5C8A6B 55%, #2A4233)",
                  boxShadow: "0 0 4px rgba(123,166,125,.7)",
                }}
              />
            )}
            {it.label}
          </span>
        );
      })}
    </div>
  );
}
