import { PageHero, PageEmpty } from "../_components/PageHero";

export default function StrategyPage() {
  return (
    <>
      <PageHero
        medallion="orn-compass"
        eyebrow="◆ OFFICINA · 策略"
        title="关键词策略"
        latin="STRATEGEMA · VERBORUM"
        tagline="Cluster · Theme · Plan"
      />
      <PageEmpty message="关键词分群与策略规划功能开发中" latin="CONSILIUM IN ORDINE" />
    </>
  );
}
