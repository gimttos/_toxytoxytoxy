import type { Metadata } from "next";
import { PageHeader } from "@/components/page-shell";
import { about } from "@/lib/about";

export const metadata: Metadata = { title: "소개" };

function List({ title, en, items }: { title: string; en: string; items: string[] }) {
	if (items.length === 0) return null;
	return (
		<div>
			<p className="kicker">
				{en} · {title}
			</p>
			<ul className="mt-3 grid gap-2">
				{items.map((t) => (
					<li key={t} className="flex gap-2.5 text-sm">
						<span className="text-accent" aria-hidden>
							—
						</span>
						<span>{t}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export default function AboutPage() {
	const a = about;
	return (
		<>
			<PageHeader href="/about" />

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14 sm:py-20 grid gap-16">
				{/* 자기소개 */}
				<div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
					<div>
						<h3 className="display-en text-3xl sm:text-5xl font-semibold flex items-baseline gap-2">
							{a.intro.name}
							<span className="dot" aria-hidden />
						</h3>
						{a.intro.aka.length > 0 && (
							<p className="mt-2 kicker">{a.intro.aka.join(" · ")}</p>
						)}
						{a.intro.links.length > 0 && (
							<div className="mt-4 flex flex-wrap gap-3 text-sm">
								{a.intro.links.map((l) => (
									<a
										key={l.href}
										href={l.href}
										target="_blank"
										rel="noreferrer"
										className="border-b border-ink pb-0.5 hover:text-accent hover:border-accent transition-colors"
									>
										{l.label}
									</a>
								))}
							</div>
						)}
					</div>
					<div className="grid gap-2 self-center">
						{a.intro.lines.map((line) => (
							<p key={line} className="text-base sm:text-lg leading-relaxed">
								{line}
							</p>
						))}
					</div>
				</div>

				{/* 성향표 */}
				<div className="border-t rule pt-10">
					<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
						<h3 className="display-en text-2xl sm:text-4xl font-semibold">
							Tendency
						</h3>
						<span className="kicker">성향표</span>
					</div>
					<p className="mt-3 kicker text-muted">{a.tendency.legend}</p>
					<ul className="mt-4">
						{a.tendency.rows.map((r) => (
							<li
								key={r.topic}
								className="flex items-baseline gap-4 border-b rule py-3"
							>
								<span
									className={`display-en text-xl w-6 text-center ${
										r.mark === "✕"
											? "text-muted"
											: r.mark === "△"
												? "text-ink"
												: "text-accent"
									}`}
									aria-hidden
								>
									{r.mark}
								</span>
								<span className="text-sm flex-1">{r.topic}</span>
								{r.note && (
									<span className="kicker text-muted">{r.note}</span>
								)}
							</li>
						))}
					</ul>
				</div>

				{/* BYF · DNI · MUTE */}
				<div className="border-t rule pt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
					<List title="팔로우 전" en="BYF" items={a.byf} />
					<List title="상호작용 사절" en="DNI" items={a.dni} />
					<List title="뮤트 권장" en="MUTE" items={a.mute} />
				</div>

				{/* 위시리스트 · 최애 */}
				<div className="border-t rule pt-10 grid gap-10 lg:grid-cols-2">
					<div>
						<p className="kicker">Wishlist · 위시리스트</p>
						{a.wishlist.length === 0 ? (
							<p className="mt-3 text-sm text-muted">아직 없어요.</p>
						) : (
							<ul className="mt-3">
								{a.wishlist.map((w) => (
									<li
										key={w.item}
										className="flex items-baseline gap-3 border-b rule py-3"
									>
										<span
											className={`text-sm flex-1 ${
												w.got ? "text-muted line-through" : ""
											}`}
										>
											{w.item}
										</span>
										{w.note && (
											<span className="kicker text-muted">{w.note}</span>
										)}
										{w.got && <span className="kicker text-accent">받음</span>}
									</li>
								))}
							</ul>
						)}
					</div>
					<div>
						<p className="kicker">Oshi · 최애</p>
						{a.oshi.length === 0 ? (
							<p className="mt-3 text-sm text-muted">아직 없어요.</p>
						) : (
							<ul className="mt-3">
								{a.oshi.map((o) => (
									<li
										key={`${o.name}-${o.from}`}
										className="border-b rule py-3"
									>
										<p className="text-sm">
											<span className="font-medium">{o.name}</span>
											<span className="text-muted"> — {o.from}</span>
										</p>
										{o.note && (
											<p className="mt-1 kicker text-muted">{o.note}</p>
										)}
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</section>
		</>
	);
}
