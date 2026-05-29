import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import type { Cohort } from "@/lib/db/schema";
import { cohortMembers, cohorts, users } from "@/lib/db/schema";

/**
 * Tutor cohort queries. All tutor-facing reads are scoped by tutorId so a tutor
 * can only see their own cohorts (no cross-tutor leak).
 */

function inviteToken(): string {
	return randomBytes(12).toString("base64url");
}

export async function createCohort(input: {
	tutorId: string;
	name: string;
	targetBand?: number | null;
	examDate?: Date | null;
}): Promise<{ id: string; inviteToken: string }> {
	const token = inviteToken();
	const [row] = await db
		.insert(cohorts)
		.values({
			tutorId: input.tutorId,
			name: input.name,
			targetBand: input.targetBand ?? null,
			examDate: input.examDate ?? null,
			inviteToken: token,
		})
		.returning({ id: cohorts.id, inviteToken: cohorts.inviteToken });
	if (!row) throw new Error("createCohort: insert returned no row");
	return row;
}

export async function listCohortsByTutor(tutorId: string): Promise<Cohort[]> {
	return db
		.select()
		.from(cohorts)
		.where(and(eq(cohorts.tutorId, tutorId), eq(cohorts.isActive, true)))
		.orderBy(desc(cohorts.createdAt));
}

export type CohortMemberRow = {
	userId: string;
	name: string | null;
	email: string;
	status: (typeof cohortMembers.status.enumValues)[number];
};

/** A cohort (tutor-scoped) + its members joined to user identity. null if not the tutor's. */
export async function getCohortForTutor(
	cohortId: string,
	tutorId: string,
): Promise<{ cohort: Cohort; members: CohortMemberRow[] } | null> {
	const [cohort] = await db
		.select()
		.from(cohorts)
		.where(and(eq(cohorts.id, cohortId), eq(cohorts.tutorId, tutorId)))
		.limit(1);
	if (!cohort) return null;

	const members = await db
		.select({
			userId: cohortMembers.userId,
			name: users.name,
			email: users.email,
			status: cohortMembers.status,
		})
		.from(cohortMembers)
		.innerJoin(users, eq(cohortMembers.userId, users.id))
		.where(eq(cohortMembers.cohortId, cohortId))
		.orderBy(cohortMembers.joinedAt);

	return { cohort, members };
}

export type JoinResult =
	| { ok: true; cohortName: string }
	| { ok: false; reason: "not_found" | "is_tutor" };

/** Join (or re-activate) a cohort by invite token. The tutor can't join their own. */
export async function joinCohort(token: string, userId: string): Promise<JoinResult> {
	const [cohort] = await db
		.select({ id: cohorts.id, name: cohorts.name, tutorId: cohorts.tutorId })
		.from(cohorts)
		.where(and(eq(cohorts.inviteToken, token), eq(cohorts.isActive, true)))
		.limit(1);
	if (!cohort) return { ok: false, reason: "not_found" };
	if (cohort.tutorId === userId) return { ok: false, reason: "is_tutor" };

	await db
		.insert(cohortMembers)
		.values({ cohortId: cohort.id, userId, status: "active" })
		.onConflictDoUpdate({
			target: [cohortMembers.cohortId, cohortMembers.userId],
			set: { status: "active" },
		});

	return { ok: true, cohortName: cohort.name };
}
