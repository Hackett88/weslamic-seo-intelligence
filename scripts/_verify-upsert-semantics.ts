/**
 * Acceptance test for incremental sync semantics.
 *
 *   1. Pick one row by row_key
 *   2. Locally mutate two fields:
 *        - protected → true (local-owned, must NOT be overwritten by sync)
 *        - keyword   → "__MARKER__" (source-owned, MUST be overwritten by sync)
 *   3. Run a tiny upsert that simulates the import script (single row from N8N)
 *   4. Read back, assert:
 *        - protected stays true
 *        - keyword reverts to source value
 *
 * Restores protected = NULL after the test so we don't pollute the table.
 */
import * as fs from "node:fs";
import postgres from "postgres";
// @ts-ignore
import { config } from "dotenv";
config({ path: ".env.local" });

const N8N_CONFIG_PATH =
  process.env.N8N_CONFIG_PATH ??
  "C:/Users/lxpfo/.claude/skills/n8n-api/config.env";
const TABLE_ID = "3irgfvwK6W7XumHj";

function loadN8nConfig() {
  const cfg = fs.readFileSync(N8N_CONFIG_PATH, "utf8");
  const baseUrl = cfg.match(/^N8N_BASE_URL=(.+)$/m)?.[1].trim();
  const apiKey = cfg.match(/^N8N_API_KEY=(.+)$/m)?.[1].trim();
  if (!baseUrl || !apiKey) throw new Error("bad N8N config");
  return { baseUrl, apiKey };
}

const sql = postgres(process.env.DATABASE_URL!, { ssl: false, connect_timeout: 10 });

(async () => {
  let testRowKey: string | undefined;
  let originalKeyword: string | undefined;

  try {
    // 0. Pick one row to mess with
    const candidate = await sql<{ row_key: string; keyword: string; protected: boolean | null }[]>`
      SELECT row_key, keyword, "protected"
      FROM keywords
      ORDER BY id
      LIMIT 1
    `;
    if (candidate.length === 0) throw new Error("no rows in keywords table");
    testRowKey = candidate[0].row_key;
    originalKeyword = candidate[0].keyword;
    console.log("Using row:");
    console.log(`  row_key   = ${testRowKey}`);
    console.log(`  keyword   = ${originalKeyword}`);
    console.log(`  protected = ${candidate[0].protected}`);

    // 1. Local mutation: simulate UI editing protected + tampering with source field
    console.log("\n[1/4] Locally mutate: protected=true, keyword='__MARKER__'");
    await sql`
      UPDATE keywords
      SET "protected" = TRUE,
          keyword     = '__MARKER__'
      WHERE row_key = ${testRowKey!}
    `;
    const afterMutation = await sql<{ keyword: string; protected: boolean | null }[]>`
      SELECT keyword, "protected" FROM keywords WHERE row_key = ${testRowKey!}
    `;
    console.log(`  -> keyword=${afterMutation[0].keyword}, protected=${afterMutation[0].protected}`);

    // 2. Fetch the same row from N8N (source of truth)
    console.log("\n[2/4] Re-fetch this row from N8N source...");
    const { baseUrl, apiKey } = loadN8nConfig();
    const url = `${baseUrl}/api/v1/data-tables/${TABLE_ID}/rows?limit=200`;
    const res = await fetch(url, { headers: { "X-N8N-API-KEY": apiKey } });
    const json: any = await res.json();
    const sourceRow = (json.data as any[]).find((r) => r.row_key === testRowKey);
    if (!sourceRow) throw new Error(`source row ${testRowKey} not found in N8N`);
    console.log(`  -> source keyword = "${sourceRow.keyword}", source protected = ${sourceRow.protected}`);

    // 3. Run the same upsert SQL the import script uses, for this single row
    console.log("\n[3/4] Run upsert (mimicking import script's ON CONFLICT clause)...");
    await sql`
      INSERT INTO keywords (
        keyword, market, month, row_key,
        search_volume, keyword_difficulty, cpc, number_of_results,
        trends, intent, serp_features_keyword,
        bp, cs, source_row_keys, "protected", question_type
      ) VALUES (
        ${sourceRow.keyword}, ${sourceRow.market}, ${sourceRow.month}, ${sourceRow.row_key},
        ${sourceRow.search_volume}, ${sourceRow.keyword_difficulty}, ${sourceRow.cpc}, ${sourceRow.number_of_results},
        ${sourceRow.trends}, ${sourceRow.intent}, ${sourceRow.serp_features_keyword},
        ${sourceRow.bp}, ${sourceRow.cs}, ${sourceRow.source_row_keys}, ${sourceRow.protected}, ${sourceRow.question_type}
      )
      ON CONFLICT (row_key) DO UPDATE SET
        keyword              = EXCLUDED.keyword,
        market               = EXCLUDED.market,
        month                = EXCLUDED.month,
        search_volume        = EXCLUDED.search_volume,
        keyword_difficulty   = EXCLUDED.keyword_difficulty,
        cpc                  = EXCLUDED.cpc,
        number_of_results    = EXCLUDED.number_of_results,
        trends               = EXCLUDED.trends,
        intent               = EXCLUDED.intent,
        serp_features_keyword = EXCLUDED.serp_features_keyword,
        bp                   = EXCLUDED.bp,
        cs                   = EXCLUDED.cs,
        source_row_keys      = EXCLUDED.source_row_keys,
        question_type        = EXCLUDED.question_type,
        updated_at           = NOW()
        -- protected 故意不在 SET 里
        -- created_at 也故意不在 SET 里
    `;
    console.log("  -> upsert executed");

    // 4. Verify
    console.log("\n[4/4] Verify after upsert...");
    const after = await sql<{ keyword: string; protected: boolean | null }[]>`
      SELECT keyword, "protected" FROM keywords WHERE row_key = ${testRowKey!}
    `;
    const finalKw = after[0].keyword;
    const finalProt = after[0].protected;
    console.log(`  -> keyword=${finalKw}, protected=${finalProt}`);

    console.log("\n===== Acceptance =====");
    const keywordRestored = finalKw === sourceRow.keyword;
    const protectedKept = finalProt === true;
    console.log(`  keyword restored to source value : ${keywordRestored ? "✅" : "❌"} (got "${finalKw}", expected "${sourceRow.keyword}")`);
    console.log(`  protected=true preserved locally : ${protectedKept ? "✅" : "❌"} (got ${finalProt})`);

    if (keywordRestored && protectedKept) {
      console.log("\n✅ PASS — incremental sync semantics correct.");
    } else {
      console.log("\n❌ FAIL — semantics broken, see above.");
      process.exitCode = 1;
    }
  } catch (err: any) {
    console.error("ERR:", err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup: restore protected = NULL on the test row so the table looks pristine
    if (testRowKey) {
      console.log("\n[cleanup] Resetting protected = NULL on test row...");
      await sql`UPDATE keywords SET "protected" = NULL WHERE row_key = ${testRowKey}`;
      console.log("  -> done");
    }
    await sql.end();
  }
})();
