import Link from "next/link";
import { site, publicNav } from "@/lib/site";
import { bumpHits, getSiteMeta } from "@/lib/meta";
import { latestUpdate } from "@/lib/log";
import { BgmToggle } from "@/components/bgm-toggle";
import { PageStickers } from "@/components/page-stickers";

const contents = publicNav.filter((n) => n.href !== "/");

// 소품(방문자 수·한마디·BGM)을 표지에서 읽으므로 동적.
export const dynamic = "force-dynamic";

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ edit?: string }>;
}) {
	const sp = await searchParams;
	const [hits, meta, lu] = await Promise.all([
		bumpHits(),
		getSiteMeta(),
		latestUpdate(),
	]);
	const luText = lu ? (lu.title ?? lu.body.split("\n")[0]).slice(0, 44) : null;

	return (
		<div className="relative">
			{/* ─── 표지 ─────────────────────────────────────── */}
			<section className="border-b rule">
				<div className="mx-auto max-w-[1240px] px-5 sm:px-8 grid lg:grid-cols-[1fr_1fr] gap-10 py-16 sm:py-24">
					<div className="flex flex-col justify-center min-w-0">
						<h2 className="text-4xl sm:text-6xl font-semibold tracking-tight lowercase flex items-baseline gap-3 rise">
							{site.name}
							<span
								className="text-accent text-3xl sm:text-5xl"
								aria-hidden
							>
								✿
							</span>
						</h2>
						{meta.status && (
							<div
								className="mt-6 inline-flex items-center gap-3 self-start rounded-full bg-accent-2 px-4 py-2 rise"
								style={{ animationDelay: "100ms" }}
							>
								<span className="kicker text-ink">한마디</span>
								<span className="text-sm text-ink">{meta.status}</span>
							</div>
						)}
					</div>
					<div
						className="rise"
						style={{ animationDelay: "150ms" }}
					>
						<div className="relative aspect-[4/5] border rule rounded-lg bg-paper-2" />
					</div>
				</div>
			</section>

			{/* ─── 목차 ─────────────────────────────────────── */}
			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-16 sm:py-20">
				<div className="flex items-baseline justify-between border-b rule pb-3">
					<h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">
						목차
					</h3>
					<span className="kicker text-base">{contents.length}개</span>
				</div>
				<ul>
					{contents.map((item) => (
						<li key={item.href}>
							<Link
								href={item.href}
								className="group grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_1fr_auto] items-baseline gap-4 border-b rule py-5 sm:py-6 transition-colors hover:text-accent"
							>
								<span className="kicker text-accent text-base">{item.no}</span>
								<span className="text-xl sm:text-2xl font-medium">
									{item.label}
								</span>
								<span className="hidden sm:block text-sm text-muted group-hover:text-accent/70">
									{item.desc}
								</span>
								<span className="text-sm transition-transform group-hover:translate-x-1">
									→
								</span>
							</Link>
						</li>
					))}
				</ul>
			</section>

			{/* ─── 한 줄 · 소품 ──────────────────────────────── */}
			<section className="border-t rule">
				<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-4">
					<Link
						href="/"
						className="inline-flex items-baseline gap-2 group"
					>
						<span className="text-lg font-semibold tracking-tight lowercase">
							{site.name}
						</span>
						<span
							className="text-accent transition-transform group-hover:rotate-12"
							aria-hidden
						>
							✿
						</span>
					</Link>
					<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
						{luText && (
							<Link
								href="/log?kind=update"
								className="kicker hover:text-accent transition-colors"
							>
								최근 갱신 · {luText}
							</Link>
						)}
						<BgmToggle
							src={meta.bgm_key ? `/media/${meta.bgm_key}` : null}
							title={meta.bgm_title}
						/>
						<span className="kicker text-muted">
							방문 {hits.toLocaleString()}
						</span>
					</div>
				</div>
			</section>

			<PageStickers surface="page:/" edit={sp.edit === "1"} back="/" />
		</div>
	);
}
