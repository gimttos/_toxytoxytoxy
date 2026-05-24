import type { Metadata } from "next";
import { PageHeader } from "@/components/page-shell";
import { PageStickers } from "@/components/page-stickers";
import { StickerRoot } from "@/components/sticker-root";
import { DecoWords, type DecoWord } from "@/components/deco-words";
import { about } from "@/lib/about";

export const metadata: Metadata = { title: "소개" };
export const dynamic = "force-dynamic";

// 배경 장식 영어 단어 — Homemade Apple 손글씨로 옅게.
const ABOUT_DECO: DecoWord[] = [
	{ text: "We are made of star stuff.", x: "3%",  y: "4%",  rot: -3, size: "3.2rem", opacity: 0.1 },
	{ text: "We are made of star stuff.", x: "10%", y: "92%", rot: 2,  size: "2.6rem", opacity: 0.09 },
];

function Chips({ items }: { items: string[] }) {
	return (
		<ul className="mt-3 flex flex-wrap gap-2 text-sm">
			{items.map((t) => (
				<li key={t} className="border rule px-3 py-1">
					{t}
				</li>
			))}
		</ul>
	);
}

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

export default async function AboutPage({
	searchParams,
}: {
	searchParams: Promise<{ edit?: string }>;
}) {
	const sp = await searchParams;
	const a = about;
	return (
		<StickerRoot edit={sp.edit === "1"} back="/about">
		<div className="relative">
			<DecoWords words={ABOUT_DECO} />
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
						<ul className="mt-4 flex flex-wrap gap-3 text-sm">
							{a.intro.links.map((l) => (
								<li key={l.label}>
									{l.href ? (
										<a
											href={l.href}
											target="_blank"
											rel="noreferrer"
											className="border-b border-ink pb-0.5 hover:text-accent hover:border-accent transition-colors"
										>
											{l.label}
										</a>
									) : (
										<span className="text-muted">{l.label}</span>
									)}
								</li>
							))}
						</ul>
					</div>
					<div className="grid gap-2 self-center">
						{a.intro.lines.map((line) => (
							<p key={line} className="text-base sm:text-lg leading-relaxed">
								{line}
							</p>
						))}
					</div>
				</div>

				{/* 인용 */}
				<figure className="border-l-2 border-accent pl-5 sm:pl-7">
					<blockquote className="font-serif-ko text-lg sm:text-xl leading-relaxed whitespace-pre-line">
						{a.quote.text}
					</blockquote>
					<figcaption className="mt-3 kicker text-muted">
						— {a.quote.source} 中
					</figcaption>
				</figure>

				{/* 좋아하는 것 */}
				<div className="border-t rule pt-10">
					<p className="kicker">Likes · 좋아하는 것</p>
					<Chips items={a.likes} />
				</div>

				{/* TRPG */}
				<div className="border-t rule pt-10 grid gap-8 sm:grid-cols-2">
					<div>
						<p className="kicker">Owned · 보유 룰</p>
						<Chips items={a.trpg.owned} />
					</div>
					<div>
						<p className="kicker">GM · 가능 룰</p>
						<Chips items={a.trpg.gm} />
						<p className="mt-4 text-sm text-muted">{a.trpg.note}</p>
					</div>
				</div>

				{/* 성향표 — 구글 시트 임베드 */}
				<div className="border-t rule pt-10">
					<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
						<h3 className="display-en text-2xl sm:text-4xl font-semibold">
							Tendency
						</h3>
						<a
							href={a.tendency.linkUrl}
							target="_blank"
							rel="noreferrer"
							className="kicker hover:text-accent transition-colors"
						>
							성향표 · 새 탭으로 ↗
						</a>
					</div>
					<p className="mt-3 text-sm text-muted max-w-prose">
						{a.tendency.note}
					</p>
					<div className="mt-5 border rule bg-paper-2">
						<iframe
							src={a.tendency.embedUrl}
							title="성향표"
							loading="lazy"
							className="w-full h-[70vh] min-h-[480px] block"
						/>
					</div>
				</div>

				{/* BYF · DNI · MUTE */}
				<div className="border-t rule pt-10 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
					<List title="" en="BYF" items={a.byf} />
					<div>
						<p className="kicker">DNI</p>
						{a.dniNote && (
							<p className="mt-3 text-sm text-muted">{a.dniNote}</p>
						)}
						<ul className="mt-3 grid gap-2">
							{a.dni.map((t) => (
								<li key={t} className="flex gap-2.5 text-sm">
									<span className="text-accent" aria-hidden>
										—
									</span>
									<span>{t}</span>
								</li>
							))}
						</ul>
						{a.mute.length > 0 && (
							<div className="mt-6">
								<List title="뮤트 권장" en="MUTE" items={a.mute} />
							</div>
						)}
					</div>
				</div>

				{/* 위시리스트 · 최애 */}
				{(a.wishlist.length > 0 || a.oshi.length > 0) && (
					<div className="border-t rule pt-10 grid gap-10 lg:grid-cols-2">
						{a.wishlist.length > 0 && (
							<div>
								<p className="kicker">Wishlist · 위시리스트</p>
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
											{w.got && (
												<span className="kicker text-accent">받음</span>
											)}
										</li>
									))}
								</ul>
							</div>
						)}
						{a.oshi.length > 0 && (
							<div>
								<p className="kicker">Oshi · 최애</p>
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
							</div>
						)}
					</div>
				)}
			</section>

			<PageStickers
				surface="page:/about"
				edit={sp.edit === "1"}
				back="/about"
			/>
		</div>
		</StickerRoot>
	);
}
