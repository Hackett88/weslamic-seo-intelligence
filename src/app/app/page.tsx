import { auth } from "@/lib/auth";

export default async function AppPage() {
  const session = await auth();
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-white">总览</h1>
        <p className="text-sm text-zinc-500 mt-1">
          欢迎回来，{session?.user?.name ?? "管理员"}
        </p>
      </div>
      <div className="flex items-center justify-center h-64 border border-dashed border-zinc-800 rounded-lg">
        <p className="text-zinc-600 text-sm">数据总览功能开发中</p>
      </div>
    </div>
  );
}
