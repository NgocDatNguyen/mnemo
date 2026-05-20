import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("scaffold sanity", () => {
	it("cn merges class names", () => {
		expect(cn("px-2", "px-4")).toBe("px-4");
		expect(cn("text-text", false && "text-error")).toBe("text-text");
	});
});
