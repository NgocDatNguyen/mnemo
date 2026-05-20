import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for lib/auth/access.ts.
 *
 * Strategy: mock `@/lib/db/client` so we can control the user-count return
 * value without hitting Neon. Each test uses `vi.resetModules()` + dynamic
 * import to pick up the latest env-var state and mock — the constants
 * BETA_MODE / BETA_USER_LIMIT are read at module load.
 */

beforeEach(() => {
	vi.resetModules();
	vi.stubEnv("BETA_MODE", "true");
	vi.stubEnv("BETA_USER_LIMIT", "100");
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.doUnmock("@/lib/db/client");
});

function mockUserCount(count: number) {
	vi.doMock("@/lib/db/client", () => ({
		db: {
			select: () => ({
				from: async () => [{ value: count }],
			}),
		},
	}));
}

describe("BETA_MODE constant", () => {
	it("is true when env BETA_MODE='true'", async () => {
		vi.stubEnv("BETA_MODE", "true");
		const { BETA_MODE } = await import("@/lib/auth/access");
		expect(BETA_MODE).toBe(true);
	});

	it("is false for any other env value", async () => {
		vi.stubEnv("BETA_MODE", "false");
		const { BETA_MODE } = await import("@/lib/auth/access");
		expect(BETA_MODE).toBe(false);
	});
});

describe("BETA_USER_LIMIT constant", () => {
	it("reflects env value", async () => {
		vi.stubEnv("BETA_USER_LIMIT", "250");
		const { BETA_USER_LIMIT } = await import("@/lib/auth/access");
		expect(BETA_USER_LIMIT).toBe(250);
	});

	it("falls back to 100 when env is unset", async () => {
		vi.stubEnv("BETA_USER_LIMIT", "");
		const { BETA_USER_LIMIT } = await import("@/lib/auth/access");
		expect(BETA_USER_LIMIT).toBe(100);
	});
});

describe("canAcceptNewUser", () => {
	it("returns true when user count is well below limit", async () => {
		mockUserCount(42);
		const { canAcceptNewUser } = await import("@/lib/auth/access");
		expect(await canAcceptNewUser()).toBe(true);
	});

	it("returns true at count = limit − 1", async () => {
		mockUserCount(99);
		const { canAcceptNewUser } = await import("@/lib/auth/access");
		expect(await canAcceptNewUser()).toBe(true);
	});

	it("returns false at count = limit", async () => {
		mockUserCount(100);
		const { canAcceptNewUser } = await import("@/lib/auth/access");
		expect(await canAcceptNewUser()).toBe(false);
	});

	it("returns false when count is over limit (soft-cap overflow)", async () => {
		mockUserCount(101);
		const { canAcceptNewUser } = await import("@/lib/auth/access");
		expect(await canAcceptNewUser()).toBe(false);
	});

	it("returns true regardless of count when BETA_MODE is off", async () => {
		vi.stubEnv("BETA_MODE", "false");
		mockUserCount(9999);
		const { canAcceptNewUser } = await import("@/lib/auth/access");
		expect(await canAcceptNewUser()).toBe(true);
	});
});

describe("canAccessFeature", () => {
	it("returns true for beta tester during beta", async () => {
		const { canAccessFeature } = await import("@/lib/auth/access");
		expect(canAccessFeature({ betaTester: true }, "mock_test")).toBe(true);
	});

	it("returns false for non-beta-tester during beta", async () => {
		const { canAccessFeature } = await import("@/lib/auth/access");
		expect(canAccessFeature({ betaTester: false }, "mock_test")).toBe(false);
	});

	it("returns false for user with null betaTester during beta", async () => {
		const { canAccessFeature } = await import("@/lib/auth/access");
		expect(canAccessFeature({ betaTester: null }, "ai_generation")).toBe(false);
	});

	it("returns false post-beta (subscription check stubbed)", async () => {
		vi.stubEnv("BETA_MODE", "false");
		const { canAccessFeature } = await import("@/lib/auth/access");
		expect(canAccessFeature({ betaTester: true }, "anki_export")).toBe(false);
	});
});
