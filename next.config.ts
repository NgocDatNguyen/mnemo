import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// sql.js is a Node-only WASM module — don't let the bundler trace its wasm loader.
	serverExternalPackages: ["sql.js"],
	experimental: {
		// Anki .apkg import posts the file through a server action; default cap is 1MB.
		serverActions: { bodySizeLimit: "10mb" },
	},
};

export default withSentryConfig(nextConfig, {
	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,
	silent: !process.env.CI,
	widenClientFileUpload: true,
	disableLogger: true,
	automaticVercelMonitors: false,
});
