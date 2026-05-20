import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const tables = await sql`
	SELECT tablename FROM pg_tables
	WHERE schemaname = 'public'
	ORDER BY tablename
`;
console.log("TABLES IN public SCHEMA:");
for (const row of tables) console.log(`  - ${row.tablename}`);
console.log(`  (${tables.length} total)`);

const [{ count: userCount }] = await sql`SELECT COUNT(*)::int AS count FROM users`;
console.log(`\nSELECT COUNT(*) FROM users  →  ${userCount}`);
