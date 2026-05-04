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
