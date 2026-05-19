import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FetchTabs } from "./_components/FetchTabs";
import { HexBadge } from "@/components/ManorOrnaments";

const sc = "var(--font-sc), 'Cormorant SC', serif";
const serif = "var(--font-serif), 'EB Garamond', serif";

export default async function KeywordFetchPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      {/* 紧凑标题栏 — 参考 /app/keywords 风格，单行内联 ~52px */}
      <div
        className="px-5 py-2.5 border-b border-manor-brass/25 bg-manor-bg2 flex items-center justify-between shrink-0"
      >
        <div className="flex items-baseline gap-3 min-w-0">
          <span
            className="font-sc tracking-[0.32em] text-manor-brassHi/80 shrink-0"
            style={{ fontFamily: sc, fontSize: 10 }}
          >
            ◆ OFFICINA · 上架
          </span>
          <h1
            className="text-brass-gradient font-serif font-semibold leading-none shrink-0"
            style={{
              fontFamily: serif,
              fontSize: 22,
              letterSpacing: "0.04em",
            }}
          >
            关键词功能库
          </h1>
          <span
            className="font-sc tracking-[0.24em] text-manor-brassDim shrink-0"
            style={{ fontFamily: sc, fontSize: 10 }}
          >
            〔INSTRUMENTA VERBORUM〕
          </span>
          <span
            className="ital-italic text-manor-inkDim min-w-0 truncate inline-flex items-center gap-1.5"
            style={{ fontFamily: serif, fontSize: 11 }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 3,
                height: 3,
                borderRadius: 9999,
                background:
                  "radial-gradient(circle at 30% 30%, #F8E6B0, #D4B36F 55%, #A08850)",
                boxShadow: "0 0 4px rgba(239,216,154,.6)",
              }}
            />
            Eight instruments for the unwearying weighing &amp; gathering of words.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <HexBadge value="8" label="INSTRUMENTA" sub="工具总数" tone="ink"   width={56} height={52} index={0} />
          <HexBadge value="7" label="EXPEDITA"    sub="已配置"   tone="brass" width={56} height={52} index={1} />
          <HexBadge value="1" label="VECTIS"      sub="维护中"   tone="ember" width={56} height={52} index={2} />
        </div>
      </div>
      <FetchTabs />
    </>
  );
}
