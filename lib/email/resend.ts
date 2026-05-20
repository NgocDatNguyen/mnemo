import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
	throw new Error("RESEND_API_KEY is not set. Required for transactional email.");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Phase 1 from-address. Resend's sandbox only delivers to the email registered
 * on the Resend account — fine for internal beta testing, NOT for external users.
 *
 * TODO (Phase 2): purchase mnemo.app domain, verify in Resend dashboard, then
 * change to `Mnemo <hello@mnemo.app>` or `Mnemo <auth@mnemo.app>`.
 * See CLAUDE.md decisions log (2026-05-20, "Phase 1 email sending uses Resend dev mode").
 */
export const FROM_ADDRESS = "Mnemo <onboarding@resend.dev>";
