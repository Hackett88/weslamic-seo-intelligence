import { auth } from "@/lib/auth";
import { AppSidebar } from "./_components/AppSidebar";
import { UserMenu } from "./_components/UserMenu";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";
import { CurrentTime } from "./_components/CurrentTime";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* 固定顶栏 */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-zinc-900 border-b border-zinc-800 z-50 flex items-center px-4 gap-4">
        {/* 品牌区 */}
        <div className="flex items-center gap-3 w-52 shrink-0">
          <span className="text-amber-400 font-bold text-sm tracking-wide">
            WESLAMIC
          </span>
          <span className="text-zinc-700 text-xs">|</span>
          <span className="text-zinc-400 text-xs">SEO Intelligence</span>
        </div>

        {/* 全局搜索 */}
        <div className="flex-1 flex justify-center">
          <Input
            className="w-64 h-7 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-xs focus-visible:ring-amber-500 focus-visible:border-amber-500"
            placeholder="搜索关键词 / 页面 / 词群..."
          />
        </div>

        {/* 右侧工具区 */}
        <div className="flex items-center gap-3">
          <CurrentTime />
          <button className="text-zinc-400 hover:text-white transition-colors">
            <Bell size={15} />
          </button>
          <UserMenu
            name={session?.user?.name}
            email={session?.user?.email}
          />
        </div>
      </header>

      {/* 侧栏 */}
      <AppSidebar />

      {/* 主内容区 */}
      <main className="ml-52 pt-12 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
