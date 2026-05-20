import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ErrorCopy = { title: string; description: string; cta: { href: string; label: string } };

const COPY_BY_CODE: Record<string, ErrorCopy> = {
	BETA_CAP_REACHED: {
		title: "Beta đã đầy",
		description:
			"Mnemo đang giới hạn 100 beta tester đầu tiên. Đăng ký waitlist để được mời khi có chỗ trống. Nếu bạn đã có tài khoản, link đăng nhập trong email vẫn dùng được.",
		cta: { href: "/waitlist", label: "Đăng ký waitlist" },
	},
	INVALID_TOKEN: {
		title: "Link không hợp lệ",
		description: "Link đăng nhập đã hết hạn hoặc đã được sử dụng. Yêu cầu link mới để tiếp tục.",
		cta: { href: "/login", label: "Yêu cầu link mới" },
	},
	DEFAULT: {
		title: "Có lỗi xảy ra",
		description: "Đăng nhập không thành công. Vui lòng thử lại sau ít phút.",
		cta: { href: "/login", label: "Quay lại đăng nhập" },
	},
};

export default async function AuthErrorPage({
	searchParams,
}: {
	searchParams: Promise<{ code?: string }>;
}) {
	const params = await searchParams;
	const copy = COPY_BY_CODE[params.code ?? "DEFAULT"] ?? COPY_BY_CODE.DEFAULT;

	if (!copy) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{copy.title}</CardTitle>
				<CardDescription>{copy.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<Link
					href={copy.cta.href}
					className="inline-block text-sm font-medium text-accent underline underline-offset-2"
				>
					{copy.cta.label}
				</Link>
			</CardContent>
		</Card>
	);
}
