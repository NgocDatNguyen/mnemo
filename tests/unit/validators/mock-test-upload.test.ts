import { describe, expect, it } from "vitest";
import {
	getUploadUrlInputSchema,
	inputSourceFromContentType,
	recordUploadInputSchema,
} from "@/lib/validators/mock-test-upload";

describe("getUploadUrlInputSchema", () => {
	const valid = {
		filename: "photo.jpg",
		contentType: "image/jpeg" as const,
		testType: "reading" as const,
	};

	it("accepts a valid input", () => {
		expect(getUploadUrlInputSchema.safeParse(valid).success).toBe(true);
	});

	it("rejects unsupported MIME types", () => {
		expect(getUploadUrlInputSchema.safeParse({ ...valid, contentType: "image/gif" }).success).toBe(
			false,
		);
	});

	it("rejects empty filename", () => {
		expect(getUploadUrlInputSchema.safeParse({ ...valid, filename: "" }).success).toBe(false);
	});

	it("rejects filenames over 255 chars", () => {
		expect(getUploadUrlInputSchema.safeParse({ ...valid, filename: "a".repeat(256) }).success).toBe(
			false,
		);
	});

	it("rejects invalid testType", () => {
		expect(getUploadUrlInputSchema.safeParse({ ...valid, testType: "listening" }).success).toBe(
			false,
		);
	});

	it("accepts all whitelisted MIME types", () => {
		const types = ["image/jpeg", "image/png", "image/heic", "image/heif", "application/pdf"];
		for (const contentType of types) {
			expect(getUploadUrlInputSchema.safeParse({ ...valid, contentType }).success).toBe(true);
		}
	});
});

describe("recordUploadInputSchema", () => {
	const valid = {
		testId: "550e8400-e29b-41d4-a716-446655440000",
		objectKey: "users/u1/mock-tests/t1/photo.jpg",
		testType: "writing" as const,
		contentType: "image/png" as const,
	};

	it("accepts a valid input", () => {
		expect(recordUploadInputSchema.safeParse(valid).success).toBe(true);
	});

	it("rejects non-UUID testId", () => {
		expect(recordUploadInputSchema.safeParse({ ...valid, testId: "not-a-uuid" }).success).toBe(
			false,
		);
	});

	it("rejects empty objectKey", () => {
		expect(recordUploadInputSchema.safeParse({ ...valid, objectKey: "" }).success).toBe(false);
	});
});

describe("inputSourceFromContentType", () => {
	it("returns 'pdf' for application/pdf", () => {
		expect(inputSourceFromContentType("application/pdf")).toBe("pdf");
	});

	it("returns 'photo' for image/jpeg", () => {
		expect(inputSourceFromContentType("image/jpeg")).toBe("photo");
	});

	it("returns 'photo' for image/png", () => {
		expect(inputSourceFromContentType("image/png")).toBe("photo");
	});

	it("returns 'photo' for image/heic", () => {
		expect(inputSourceFromContentType("image/heic")).toBe("photo");
	});

	it("returns 'photo' for image/heif", () => {
		expect(inputSourceFromContentType("image/heif")).toBe("photo");
	});
});
