import { createRequire } from "node:module";
import type { SqlJsStatic } from "sql.js";

export type { Database } from "sql.js";

/**
 * sql.js (SQLite) loader — Node only; routes using the Anki bridge run on the
 * `nodejs` runtime.
 *
 * We use the ASM.JS build (`sql-asm.js`), not the WASM build: Turbopack (Next 16's
 * bundler) can't process emscripten's generated wasm loader. The asm.js build is
 * pure JS (no separate .wasm to bundle), a touch slower, fine for occasional
 * import/export. Loaded via runtime `require` so the bundler treats it opaquely.
 */
let cached: Promise<SqlJsStatic> | null = null;

export function getSql(): Promise<SqlJsStatic> {
	if (!cached) {
		const require = createRequire(import.meta.url);
		const initSqlJs = require("sql.js/dist/sql-asm.js") as () => Promise<SqlJsStatic>;
		cached = initSqlJs();
	}
	return cached;
}
