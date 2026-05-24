"use client";

// 꾸미기 모드 토글 — 오너만 푸터에서 보임.
// URL ?edit=1 로 상태 보존(서버가 검토하기 편함).

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function DecorateToggle() {
	const pathname = usePathname();
	const sp = useSearchParams();
	const on = sp.get("edit") === "1";

	const next = new URLSearchParams(sp.toString());
	if (on) next.delete("edit");
	else next.set("edit", "1");
	const qs = next.toString();
	const href = qs ? `${pathname}?${qs}` : pathname;

	return (
		<Link
			href={href}
			scroll={false}
			className={
				on
					? "kicker rounded-full bg-accent-2 text-ink px-3 py-1 hover:opacity-80 transition-opacity"
					: "kicker rounded-full border rule px-3 py-1 hover:bg-accent-2 hover:text-ink transition-colors"
			}
		>
			{on ? "꾸미기 끄기" : "꾸미기"}
		</Link>
	);
}
