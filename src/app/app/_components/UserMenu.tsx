"use client";

import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
}

export function UserMenu({ name, email }: UserMenuProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // 中文头像章字符：取 name 第一个汉字；若无则用 "客"
  const cnChar = name && /[一-龥]/.test(name)
    ? (name.match(/[一-龥]/)?.[0] ?? "客")
    : "客";
  const displayName = name ?? "Mr. Chen Xiaomin";
  const titleSub = "庄园生 · LORD";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 outline-none bg-transparent border-none cursor-pointer">
        <div className="flex flex-col items-end leading-none">
          <span
            className="ital-italic text-manor-ink"
            style={{ fontFamily: "var(--font-serif), 'EB Garamond', serif", fontSize: 12 }}
          >
            {displayName}
          </span>
          <span
            className="font-sc text-manor-brassDim tracking-[0.22em] mt-0.5"
            style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif", fontSize: 8 }}
          >
            {titleSub}
          </span>
        </div>
        <div
          className="relative inline-flex items-center justify-center select-none brass-aura"
          style={{ width: 30, height: 30 }}
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #D88876, #C46B5A 55%, #7A4239)",
              border: "1px solid rgba(201,169,97,.55)",
              boxShadow:
                "inset 0 1px 0 rgba(255,200,180,.45), inset 0 -1px 0 rgba(0,0,0,.45), 0 0 8px rgba(196,107,90,.55)",
            }}
          />
          <span
            className="relative z-10 font-serif font-semibold leading-none"
            style={{
              fontFamily: "var(--font-serif), 'EB Garamond', serif",
              fontSize: 14,
              color: "#FBF0E0",
              textShadow: "0 1px 0 rgba(0,0,0,.45)",
            }}
          >
            {cnChar !== "客" ? cnChar : initials}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="popover-brass w-52 bg-manor-bg2 border-manor-line text-manor-ink"
      >
        <div className="px-2 py-2 flex items-center gap-2">
          <svg width="14" height="14" aria-hidden="true">
            <use href="#orn-wax" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-manor-ink truncate">
              {name ?? "管理员"}
            </p>
            {email && (
              <p className="text-[10px] text-manor-inkDim truncate italic">{email}</p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="bg-manor-line" />
        <DropdownMenuItem className="text-manor-inkDim hover:text-manor-ink focus:text-manor-ink focus:bg-manor-bg3 cursor-pointer gap-2">
          <User size={13} />
          <span className="text-xs">个人设置</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-manor-line" />
        <DropdownMenuItem
          className="text-manor-oxbloodHi hover:text-manor-oxblood focus:text-manor-oxblood focus:bg-manor-bg3 cursor-pointer gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={13} />
          <span className="text-xs">退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
