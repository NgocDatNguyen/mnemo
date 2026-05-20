import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { analyzeMockTest } from "@/lib/ai/analyze-mock-test";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { mockTests } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
// Gemini Vision generateObject typically returns in 5–15s on mock-test photos.
// Allow generous headroom for cold starts and long writing essays before timing
// out — Vercel Hobby plan caps at 60s.
export const maxDuration = 60;

/**
 * Manual retry endpoint for failed/stuck analyses.
 *
 * Auth-scoped (404 on cross-user). Idempotent: if `analyzed_at` is already set,
 * returns `{ ok: true, already_analyzed: true }` without re-billing Gemini.
 * Otherwise clears any prior `analysis_failed` warning and synchronously runs
 * the analyzer so the client can wait on the response.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

	const { id } = await params;
	const [row] = await db
		.select({ id: mockTests.id, analyzedAt: mockTests.analyzedAt })
		.from(mockTests)
		.where(and(eq(mockTests.id, id), eq(mockTests.userId, session.user.id)))
		.limit(1);

	if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
	if (row.analyzedAt) {
		return NextResponse.json({ ok: true, already_analyzed: true });
	}

	// Clear prior failure so a stale `analysis_failed` warning doesn't keep the
	// detail page in error state if the retry succeeds.
	await db.update(mockTests).set({ qualityWarnings: null }).where(eq(mockTests.id, id));

	try {
		await analyzeMockTest(id);
		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json(
			{
				ok: false,
				error: error instanceof Error ? error.message : "Analysis failed",
			},
			{ status: 500 },
		);
	}
}
