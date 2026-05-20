import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

/**
 * Centralized provider routing per CLAUDE.md "AI providers" section.
 *
 * Beta defaults to Gemini free tier across all roles. Provider swaps happen
 * here — call sites consume `models.X` and don't care which vendor handles it.
 */
export const models = {
	vision: google("gemini-2.5-flash"),
	generation: google("gemini-2.5-flash"),
	classification: google("gemini-2.5-flash-lite"),
	premium: anthropic("claude-haiku-4-5"),
} as const;

export type ModelRole = keyof typeof models;

/**
 * Human label stored on `mock_tests.ai_provider` for telemetry. Matches the
 * model selected for a given role at call time.
 */
export const AI_PROVIDER_LABELS = {
	vision: "gemini-2.5-flash",
	generation: "gemini-2.5-flash",
	classification: "gemini-2.5-flash-lite",
	premium: "claude-haiku-4-5",
} as const satisfies Record<ModelRole, string>;
