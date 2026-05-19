import { PageHero, PageEmpty } from "../_components/PageHero";

export default function DatasourcePage() {
  return (
    <>
      <PageHero
        medallion="orn-compass"
        eyebrow="◆ OFFICINA · 接入"
        title="数据与接入"
        latin="FONS · NEXUS DATORUM"
        tagline="Sources · Channels · Sync"
      />
      <PageEmpty message="数据源接入与凭证管理功能开发中" latin="FONS NONDUM APERTUS" />
    </>
  );
}
