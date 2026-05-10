// Legacy seed script — superseded by scripts/import-keywords-pool.ts
// keywords table now mirrors N8N keywords_pool DataTable; populate via:
//   npx tsx scripts/import-keywords-pool.ts
//
// Kept as a no-op so old `npx tsx src/db/seed.ts` invocations don't error out.

async function seed() {
  console.log(
    "[seed] Skipped. Use scripts/import-keywords-pool.ts to load real keywords from N8N.",
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
