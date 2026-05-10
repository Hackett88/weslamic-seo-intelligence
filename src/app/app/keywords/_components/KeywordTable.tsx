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
import type { Keyword } from "@/db/schema";
import { formatBP, formatCS, formatIntent, parseTrends, Sparkline } from "./_utils";

function kdCell(kd: number | null) {
  if (kd === null || kd === undefined) return <span className="text-gray-300">—</span>;
  const cls = kd >= 70 ? "text-red-600" : kd >= 40 ? "text-amber-600" : "text-emerald-600";
  return <span className={`text-xs font-medium ${cls}`}>{kd}</span>;
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
    { id: "searchVolume", desc: true },
  ]);

  const columns: ColumnDef<Keyword>[] = [
    {
      accessorKey: "keyword",
      header: "关键词",
      size: 240,
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900 text-xs">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "market",
      header: "市场",
      size: 64,
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-600 uppercase">
          {(getValue() as string) ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "searchVolume",
      header: "搜索量",
      size: 96,
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return (
          <span className="text-xs text-gray-700 tabular-nums">
            {v != null ? v.toLocaleString() : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "keywordDifficulty",
      header: "KD",
      size: 64,
      cell: ({ getValue }) => kdCell(getValue() as number | null),
    },
    {
      accessorKey: "cpc",
      header: "CPC",
      size: 80,
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return (
          <span className="text-xs text-gray-700 tabular-nums">
            {v != null ? `$${v.toFixed(2)}` : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "bp",
      header: "BP 业务价值",
      size: 144,
      cell: ({ getValue }) => formatBP(getValue() as number | null),
    },
    {
      accessorKey: "cs",
      header: "CS 商业信号",
      size: 144,
      cell: ({ getValue }) => formatCS(getValue() as number | null),
    },
    {
      accessorKey: "intent",
      header: "意图",
      size: 96,
      cell: ({ getValue }) => formatIntent(getValue() as string | null),
    },
    {
      accessorKey: "trends",
      header: "12 月趋势",
      size: 132,
      enableSorting: false,
      cell: ({ getValue }) => {
        const data = parseTrends(getValue() as string | null);
        if (!data) return <span className="text-gray-300 text-xs">—</span>;
        return <Sparkline data={data} width={100} height={24} variant="bar" />;
      },
    },
    {
      accessorKey: "protected",
      header: "保护",
      size: 56,
      cell: ({ getValue }) => {
        const v = getValue() as boolean | null;
        if (v === true) {
          return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs border bg-blue-50 text-blue-700 border-blue-200">
              是
            </span>
          );
        }
        return <span className="text-gray-300 text-xs">—</span>;
      },
    },
    {
      accessorKey: "updatedAt",
      header: "更新时间",
      size: 96,
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
