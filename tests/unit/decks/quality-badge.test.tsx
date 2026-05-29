import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QualityBadge } from "@/components/decks/quality-badge";

describe("QualityBadge", () => {
	it("renders nothing when the card has no score yet", () => {
		const { container } = render(<QualityBadge score={null} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders the Vietnamese label for grade A", () => {
		render(<QualityBadge score="A" />);
		expect(screen.getByText("Xuất sắc")).toBeInTheDocument();
	});

	it("shows needs_work plainly (not softened)", () => {
		render(<QualityBadge score="needs_work" />);
		expect(screen.getByText("Cần sửa")).toBeInTheDocument();
	});
});
