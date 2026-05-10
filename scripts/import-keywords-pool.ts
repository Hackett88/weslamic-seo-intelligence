/**
 * 从 N8N 候选词池 DataTable (3irgfvwK6W7XumHj) 全量导入到本地 PostgreSQL
 * 的 keywords 表。
 *
 * - 不在源码中硬编码 N8N_API_KEY，运行时从 ~/.claude/skills/n8n-api/config.env 解析
 * - 导入前先 DELETE 现有 keywords 行，避免重复跑数据重复
 * - 使用现成的 src/db/client.ts 中的 db 实例
 *
 * NOTE: client.ts 在模块顶部就调用 postgres(process.env.DATABASE_URL!)。
 * 必须先 dotenv.config() 再 dynamic import 它，避免 ESM hoisting 导致
 * DATABASE_URL 未定义而连默认 127.0.0.1:5432。
 */
import * as fs from "node:fs";
// @ts-ignore — dotenv is a transitive dep (drizzle-kit), no @types installed by design (与 _dbtest.ts 一致)
import { config } from "dotenv";

config({ path: ".env.local" });

const N8N_CONFIG_PATH = "C:/Users/lxpfo/.claude/skills/n8n-api/config.env";
const TABLE_ID = "3irgfvwK6W7XumHj";

function loadN8nConfig(): { baseUrl: string; apiKey: string } {
  const cfg = fs.readFileSync(N8N_CONFIG_PATH, "utf8");
  const baseUrl = cfg.match(/^N8N_BASE_URL=(.+)$/m)?.[1].trim();
  const apiKey = cfg.match(/^N8N_API_KEY=(.+)$/m)?.[1].trim();
  if (!baseUrl || !apiKey) {
    throw new Error(`Failed to parse N8N config from ${N8N_CONFIG_PATH}`);
  }
  return { baseUrl, apiKey };
}

interface PoolRow {
  keyword: string;
  market: string | null;
  month: string | null;
  row_key: string | null;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  number_of_results: number | null;
  trends: string | null;
  intent: string | null;
  serp_features_keyword: string | null;
  bp: number | null;
  cs: number | null;
  source_row_keys: string | null;
  protected: boolean | null;
  question_type: string | null;
}

async function fetchAllRows(): Promise<PoolRow[]> {
  const { baseUrl, apiKey } = loadN8nConfig();
  const url = `${baseUrl}/api/v1/data-tables/${TABLE_ID}/rows?limit=200`;
  const res = await fetch(url, {
    headers: { "X-N8N-API-KEY": apiKey, accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`N8N API ${res.status} ${res.statusText}`);
  }
  const json: any = await res.json();
  if (!Array.isArray(json.data)) {
    throw new Error("N8N response missing data array");
  }
  if (json.nextCursor) {
    throw new Error(`Pagination needed: nextCursor=${json.nextCursor}. Increase limit or implement paging.`);
  }
  return json.data as PoolRow[];
}

(async () => {
  // dynamic import after dotenv ran
  const { db } = await import("../src/db/client");
  const { keywords } = await import("../src/db/schema");

  console.log("[1/3] Fetching rows from N8N keywords_pool...");
  const rows = await fetchAllRows();
  console.log(`  -> fetched ${rows.length} rows`);

  console.log("[2/3] Clearing existing keywords table...");
  const deleted = await db.delete(keywords).returning({ id: keywords.id });
  console.log(`  -> deleted ${deleted.length} existing rows`);

  console.log("[3/3] Inserting fresh rows...");
  const mapped = rows.map((r) => ({
    keyword: r.keyword,
    market: r.market,
    month: r.month,
    rowKey: r.row_key,
    searchVolume: r.search_volume,
    keywordDifficulty: r.keyword_difficulty,
    cpc: r.cpc,
    numberOfResults: r.number_of_results,
    trends: r.trends,
    intent: r.intent,
    serpFeaturesKeyword: r.serp_features_keyword,
    bp: r.bp,
    cs: r.cs,
    sourceRowKeys: r.source_row_keys,
    protected: r.protected,
    questionType: r.question_type,
  }));
  const inserted = await db.insert(keywords).values(mapped).returning({ id: keywords.id });
  console.log(`  -> inserted ${inserted.length} rows`);

  console.log("\nReport:");
  console.log(`  fetched: ${rows.length}`);
  console.log(`  inserted: ${inserted.length}`);
  console.log(`  sample[0]: ${rows[0]?.keyword} (${rows[0]?.market}, sv=${rows[0]?.search_volume})`);

  process.exit(0);
})().catch((err) => {
  console.error("import failed:", err);
  process.exit(1);
});
