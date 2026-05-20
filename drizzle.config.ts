import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
	throw new Error(
		"DATABASE_URL is not set. Run drizzle-kit scripts via `pnpm db:*` (loads .env.local).",
	);
}

export default defineConfig({
	schema: "./lib/db/schema/*.ts",
	out: "./drizzle",
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
	strict: true,
	verbose: true,
});
