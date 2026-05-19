import type { Metadata } from "next";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const metadata: Metadata = { title: "로그" };

export default function LogPage() {
	return (
		<>
			<PageHeader href="/log" />
			<ComingSoon milestone="M4 — 갱신기록 · 잡담" />
		</>
	);
}
