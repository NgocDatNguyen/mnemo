import "@testing-library/jest-dom/vitest";

/**
 * Stub envs that modules check at load time. These should be overridden per-test
 * via `vi.stubEnv` when behavior depends on them.
 */
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET ??= "test-secret-not-real";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.RESEND_API_KEY ??= "re_test_placeholder";
process.env.R2_ACCOUNT_ID ??= "test-account-id";
process.env.R2_ACCESS_KEY_ID ??= "test-access-key";
process.env.R2_SECRET_ACCESS_KEY ??= "test-secret-key";
process.env.R2_BUCKET_NAME ??= "test-bucket";
