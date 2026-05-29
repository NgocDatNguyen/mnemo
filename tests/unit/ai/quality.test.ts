import { describe, expect, it } from "vitest";
import { rollupGrade } from "@/lib/ai/quality/rollup";
import {
	ruleClozePlacement,
	ruleInterference,
	ruleReadingLoad,
	type ScorableCard,
} from "@/lib/ai/quality/rules";

const basic = (front: string, back = "x"): ScorableCard => ({ type: "basic", front, back });
const cloze = (front: string): ScorableCard => ({ type: "cloze", front, back: "" });

describe("Rule 2 — reading load", () => {
	it("no warning at/under 20 words", () => {
		expect(ruleReadingLoad(basic("one two three four five"))).toHaveLength(0);
	});
	it("medium warning over 20 words", () => {
		const w = ruleReadingLoad(basic(Array.from({ length: 25 }, () => "word").join(" ")));
		expect(w[0]?.severity).toBe("medium");
	});
	it("high warning over 35 words", () => {
		const w = ruleReadingLoad(basic(Array.from({ length: 40 }, () => "word").join(" ")));
		expect(w[0]?.severity).toBe("high");
	});
});

describe("Rule 4 — cloze placement", () => {
	it("no warning for a content-word deletion", () => {
		expect(ruleClozePlacement(cloze("Prices {{c1::rose}} sharply."))).toHaveLength(0);
	});
	it("high warning when deleting a stop word", () => {
		const w = ruleClozePlacement(cloze("The price {{c1::the}} sharply."));
		expect(w[0]?.severity).toBe("high");
		expect(w[0]?.rule).toBe("cloze_placement");
	});
	it("high warning when a cloze card has no deletion", () => {
		expect(ruleClozePlacement(cloze("No deletion here")).length).toBeGreaterThan(0);
	});
	it("ignores basic cards", () => {
		expect(ruleClozePlacement(basic("the"))).toHaveLength(0);
	});
});

describe("Rule 5 — interference", () => {
	it("flags near-duplicate cards", () => {
		const cards = [
			basic("synonym of increase in academic writing", "rise"),
			basic("synonym of increase in academic writing", "rise"),
			basic("opposite of scarce", "abundant"),
		];
		const out = ruleInterference(cards);
		expect(out[0]?.length).toBeGreaterThan(0);
		expect(out[1]?.length).toBeGreaterThan(0);
		expect(out[2]).toHaveLength(0); // distinct card not flagged
	});
});

describe("rollupGrade", () => {
	it("clean card is A", () => {
		expect(rollupGrade([])).toBe("A");
	});
	it("one high warning drops to B", () => {
		expect(rollupGrade([{ rule: "atomicity", severity: "high", message: "" }])).toBe("B");
	});
	it("two mediums drop to B (0.5 + 0.5 = 1)", () => {
		expect(
			rollupGrade([
				{ rule: "reading_load", severity: "medium", message: "" },
				{ rule: "disambiguation", severity: "medium", message: "" },
			]),
		).toBe("B");
	});
	it("two high warnings => needs_work", () => {
		expect(
			rollupGrade([
				{ rule: "atomicity", severity: "high", message: "" },
				{ rule: "cloze_placement", severity: "high", message: "" },
			]),
		).toBe("needs_work");
	});
	it("one medium alone rounds down to A (0.5 floor = 0)", () => {
		expect(rollupGrade([{ rule: "reading_load", severity: "medium", message: "" }])).toBe("A");
	});
});
