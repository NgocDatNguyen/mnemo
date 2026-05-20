import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Landing page after the user clicks a magic link in their email.
 *
 * Better Auth's `/api/auth/magic-link/verify?token=...` endpoint handles the
 * actual token consumption + session creation server-side and then redirects
 * to the `callbackURL` we set in the login form (default `/dashboard`).
 *
 * This page only renders if the user navigates here directly (e.g. clicked a
 * stale link from email, or opened the verify URL in a different browser
 * where Better Auth's response redirect didn't fire). In those cases we just
 * tell them to go back to /login and try again.
 */
export default function VerifyPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Đang xác minh…</CardTitle>
				<CardDescription>
					Nếu trang này không tự chuyển hướng trong vài giây, link đăng nhập có thể đã hết hạn hoặc
					đã được sử dụng.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				<Link
					href="/login"
					className="inline-block text-sm text-accent underline underline-offset-2"
				>
					Yêu cầu link đăng nhập mới
				</Link>
			</CardContent>
		</Card>
	);
}
