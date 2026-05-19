import type { Metadata } from "next";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const metadata: Metadata = { title: "갤러리" };

export default function GalleryPage() {
	return (
		<>
			<PageHeader href="/gallery" />
			<ComingSoon milestone="M3 — 갤러리 (Cloudflare R2)" />
		</>
	);
}
