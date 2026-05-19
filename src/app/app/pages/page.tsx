import { PageHero, PageEmpty } from "../_components/PageHero";

export default function PagesPage() {
  return (
    <>
      <PageHero
        medallion="orn-compass"
        eyebrow="◆ OFFICINA · 页面"
        title="页面规划"
        latin="ARCHITECTURA · PAGINARUM"
        tagline="Outline · Brief · Map"
      />
      <PageEmpty message="页面架构与简报规划功能开发中" latin="CHARTA NONDUM TRACTA" />
    </>
  );
}
