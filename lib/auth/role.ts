import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import type { User } from "@/lib/db/schema";
import { users } from "@/lib/db/schema";
import { auth } from "./server";

/**
 * Session + the user's role from the DB. Role isn't a Better Auth additionalField,
 * so it's read from the users row. Returns null when unauthenticated.
 */
export async function getSessionWithRole(): Promise<{
	userId: string;
	role: User["role"];
} | null> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return null;
	const [row] = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);
	return { userId: session.user.id, role: row?.role ?? "student" };
}
