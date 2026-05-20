import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { mockTests } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Polling target for the analysis-status client component.
 *
 * Scoped by `user_id` so a probed id belonging to another user returns 404,
 * not 403 — avoids leaking existence of other users' tests.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

	const { id } = await params;
	const [row] = await db
		.select({
			analyzedAt: mockTests.analyzedAt,
			qualityWarnings: mockTests.qualityWarnings,
		})
		.from(mockTests)
		.where(and(eq(mockTests.id, id), eq(mockTests.userId, session.user.id)))
		.limit(1);

	if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

	const hasError = (row.qualityWarnings ?? []).some((w) => w.type === "analysis_failed");

	return NextResponse.json({
		analyzedAt: row.analyzedAt?.toISOString() ?? null,
		hasError,
	});
}
