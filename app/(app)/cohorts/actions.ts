"use server";

import { z } from "zod";
import { getSessionWithRole } from "@/lib/auth/role";
import { createCohort } from "@/lib/db/queries";

export type CreateCohortResult =
	| { ok: true; cohortId: string }
	| { ok: false; error: "FORBIDDEN" | "INVALID" | "INTERNAL" };

const Schema = z.object({
	name: z.string().trim().min(1).max(120),
	targetBand: z.coerce.number().min(0).max(9).optional(),
	examDate: z.string().optional(),
});

/** Create a cohort. Tutor-only (role gate, server-side). */
export async function createCohortAction(input: unknown): Promise<CreateCohortResult> {
	const ctx = await getSessionWithRole();
	if (!ctx) return { ok: false, error: "FORBIDDEN" };
	if (ctx.role !== "tutor") return { ok: false, error: "FORBIDDEN" };

	const parsed = Schema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "INVALID" };

	try {
		const { id } = await createCohort({
			tutorId: ctx.userId,
			name: parsed.data.name,
			targetBand: parsed.data.targetBand ?? null,
			examDate: parsed.data.examDate ? new Date(parsed.data.examDate) : null,
		});
		return { ok: true, cohortId: id };
	} catch (err) {
		console.error("[createCohortAction] failed", err);
		return { ok: false, error: "INTERNAL" };
	}
}
