"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Target,
  FileText,
  PenLine,
  CheckSquare,
  Search,
  BarChart2,
  Zap,
  Plug,
} from "lucide-react";

const navItems = [
  { label: "总览", href: "/app", icon: LayoutDashboard },
  { label: "关键词库", href: "/app/keywords", icon: Database },
  { label: "关键词策略", href: "/app/strategy", icon: Target },
  { label: "页面规划", href: "/app/pages", icon: FileText },
  { label: "内容工坊", href: "/app/content", icon: PenLine },
  { label: "发布与审核", href: "/app/publish", icon: CheckSquare },
  { label: "收录与索引", href: "/app/indexing", icon: Search },
  { label: "表现与迭代", href: "/app/analytics", icon: BarChart2 },
  { label: "自动化中心", href: "/app/automation", icon: Zap },
  { label: "数据与接入", href: "/app/datasource", icon: Plug },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-12 h-[calc(100vh-3rem)] w-52 bg-zinc-900 border-r border-zinc-800 overflow-y-auto z-40">
      <nav className="py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                "border-l-2",
                isActive
                  ? "bg-zinc-800 border-amber-500 text-white"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white",
              ].join(" ")}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
