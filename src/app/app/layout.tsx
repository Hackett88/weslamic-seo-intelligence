import { auth } from "@/lib/auth";
import { AppSidebar } from "./_components/AppSidebar";
import { UserMenu } from "./_components/UserMenu";
import { Bell } from "lucide-react";
import { CurrentTime } from "./_components/CurrentTime";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 固定顶栏 */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-50 flex items-center px-4 gap-4">
        {/* 品牌区 */}
        <div className="flex items-center gap-3 w-52 shrink-0">
          <span className="text-gray-900 font-bold text-sm tracking-wide">
            WESLAMIC
          </span>
          <span className="text-gray-300 text-xs">|</span>
          <span className="text-gray-900 text-xs font-light">SEO Intelligence</span>
        </div>

        {/* 弹性占位 */}
        <div className="flex-1" />

        {/* 右侧工具区 */}
        <div className="flex items-center gap-3">
          <CurrentTime />
          <button className="text-gray-400 hover:text-gray-700 transition-colors">
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
      <main className="ml-52 pt-12 pb-[50px] h-screen overflow-hidden flex flex-col">
        {children}
      </main>

      {/* 固定底栏 */}
      <footer className="fixed bottom-0 left-52 right-0 h-[50px] bg-white border-t border-gray-200 z-40 flex items-center justify-between px-6 whitespace-nowrap">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-gray-900 font-bold tracking-wide">
            WESLAMIC SEO Intelligence
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-400">基于 Semrush 数据的智能 SEO 工作台</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-gray-500">v1.0.0</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-400">© 2026 WESLAMIC · All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
