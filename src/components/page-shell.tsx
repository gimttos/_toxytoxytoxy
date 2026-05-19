import Link from "next/link";
import { nav } from "@/lib/site";

// 하위 페이지 공통 머리글 — 잡지의 섹션 도비라(扉) 느낌.
export function PageHeader({ href }: { href: string }) {
	const item = nav.find((n) => n.href === href);
	if (!item) return null;
	return (
		<header className="border-b rule">
			<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-16 sm:py-24">
				<p className="kicker">
					{item.no} — Section
				</p>
				<h2 className="display-en mt-5 text-[clamp(2.6rem,9vw,6rem)] font-semibold flex items-baseline gap-4">
					{item.en}
					<span className="text-muted text-[0.4em] font-sans font-normal">
						{item.label}
					</span>
				</h2>
				<p className="mt-4 text-muted max-w-md">{item.desc}</p>
			</div>
		</header>
	);
}

// 아직 안 만든 섹션의 자리표시 — 비어 보이지 않게 의도적으로 디자인.
export function ComingSoon({ milestone }: { milestone: string }) {
	return (
		<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-24">
			<div className="relative ticks border rule p-10 sm:p-16 bg-paper-2">
				<span className="dot" aria-hidden />
				<p className="display-en text-4xl sm:text-6xl font-semibold mt-5">
					Not yet<span className="text-accent">.</span>
				</p>
				<p className="mt-4 text-muted max-w-md leading-relaxed">
					이 섹션은 다음 마일스톤에서 실제로 동작합니다. 골격과 디자인이 먼저 자리를
					잡았어요.
				</p>
				<p className="kicker text-accent mt-6">{milestone}</p>
				<Link
					href="/"
					className="inline-flex items-center gap-2 mt-8 text-sm font-medium border-b border-ink pb-0.5 hover:text-accent hover:border-accent transition-colors"
				>
					← Back to cover
				</Link>
			</div>
		</section>
	);
}
