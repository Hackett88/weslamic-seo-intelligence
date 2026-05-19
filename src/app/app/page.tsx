import { auth } from "@/lib/auth";
import { HexBadge, SkillMedallion, FiligreeCorners } from "@/components/ManorOrnaments";
import { PageHero } from "./_components/PageHero";
import { Sparkline } from "./keywords/_components/_utils";

type MedallionSym = "bars" | "metric" | "ad";

export default async function AppPage() {
  const session = await auth();
  const name = session?.user?.name ?? "管理员";

  const mainCards: Array<{
    eyebrow: string;
    title: string;
    latin: string;
    val: string;
    sub: string;
    delta: string;
    sym: MedallionSym;
    micro: { label: string; value: string }[];
  }> = [
    {
      eyebrow: "◆ I",
      title: "关键词功能库",
      latin: "VERBA · INSTRUMENTA",
      val: "10",
      sub: "INSTRUMENTA",
      delta: "+1 本月",
      sym: "bars",
      micro: [
        { label: "在线", value: "9" },
        { label: "维护", value: "1" },
        { label: "调用/日", value: "248" },
      ],
    },
    {
      eyebrow: "◆ II",
      title: "关键词库",
      latin: "ARCHIVUM · VERBORUM",
      val: "154",
      sub: "VOCABULA",
      delta: "+14 今日",
      sym: "metric",
      micro: [
        { label: "已评", value: "141" },
        { label: "待评", value: "13" },
        { label: "受保护", value: "6" },
      ],
    },
    {
      eyebrow: "◆ III",
      title: "自动化工坊",
      latin: "OFFICINA · MACHINA",
      val: "06",
      sub: "OPERA",
      delta: "3 待审",
      sym: "ad",
      micro: [
        { label: "在跑", value: "3" },
        { label: "待审", value: "3" },
        { label: "本月", value: "21" },
      ],
    },
  ];

  const healthCells = [
    { latin: "OPERA · MENSIS",  zh: "本月词敞复利", val: "+5.9%", tone: "good" as const,    spark: [12,14,15,17,16,18,20,22,21,24,26,28] },
    { latin: "INDICATA · RATIO", zh: "本月收录率",   val: "78%",   tone: "neutral" as const, spark: [50,55,58,62,60,65,68,70,72,74,76,78] },
    { latin: "ASCENSUS",         zh: "排名上升词",   val: "38",    tone: "good" as const,    spark: [20,24,22,28,30,32,28,34,36,35,38,38] },
    { latin: "LAPSI",            zh: "本月失败率",   val: "2.1%",  tone: "warn" as const,    spark: [5,4,6,3,5,4,3,4,2,3,2.5,2.1] },
  ];

  const diariumRows = [
    { ts: "03:15", endpoint: "W01", text: "批量关键词指标查询 · 154 词更新完成", tag: "OPUS" },
    { ts: "02:48", endpoint: "W04", text: "问句词挖掘 · seed=halal cosmetics · 33 行入库", tag: "INSCR" },
    { ts: "02:11", endpoint: "W03", text: "SERP 特征实时查询 · 6 词排名前 10 抓取", tag: "OBS" },
  ];

  return (
    <>
      <PageHero
        medallion="orn-compass"
        eyebrow="◆ DOMINUS · 总览"
        title="总览"
        latin="ATRIUM · VISIO TOTIUS"
        tagline={`Salve, ${name}`}
        rightSlot={
          <div className="flex items-center gap-2.5">
            <HexBadge value="11" label="OFFICIA" sub="模块"   tone="ink"   width={88} height={84} />
            <HexBadge value="3"  label="OPERA"   sub="在线"   tone="brass" width={88} height={84} />
            <HexBadge value="2026" label="" tone="ember" width={104} height={84} />
          </div>
        }
      />

      {/* 单屏主体网格：上行 3 主卡（高度自适应），下行 4 KPI + DIARIUM 并排 */}
      <div className="flex-1 min-h-0 px-6 pb-3 grid gap-3 overflow-hidden"
           style={{ gridTemplateRows: "minmax(0, 1.05fr) minmax(0, 1fr)" }}>
        {/* Row A — 3 main pivot cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">
          {mainCards.map((c) => (
            <div
              key={c.title}
              className="glass-panel glass-panel-interactive relative p-3 flex flex-col gap-1.5 overflow-hidden"
              style={{ borderRadius: 6 }}
            >
              <FiligreeCorners size={14} />
              <div className="flex items-center justify-between">
                <div
                  className="font-sc tracking-[0.32em] text-manor-brassHi"
                  style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif", fontSize: 10 }}
                >
                  {c.eyebrow}
                </div>
                <span className="brass-dot" />
              </div>
              <div className="flex items-center gap-3">
                <SkillMedallion symbol={c.sym} size={44} />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-brass-gradient font-serif font-semibold leading-tight"
                    style={{ fontFamily: "var(--font-serif), 'EB Garamond', serif", fontSize: 17 }}
                  >
                    {c.title}
                  </div>
                  <div
                    className="font-sc tracking-[0.26em] text-manor-brassDim mt-0.5"
                    style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif", fontSize: 9 }}
                  >
                    〔{c.latin}〕
                  </div>
                </div>
              </div>

              {/* Brass divider — separates identity block from data tiles */}
              <span
                aria-hidden="true"
                className="h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(212,179,111,.35) 20%, rgba(212,179,111,.35) 80%, transparent)",
                }}
              />

              {/* Micro KPI strip — three labelled values across the empty mid section */}
              <div className="grid grid-cols-3 gap-1.5">
                {c.micro.map((m) => (
                  <div
                    key={m.label}
                    className="px-2 py-0.5 flex flex-col items-start leading-none"
                    style={{
                      background: "linear-gradient(180deg, rgba(10,22,15,.7) 0%, rgba(4,12,8,.85) 100%)",
                      border: "1px solid rgba(212,179,111,.18)",
                      borderRadius: 3,
                    }}
                  >
                    <span
                      className="font-sc tracking-[0.22em] text-manor-brassDim"
                      style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif", fontSize: 8 }}
                    >
                      {m.label}
                    </span>
                    <span
                      className="text-brass-gradient font-serif font-semibold tabnum num-breath mt-0.5"
                      style={{ fontFamily: "var(--font-serif), 'EB Garamond', serif", fontSize: 14 }}
                    >
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-1.5 border-t border-manor-brass/15 flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-brass-gradient num-breath font-serif font-semibold leading-none tabnum"
                    style={{ fontFamily: "var(--font-serif), 'EB Garamond', serif", fontSize: 24 }}
                  >
                    {c.val}
                  </span>
                  <span
                    className="font-sc tracking-[0.26em] text-manor-inkDim leading-none"
                    style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif", fontSize: 9 }}
                  >
                    {c.sub}
                  </span>
                </div>
                <span
                  className="text-manor-brassHi/85"
                  style={{
                    fontFamily: "var(--font-serif), 'EB Garamond', serif",
                    fontSize: 10.5,
                    letterSpacing: "0.06em",
                  }}
                >
                  {c.delta}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Row B — left: 4 KPI cells in 2x2 grid; right: DIARIUM panel */}
        <div className="grid grid-cols-12 gap-3 min-h-0">
          <div className="col-span-12 lg:col-span-7 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
            {healthCells.map((k) => {
              const accent =
                k.tone === "good"
                  ? "rgba(123, 166, 125, .55)"
                  : k.tone === "warn"
                  ? "rgba(166, 91, 91, .5)"
                  : "rgba(212, 179, 111, .45)";
              return (
                <div
                  key={k.latin}
                  className="glass-panel-interactive relative px-3 py-2 overflow-hidden flex flex-col justify-between"
                  style={{
                    borderRadius: 4,
                    background:
                      "linear-gradient(180deg, rgba(20, 42, 28, .92) 0%, rgba(10, 24, 16, .96) 100%)",
                    border: "1px solid rgba(212, 179, 111, .26)",
                    boxShadow:
                      "inset 0 1px 0 rgba(239, 216, 154, .18), inset 0 -1px 0 rgba(0, 0, 0, .5), 0 0 0 1px rgba(0, 0, 0, .3)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      style={{
                        width: 3,
                        height: 3,
                        transform: "rotate(45deg)",
                        background:
                          "linear-gradient(135deg, #EFD89A 0%, #A08850 100%)",
                        boxShadow: "0 0 4px rgba(239,216,154,.55)",
                      }}
                    />
                    <p
                      className="text-manor-brassHi/85 tracking-[0.26em]"
                      style={{
                        fontFamily: "var(--font-sc), 'Cormorant SC', serif",
                        fontSize: 9,
                      }}
                    >
                      {k.latin}
                    </p>
                    <span
                      className="flex-1 h-px"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(212,179,111,.45), transparent)",
                      }}
                    />
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className="text-brass-gradient font-semibold tabnum leading-none num-breath"
                      style={{
                        fontFamily: "var(--font-serif), 'EB Garamond', serif",
                        fontSize: 24,
                      }}
                    >
                      {k.val}
                    </p>
                    <span className="opacity-90 shrink-0">
                      <Sparkline data={k.spark} width={68} height={22} variant="bar" />
                    </span>
                  </div>
                  <p
                    className="text-manor-ink/75"
                    style={{
                      fontFamily: "var(--font-serif), 'EB Garamond', serif",
                      fontSize: 11,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {k.zh}
                  </p>
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-3 right-3 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div
            className="col-span-12 lg:col-span-5 glass-panel relative px-4 py-3 flex flex-col min-h-0 overflow-hidden"
            style={{ borderRadius: 6 }}
          >
            <FiligreeCorners size={12} />
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div
                className="font-sc tracking-[0.32em] text-manor-brassHi/85"
                style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif", fontSize: 10 }}
              >
                ◆ DIARIUM · 最近活动
              </div>
              <div className="flex items-center gap-1.5">
                <span className="brass-dot" />
                <span
                  className="font-sc tracking-[0.28em] text-manor-brassDim"
                  style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif", fontSize: 9 }}
                >
                  LIVE
                </span>
              </div>
            </div>
            <ul className="flex-1 min-h-0 overflow-auto no-scrollbar divide-y divide-manor-brass/15">
              {diariumRows.map((row) => (
                <li key={row.ts} className="py-2 flex items-center gap-2 row-glow group">
                  {/* Rivet-tipped timestamp gutter */}
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span
                      aria-hidden="true"
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: 9999,
                        background:
                          "radial-gradient(circle at 30% 30%, #F8E6B0, #D4B36F 55%, #A08850)",
                        boxShadow: "0 0 4px rgba(239,216,154,.7)",
                      }}
                    />
                    <span
                      className="font-sc tracking-[0.22em] text-manor-brass tabnum"
                      style={{ fontFamily: "var(--font-sc), 'Cormorant SC', serif", fontSize: 10 }}
                    >
                      {row.ts}
                    </span>
                  </span>
                  {/* Status pulse dot (sage = live event) */}
                  <span
                    className="shrink-0 brass-dot"
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 9999,
                      background:
                        "radial-gradient(circle at 30% 30%, #BDE6B1, #5C8A6B 55%, #2A4233)",
                      boxShadow: "0 0 7px rgba(123,166,125,.75)",
                    }}
                  />
                  {/* Endpoint chip with leading brass diamond */}
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 font-sc tracking-[0.22em] text-manor-brassHi leading-none shrink-0"
                    style={{
                      fontFamily: "var(--font-sc), 'Cormorant SC', serif",
                      fontSize: 9.5,
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(8,19,13,.85) 100%)",
                      border: "1px solid rgba(224,197,122,.5)",
                      borderRadius: 4,
                      boxShadow: "inset 0 1px 0 rgba(224,197,122,.25)",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 4,
                        height: 4,
                        transform: "rotate(45deg)",
                        background:
                          "linear-gradient(135deg, #EFD89A 0%, #A08850 100%)",
                        boxShadow: "0 0 4px rgba(239,216,154,.6)",
                      }}
                    />
                    {row.endpoint}
                  </span>
                  <span
                    className="text-manor-ink flex-1 truncate group-hover:text-manor-brassHi transition-colors"
                    style={{ fontFamily: "var(--font-serif), 'EB Garamond', serif", fontSize: 12, letterSpacing: "0.02em" }}
                    title={row.text}
                  >
                    {row.text}
                  </span>
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 font-sc tracking-[0.24em] text-manor-brassHi border border-manor-brass/45 shrink-0"
                    style={{
                      fontFamily: "var(--font-sc), 'Cormorant SC', serif",
                      fontSize: 8.5,
                      background: "rgba(8,19,13,.7)",
                      borderRadius: 2,
                      boxShadow: "inset 0 1px 0 rgba(224,197,122,.18)",
                    }}
                  >
                    {row.tag}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
