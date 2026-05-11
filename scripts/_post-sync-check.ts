/**
 * Post-sync acceptance check: verify the N8N workflow actually wrote to keywords.
 *   1. row count still 110
 *   2. updated_at recency distribution (how many updated within last N minutes)
 *   3. created_at NOT touched (oldest first-insert timestamps preserved)
 *   4. show min/max updated_at + sample row
 */
import postgres from "postgres";
// @ts-ignore
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!, { ssl: false, connect_timeout: 10 });

(async () => {
  try {
    const cnt = await sql<{ c: number }[]>`SELECT count(*)::int AS c FROM keywords`;
    console.log(`Row count                : ${cnt[0].c}`);

    const updRecent = await sql<
      { in_5min: number; in_1h: number; in_24h: number; older: number }[]
    >`
      SELECT
        count(*) FILTER (WHERE updated_at > NOW() - INTERVAL '5 minutes')::int  AS in_5min,
        count(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 hour')::int     AS in_1h,
        count(*) FILTER (WHERE updated_at > NOW() - INTERVAL '24 hours')::int   AS in_24h,
        count(*) FILTER (WHERE updated_at <= NOW() - INTERVAL '24 hours')::int  AS older
      FROM keywords
    `;
    console.log("\nupdated_at recency:");
    console.log(`  within 5min  : ${updRecent[0].in_5min}`);
    console.log(`  within 1h    : ${updRecent[0].in_1h}`);
    console.log(`  within 24h   : ${updRecent[0].in_24h}`);
    console.log(`  older        : ${updRecent[0].older}`);

    const ts = await sql<
      { min_updated: Date; max_updated: Date; min_created: Date; max_created: Date }[]
    >`
      SELECT
        min(updated_at) AS min_updated,
        max(updated_at) AS max_updated,
        min(created_at) AS min_created,
        max(created_at) AS max_created
      FROM keywords
    `;
    console.log("\nTimestamp ranges:");
    console.log(`  updated_at  : ${ts[0].min_updated.toISOString()}  →  ${ts[0].max_updated.toISOString()}`);
    console.log(`  created_at  : ${ts[0].min_created.toISOString()}  →  ${ts[0].max_created.toISOString()}`);

    const sample = await sql<{ row_key: string; keyword: string; updated_at: Date; created_at: Date }[]>`
      SELECT row_key, keyword, updated_at, created_at
      FROM keywords
      ORDER BY updated_at DESC
      LIMIT 3
    `;
    console.log("\nMost recently updated rows:");
    sample.forEach((r) =>
      console.log(`  ${r.row_key}  upd=${r.updated_at.toISOString()}  crt=${r.created_at.toISOString()}  kw="${r.keyword}"`)
    );

    console.log("\n===== Verdict =====");
    const allRecent = updRecent[0].in_5min === cnt[0].c;
    if (cnt[0].c === 110 && allRecent) {
      console.log("✅ Workflow ran successfully: all 110 rows touched within last 5 minutes.");
    } else if (cnt[0].c === 110 && updRecent[0].in_1h === cnt[0].c) {
      console.log("⚠️ All rows updated within last hour, but not within last 5min — workflow ran a bit ago, OK.");
    } else {
      console.log("❌ Something off — see numbers above.");
    }
  } catch (err: any) {
    console.error("ERR:", err.message);
    process.exitCode = 1;
  }
  await sql.end();
})();
