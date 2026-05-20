import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/marketing/hero";

describe("Hero", () => {
	it("renders the brand headline (both halves)", () => {
		render(<Hero />);
		expect(screen.getByText(/học một lần/)).toBeInTheDocument();
		expect(screen.getByText(/nhớ trọn đời/)).toBeInTheDocument();
	});

	it("links the primary CTA to /login", () => {
		render(<Hero />);
		const link = screen.getByRole("link", { name: /tham gia beta/i });
		expect(link).toHaveAttribute("href", "/login");
	});

	it("links the secondary CTA to /waitlist", () => {
		render(<Hero />);
		const link = screen.getByRole("link", { name: /vào waitlist/i });
		expect(link).toHaveAttribute("href", "/waitlist");
	});

	it("renders the beta badge", () => {
		render(<Hero />);
		expect(screen.getByText(/beta 0\.1.+100 người đầu/i)).toBeInTheDocument();
	});

	it("renders the magic-link clarifier under the CTAs", () => {
		render(<Hero />);
		expect(screen.getByText(/không cần mật khẩu/i)).toBeInTheDocument();
	});
});
