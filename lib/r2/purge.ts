import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { mockTests } from "@/lib/db/schema";
import { deleteObject } from "./objects";

/**
 * 30-day retention enforcement (CLAUDE.md: raw_input_url auto-delete after 30 days,
 * a privacy + cost requirement). Deletes the R2 object and nulls raw_input_url for
 * mock tests older than the window. The extracted_text + weakness analysis are kept;
 * only the original photo/PDF is purged.
 *
 * Best-effort per row: an R2 delete failure is logged but still nulls the column so
 * we don't retry forever on a missing object. Returns counts for observability.
 */
const RETENTION_DAYS = 30;

export async function purgeExpiredUploads(now: Date = new Date()): Promise<{
	purged: number;
	failed: number;
}> {
	const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

	const rows = await db
		.select({ id: mockTests.id, rawInputUrl: mockTests.rawInputUrl })
		.from(mockTests)
		.where(and(isNotNull(mockTests.rawInputUrl), lt(mockTests.createdAt, cutoff)));

	let purged = 0;
	let failed = 0;
	for (const row of rows) {
		if (!row.rawInputUrl) continue;
		try {
			await deleteObject(row.rawInputUrl);
		} catch (err) {
			failed++;
			console.error(`[purge] R2 delete failed for ${row.id}`, err);
		}
		await db.update(mockTests).set({ rawInputUrl: null }).where(eq(mockTests.id, row.id));
		purged++;
	}
	return { purged, failed };
}
