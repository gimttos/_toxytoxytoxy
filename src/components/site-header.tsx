import Link from "next/link";
import { site, publicNav, xUrl } from "@/lib/site";

// 잡지 마스트헤드(제호) + 목차형 네비게이션.
export function SiteHeader() {
	return (
		<header className="border-b rule">
			{/* 정체성 — 상단 블루 룰 */}
			<div className="h-1 bg-accent" aria-hidden />

			{/* 발행 정보 바 */}
			<div className="border-b rule">
				<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-2.5 flex items-center justify-between kicker">
					<span>
						{site.issue} · {site.since}
					</span>
					<span className="hidden sm:inline">Personal Archive</span>
					<a
						href={xUrl}
						target="_blank"
						rel="noreferrer"
						className="hover:text-accent transition-colors"
					>
						X / @{site.x}
					</a>
				</div>
			</div>

			{/* 제호 */}
			<div className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-8 pb-6">
				<Link href="/" className="block group">
					<h1 className="display-en font-semibold text-[clamp(2.4rem,8.5vw,6.5rem)] flex items-baseline gap-3">
						{site.name}
						<span className="dot translate-y-[-0.1em]" aria-hidden />
					</h1>
					<p className="mt-3 kicker">
						{site.tagline} — {site.taglineKo}
					</p>
				</Link>
			</div>

			{/* 목차 네비게이션 */}
			<nav className="border-t rule">
				<ul className="mx-auto max-w-[1240px] px-5 sm:px-8 flex flex-wrap items-stretch">
					{publicNav.map((item) => (
						<li key={item.href} className="border-r rule first:border-l">
							<Link
								href={item.href}
								className="group flex items-baseline gap-2.5 px-4 sm:px-5 py-3.5 transition-colors hover:bg-ink hover:text-paper"
							>
								<span className="kicker group-hover:text-paper/70">{item.no}</span>
								<span className="text-sm font-medium tracking-tight">
									{item.en}
									<span className="text-muted group-hover:text-paper/60"> · {item.label}</span>
								</span>
								{item.status === "soon" && (
									<span className="kicker text-accent group-hover:text-paper/60">soon</span>
								)}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</header>
	);
}
