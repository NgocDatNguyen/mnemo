import vi from "@/i18n/vi.json";

/**
 * Typed landing-page copy. Vietnamese is the default + canonical source of truth
 * for the schema; en.json is structurally identical and ships for V2 readiness.
 *
 * No locale switcher in UI yet — when we add one, swap the import source here
 * (or accept a locale arg) and consumers don't change.
 */
export const copy = vi;
export type Copy = typeof vi;
