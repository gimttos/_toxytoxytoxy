import type { Metadata } from "next";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const metadata: Metadata = { title: "캐릭터" };

export default function CharactersPage() {
	return (
		<>
			<PageHeader href="/characters" />
			<ComingSoon milestone="M3 — 캐릭터 도감" />
		</>
	);
}
