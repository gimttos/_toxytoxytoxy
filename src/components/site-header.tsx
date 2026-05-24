import Link from "next/link";
import { site, publicNav } from "@/lib/site";

// 단순한 갠홈 머리글 — 사이트명 + 작은 꽃 + 목차 한 줄.
export function SiteHeader() {
	return (
		<header className="border-b rule">
			<div className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-7 pb-4">
				<Link href="/" className="inline-flex items-baseline gap-2 group">
					<span className="text-2xl sm:text-3xl font-semibold tracking-tight lowercase">
						{site.name}
					</span>
					<span
						className="text-accent text-xl transition-transform group-hover:rotate-12"
						aria-hidden
					>
						✿
					</span>
				</Link>
			</div>

			<nav className="border-t rule">
				<ul className="mx-auto max-w-[1240px] px-5 sm:px-8 flex flex-wrap gap-x-5 gap-y-1.5 py-3">
					{publicNav.map((item) => (
						<li key={item.href}>
							<Link
								href={item.href}
								className="group inline-flex items-baseline gap-1.5 text-sm hover:text-accent transition-colors"
							>
								<span className="kicker text-muted group-hover:text-accent">
									{item.no}
								</span>
								<span>{item.label}</span>
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</header>
	);
}
