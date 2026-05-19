"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Top-right Bell + notification popover.
 * - Click toggles open; click-outside / Escape closes.
 * - Popover uses `data-state` so global `.popover-brass` rules drive
 *   the open/close animation (translateY -8 → 0 + opacity 0 → 1, 0.18s).
 * - Close animation keeps the element mounted briefly so it can fade out.
 */

type Notice = { id: string; ts: string; kind: string; text: string };

const NOTICES: Notice[] = [
  { id: "n1", ts: "06:32", kind: "审核", text: "13 个候选词等待你的确认入库" },
  { id: "n2", ts: "05:54", kind: "排名", text: "prayer mat / US 进入前 20，建议加大投入" },
  { id: "n3", ts: "04:18", kind: "估值", text: "本周词敞复利估值 +$1,342" },
  { id: "n4", ts: "03:11", kind: "同步", text: "Semrush kmt_staging 已完成增量同步" },
];

const sc = "var(--font-sc), 'Cormorant SC', serif";
const serif = "var(--font-serif), 'EB Garamond', serif";

export function BellMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // keeps DOM alive during close animation
  const [unread, setUnread] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Drive mount lifecycle alongside the close animation.
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const t = window.setTimeout(() => setMounted(false), 200);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  // Click-outside + Escape close.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dataState = open ? "open" : "closed";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className="bell-btn text-manor-brassDim hover:text-manor-brassHi"
        aria-label="Bell"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-open={open ? "true" : "false"}
        data-unread={unread ? "true" : "false"}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setUnread(false); // mark as read on first open
        }}
      >
        <Bell size={15} />
      </button>

      {mounted && (
        <div
          role="dialog"
          aria-label="通知"
          data-state={dataState}
          className="popover-brass absolute right-0 top-[calc(100%+8px)] z-40 w-72 overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(12,22,16,.97) 0%, rgba(6,14,10,.97) 100%)",
            border: "1px solid rgba(201,169,97,.45)",
            borderRadius: 4,
            boxShadow:
              "0 8px 32px -6px rgba(0,0,0,.85), inset 0 1px 0 rgba(239,216,154,.22), inset 0 -1px 0 rgba(0,0,0,.65)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{
              borderBottom: "1px solid rgba(201,169,97,.22)",
              background: "linear-gradient(180deg, rgba(20,38,26,.65) 0%, rgba(8,18,12,.65) 100%)",
            }}
          >
            <div className="flex items-center gap-2 leading-none">
              <svg width="11" height="11" viewBox="0 0 10 10" aria-hidden="true">
                <polygon
                  points="5,1 9,3 9,7 5,9 1,7 1,3"
                  fill="none"
                  stroke="#EFD89A"
                  strokeWidth="0.7"
                />
              </svg>
              <span
                className="font-sc text-manor-brassHi tracking-[0.28em]"
                style={{ fontFamily: sc, fontSize: 9 }}
              >
                NUNTII
              </span>
              <span className="brass-divider-v h-3" />
              <span
                className="text-manor-inkDim leading-none"
                style={{ fontFamily: serif, fontSize: 11 }}
              >
                通知 · {NOTICES.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-manor-inkDim hover:text-manor-brassHi text-[10px] tracking-widest"
              style={{ fontFamily: sc }}
              aria-label="Close"
            >
              ESC
            </button>
          </div>

          {/* Notice list */}
          <ul className="max-h-72 overflow-y-auto no-scrollbar">
            {NOTICES.map((n) => (
              <li
                key={n.id}
                className="px-3 py-2 cursor-pointer transition-colors"
                style={{
                  borderBottom: "1px dashed rgba(201,169,97,.14)",
                  fontFamily: serif,
                }}
              >
                <div className="flex items-center gap-2 mb-0.5 leading-none">
                  <span
                    className="text-manor-brass tabnum"
                    style={{ fontFamily: sc, fontSize: 9.5, letterSpacing: "0.18em" }}
                  >
                    {n.ts}
                  </span>
                  <span
                    className="inline-flex items-center px-1 py-0.5 text-manor-brassHi leading-none"
                    style={{
                      fontFamily: serif,
                      fontSize: 9.5,
                      background: "rgba(8,19,13,.85)",
                      border: "1px solid rgba(201,169,97,.4)",
                      borderRadius: 2,
                    }}
                  >
                    {n.kind}
                  </span>
                </div>
                <p
                  className="text-manor-ink/90 leading-snug truncate"
                  style={{ fontFamily: serif, fontSize: 11.5 }}
                  title={n.text}
                >
                  {n.text}
                </p>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div
            className="px-3 py-1.5 text-center"
            style={{
              borderTop: "1px solid rgba(201,169,97,.22)",
              background: "linear-gradient(180deg, rgba(8,18,12,.4), rgba(6,14,10,.65))",
            }}
          >
            <span
              className="font-sc text-manor-brassDim tracking-[0.3em] leading-none"
              style={{ fontFamily: sc, fontSize: 8 }}
            >
              CONSPECTUS · 全部通知
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
