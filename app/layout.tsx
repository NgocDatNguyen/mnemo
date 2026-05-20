import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
	variable: "--font-fraunces",
	subsets: ["latin", "vietnamese"],
	axes: ["opsz", "SOFT", "WONK"],
	display: "swap",
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin", "vietnamese"],
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
	display: "swap",
});

const SITE_URL = "https://mnemo.app";
const SITE_DESCRIPTION =
	"Mnemo phân tích mock test của bạn, tạo flashcard cá nhân hóa, và dùng FSRS để bạn nhớ lâu. Cho IELTS Reading + Writing, band 6.5 lên 7.0–7.5.";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: "Mnemo — học một lần, nhớ trọn đời",
		template: "%s · Mnemo",
	},
	description: SITE_DESCRIPTION,
	openGraph: {
		title: "Mnemo — học một lần, nhớ trọn đời",
		description: SITE_DESCRIPTION,
		type: "website",
		locale: "vi_VN",
		url: SITE_URL,
		siteName: "Mnemo",
	},
	twitter: {
		card: "summary_large_image",
		title: "Mnemo — học một lần, nhớ trọn đời",
		description: SITE_DESCRIPTION,
	},
	alternates: {
		canonical: SITE_URL,
	},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html
			lang="vi"
			className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col bg-bg text-text font-ui">{children}</body>
		</html>
	);
}
