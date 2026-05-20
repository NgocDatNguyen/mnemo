"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinWaitlist } from "./actions";

type State = { kind: "idle" } | { kind: "submitted" } | { kind: "error"; message: string };

export default function WaitlistPage() {
	const [state, setState] = useState<State>({ kind: "idle" });
	const [pending, startTransition] = useTransition();

	function handleSubmit(formData: FormData) {
		startTransition(async () => {
			const result = await joinWaitlist(formData);
			if (result.ok) {
				setState({ kind: "submitted" });
			} else {
				const message =
					result.error === "invalid_email"
						? "Email không hợp lệ."
						: "Có lỗi xảy ra. Vui lòng thử lại.";
				setState({ kind: "error", message });
			}
		});
	}

	return (
		<main className="min-h-screen flex items-center justify-center bg-bg-subtle px-4 py-12">
			<div className="w-full max-w-md">
				<Card>
					<CardHeader>
						<CardTitle>Beta đã đầy — đăng ký waitlist</CardTitle>
						<CardDescription>
							Mnemo đang giới hạn 100 beta tester đầu tiên để giữ chất lượng feedback. Để lại email
							— chúng tôi sẽ liên lạc khi có chỗ trống hoặc khi V2 launch.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{state.kind === "submitted" ? (
							<p className="text-sm text-text-secondary">
								Cảm ơn bạn. Chúng tôi sẽ liên lạc qua email khi có chỗ.
							</p>
						) : (
							<form action={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										name="email"
										type="email"
										required
										autoComplete="email"
										placeholder="ban@example.com"
										disabled={pending}
									/>
								</div>
								{state.kind === "error" && <p className="text-sm text-error">{state.message}</p>}
								<Button type="submit" className="w-full" disabled={pending}>
									{pending ? "Đang gửi…" : "Thêm tôi vào waitlist"}
								</Button>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
