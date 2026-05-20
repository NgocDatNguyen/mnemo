"use server";

import { db } from "@/lib/db/client";
import { emailCaptures } from "@/lib/db/schema";

export type WaitlistResult =
	| { ok: true }
	| { ok: false; error: "invalid_email" | "already_on_list" | "server_error" };

export async function joinWaitlist(formData: FormData): Promise<WaitlistResult> {
	const email = String(formData.get("email") ?? "")
		.trim()
		.toLowerCase();
	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return { ok: false, error: "invalid_email" };
	}

	try {
		await db
			.insert(emailCaptures)
			.values({ email, source: "beta_full" })
			.onConflictDoNothing({ target: emailCaptures.email });
		return { ok: true };
	} catch (err) {
		console.error("[waitlist] insert failed", err);
		return { ok: false, error: "server_error" };
	}
}
