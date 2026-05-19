import { PageHero, PageEmpty } from "../_components/PageHero";

export default function PublishPage() {
  return (
    <>
      <PageHero
        medallion="orn-compass"
        eyebrow="◆ OFFICINA · 发布"
        title="发布与审核"
        latin="EDICTIO · REVISIO"
        tagline="Review · Approve · Publish"
      />
      <PageEmpty message="发布工作流与审核记录功能开发中" latin="SIGILLUM EXPECTATUR" />
    </>
  );
}
