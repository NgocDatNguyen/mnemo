import type { QualityWarning } from "@/lib/db/types";
import { isStopWord } from "../stop-words";

/**
 * Deterministic Quality Engine rules (no LLM): Rule 2 reading load, Rule 4 cloze
 * placement, Rule 5 interference. Rules 1 (atomicity) + 3 (disambiguation) are
 * LLM-classified separately and merged in the engine.
 *
 * Severity vocabulary matches CLAUDE.md "Quality Engine — 5 rules": low/medium/high.
 */

export type ScorableCard = {
	type: "basic" | "cloze";
	front: string;
	back: string;
};

const CLOZE_RE = /\{\{c\d+::(.*?)\}\}/g;

function wordCount(text: string): number {
	const t = text.trim();
	return t.length === 0 ? 0 : t.split(/\s+/).length;
}

/** Rule 2 — reading load. Warn >20 words (medium), escalate >35 (high). */
export function ruleReadingLoad(card: ScorableCard): QualityWarning[] {
	const count = wordCount(card.front);
	if (count > 35) {
		return [
			{
				rule: "reading_load",
				severity: "high",
				message: `Front is ${count} words (>35). Too much to read on one card — split it.`,
			},
		];
	}
	if (count > 20) {
		return [
			{
				rule: "reading_load",
				severity: "medium",
				message: `Front is ${count} words (>20). Consider shortening.`,
			},
		];
	}
	return [];
}

/** Rule 4 — cloze placement (cloze cards only). The deleted token must not be a stop word. */
export function ruleClozePlacement(card: ScorableCard): QualityWarning[] {
	if (card.type !== "cloze") return [];
	const warnings: QualityWarning[] = [];
	const matches = [...card.front.matchAll(CLOZE_RE)];
	if (matches.length === 0) {
		warnings.push({
			rule: "cloze_placement",
			severity: "high",
			message: "Cloze card has no {{c1::...}} deletion.",
		});
		return warnings;
	}
	for (const m of matches) {
		const deleted = (m[1] ?? "").trim();
		// A single-token stop-word deletion teaches nothing.
		if (deleted.split(/\s+/).length === 1 && isStopWord(deleted)) {
			warnings.push({
				rule: "cloze_placement",
				severity: "high",
				message: `Cloze deletes a stop word ("${deleted}"); delete a content word instead.`,
			});
		}
	}
	return warnings;
}

// ---- Rule 5 — interference (TF-IDF cosine over a deck) ----

function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/\{\{c\d+::(.*?)\}\}/g, "$1")
		.split(/[^a-z']+/)
		.filter((w) => w.length > 1 && !isStopWord(w));
}

function tfidfVectors(docs: string[][]): Map<string, number>[] {
	const df = new Map<string, number>();
	for (const doc of docs) {
		for (const term of new Set(doc)) df.set(term, (df.get(term) ?? 0) + 1);
	}
	const n = docs.length;
	return docs.map((doc) => {
		const tf = new Map<string, number>();
		for (const term of doc) tf.set(term, (tf.get(term) ?? 0) + 1);
		const vec = new Map<string, number>();
		for (const [term, freq] of tf) {
			const idf = Math.log((n + 1) / ((df.get(term) ?? 0) + 1)) + 1;
			vec.set(term, (freq / doc.length) * idf);
		}
		return vec;
	});
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
	let dot = 0;
	let na = 0;
	let nb = 0;
	for (const [, v] of a) na += v * v;
	for (const [, v] of b) nb += v * v;
	const [small, large] = a.size < b.size ? [a, b] : [b, a];
	for (const [term, v] of small) {
		const w = large.get(term);
		if (w !== undefined) dot += v * w;
	}
	if (na === 0 || nb === 0) return 0;
	return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export const INTERFERENCE_THRESHOLD = 0.85;

/**
 * Rule 5 — interference. Returns, per card index, a warning if its TF-IDF cosine
 * similarity to any sibling card in the deck exceeds the threshold.
 */
export function ruleInterference(cards: ScorableCard[]): QualityWarning[][] {
	const docs = cards.map((c) => tokenize(`${c.front} ${c.back}`));
	const vecs = tfidfVectors(docs);
	return cards.map((_, i) => {
		const vi = vecs[i];
		if (!vi) return [];
		let maxSim = 0;
		for (let j = 0; j < vecs.length; j++) {
			if (j === i) continue;
			const vj = vecs[j];
			if (!vj) continue;
			maxSim = Math.max(maxSim, cosine(vi, vj));
		}
		return maxSim > INTERFERENCE_THRESHOLD
			? [
					{
						rule: "interference" as const,
						severity: "medium" as const,
						message: `Very similar to another card in this deck (similarity ${maxSim.toFixed(2)}).`,
					},
				]
			: [];
	});
}
