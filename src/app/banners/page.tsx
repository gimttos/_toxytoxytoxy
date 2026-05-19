import type { Metadata } from "next";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const metadata: Metadata = { title: "배너" };

export default function BannersPage() {
	return (
		<>
			<PageHeader href="/banners" />
			<ComingSoon milestone="M4 — 배너 교환 · 링크" />
		</>
	);
}
