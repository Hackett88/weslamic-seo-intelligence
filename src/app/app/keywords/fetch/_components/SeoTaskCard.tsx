export type CardStatus =
  | "idle"
  | "submitting"
  | "running"
  | "succeeded"
  | "failed";

export type ProgressState = {
  status: CardStatus;
  nodeName?: string;
  nodeStatus?: string;
  seq?: number;
  totalEstimated?: number;
  rowsNew?: number;
  rowsCached?: number;
  unitsActual?: number;
  errorMessage?: string;
  mock?: boolean;
  totalBatches?: number;
  failedBatches?: number;
};

export type W01ResultRow = {
  keyword: string;
  market: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  trends: string | null;
  intent: string | null;
};

export type W03ResultRow = {
  keyword: string;
  market: string;
  position: number | null;
  position_type: string | null;
  domain: string | null;
  url: string | null;
  keyword_serp_features_codes: string | null;
  domain_serp_features_codes: string | null;
};

export type W07ResultRow = {
  keyword: string;
  market: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  intent: string | null;
};

export type W04ResultRow = {
  keyword: string;
  market: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  trends: string | null;
  intent: string | null;
  question_type: string | null;
};

export type W05ResultRow = {
  keyword: string;
  market: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  trends: string | null;
  intent: string | null;
  relevance_rate: number | null;
  keyword_serp_features_codes: string | null;
};

export type W06ResultRow = {
  keyword: string;
  market: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  trends: string | null;
  intent: string | null;
  relevance_rate: number | null;
  keyword_serp_features_codes: string | null;
};

export type W08ResultRow = {
  keyword: string;
  market: string;
  advertiser_domain: string;
  position: number | null;
  visible_url: string | null;
  ad_title: string | null;
  ad_description: string | null;
};

export type W09ResultRow = {
  keyword: string;
  market: string;
  advertiser_domain: string;
  fetch_date: string | null;
  position: number | null;
  visible_url: string | null;
  ad_title: string | null;
  ad_description: string | null;
};

export type W10ResultRow = {
  keyword: string;
  market: string;
  gap_type: string | null;
  our_domain: string | null;
  competitor_domain: string | null;
  our_position: number | null;
  competitor_position: number | null;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  number_of_results: number | null;
  trends: string | null;
  keyword_serp_features_codes: string | null;
  domain_serp_features_codes: string | null;
};
