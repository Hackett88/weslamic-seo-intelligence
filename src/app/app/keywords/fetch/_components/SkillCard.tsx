"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  description: string;
  endpoint: string;
  available: boolean;
  tags?: string[];
  featured?: boolean;
  icon?: LucideIcon;
};

export function SkillCard({
  title,
  description,
  endpoint,
  available,
  tags,
  featured,
  icon: Icon,
}: Props) {
  const slug = endpoint.toLowerCase();
  return (
    <div
      className={[
        "flex h-full flex-col rounded-lg border bg-white shadow-sm transition-colors",
        featured ? "p-5" : "p-4",
        available
          ? featured
            ? "border-emerald-200 hover:border-emerald-400 bg-gradient-to-br from-emerald-50/40 to-white"
            : "border-gray-200 hover:border-emerald-300"
          : "border-gray-200 opacity-60",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              className={[
                "w-5 h-5 shrink-0",
                available ? "text-emerald-600" : "text-gray-400",
              ].join(" ")}
            />
          )}
          <h3
            className={[
              "font-semibold text-gray-900",
              featured ? "text-base" : "text-sm",
            ].join(" ")}
          >
            {title}
          </h3>
        </div>
        {!available && (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-600">
            即将上线
          </span>
        )}
      </div>
      <p
        className={[
          "mb-3 flex-1 leading-relaxed text-gray-500",
          featured ? "text-sm" : "text-xs",
        ].join(" ")}
      >
        {description}
      </p>
      {tags && tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {available ? (
        <Link
          href={`/app/keywords/fetch/${slug}`}
          className={[
            "inline-flex items-center justify-center rounded bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700",
            featured ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
          ].join(" ")}
        >
          启动
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center rounded bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500"
        >
          启动
        </button>
      )}
    </div>
  );
}
