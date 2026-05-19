import { PageHero, PageEmpty } from "../_components/PageHero";

export default function ContentPage() {
  return (
    <>
      <PageHero
        medallion="orn-compass"
        eyebrow="◆ OFFICINA · 内容"
        title="内容工坊"
        latin="SCRIPTORIUM · TEXTUS"
        tagline="Draft · Refine · Publish"
      />
      <PageEmpty message="内容生产与素材库功能开发中" latin="CALAMUS DORMIT" />
    </>
  );
}
