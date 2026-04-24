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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 outline-none bg-transparent border-none cursor-pointer">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-amber-500 text-zinc-950 text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-zinc-900 border-zinc-800 text-white"
      >
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-white">{name ?? "管理员"}</p>
          {email && (
            <p className="text-xs text-zinc-400 truncate">{email}</p>
          )}
        </div>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem className="text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer gap-2">
          <User size={13} />
          <span className="text-xs">个人设置</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          className="text-red-400 hover:text-red-300 hover:bg-zinc-800 cursor-pointer gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={13} />
          <span className="text-xs">退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
