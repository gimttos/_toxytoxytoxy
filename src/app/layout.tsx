import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
	title: {
		default: `${site.name} — ${site.tagline}`,
		template: `%s · ${site.name}`,
	},
	description: `${site.tagline}. ${site.taglineKo}.`,
};

// 폰트는 Google Fonts 스타일시트로 로드 (한글 글리프 안정성을 위해).
// 다른 폰트로 바꾸려면 이 URL과 globals.css 의 --font-* 토큰만 교체.
const FONTS_HREF =
	"https://fonts.googleapis.com/css2?" +
	"family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&" +
	"family=Nanum+Myeongjo:wght@400;700;800&" +
	"family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&" +
	"family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&display=swap";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link rel="stylesheet" href={FONTS_HREF} />
			</head>
			<body className="min-h-screen flex flex-col">
				<SiteHeader />
				<main className="flex-1">{children}</main>
				<SiteFooter />
			</body>
		</html>
	);
}
