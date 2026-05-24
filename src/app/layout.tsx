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

// 본문 고딕 = Pretendard (jsdelivr 동적 서브셋 — 한글 글리프 안정).
// 포인트 손글씨 = IncheonEducation (globals.css 의 @font-face 로 로드).
// 폰트 바꾸려면 이 href + globals.css 의 --font-* 토큰 / @font-face 만 교체.
const FONTS_HREF =
	"https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
				<link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
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
