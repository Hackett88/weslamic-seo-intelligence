"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export type SortDir = "asc" | "desc";

export type Getter<T> = (row: T) => string | number | null | undefined;

type SortState = { key: string; dir: SortDir } | null;

type DefaultSort<T> =
  | { key: string; dir: SortDir }
  | ((rows: T[]) => T[])
  | undefined;

function compareValues(
  va: string | number | null | undefined,
  vb: string | number | null | undefined,
  dir: SortDir,
): number {
  const aNull = va == null;
  const bNull = vb == null;
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  if (typeof va === "number" && typeof vb === "number") {
    return dir === "asc" ? va - vb : vb - va;
  }
  const sa = String(va);
  const sb = String(vb);
  const cmp = sa.localeCompare(sb, undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return dir === "asc" ? cmp : -cmp;
}

export function useTableSort<T>(
  rows: T[],
  getters: Record<string, Getter<T>>,
  defaultSort?: DefaultSort<T>,
) {
  const [state, setState] = useState<SortState>(
    defaultSort && typeof defaultSort === "object"
      ? { key: defaultSort.key, dir: defaultSort.dir }
      : null,
  );

  const sortedRows = useMemo(() => {
    if (state) {
      const getter = getters[state.key];
      if (!getter) return rows;
      const out = [...rows];
      out.sort((a, b) => compareValues(getter(a), getter(b), state.dir));
      return out;
    }
    if (typeof defaultSort === "function") {
      return defaultSort(rows);
    }
    return rows;
  }, [rows, state, getters, defaultSort]);

  function toggle(key: string) {
    setState((prev) => {
      if (!prev || prev.key !== key) {
        const sample =
          rows.length > 0 && getters[key] ? getters[key](rows[0]) : undefined;
        return { key, dir: typeof sample === "number" ? "desc" : "asc" };
      }
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  return {
    sortedRows,
    sortKey: state?.key ?? null,
    sortDir: state?.dir ?? null,
    toggle,
  };
}

type ThProps = {
  active: boolean;
  dir: SortDir | null;
  align?: "left" | "right";
  onClick: () => void;
  className?: string;
  children: ReactNode;
};

export function SortableTh({
  active,
  dir,
  align = "left",
  onClick,
  className,
  children,
}: ThProps) {
  const Icon = active ? (dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th
      onClick={onClick}
      aria-sort={
        active ? (dir === "asc" ? "ascending" : "descending") : "none"
      }
      className={[
        "sort-th select-none cursor-pointer font-medium whitespace-nowrap",
        active ? "text-[#F0DEA0]" : "text-manor-brassHi hover:text-[#F0DEA0]",
        align === "right" ? "text-right" : "text-left",
        className ?? "",
      ].join(" ")}
      style={{
        textShadow: active ? "0 0 8px rgba(224,197,122,.55)" : undefined,
      }}
    >
      <span
        className={[
          "inline-flex w-full items-center gap-1.5",
          align === "right" ? "justify-end" : "justify-start",
        ].join(" ")}
      >
        {active && align === "left" && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 4,
              height: 4,
              borderRadius: 9999,
              background:
                "radial-gradient(circle at 30% 30%, #F0DEA0, #D4B36F 55%, #A08850)",
              boxShadow: "0 0 6px rgba(224,197,122,.7)",
            }}
          />
        )}
        <span>{children}</span>
        <Icon
          size={11}
          className={`sort-icon ${active ? "text-manor-brassHi" : "text-manor-inkGhost"}`}
        />
        {active && align === "right" && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 4,
              height: 4,
              borderRadius: 9999,
              background:
                "radial-gradient(circle at 30% 30%, #F0DEA0, #D4B36F 55%, #A08850)",
              boxShadow: "0 0 6px rgba(224,197,122,.7)",
            }}
          />
        )}
      </span>
    </th>
  );
}
