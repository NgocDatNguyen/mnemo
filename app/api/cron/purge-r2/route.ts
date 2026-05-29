import { purgeExpiredUploads } from "@/lib/r2/purge";

export const runtime = "nodejs";

/**
 * Daily R2 retention cron (scheduled in vercel.json). Deletes mock-test uploads
 * older than 30 days. Protected by CRON_SECRET: Vercel cron sends
 * `Authorization: Bearer <CRON_SECRET>`. Returns 401 otherwise so the route can't
 * be triggered by anyone.
 */
export async function GET(req: Request): Promise<Response> {
	const secret = process.env.CRON_SECRET;
	if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	try {
		const result = await purgeExpiredUploads();
		return Response.json({ ok: true, ...result });
	} catch (err) {
		console.error("[cron/purge-r2] failed", err);
		return new Response("Internal Error", { status: 500 });
	}
}
