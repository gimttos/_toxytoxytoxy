import type { Metadata } from "next";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const metadata: Metadata = { title: "소개" };

export default function AboutPage() {
	return (
		<>
			<PageHeader href="/about" />
			<ComingSoon milestone="M3 — 성향표 · 자기소개" />
		</>
	);
}
