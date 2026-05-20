import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./tests/setup.ts"],
		include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["tests/e2e/**", "node_modules", ".next"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["lib/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
			exclude: ["**/*.d.ts", "**/.gitkeep"],
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./"),
		},
	},
});
