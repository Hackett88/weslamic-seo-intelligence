"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Keyword } from "@/db/schema";

const LAYER_ORDER: Record<string, number> = {
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
  pending: 5,
};

function layerBadge(layer: string | null) {
  if (!layer) return <span className="text-zinc-600">—</span>;
  const colorMap: Record<string, string> = {
    L1: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    L2: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    L3: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    L4: "bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${colorMap[layer] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
    >
      {layer}
    </span>
  );
}

function handlingBadge(handling: string | null) {
  if (!handling) return <span className="text-zinc-600">—</span>;
  const colorMap: Record<string, string> = {
    independent: "bg-green-500/20 text-green-400 border-green-500/30",
    merge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    defer: "bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
    exclude: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const labelMap: Record<string, string> = {
    independent: "独立",
    merge: "合并",
    defer: "暂缓",
    exclude: "排除",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${colorMap[handling] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
    >
      {labelMap[handling] ?? handling}
    </span>
  );
}

function cannibalizationBadge(risk: string | null) {
  if (!risk) return <span className="text-zinc-600">—</span>;
  const colorMap: Record<string, string> = {
    low: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const labelMap: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${colorMap[risk] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
    >
      {labelMap[risk] ?? risk}
    </span>
  );
}

function statusBadge(status: string | null) {
  if (!status) return <span className="text-zinc-600">—</span>;
  const colorMap: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    evaluated: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    clustered: "bg-green-500/20 text-green-400 border-green-500/30",
    excluded: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const labelMap: Record<string, string> = {
    pending: "待评估",
    evaluated: "已评估",
    clustered: "已聚类",
    excluded: "已排除",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${colorMap[status] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
    >
      {labelMap[status] ?? status}
    </span>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}/${mm}/${dd}`;
}

interface KeywordTableProps {
  data: Keyword[];
  onRowClick: (keyword: Keyword) => void;
}

export function KeywordTable({ data, onRowClick }: KeywordTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "layer", desc: false },
  ]);

  const columns: ColumnDef<Keyword>[] = [
    {
      accessorKey: "kwId",
      header: "词条 ID",
      size: 128,
      cell: ({ getValue }) => (
        <span className="font-mono text-amber-400 text-xs">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "rawKeyword",
      header: "关键词原文",
      size: 192,
      cell: ({ getValue }) => (
        <span className="font-medium text-white text-xs">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "normalizedKeyword",
      header: "标准化",
      size: 192,
      cell: ({ getValue }) => (
        <span className="text-zinc-400 text-xs">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "language",
      header: "语言",
      size: 64,
      cell: ({ getValue }) => (
        <span className="text-center block text-xs text-zinc-300">
          {(getValue() as string) ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "layer",
      header: "分层",
      size: 80,
      sortingFn: (rowA, rowB) => {
        const a = LAYER_ORDER[rowA.original.layer ?? ""] ?? 99;
        const b = LAYER_ORDER[rowB.original.layer ?? ""] ?? 99;
        return a - b;
      },
      cell: ({ getValue }) => layerBadge(getValue() as string | null),
    },
    {
      accessorKey: "clusterCode",
      header: "词群编号",
      size: 112,
      cell: ({ getValue }) => (
        <span className="text-zinc-400 text-xs font-mono">
          {(getValue() as string) ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "headKeyword",
      header: "主词",
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-xs text-zinc-300">{(getValue() as string) ?? "—"}</span>
      ),
    },
    {
      accessorKey: "handling",
      header: "承接状态",
      size: 96,
      cell: ({ getValue }) => handlingBadge(getValue() as string | null),
    },
    {
      accessorKey: "cannibalization",
      header: "蚕食风险",
      size: 80,
      cell: ({ getValue }) => cannibalizationBadge(getValue() as string | null),
    },
    {
      accessorKey: "status",
      header: "流程状态",
      size: 80,
      cell: ({ getValue }) => statusBadge(getValue() as string | null),
    },
    {
      accessorKey: "updatedAt",
      header: "更新时间",
      size: 128,
      cell: ({ getValue }) => (
        <span className="text-zinc-500 text-xs">
          {formatDate(getValue() as Date | null)}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-max w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-zinc-900 h-8">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider whitespace-nowrap border-b border-zinc-800 cursor-pointer select-none hover:text-white transition-colors"
                  style={{ width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc" && (
                      <span className="text-amber-400">↑</span>
                    )}
                    {header.column.getIsSorted() === "desc" && (
                      <span className="text-amber-400">↓</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-12 text-zinc-600 text-sm"
              >
                暂无数据
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="h-9 hover:bg-zinc-900 cursor-pointer border-b border-zinc-800 transition-colors"
                onClick={() => onRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
