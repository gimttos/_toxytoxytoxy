import type { Metadata } from "next";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const metadata: Metadata = { title: "일정" };

export default function SchedulePage() {
	return (
		<>
			<PageHeader href="/schedule" />
			<ComingSoon milestone="M4 — 캘린더 연동 (삼성→Google .ics)" />
		</>
	);
}
