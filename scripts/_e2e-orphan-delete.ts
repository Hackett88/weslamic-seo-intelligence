/**
 * End-to-end test: verify import-keywords-pool.ts now deletes source orphans
 * while keeping protected rows.
 *
 * Procedure (NOT in transaction — actually mutates and cleans up):
 *   1. Insert 2 fake orphans (one protected, one not)
 *   2. Spawn `npx tsx scripts/import-keywords-pool.ts`
 *   3. Verify:
 *        - unprotected orphan was deleted
 *        - protected orphan still there
 *        - real 110 rows untouched
 *   4. Cleanup: delete the protected orphan if it survived
 */
import postgres from "postgres";
import { spawnSync } from "node:child_process";
// @ts-ignore
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!, { ssl: false, connect_timeout: 10 });

const FAKE_UNPROT = "fake_e2e_orphan_unprot";
const FAKE_PROT = "fake_e2e_orphan_prot";

(async () => {
  let cleanupNeeded = false;
  try {
    // 1. Setup fixture
    console.log("[1/4] Insert 2 fake orphan rows...");
    await sql`DELETE FROM keywords WHERE row_key IN (${FAKE_UNPROT}, ${FAKE_PROT})`;
    await sql`
      INSERT INTO keywords (keyword, row_key, "protected")
      VALUES
        ('__e2e_orphan_unprot__', ${FAKE_UNPROT}, NULL),
        ('__e2e_orphan_prot__',   ${FAKE_PROT},   TRUE)
    `;
    cleanupNeeded = true;
    const before = await sql<{ c: number }[]>`SELECT count(*)::int AS c FROM keywords`;
    console.log(`  -> rows now: ${before[0].c} (expected 112)`);

    // 2. Run the actual import script
    console.log("\n[2/4] Spawn `npx tsx scripts/import-keywords-pool.ts`...");
    const proc = spawnSync("npx", ["tsx", "scripts/import-keywords-pool.ts"], {
      cwd: process.cwd(),
      encoding: "utf8",
      shell: true,
    });
    if (proc.status !== 0) {
      console.error("import script failed:");
      console.error(proc.stdout);
      console.error(proc.stderr);
      throw new Error(`import-keywords-pool.ts exited with code ${proc.status}`);
    }
    // Print just the Report section
    const reportIdx = proc.stdout.indexOf("Report:");
    if (reportIdx >= 0) console.log(proc.stdout.slice(reportIdx).trim());

    // 3. Verify
    console.log("\n[3/4] Verify post-sync state...");
    const survivors = await sql<{ row_key: string; protected: boolean | null }[]>`
      SELECT row_key, "protected" FROM keywords
      WHERE row_key IN (${FAKE_UNPROT}, ${FAKE_PROT})
    `;
    const total = await sql<{ c: number }[]>`SELECT count(*)::int AS c FROM keywords`;
    console.log(`  total rows now: ${total[0].c}`);
    console.log(`  fake survivors: ${survivors.length}`);
    survivors.forEach((s) => console.log(`     ${s.row_key} protected=${s.protected}`));

    const unprotectedDeleted = !survivors.some((s) => s.row_key === FAKE_UNPROT);
    const protectedKept = survivors.some((s) => s.row_key === FAKE_PROT && s.protected === true);
    const realDataIntact = total[0].c === 111; // 110 real + 1 protected fake

    console.log("\n===== Acceptance =====");
    console.log(`  unprotected orphan deleted : ${unprotectedDeleted ? "✅" : "❌"}`);
    console.log(`  protected orphan kept      : ${protectedKept ? "✅" : "❌"}`);
    console.log(`  real 110 rows untouched    : ${realDataIntact ? "✅" : "❌"} (count=${total[0].c}, expected 111)`);

    if (unprotectedDeleted && protectedKept && realDataIntact) {
      console.log("\n✅ PASS — orphan delete with protected-row safety works.");
    } else {
      console.log("\n❌ FAIL — see above.");
      process.exitCode = 1;
    }
  } catch (err: any) {
    console.error("\nE2E test failed:", err.message);
    process.exitCode = 1;
  } finally {
    if (cleanupNeeded) {
      console.log("\n[4/4] Cleanup: removing both fake orphans (in case any survived)...");
      const cleaned = await sql`
        DELETE FROM keywords WHERE row_key IN (${FAKE_UNPROT}, ${FAKE_PROT})
        RETURNING row_key
      `;
      console.log(`  -> cleanup deleted: ${cleaned.length}`);
    }
    await sql.end();
  }
})();
