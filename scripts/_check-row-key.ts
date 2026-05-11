/**
 * Read-only probe: verify whether `row_key` can serve as the business unique key
 * for incremental upsert sync. Pulls directly from N8N keywords_pool DataTable
 * (source of truth), no local DB needed.
 *
 * Output:
 *   - total rows
 *   - NULL row_key count
 *   - empty-string row_key count
 *   - distinct row_key count
 *   - duplicate row_key values (if any)
 */
import * as fs from "node:fs";

const N8N_CONFIG_PATH =
  process.env.N8N_CONFIG_PATH ??
  "C:/Users/lxpfo/.claude/skills/n8n-api/config.env";
const TABLE_ID = "3irgfvwK6W7XumHj";

function loadN8nConfig(): { baseUrl: string; apiKey: string } {
  const cfg = fs.readFileSync(N8N_CONFIG_PATH, "utf8");
  const baseUrl = cfg.match(/^N8N_BASE_URL=(.+)$/m)?.[1].trim();
  const apiKey = cfg.match(/^N8N_API_KEY=(.+)$/m)?.[1].trim();
  if (!baseUrl || !apiKey) throw new Error(`Failed to parse N8N config from ${N8N_CONFIG_PATH}`);
  return { baseUrl, apiKey };
}

interface PoolRow {
  row_key: string | null;
  keyword: string;
  market: string | null;
  month: string | null;
}

async function fetchAllRows(): Promise<PoolRow[]> {
  const { baseUrl, apiKey } = loadN8nConfig();
  const all: PoolRow[] = [];
  let cursor: string | null = null;
  let page = 0;
  do {
    const url =
      `${baseUrl}/api/v1/data-tables/${TABLE_ID}/rows?limit=200` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const res = await fetch(url, {
      headers: { "X-N8N-API-KEY": apiKey, accept: "application/json" },
    });
    if (!res.ok) throw new Error(`N8N API ${res.status} ${res.statusText}`);
    const json: any = await res.json();
    if (!Array.isArray(json.data)) throw new Error("N8N response missing data array");
    all.push(...(json.data as PoolRow[]));
    cursor = json.nextCursor ?? null;
    page++;
    console.log(`  page ${page}: +${json.data.length} (cursor=${cursor ?? "end"})`);
  } while (cursor);
  return all;
}

(async () => {
  try {
    console.log("Fetching rows from N8N keywords_pool...");
    const rows = await fetchAllRows();

    const total = rows.length;
    const nullRows = rows.filter((r) => r.row_key == null);
    const emptyRows = rows.filter((r) => r.row_key === "");
    const validRows = rows.filter((r) => r.row_key != null && r.row_key !== "");
    const keyCount = new Map<string, number>();
    for (const r of validRows) keyCount.set(r.row_key!, (keyCount.get(r.row_key!) ?? 0) + 1);
    const distinct = keyCount.size;
    const dupes = [...keyCount.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);

    console.log("\n===== row_key 可用性探查（源端 N8N keywords_pool） =====");
    console.log(`总行数            : ${total}`);
    console.log(`NULL 数            : ${nullRows.length}`);
    console.log(`空字符串数         : ${emptyRows.length}`);
    console.log(`有效（非空）行数   : ${validRows.length}`);
    console.log(`distinct row_key   : ${distinct}`);
    console.log(`重复 row_key 组数  : ${dupes.length}`);

    if (nullRows.length > 0) {
      console.log("\nNULL row_key 样例 (前 5):");
      nullRows.slice(0, 5).forEach((r) =>
        console.log(`  keyword="${r.keyword}" market=${r.market} month=${r.month}`)
      );
    }
    if (dupes.length > 0) {
      console.log("\n重复 row_key 样例 (前 10):");
      dupes.slice(0, 10).forEach(([k, c]) => console.log(`  ${k}  x${c}`));
    }

    console.log("\n===== 结论 =====");
    if (nullRows.length === 0 && emptyRows.length === 0 && dupes.length === 0 && total > 0) {
      console.log("✅ row_key 可直接做 UNIQUE 约束，无需清洗。可放心做 upsert。");
    } else {
      console.log("⚠️ 不能直接加 UNIQUE，需要先决定清洗策略：");
      if (nullRows.length > 0) console.log(`   - ${nullRows.length} 条 NULL row_key`);
      if (emptyRows.length > 0) console.log(`   - ${emptyRows.length} 条空字符串 row_key`);
      if (dupes.length > 0) console.log(`   - ${dupes.length} 组重复值`);
    }
    process.exit(0);
  } catch (err: any) {
    console.error("ERR:", err.message);
    process.exit(1);
  }
})();
