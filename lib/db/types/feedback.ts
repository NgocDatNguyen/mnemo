/**
 * JSONB payload shape for `feedback.device_info`.
 *
 * Captured on the client when a beta tester submits feedback so we can
 * triage browser/viewport/platform-specific bugs without asking them.
 * All fields optional — server should not require any.
 */

export type DeviceInfo = {
	userAgent?: string;
	viewport?: { width: number; height: number };
	platform?: string;
};
