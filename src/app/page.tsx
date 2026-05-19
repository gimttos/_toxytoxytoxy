import Link from "next/link";
import { site, publicNav } from "@/lib/site";
import { bumpHits, getSiteMeta } from "@/lib/meta";
import { latestUpdate } from "@/lib/log";
import { BgmToggle } from "@/components/bgm-toggle";

const contents = publicNav.filter((n) => n.href !== "/");

// 소품(방문자 수·한마디·BGM)을 표지에서 읽으므로 동적.
export const dynamic = "force-dynamic";

export default async function Home() {
	const [hits, meta, lu] = await Promise.all([
		bumpHits(),
		getSiteMeta(),
		latestUpdate(),
	]);
	const luText = lu ? (lu.title ?? lu.body.split("\n")[0]).slice(0, 44) : null;

	return (
		<>
			{/* ─── 표지(COVER) ─────────────────────────────────────── */}
			<section className="border-b rule">
				<div className="mx-auto max-w-[1240px] px-5 sm:px-8 grid lg:grid-cols-[1.15fr_1fr]">
					{/* 표제 */}
					<div className="py-16 sm:py-24 lg:pr-12 lg:border-r rule">
						<p className="kicker rise" style={{ animationDelay: "0ms" }}>
							{site.issue} — {site.since} · Cover
						</p>
						<h2
							className="display-en mt-7 text-[clamp(3.2rem,12vw,9rem)] font-semibold rise"
							style={{ animationDelay: "80ms" }}
						>
							A personal
							<br />
							archive<span className="text-accent">.</span>
						</h2>
						<p
							className="mt-6 text-base sm:text-lg text-muted rise"
							style={{ animationDelay: "160ms" }}
						>
							{site.taglineKo}.
						</p>

						{meta.status && (
							<p
								className="mt-4 text-sm rise flex items-baseline gap-2"
								style={{ animationDelay: "200ms" }}
							>
								<span className="kicker text-accent">한마디</span>
								<span className="text-muted">{meta.status}</span>
							</p>
						)}

						{/* 표지 카피 */}
						<ul className="mt-12 max-w-md">
							{site.coverLines.map((line, i) => (
								<li
									key={line}
									className="flex items-baseline gap-3 border-t rule py-3 rise"
									style={{ animationDelay: `${240 + i * 70}ms` }}
								>
									<span className="kicker text-accent">{String(i + 1).padStart(2, "0")}</span>
									<span className="text-[15px]">{line}</span>
								</li>
							))}
						</ul>
					</div>

					{/* 표지 사진 자리 */}
					<div className="py-16 sm:py-24 lg:pl-12 flex">
						<div
							className="relative ticks flex-1 min-h-[360px] border rule rise bg-paper-2"
							style={{ animationDelay: "200ms" }}
						>
							<div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
								<span className="dot mb-5" aria-hidden />
								<p className="display-en text-5xl font-semibold">Cover</p>
								<p className="mt-3 text-sm text-muted">표지 이미지 자리</p>
								<p className="kicker mt-5">Image — with the gallery · M3</p>
							</div>
							<span className="absolute bottom-3 left-3 kicker">Plate 01</span>
						</div>
					</div>
				</div>
			</section>

			{/* ─── 목차(CONTENTS) ──────────────────────────────────── */}
			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-16 sm:py-24">
				<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
					<h3 className="display-en text-3xl sm:text-5xl font-semibold">
						Contents
					</h3>
					<span className="kicker">목차 — {contents.length}</span>
				</div>

				<ul>
					{contents.map((item) => (
						<li key={item.href}>
							<Link
								href={item.href}
								className="group grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[5rem_1fr_1fr_auto] items-center gap-4 border-b rule py-6 sm:py-8 px-2 -mx-2 transition-colors hover:bg-ink hover:text-paper"
							>
								<span className="display-en text-2xl sm:text-4xl text-accent">
									{item.no}
								</span>
								<span className="flex items-baseline gap-3">
									<span className="display-en text-2xl sm:text-4xl font-semibold">
										{item.en}
									</span>
									<span className="text-sm text-muted group-hover:text-paper/60">
										{item.label}
									</span>
								</span>
								<span className="hidden sm:block text-sm text-muted group-hover:text-paper/60">
									{item.desc}
								</span>
								<span className="kicker flex items-center gap-3 group-hover:text-paper/70">
									{item.status === "soon" ? "soon" : "open"}
									<span className="transition-transform duration-300 group-hover:translate-x-1.5">
										→
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			</section>

			{/* ─── 발행 한 줄 + 소품 ───────────────────────────────── */}
			<section className="border-t rule">
				<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-10 flex flex-wrap items-center justify-between gap-4">
					<p className="display-en text-xl sm:text-2xl font-semibold flex items-baseline gap-2">
						{site.name}
						<span className="dot" aria-hidden />
					</p>
					<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
						{luText && (
							<Link
								href="/log?kind=update"
								className="kicker hover:text-accent transition-colors"
							>
								최근 갱신 — {luText}
							</Link>
						)}
						<BgmToggle
							src={meta.bgm_key ? `/media/${meta.bgm_key}` : null}
							title={meta.bgm_title}
						/>
						<span className="kicker text-muted">
							visitors {hits.toLocaleString()}
						</span>
					</div>
				</div>
			</section>
		</>
	);
}
