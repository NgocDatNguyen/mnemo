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

export const metadata: Metadata = {
	title: {
		default: "Mnemo — học một lần, nhớ trọn đời",
		template: "%s · Mnemo",
	},
	description:
		"AI flashcard builder cho người học IELTS nghiêm túc. Phân tích bài làm sai, sinh deck cá nhân, ôn tập tối ưu bằng FSRS.",
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
