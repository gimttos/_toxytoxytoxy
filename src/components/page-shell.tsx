import { nav } from "@/lib/site";

// 섹션 머리글 — 작은 번호 + 한글 라벨 + 손글씨 부제.
export function PageHeader({ href }: { href: string }) {
	const item = nav.find((n) => n.href === href);
	if (!item) return null;
	return (
		<header className="border-b rule">
			<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-12 sm:py-16">
				<div className="flex items-baseline gap-3">
					<span className="kicker text-accent text-base">{item.no}</span>
					<h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
						{item.label}
					</h2>
				</div>
				{item.desc && (
					<p className="kicker mt-2 text-base text-muted">{item.desc}</p>
				)}
			</div>
		</header>
	);
}
