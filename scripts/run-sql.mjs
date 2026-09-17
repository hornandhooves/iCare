// One-off helper: run a .sql file against DATABASE_URL. Not part of the app
// runtime — use `node --env-file=.env.local scripts/run-sql.mjs <file.sql>`.
import { readFileSync } from "node:fs";
import { Client } from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/run-sql.mjs <file.sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`OK: ran ${file}`);
} catch (err) {
  console.error(`FAILED: ${file}`);
  console.error(err.message);
  process.exit(1);
} finally {
  await client.end();
}
