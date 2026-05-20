import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<main className="min-h-screen flex items-center justify-center bg-bg-subtle px-4 py-12">
			<div className="w-full max-w-md">{children}</div>
		</main>
	);
}
