import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisStatus } from "@/components/mock-tests/analysis-status";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock }),
}));

const fetchMock = vi.fn();

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
	vi.stubGlobal("fetch", fetchMock);
	fetchMock.mockReset();
	refreshMock.mockReset();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

function statusResponse(body: { analyzedAt: string | null; hasError: boolean }) {
	return Promise.resolve({
		ok: true,
		json: () => Promise.resolve(body),
	} as Response);
}

describe("AnalysisStatus", () => {
	it("renders the polling state initially", () => {
		fetchMock.mockReturnValue(statusResponse({ analyzedAt: null, hasError: false }));
		render(<AnalysisStatus testId="t1" />);
		expect(screen.getByText(/đang phân tích/i)).toBeInTheDocument();
	});

	it("calls router.refresh() when analyzedAt becomes non-null", async () => {
		fetchMock.mockReturnValue(
			statusResponse({ analyzedAt: "2026-05-20T08:00:00Z", hasError: false }),
		);
		render(<AnalysisStatus testId="t1" />);
		await waitFor(() => {
			expect(refreshMock).toHaveBeenCalled();
		});
	});

	it("renders the failed state with retry button when hasError is true", async () => {
		fetchMock.mockReturnValue(statusResponse({ analyzedAt: null, hasError: true }));
		render(<AnalysisStatus testId="t1" />);
		await waitFor(() => {
			expect(screen.getByText(/lỗi phân tích/i)).toBeInTheDocument();
		});
		expect(screen.getByRole("button", { name: /thử phân tích lại/i })).toBeInTheDocument();
	});

	it("polls /status with the correct test id", async () => {
		fetchMock.mockReturnValue(statusResponse({ analyzedAt: null, hasError: false }));
		render(<AnalysisStatus testId="abc-123" />);
		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/mock-tests/abc-123/status",
				expect.objectContaining({ cache: "no-store" }),
			);
		});
	});
});
