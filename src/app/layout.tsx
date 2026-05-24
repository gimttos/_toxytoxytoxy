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

// 본문 고딕 = GounBatang (globals.css @font-face, jsdelivr noonfonts).
// 손글씨 = OngleipParkDahyeon (globals.css @font-face, jsdelivr noonfonts).
// 영어 배경 장식 = Homemade Apple (Google Fonts <link>, 아래).
// 한글 폴백 = Pretendard 동적 서브셋 (jsdelivr — GounBatang CDN 실패 시 안전망).
const PRETENDARD_HREF =
	"https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css";
const HOMEMADE_APPLE_HREF =
	"https://fonts.googleapis.com/css2?family=Homemade+Apple&display=swap";

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
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link rel="stylesheet" href={PRETENDARD_HREF} />
				<link rel="stylesheet" href={HOMEMADE_APPLE_HREF} />
			</head>
			<body className="min-h-screen flex flex-col">
				<SiteHeader />
				<main className="flex-1">{children}</main>
				<SiteFooter />
			</body>
		</html>
	);
}
