import { z } from "zod";

/**
 * MIME whitelist for mock test uploads. HEIC is accepted (Gemini Vision handles
 * it natively per CLAUDE.md AI providers section); we do NOT convert in Session 6.
 */
export const ACCEPTED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/heic",
	"image/heif",
	"application/pdf",
] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const mimeSchema = z.enum(ACCEPTED_MIME_TYPES);
const testTypeSchema = z.enum(["reading", "writing"]);

export const getUploadUrlInputSchema = z.object({
	filename: z.string().min(1).max(255),
	contentType: mimeSchema,
	testType: testTypeSchema,
});

export type GetUploadUrlInput = z.infer<typeof getUploadUrlInputSchema>;

export const recordUploadInputSchema = z.object({
	testId: z.string().uuid(),
	objectKey: z.string().min(1).max(500),
	testType: testTypeSchema,
	contentType: mimeSchema,
});

export type RecordUploadInput = z.infer<typeof recordUploadInputSchema>;

/**
 * Derives the mock_input_source enum from a content type.
 * `image/*` → "photo", `application/pdf` → "pdf". Manual text entry not supported
 * via this path (Session 6 scope is file upload only).
 */
export function inputSourceFromContentType(contentType: AcceptedMimeType): "photo" | "pdf" {
	return contentType === "application/pdf" ? "pdf" : "photo";
}
