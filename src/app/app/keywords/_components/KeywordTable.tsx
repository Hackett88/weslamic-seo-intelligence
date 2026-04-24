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
  if (!layer) return <span className="text-gray-300">—</span>;
  const colorMap: Record<string, string> = {
    L1: "bg-amber-50 text-amber-700 border-amber-200",
    L2: "bg-blue-50 text-blue-700 border-blue-200",
    L3: "bg-purple-50 text-purple-700 border-purple-200",
    L4: "bg-gray-100 text-gray-500 border-gray-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
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
  if (!handling) return <span className="text-gray-300">—</span>;
  const colorMap: Record<string, string> = {
    independent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    merge: "bg-blue-50 text-blue-700 border-blue-200",
    defer: "bg-gray-100 text-gray-500 border-gray-200",
    exclude: "bg-red-50 text-red-700 border-red-200",
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
  if (!risk) return <span className="text-gray-300">—</span>;
  const colorMap: Record<string, string> = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    high: "bg-red-50 text-red-700 border-red-200",
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
  if (!status) return <span className="text-gray-300">—</span>;
  const colorMap: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    evaluated: "bg-blue-50 text-blue-700 border-blue-200",
    clustered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    excluded: "bg-red-50 text-red-700 border-red-200",
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
        <span className="font-mono text-emerald-700 text-xs">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "rawKeyword",
      header: "关键词原文",
      size: 192,
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900 text-xs">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "normalizedKeyword",
      header: "标准化",
      size: 192,
      cell: ({ getValue }) => (
        <span className="text-gray-500 text-xs">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "language",
      header: "语言",
      size: 64,
      cell: ({ getValue }) => (
        <span className="text-center block text-xs text-gray-600">
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
        <span className="text-gray-500 text-xs font-mono">
          {(getValue() as string) ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "headKeyword",
      header: "主词",
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-700">{(getValue() as string) ?? "—"}</span>
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
        <span className="text-gray-400 text-xs">
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
            <tr key={headerGroup.id} className="bg-gray-50 h-8">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 cursor-pointer select-none hover:text-gray-900 transition-colors"
                  style={{ width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc" && (
                      <span className="text-emerald-500">↑</span>
                    )}
                    {header.column.getIsSorted() === "desc" && (
                      <span className="text-emerald-500">↓</span>
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
                className="text-center py-12 text-gray-400 text-sm"
              >
                暂无数据
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="h-9 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
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
