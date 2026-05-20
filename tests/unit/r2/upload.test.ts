import { describe, expect, it } from "vitest";
import { buildObjectKey, sanitizeFilename } from "@/lib/r2/upload";

describe("sanitizeFilename", () => {
	it("lowercases", () => {
		expect(sanitizeFilename("Photo.JPG")).toBe("photo.jpg");
	});

	it("replaces spaces with hyphens", () => {
		expect(sanitizeFilename("my photo.png")).toBe("my-photo.png");
	});

	it("strips parens and other punctuation", () => {
		expect(sanitizeFilename("IMG_4567 (1).heic")).toBe("img_4567-1.heic");
	});

	it("collapses repeated hyphens", () => {
		expect(sanitizeFilename("a   b---c.pdf")).toBe("a-b-c.pdf");
	});

	it("trims leading and trailing hyphens", () => {
		expect(sanitizeFilename("--weird--name--.jpg")).toBe("weird-name.jpg");
	});

	it("falls back to 'file' for whitespace-only input", () => {
		expect(sanitizeFilename("   ")).toBe("file");
	});

	it("falls back to 'file' for empty string", () => {
		expect(sanitizeFilename("")).toBe("file");
	});

	it("preserves extension when basename gets fully sanitized away", () => {
		expect(sanitizeFilename("!!!.pdf")).toBe("file.pdf");
	});

	it("caps total length at 100 chars while preserving extension", () => {
		const longName = `${"a".repeat(200)}.pdf`;
		const result = sanitizeFilename(longName);
		expect(result.length).toBeLessThanOrEqual(100);
		expect(result.endsWith(".pdf")).toBe(true);
	});

	it("handles Vietnamese diacritics by replacing with hyphens", () => {
		const result = sanitizeFilename("bài thi reading.pdf");
		// Diacritics aren't in [a-z0-9._-], so they become hyphens then collapse
		expect(result.endsWith(".pdf")).toBe(true);
		expect(result).not.toMatch(/[à-ỹ]/i);
	});

	it("handles names with no extension", () => {
		expect(sanitizeFilename("Plain Name")).toBe("plain-name");
	});
});

describe("buildObjectKey", () => {
	it("constructs the canonical users/{userId}/mock-tests/{testId}/{filename} layout", () => {
		const key = buildObjectKey("user-uuid", "test-uuid", "Photo.JPG");
		expect(key).toBe("users/user-uuid/mock-tests/test-uuid/photo.jpg");
	});

	it("sanitizes the filename in the key", () => {
		const key = buildObjectKey("u1", "t1", "IMG 4567 (1).HEIC");
		expect(key).toBe("users/u1/mock-tests/t1/img-4567-1.heic");
	});
});
