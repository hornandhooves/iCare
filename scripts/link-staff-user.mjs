// One-off helper: link an auth user id to a seeded staff row.
// Usage: node --env-file=.env.local scripts/link-staff-user.mjs <auth-user-uuid> <staff-id>
import { Client } from "pg";

const [authUserId, staffId] = process.argv.slice(2);
if (!authUserId || !staffId) {
  console.error("Usage: node --env-file=.env.local scripts/link-staff-user.mjs <auth-user-uuid> <staff-id>");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const result = await client.query(
    "update staff set user_id = $1, status = 'active' where id = $2 returning id, name, status, user_id",
    [authUserId, staffId],
  );
  console.log(result.rows);
} finally {
  await client.end();
}
