"use client";

import { Moon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Bottom-most DIARIUM ticker — reads like a ledger margin under STATUS.
 * Left: moon glyph + "DIARIUM 日志·今夜" + roman date.
 * Right: rolling time-stamped event chips.
 *
 * Live behavior (r18):
 * - Every ~7s a new entry is prepended; marked `.is-fresh` for 1.5s →
 *   triggers fly-in (existing) + gold halo highlight (new).
 * - List capped to 8 entries, oldest drops off the right.
 * - Respects prefers-reduced-motion.
 * - Test hook: window.__addDiariumEntry({ kind, text }).
 */

const sc = "var(--font-sc), 'Cormorant SC', serif";
const serif = "var(--font-serif), 'EB Garamond', serif";

type Entry = { id: string; ts: string; kind: string; text: string };

const INITIAL_ENTRIES: Entry[] = [
  { id: "i1", ts: "03:15", kind: "同步", text: "与 Semrush kmt_staging 同步完成，新增 14 条候选" },
  { id: "i2", ts: "04:02", kind: "确认", text: "Islamic wedding gifts 入库 · 受保护加封" },
  { id: "i3", ts: "05:21", kind: "估值", text: "词敞复利估值上调 +5.9% · 本月累计 +$1,342" },
  { id: "i4", ts: "06:33", kind: "推荐", text: "prayer mat / US 上升 11 位次" },
];

const SAMPLE_KINDS: { kind: string; text: string }[] = [
  { kind: "同步", text: "增量同步完成，新增候选词条" },
  { kind: "估值", text: "词敞复利估值上调" },
  { kind: "推荐", text: "新主题关联建议入列" },
  { kind: "确认", text: "候选词入库 · 加封" },
  { kind: "扫描", text: "竞品广告词扫描完成" },
  { kind: "差距", text: "域名差距分析新增缺口" },
  { kind: "提醒", text: "市场热度本周变化值得复核" },
];

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-manor-brassHi border border-manor-brass/45 leading-none"
      style={{
        fontFamily: serif,
        fontSize: 10.5,
        background: "rgba(8,19,13,.75)",
        borderRadius: 2,
        boxShadow: "inset 0 1px 0 rgba(224,197,122,.18)",
      }}
    >
      {children}
    </span>
  );
}

export function DiariumTicker() {
  const [entries, setEntries] = useState<Entry[]>(INITIAL_ENTRIES);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const counterRef = useRef(0);

  const addEntry = (partial?: { kind?: string; text?: string }) => {
    counterRef.current += 1;
    const sample = SAMPLE_KINDS[Math.floor(Math.random() * SAMPLE_KINDS.length)];
    const id = `e-${Date.now()}-${counterRef.current}`;
    const next: Entry = {
      id,
      ts: nowHHMM(),
      kind: partial?.kind ?? sample.kind,
      text: partial?.text ?? sample.text,
    };
    setEntries((prev) => [next, ...prev].slice(0, 8));
    setFreshIds((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
    window.setTimeout(() => {
      setFreshIds((prev) => {
        if (!prev.has(id)) return prev;
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }, 1700);
  };

  // Auto-tick (skip if user wants reduced motion).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const handle = window.setInterval(() => addEntry(), 7000);
    return () => window.clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Test hook for browser-driven verification.
  useEffect(() => {
    (window as unknown as { __addDiariumEntry?: (p?: { kind?: string; text?: string }) => void }).__addDiariumEntry =
      (p) => addEntry(p);
    return () => {
      delete (window as unknown as { __addDiariumEntry?: unknown }).__addDiariumEntry;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-8 z-30 px-4 flex items-center gap-3 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(4,12,9,.96) 0%, rgba(2,8,6,1) 100%)",
        borderTop: "1px solid rgba(201,169,97,.22)",
        boxShadow: "inset 0 1px 0 rgba(0,0,0,.65), inset 0 -1px 0 rgba(224,197,122,.06)",
      }}
    >
      {/* Left: moon + label + roman date */}
      <div className="flex items-center gap-2 shrink-0">
        <Moon size={12} className="text-manor-brassDim" />
        <span
          className="font-sc tracking-[0.3em] text-manor-brassHi leading-none"
          style={{ fontFamily: sc, fontSize: 10 }}
        >
          DIARIUM
        </span>
        <span
          className="text-manor-inkDim leading-none"
          style={{ fontFamily: serif, fontSize: 11 }}
        >
          日志·今夜
        </span>
      </div>

      <span className="brass-divider-v h-3.5" />

      {/* Right: rolling ticker events */}
      <div className="flex-1 flex items-center gap-3 overflow-hidden text-manor-inkDim">
        {entries.map((e, i) => {
          const isFresh = freshIds.has(e.id);
          return (
            <div
              key={e.id}
              className={["diarium-entry flex items-center gap-2 min-w-0 shrink-0", isFresh ? "is-fresh" : ""].join(" ")}
              style={{ ["--diarium-i" as string]: String(i + 1) }}
            >
              <span
                className="diarium-ts font-sc tracking-[0.22em] text-manor-brass leading-none tabnum"
                style={{ fontFamily: sc, fontSize: 10.5 }}
              >
                {e.ts}
              </span>
              <span className="diarium-kind">
                <Chip>{e.kind}</Chip>
              </span>
              <span
                className="text-manor-ink/85 truncate"
                style={{ fontFamily: serif, fontSize: 11.5 }}
                title={e.text}
              >
                {e.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
