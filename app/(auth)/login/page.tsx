"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/client";

type State =
	| { kind: "idle" }
	| { kind: "submitting" }
	| { kind: "sent"; email: string }
	| { kind: "error"; message: string; code?: string };

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [state, setState] = useState<State>({ kind: "idle" });

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setState({ kind: "submitting" });

		const { error } = await signIn.magicLink({
			email,
			callbackURL: "/dashboard",
		});

		if (error) {
			const code = (error as { code?: string }).code;
			if (code === "BETA_CAP_REACHED") {
				window.location.href = "/waitlist";
				return;
			}
			setState({
				kind: "error",
				message: error.message ?? "Có lỗi xảy ra. Thử lại sau.",
				code,
			});
			return;
		}

		setState({ kind: "sent", email });
	}

	if (state.kind === "sent") {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Kiểm tra email của bạn</CardTitle>
					<CardDescription>
						Chúng tôi đã gửi link đăng nhập đến <strong>{state.email}</strong>. Link hết hạn sau 5
						phút.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<button
						type="button"
						onClick={() => setState({ kind: "idle" })}
						className="text-sm text-text-secondary underline underline-offset-2"
					>
						Gửi lại
					</button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Đăng nhập vào Mnemo</CardTitle>
				<CardDescription>
					Nhập email — chúng tôi sẽ gửi link đăng nhập. Không cần mật khẩu.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							required
							autoComplete="email"
							placeholder="ban@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={state.kind === "submitting"}
						/>
					</div>
					{state.kind === "error" && <p className="text-sm text-error">{state.message}</p>}
					<Button type="submit" className="w-full" disabled={state.kind === "submitting"}>
						{state.kind === "submitting" ? "Đang gửi…" : "Gửi link đăng nhập"}
					</Button>
					<p className="text-xs text-text-muted text-center">
						Beta đang mở cho 100 người dùng đầu tiên.{" "}
						<Link href="/waitlist" className="underline underline-offset-2">
							Beta đầy rồi?
						</Link>
					</p>
				</form>
			</CardContent>
		</Card>
	);
}
