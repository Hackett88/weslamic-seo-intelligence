import { PageHero, PageEmpty } from "../_components/PageHero";

export default function IndexingPage() {
  return (
    <>
      <PageHero
        medallion="orn-compass"
        eyebrow="◆ OFFICINA · 收录"
        title="收录与索引"
        latin="INDEX · ACCEPTATIO"
        tagline="Crawl · Index · Audit"
      />
      <PageEmpty message="收录监控与索引诊断功能开发中" latin="INDEX EXPECTATUR" />
    </>
  );
}
