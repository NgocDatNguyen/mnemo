import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { R2_BUCKET, r2 } from "./client";

const PUT_URL_TTL_SECONDS = 300; // 5 minutes
const READ_URL_TTL_SECONDS = 600; // 10 minutes

/**
 * Normalize a filename for safe inclusion in an R2 object key.
 *
 * Strategy:
 * - lowercase
 * - replace any char outside [a-z 0-9 . _ -] with "-"
 * - collapse runs of "-"
 * - trim leading/trailing "-"
 * - cap length at 100 chars while preserving the extension
 *
 * Empty/whitespace-only input falls back to "file".
 */
export function sanitizeFilename(input: string): string {
	const trimmed = input.trim();
	if (trimmed.length === 0) return "file";

	const lastDot = trimmed.lastIndexOf(".");
	const hasExt = lastDot > 0 && lastDot < trimmed.length - 1;
	const base = hasExt ? trimmed.slice(0, lastDot) : trimmed;
	const ext = hasExt ? trimmed.slice(lastDot) : "";

	const clean = (s: string) =>
		s
			.toLowerCase()
			.replace(/[^a-z0-9._-]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "");

	const cleanedBase = clean(base) || "file";
	const cleanedExt = clean(ext); // ext keeps the leading dot since "." is allowed

	const MAX = 100;
	const room = Math.max(1, MAX - cleanedExt.length);
	const truncatedBase = cleanedBase.slice(0, room);

	return `${truncatedBase}${cleanedExt}`;
}

export function buildObjectKey(userId: string, testId: string, filename: string): string {
	return `users/${userId}/mock-tests/${testId}/${sanitizeFilename(filename)}`;
}

export async function getSignedUploadUrl(params: {
	objectKey: string;
	contentType: string;
}): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: R2_BUCKET,
		Key: params.objectKey,
		ContentType: params.contentType,
	});
	return getSignedUrl(r2, command, { expiresIn: PUT_URL_TTL_SECONDS });
}

export async function getSignedReadUrl(objectKey: string): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: R2_BUCKET,
		Key: objectKey,
	});
	return getSignedUrl(r2, command, { expiresIn: READ_URL_TTL_SECONDS });
}
