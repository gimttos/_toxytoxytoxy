import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-shell";
import { PageStickers } from "@/components/page-stickers";
import { StickerRoot } from "@/components/sticker-root";
import { listSessions } from "@/lib/sessions";
import { isOwner } from "@/lib/owner";
import { createSessionAction, deleteSessionAction } from "./actions";

export const metadata: Metadata = { title: "세션" };
export const dynamic = "force-dynamic";

const inputCls =
	"border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent";

export default async function SessionsPage({
	searchParams,
}: {
	searchParams: Promise<{ ok?: string; err?: string; owner?: string; edit?: string }>;
}) {
	const sp = await searchParams;
	const owner = await isOwner();
	const sessions = await listSessions();

	return (
		<StickerRoot edit={sp.edit === "1"} back="/sessions">
		<div className="relative">
			<PageHeader href="/sessions" />

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14 sm:py-20">
				{sp.err && (
					<p className="mb-6 border rule rounded-md bg-paper-2 px-4 py-3 text-sm text-accent">
						{sp.err}
					</p>
				)}

				<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
					<h3 className="display-en text-2xl sm:text-4xl font-semibold">
						Sessions
					</h3>
					<span className="kicker">{sessions.length} · 기록부</span>
				</div>

				{sessions.length === 0 ? (
					<div className="border rule rounded-lg bg-paper-2 px-6 py-16 mt-6 text-center">
						<span className="dot mx-auto mb-4 block" aria-hidden />
						<p className="display-en text-2xl font-semibold">
							Empty<span className="text-accent">.</span>
						</p>
						<p className="mt-2 text-sm text-muted">아직 기록된 세션이 없어요.</p>
					</div>
				) : (
					<ul className="mt-4">
						{sessions.map((s) => (
							<li key={s.id} className="border-b rule">
								<Link
									href={`/sessions/${s.slug}`}
									className="group grid sm:grid-cols-[7rem_1fr_auto] gap-x-5 gap-y-1 py-5 hover:bg-ink hover:text-paper transition-colors px-2 -mx-2"
								>
									<span className="kicker self-center group-hover:text-paper/70">
										{s.played_on ?? "—"}
									</span>
									<span className="min-w-0">
										<span className="font-medium">{s.title}</span>
										{s.review && (
											<span className="block text-sm text-muted group-hover:text-paper/60 line-clamp-1">
												{s.review}
											</span>
										)}
									</span>
									<span className="kicker self-center flex flex-wrap gap-x-3 group-hover:text-paper/70">
										{s.system && <span>{s.system}</span>}
										{s.role && <span className="text-accent group-hover:text-paper">{s.role}</span>}
									</span>
								</Link>
								{owner && (
									<details className="px-2 pb-3 -mt-1">
										<summary className="kicker text-accent text-xs cursor-pointer hover:opacity-70 list-none w-fit">
											세션 삭제 ⋯
										</summary>
										<form action={deleteSessionAction} className="mt-2">
											<input type="hidden" name="id" value={s.id} />
											<button
												type="submit"
												className="kicker text-accent text-xs border border-accent rounded-md px-2.5 py-1 hover:bg-accent hover:text-paper transition-colors"
											>
												정말 삭제 (로그 같이 지움)
											</button>
										</form>
									</details>
								)}
							</li>
						))}
					</ul>
				)}

				{owner ? (
					<details className="mt-12 border-t rule pt-6">
						<summary className="kicker text-accent cursor-pointer select-none">
							● Owner — 세션 기록 추가
						</summary>
						<form
							action={createSessionAction}
							className="mt-4 grid gap-3 max-w-md"
						>
							<input name="title" required placeholder="시나리오명" className={inputCls} />
							<input name="slug" placeholder="슬러그 (비우면 자동)" className={inputCls} />
							<div className="grid grid-cols-2 gap-3">
								<input name="system" placeholder="시스템" className={inputCls} />
								<input
									name="played_on"
									type="date"
									className={inputCls}
									aria-label="플레이 날짜"
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<input name="role" placeholder="GM / PL" className={inputCls} />
								<input name="party" placeholder="같이 한 사람" className={inputCls} />
							</div>
							<input name="result" placeholder="결말 (선택)" className={inputCls} />
							<input name="review" placeholder="한줄평 (선택)" className={inputCls} />
							<input name="tags" placeholder="태그 쉼표 구분" className={inputCls} />
							<button
								type="submit"
								className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
							>
								기록 추가
							</button>
							<p className="kicker text-muted">
								추가 후 상세에서 로그(공개/비공개)를 붙여요.
							</p>
						</form>
					</details>
				) : (
					<p className="mt-12 border-t rule pt-6 kicker text-muted">
						세션 기록은 오너만 추가할 수 있어요.
					</p>
				)}
			</section>

			<PageStickers
				surface="page:/sessions"
				edit={sp.edit === "1"}
				back="/sessions"
			/>
		</div>
		</StickerRoot>
	);
}
