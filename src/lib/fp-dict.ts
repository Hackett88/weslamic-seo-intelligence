export type FpEntry = {
  code: number;
  nameEn: string;
  nameCn: string;
  linking: boolean;
};

export const FP_DICT: Record<number, FpEntry> = {
  0: { code: 0, nameEn: "Instant Answer", nameCn: "即时灰框答案", linking: false },
  1: { code: 1, nameEn: "Knowledge Panel", nameCn: "知识面板", linking: true },
  2: { code: 2, nameEn: "Carousel", nameCn: "图片/产品轮播", linking: false },
  3: { code: 3, nameEn: "Local pack", nameCn: "本地包", linking: true },
  4: { code: 4, nameEn: "Top stories", nameCn: "热门新闻", linking: true },
  5: { code: 5, nameEn: "Image pack", nameCn: "图片包", linking: true },
  6: { code: 6, nameEn: "Sitelinks", nameCn: "站内链接组", linking: true },
  7: { code: 7, nameEn: "Reviews", nameCn: "评分/评论", linking: true },
  8: { code: 8, nameEn: "Tweet", nameCn: "单条推文", linking: false },
  9: { code: 9, nameEn: "Video", nameCn: "视频结果", linking: true },
  10: { code: 10, nameEn: "Featured video", nameCn: "顶部精选视频", linking: true },
  11: { code: 11, nameEn: "Featured Snippet", nameCn: "精选摘要", linking: true },
  12: { code: 12, nameEn: "AMP", nameCn: "移动加速页", linking: false },
  13: { code: 13, nameEn: "Image", nameCn: "单图结果", linking: true },
  14: { code: 14, nameEn: "Ads top", nameCn: "顶部广告", linking: false },
  15: { code: 15, nameEn: "Ads bottom", nameCn: "底部广告", linking: false },
  16: { code: 16, nameEn: "Shopping ads", nameCn: "购物广告", linking: false },
  17: { code: 17, nameEn: "Hotels Pack", nameCn: "酒店预订", linking: false },
  18: { code: 18, nameEn: "Jobs search", nameCn: "招聘搜索", linking: false },
  19: { code: 19, nameEn: "Featured images", nameCn: "精选图片", linking: false },
  20: { code: 20, nameEn: "Video Carousel", nameCn: "视频轮播", linking: true },
  21: { code: 21, nameEn: "People also ask", nameCn: "也问了 PAA", linking: true },
  22: { code: 22, nameEn: "FAQ", nameCn: "FAQ 富结果", linking: true },
  23: { code: 23, nameEn: "Flights", nameCn: "航班预订", linking: false },
  24: { code: 24, nameEn: "Find results on", nameCn: "域名块", linking: true },
  25: { code: 25, nameEn: "Recipes", nameCn: "菜谱", linking: true },
  26: { code: 26, nameEn: "Related Topics", nameCn: "相关话题", linking: false },
  27: { code: 27, nameEn: "Twitter carousel", nameCn: "推文轮播", linking: true },
  28: { code: 28, nameEn: "Indented", nameCn: "缩进结果", linking: true },
  29: { code: 29, nameEn: "News", nameCn: "新闻列表", linking: true },
  30: { code: 30, nameEn: "Address Pack", nameCn: "地址包", linking: false },
  31: { code: 31, nameEn: "Application", nameCn: "App 应用块", linking: true },
  32: { code: 32, nameEn: "Events", nameCn: "活动列表", linking: false },
  // 33: Semrush 官方保留位，跳过
  34: { code: 34, nameEn: "Popular products", nameCn: "热门商品", linking: false },
  35: { code: 35, nameEn: "Related products", nameCn: "相关商品", linking: false },
  36: { code: 36, nameEn: "Related searches", nameCn: "相关搜索", linking: false },
  37: { code: 37, nameEn: "See results about", nameCn: "精确查询", linking: false },
  38: { code: 38, nameEn: "Short videos", nameCn: "短视频", linking: true },
  39: { code: 39, nameEn: "Web stories", nameCn: "网页故事", linking: true },
  40: { code: 40, nameEn: "Application list", nameCn: "应用列表", linking: true },
  41: { code: 41, nameEn: "Buying guide", nameCn: "购买指南", linking: true },
  42: { code: 42, nameEn: "Organic carousel", nameCn: "有机结果轮播", linking: true },
  43: { code: 43, nameEn: "Things to know", nameCn: "想知道的事", linking: true },
  44: { code: 44, nameEn: "Datasets", nameCn: "科学数据集", linking: true },
  45: { code: 45, nameEn: "Discussions and forums", nameCn: "讨论和论坛", linking: true },
  46: { code: 46, nameEn: "Explore brands", nameCn: "探索品牌", linking: true },
  47: { code: 47, nameEn: "Questions and answers", nameCn: "问答轮播", linking: true },
  48: { code: 48, nameEn: "Popular stores", nameCn: "热门商店", linking: true },
  49: { code: 49, nameEn: "Refine", nameCn: "查询细化", linking: false },
  50: { code: 50, nameEn: "People also search", nameCn: "相关搜索(底部)", linking: false },
  51: { code: 51, nameEn: "Ads middle", nameCn: "中部广告", linking: false },
  52: { code: 52, nameEn: "AI overview", nameCn: "AI 综述", linking: true },
};

export type ParsedFp = {
  code: number;
  label: string;
  linking: boolean;
  known: boolean;
};

export function parseSerpFeaturesCodes(codes: string | null | undefined): ParsedFp[] {
  if (!codes) return [];
  const seen = new Set<number>();
  const out: ParsedFp[] = [];
  for (const raw of codes.split(",")) {
    const n = Number(raw.trim());
    if (!Number.isFinite(n) || seen.has(n)) continue;
    seen.add(n);
    const entry = FP_DICT[n];
    if (entry) {
      out.push({ code: n, label: entry.nameCn, linking: entry.linking, known: true });
    } else {
      out.push({ code: n, label: `FP${n}`, linking: false, known: false });
    }
  }
  return out;
}
