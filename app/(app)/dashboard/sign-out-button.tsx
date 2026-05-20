"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";

export function SignOutButton({ label }: { label: string }) {
	const router = useRouter();
	const [pending, setPending] = useState(false);

	async function handleSignOut() {
		setPending(true);
		await signOut();
		router.replace("/");
		router.refresh();
	}

	return (
		<Button variant="ghost" onClick={handleSignOut} disabled={pending}>
			{pending ? "…" : label}
		</Button>
	);
}
