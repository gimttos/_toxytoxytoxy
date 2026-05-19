import type { Metadata } from "next";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const metadata: Metadata = { title: "세션" };

export default function SessionsPage() {
	return (
		<>
			<PageHeader href="/sessions" />
			<ComingSoon milestone="M4 — TRPG 기록부 · 로그 아카이브" />
		</>
	);
}
