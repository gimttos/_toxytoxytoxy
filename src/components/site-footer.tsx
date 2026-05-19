import Link from "next/link";
import { site, publicNav, xUrl } from "@/lib/site";

// 콜로폰(판권면) 스타일 푸터.
export function SiteFooter() {
	return (
		<footer className="border-t rule mt-24">
			<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14 grid gap-10 sm:grid-cols-[1.4fr_1fr]">
				<div>
					<p className="display-en text-3xl font-semibold flex items-baseline gap-2">
						{site.name}
						<span className="dot" aria-hidden />
					</p>
					<p className="mt-3 max-w-sm text-sm text-muted leading-relaxed">
						{site.tagline}. {site.taglineKo}.
					</p>
					<a
						href={xUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-block mt-4 text-sm border-b border-ink pb-0.5 hover:text-accent hover:border-accent transition-colors"
					>
						X / @{site.x}
					</a>
				</div>
				<nav>
					<p className="kicker mb-4">Contents · 목차</p>
					<ul className="space-y-1.5">
						{publicNav.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									className="group inline-flex items-baseline gap-2.5 text-sm hover:text-accent transition-colors"
								>
									<span className="kicker">{item.no}</span>
									<span>{item.en}</span>
									<span className="text-muted">· {item.label}</span>
								</Link>
							</li>
						))}
					</ul>
				</nav>
			</div>
			<div className="border-t rule">
				<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-2 kicker">
					<span>
						© {site.since} {site.name}
					</span>
					<span className="flex items-center gap-2">
						{site.issue} — @_toxytoxytoxy Archive
						<Link
							href="/admin"
							className="text-muted hover:text-accent transition-colors"
						>
							· Owner
						</Link>
					</span>
				</div>
			</div>
		</footer>
	);
}
