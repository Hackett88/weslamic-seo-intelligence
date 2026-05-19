import { PageHero, PageEmpty } from "../_components/PageHero";

export default function AnalyticsPage() {
  return (
    <>
      <PageHero
        medallion="orn-compass"
        eyebrow="◆ OFFICINA · 表现"
        title="表现与迭代"
        latin="ANALECTA · PERFORMANTIA"
        tagline="Measure · Iterate · Refine"
      />
      <PageEmpty message="表现监测与迭代分析功能开发中" latin="OPUS IN PROGRESSU" />
    </>
  );
}
