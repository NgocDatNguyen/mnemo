"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html lang="vi">
			<body>
				<main style={{ padding: "2rem", fontFamily: "system-ui" }}>
					<h1>Đã có lỗi xảy ra</h1>
					<p>Mnemo đang ghi nhận lỗi. Vui lòng thử lại sau ít phút.</p>
				</main>
			</body>
		</html>
	);
}
