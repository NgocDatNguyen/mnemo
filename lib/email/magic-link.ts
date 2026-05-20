import { FROM_ADDRESS, resend } from "./resend";

/**
 * Magic-link sign-in email — Vietnamese primary, English fallback in footer.
 *
 * Brand tokens hardcoded inline (emails cannot use Tailwind `@theme` vars).
 * Table-based layout for Gmail/Outlook/Apple Mail compatibility.
 * Wordmark font stack tries Fraunces first (rendered by Apple Mail / Thunderbird
 * if installed locally), falls back to Georgia universally.
 */

const SUBJECT = "Link đăng nhập Mnemo";

function buildHtml(url: string): string {
	return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Link đăng nhập Mnemo</title>
</head>
<body style="margin:0; padding:0; background:#fafaf7; color:#1a2547; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafaf7;">
	<tr>
		<td align="center" style="padding:48px 16px;">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
				<tr>
					<td style="font-family:'Fraunces',Georgia,'Times New Roman',serif; font-size:28px; font-weight:500; letter-spacing:-0.01em; color:#1a2547; padding-bottom:32px;">
						Mnemo
					</td>
				</tr>
				<tr>
					<td style="font-size:16px; line-height:24px; color:#1a2547; padding-bottom:20px;">
						Nhấn vào nút bên dưới để đăng nhập vào Mnemo. Không cần mật khẩu.
					</td>
				</tr>
				<tr>
					<td style="padding-bottom:28px;">
						<a href="${url}" style="display:inline-block; background:#b8845f; color:#fafaf7; padding:12px 24px; text-decoration:none; border-radius:4px; font-size:15px; font-weight:500;">
							Đăng nhập
						</a>
					</td>
				</tr>
				<tr>
					<td style="font-size:14px; line-height:20px; color:#4a5570; padding-bottom:24px; word-break:break-all;">
						Nếu nút không hoạt động, copy link vào trình duyệt:<br>
						<a href="${url}" style="color:#b8845f; text-decoration:underline;">${url}</a>
					</td>
				</tr>
				<tr>
					<td style="font-size:13px; line-height:20px; color:#8590a8; padding-bottom:32px;">
						Link có hiệu lực trong 5 phút. Nếu bạn không yêu cầu đăng nhập, bỏ qua email này — tài khoản của bạn vẫn an toàn.
					</td>
				</tr>
				<tr>
					<td style="font-size:12px; line-height:18px; color:#8590a8; font-style:italic; padding-top:24px; border-top:1px solid #e8e5e0;">
						English: Click the link above to sign in to Mnemo. No password required. The link expires in 5 minutes. If you didn't request this, you can safely ignore this email.
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>
</body>
</html>`;
}

function buildText(url: string): string {
	return [
		"Mnemo",
		"",
		"Nhấn vào link bên dưới để đăng nhập vào Mnemo. Không cần mật khẩu.",
		"",
		url,
		"",
		"Link có hiệu lực trong 5 phút. Nếu bạn không yêu cầu đăng nhập, bỏ qua email này — tài khoản của bạn vẫn an toàn.",
		"",
		"---",
		"English: Click the link above to sign in to Mnemo. No password required. The link expires in 5 minutes. If you didn't request this, you can safely ignore this email.",
	].join("\n");
}

export async function sendMagicLinkEmail({ to, url }: { to: string; url: string }) {
	await resend.emails.send({
		from: FROM_ADDRESS,
		to,
		subject: SUBJECT,
		html: buildHtml(url),
		text: buildText(url),
	});
}
