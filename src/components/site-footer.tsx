import Link from "next/link";
import { site, publicNav, xUrl } from "@/lib/site";
import { isOwner } from "@/lib/owner";
import { DecorateToggle } from "@/components/decorate-toggle";

// 단순한 푸터 — 사이트명 · 목차 · 외부 링크 · 어드민 진입.
export async function SiteFooter() {
	const owner = await isOwner();
	return (
		<footer className="border-t rule mt-24">
			<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-12 grid gap-8 sm:grid-cols-[1.4fr_1fr]">
				<div>
					<Link
						href="/"
						className="inline-flex items-baseline gap-2 group"
					>
						<span className="text-xl font-semibold tracking-tight lowercase">
							{site.name}
						</span>
						<span
							className="text-accent text-lg transition-transform group-hover:rotate-12"
							aria-hidden
						>
							✿
						</span>
					</Link>
					<a
						href={xUrl}
						target="_blank"
						rel="noreferrer"
						className="mt-4 inline-block text-sm hover:text-accent transition-colors"
					>
						X · @{site.x}
					</a>
				</div>
				<nav>
					<p className="kicker mb-3">목차</p>
					<ul className="grid grid-cols-2 gap-y-1.5 text-sm">
						{publicNav.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									className="inline-flex items-baseline gap-2 hover:text-accent transition-colors"
								>
									<span className="kicker text-muted">{item.no}</span>
									<span>{item.label}</span>
								</Link>
							</li>
						))}
					</ul>
				</nav>
			</div>
			<div className="border-t rule">
				<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-2 kicker">
					<span>
						© {site.since} {site.name.toLowerCase()}
					</span>
					<div className="flex items-center gap-3">
						{owner && <DecorateToggle />}
						<Link
							href="/admin"
							className="text-muted hover:text-accent transition-colors"
						>
							owner
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
