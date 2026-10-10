/**
 * One-time runner for sql/halfway-invites-privacy.sql (PR #252).
 * Not a check, not run by the build or any request.
 *
 *   npx tsx scripts/migrate-halfway-invites.ts            # dry run: prints the SQL
 *   DATABASE_URL=… npx tsx scripts/migrate-halfway-invites.ts --apply
 *
 * --apply runs each statement in order, then verifies the columns and the
 * unique index. Only Amjad / Ajz run --apply, against the database they
 * mean (production Neon, or a Neon branch).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const SQL_FILE = "sql/halfway-invites-privacy.sql";

export function migrationStatements(sqlText: string): string[] {
  return sqlText
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  const statements = migrationStatements(readFileSync(join(process.cwd(), SQL_FILE), "utf8"));
  const apply = process.argv.includes("--apply");
  if (!apply) {
    console.log(`dry run: ${statements.length} statements from ${SQL_FILE}\n`);
    for (const statement of statements) console.log(`${statement};\n`);
    console.log("re-run with --apply and DATABASE_URL set to run them.");
    return;
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required for --apply");
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return "(unparseable)";
    }
  })();
  console.log(`applying ${statements.length} statements to ${host}`);
  const sql = neon(url);
  for (const statement of statements) {
    await sql.query(statement);
    console.log(`ok: ${statement.split("\n")[0]}`);
  }
  const columns = (await sql.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'halfway_invites'
       AND column_name IN ('shop_ids', 'locale', 'host_locations', 'legacy_key')`,
  )) as { column_name: string }[];
  const index = (await sql.query(
    `SELECT 1 FROM pg_indexes WHERE schemaname = current_schema()
       AND tablename = 'halfway_invites' AND indexname = 'halfway_invites_legacy_key_idx'`,
  )) as unknown[];
  if (columns.length !== 4 || index.length !== 1) {
    throw new Error(`verify failed: ${columns.length}/4 columns, ${index.length}/1 index`);
  }
  console.log("verified: 4 columns + legacy_key unique index");
}

if (process.argv[1]?.endsWith("migrate-halfway-invites.ts")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
