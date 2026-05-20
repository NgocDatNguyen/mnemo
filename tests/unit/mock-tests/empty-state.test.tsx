import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/mock-tests/empty-state";

describe("EmptyState", () => {
	it("renders the Vietnamese heading", () => {
		render(<EmptyState />);
		expect(screen.getByText(/chưa có bài thi nào/i)).toBeInTheDocument();
	});

	it("links its CTA to the upload page", () => {
		render(<EmptyState />);
		const link = screen.getByRole("link", { name: /upload bài đầu tiên/i });
		expect(link).toHaveAttribute("href", "/mock-tests/upload");
	});
});
