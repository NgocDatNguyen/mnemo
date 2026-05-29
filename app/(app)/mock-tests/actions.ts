"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { uuidv7 } from "uuidv7";
import { analyzeMockTest } from "@/lib/ai/analyze-mock-test";
import { trackServerEvent } from "@/lib/analytics/posthog-server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { mockTests } from "@/lib/db/schema";
import { headObject } from "@/lib/r2/objects";
import { buildObjectKey, getSignedUploadUrl } from "@/lib/r2/upload";
import {
	type GetUploadUrlInput,
	getUploadUrlInputSchema,
	inputSourceFromContentType,
	type RecordUploadInput,
	recordUploadInputSchema,
} from "@/lib/validators/mock-test-upload";

export type GetUploadUrlResult =
	| { ok: true; signedUrl: string; testId: string; objectKey: string }
	| { ok: false; error: "UNAUTHORIZED" | "INVALID_INPUT" | "INTERNAL" };

export type RecordUploadResult =
	| { ok: true; testId: string }
	| { ok: false; error: "UNAUTHORIZED" | "INVALID_INPUT" | "UPLOAD_NOT_FOUND" | "INTERNAL" };

export async function getUploadUrl(input: GetUploadUrlInput): Promise<GetUploadUrlResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { ok: false, error: "UNAUTHORIZED" };

	const parsed = getUploadUrlInputSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

	try {
		const testId = uuidv7();
		const objectKey = buildObjectKey(session.user.id, testId, parsed.data.filename);
		const signedUrl = await getSignedUploadUrl({
			objectKey,
			contentType: parsed.data.contentType,
		});
		return { ok: true, signedUrl, testId, objectKey };
	} catch {
		return { ok: false, error: "INTERNAL" };
	}
}

export async function recordUpload(input: RecordUploadInput): Promise<RecordUploadResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { ok: false, error: "UNAUTHORIZED" };

	const parsed = recordUploadInputSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

	// Defence in depth: object key must live under this user's namespace. Prevents
	// a logged-in user from recording an upload against another user's prefix even
	// if they tampered with the testId/objectKey returned from getUploadUrl.
	if (!parsed.data.objectKey.startsWith(`users/${session.user.id}/`)) {
		return { ok: false, error: "INVALID_INPUT" };
	}

	// Verify the browser→R2 direct upload actually landed before recording it —
	// otherwise a tampered/abandoned upload would create a row pointing at nothing
	// and the analyzer would fail fetching the object.
	const head = await headObject(parsed.data.objectKey);
	if (!head) return { ok: false, error: "UPLOAD_NOT_FOUND" };
	const contentType = parsed.data.contentType; // validated to the allowed union upstream

	try {
		await db.insert(mockTests).values({
			id: parsed.data.testId,
			userId: session.user.id,
			testType: parsed.data.testType,
			inputSource: inputSourceFromContentType(contentType),
			rawInputUrl: parsed.data.objectKey,
		});

		await trackServerEvent({
			distinctId: session.user.id,
			event: "mock_test_uploaded",
			properties: {
				test_type: parsed.data.testType,
				input_source: inputSourceFromContentType(contentType),
				content_type: contentType,
			},
		});

		// Run analysis after the response is flushed. The analyzer writes its own
		// failure marker to mock_tests.quality_warnings on error, so we don't need
		// to rethrow here — the detail page picks up the state from DB on next poll.
		after(async () => {
			try {
				await analyzeMockTest(parsed.data.testId);
			} catch {
				// analyzeMockTest already recorded the failure to the DB.
			}
		});

		return { ok: true, testId: parsed.data.testId };
	} catch {
		return { ok: false, error: "INTERNAL" };
	}
}
