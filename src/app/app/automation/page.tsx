import { PageHero, PageEmpty } from "../_components/PageHero";

export default function AutomationPage() {
  return (
    <>
      <PageHero
        medallion="orn-compass"
        eyebrow="◆ OFFICINA · 自动化"
        title="自动化中心"
        latin="MACHINA · AUTOMATIO"
        tagline="Engines · Schedules · Pipelines"
      />
      <PageEmpty message="自动化工作流编排功能开发中" latin="MACHINA EXPECTAT" />
    </>
  );
}
