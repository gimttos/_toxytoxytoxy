import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-shell";
import { PageStickers } from "@/components/page-stickers";
import { StickerRoot } from "@/components/sticker-root";
import { listEntries, MAX_NAME, MAX_BODY, MOODS } from "@/lib/guestbook";
import { isOwner } from "@/lib/owner";
import { signGuestbook, hideEntry, removeEntry } from "./actions";

export const metadata: Metadata = { title: "방명록" };

// 바인딩(D1)을 요청 시점에 읽으므로 정적 생성 금지.
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("ko-KR", {
	dateStyle: "medium",
	timeStyle: "short",
	timeZone: "Asia/Seoul",
});

export default async function GuestbookPage({
	searchParams,
}: {
	searchParams: Promise<{ ok?: string; err?: string; owner?: string; edit?: string }>;
}) {
	const sp = await searchParams;
	const owner = await isOwner();
	const entries = await listEntries({ owner });

	return (
		<StickerRoot edit={sp.edit === "1"} back="/guestbook">
		<div className="relative">
			<PageHeader href="/guestbook" />

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14 sm:py-20 grid gap-14 lg:grid-cols-[1fr_1.4fr]">
				{/* ── 작성 폼 ───────────────────────────────── */}
				<div id="sign" className="lg:sticky lg:top-8 self-start">
					<p className="kicker">Leave a note · 한 줄 남기기</p>

					{sp.err && (
						<p className="mt-4 border rule rounded-md bg-paper-2 px-4 py-3 text-sm text-accent">
							{sp.err}
						</p>
					)}
					{sp.ok && (
						<p className="mt-4 border rule rounded-md bg-paper-2 px-4 py-3 text-sm">
							남겨주셔서 고마워요. 아래에 바로 떴어요.
						</p>
					)}

					<form action={signGuestbook} className="mt-5 grid gap-4">
						{/* 허니팟 — 사람에겐 안 보이고 봇만 채움 */}
						<div
							aria-hidden
							className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
						>
							<label>
								Website
								<input
									type="text"
									name="website"
									tabIndex={-1}
									autoComplete="off"
								/>
							</label>
						</div>

						<label className="grid gap-1.5">
							<span className="kicker">이름 · Name</span>
							<input
								name="name"
								required
								maxLength={MAX_NAME}
								className="border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
								placeholder="불릴 이름"
							/>
						</label>

						<label className="grid gap-1.5">
							<span className="kicker">내용 · Message</span>
							<textarea
								name="body"
								required
								maxLength={MAX_BODY}
								rows={5}
								className="border rule rounded-md bg-paper px-3 py-2.5 text-sm leading-relaxed resize-y focus:outline-none focus:border-accent"
								placeholder="다녀간 흔적을 남겨주세요"
							/>
						</label>

						<label className="grid gap-1.5">
							<span className="kicker">링크 (선택) · Link</span>
							<input
								name="link"
								type="url"
								inputMode="url"
								className="border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
								placeholder="https:// 홈피나 X"
							/>
						</label>

						<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
							<label className="grid gap-1.5">
								<span className="kicker">무드 · Mood</span>
								<select
									name="mood"
									defaultValue=""
									className="border rule rounded-md bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent"
								>
									<option value="">—</option>
									{MOODS.map((m) => (
										<option key={m} value={m}>
											{m}
										</option>
									))}
								</select>
							</label>

							<label className="flex items-center gap-2 text-sm self-end pb-1">
								<input type="checkbox" name="secret" className="accent-accent" />
								<span>
									비밀글
									<span className="text-muted"> — 오너만 봄</span>
								</span>
							</label>
						</div>

						<button
							type="submit"
							className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
						>
							방명록 남기기 <span aria-hidden>→</span>
						</button>
					</form>

					{owner && (
						<div className="mt-8 border-t rule pt-5 flex items-center justify-between gap-3">
							<span className="kicker text-accent">
								● Owner — 삭제·숨김 가능
							</span>
							<Link
								href="/admin"
								className="text-sm border-b border-ink pb-0.5 hover:text-accent hover:border-accent transition-colors"
							>
								어드민 →
							</Link>
						</div>
					)}
				</div>

				{/* ── 목록 ───────────────────────────────────── */}
				<div id="entries">
					<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
						<h3 className="display-en text-2xl sm:text-4xl font-semibold">
							Notes
						</h3>
						<span className="kicker">
							{entries.length}
							{owner ? " · 숨김 포함" : ""}
						</span>
					</div>

					{entries.length === 0 ? (
						<div className="border rule rounded-lg bg-paper-2 px-6 py-16 mt-6 text-center">
							<span className="dot mx-auto mb-4 block" aria-hidden />
							<p className="display-en text-2xl font-semibold">
								Empty<span className="text-accent">.</span>
							</p>
							<p className="mt-2 text-sm text-muted">
								첫 흔적을 남겨주세요.
							</p>
						</div>
					) : (
						<ul>
							{entries.map((e) => {
								const masked = e.secret === 1 && !owner;
								return (
									<li
										key={e.id}
										className={`border-b rule py-6 ${
											e.hidden === 1 ? "opacity-50" : ""
										}`}
									>
										<div className="flex items-baseline gap-3 flex-wrap">
											{e.mood && (
												<span aria-hidden className="text-base">
													{e.mood}
												</span>
											)}
											<span className="font-medium">
												{e.link ? (
													<a
														href={e.link}
														target="_blank"
														rel="noreferrer nofollow"
														className="hover:text-accent border-b border-line hover:border-accent transition-colors"
													>
														{e.name}
													</a>
												) : (
													e.name
												)}
											</span>
											{e.secret === 1 && (
												<span className="kicker text-accent">비밀</span>
											)}
											{e.hidden === 1 && (
												<span className="kicker">숨김</span>
											)}
											<span className="kicker ml-auto">
												{fmt.format(new Date(e.created_at))}
											</span>
										</div>

										<p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
											{masked ? (
												<span className="text-muted">
													🔒 비밀글입니다.
												</span>
											) : (
												e.body
											)}
										</p>

										{owner && (
											<div className="mt-3 flex gap-4">
												<form action={hideEntry}>
													<input type="hidden" name="id" value={e.id} />
													<input
														type="hidden"
														name="hidden"
														value={e.hidden === 1 ? "0" : "1"}
													/>
													<button
														type="submit"
														className="kicker hover:text-accent transition-colors"
													>
														{e.hidden === 1 ? "다시 보이기" : "숨기기"}
													</button>
												</form>
												<form action={removeEntry}>
													<input type="hidden" name="id" value={e.id} />
													<button
														type="submit"
														className="kicker text-accent hover:opacity-70 transition-opacity"
													>
														삭제
													</button>
												</form>
											</div>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</section>

			<PageStickers
				surface="page:/guestbook"
				edit={sp.edit === "1"}
				back="/guestbook"
			/>
		</div>
		</StickerRoot>
	);
}
