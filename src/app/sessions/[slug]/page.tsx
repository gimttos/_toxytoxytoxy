import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionBySlug, listLogs } from "@/lib/sessions";
import { isOwner } from "@/lib/owner";
import {
	updateSessionAction,
	deleteSessionAction,
	addLogAction,
	toggleLogVisibilityAction,
	deleteLogAction,
} from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const s = await getSessionBySlug(slug);
	return { title: s ? `${s.title} · 세션` : "세션" };
}

const inputCls =
	"border rule bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent";

export default async function SessionPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ ok?: string; err?: string; owner?: string }>;
}) {
	const { slug } = await params;
	const sp = await searchParams;
	const s = await getSessionBySlug(slug);
	if (!s) notFound();

	const owner = await isOwner();
	const logs = await listLogs(s.id, { owner });
	const tags = s.tags ? s.tags.split(",").filter(Boolean) : [];

	const meta: [string, string | null][] = [
		["시스템", s.system],
		["날짜", s.played_on],
		["역할", s.role],
		["파티", s.party],
		["결말", s.result],
		["한줄평", s.review],
	];

	return (
		<>
			<header className="border-b rule">
				<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-12 sm:py-16">
					<Link
						href="/sessions"
						className="kicker hover:text-accent transition-colors"
					>
						← Sessions · 세션
					</Link>
					<h2 className="display-en mt-4 text-[clamp(1.8rem,6vw,4rem)] font-semibold">
						{s.title}
					</h2>
					{tags.length > 0 && (
						<p className="mt-3 kicker text-muted">
							{tags.map((t) => `#${t}`).join(" ")}
						</p>
					)}
				</div>
			</header>

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-12 sm:py-16 grid gap-12 lg:grid-cols-[300px_1fr]">
				{/* 메타 */}
				<dl className="grid gap-4 text-sm self-start">
					{meta
						.filter(([, v]) => v)
						.map(([k, v]) => (
							<div key={k}>
								<dt className="kicker text-muted">{k}</dt>
								<dd className="mt-1 whitespace-pre-wrap break-words">{v}</dd>
							</div>
						))}
				</dl>

				{/* 로그 */}
				<div className="min-w-0">
					{sp.err && (
						<p className="mb-6 border rule bg-paper-2 px-4 py-3 text-sm text-accent">
							{sp.err}
						</p>
					)}

					<div className="flex items-baseline justify-between border-b rule pb-3">
						<h3 className="display-en text-xl sm:text-3xl font-semibold">
							Logs
						</h3>
						<span className="kicker">
							{logs.length}
							{owner ? " · 비공개 포함" : ""}
						</span>
					</div>

					{logs.length === 0 ? (
						<p className="mt-6 text-sm text-muted">
							{owner ? "아직 로그가 없어요." : "공개된 로그가 없어요."}
						</p>
					) : (
						<ul className="mt-6 grid gap-8">
							{logs.map((log) => (
								<li key={log.id} className="border rule">
									<div className="flex items-baseline justify-between gap-3 border-b rule px-4 py-3 flex-wrap">
										<span className="font-medium">
											{log.title ?? "로그"}
										</span>
										<span className="kicker flex items-center gap-2">
											{owner && (
												<span
													className={
														log.visibility === "private"
															? "text-muted"
															: "text-accent"
													}
												>
													{log.visibility === "private" ? "비공개" : "공개"}
												</span>
											)}
											<span className="text-muted">{log.format}</span>
										</span>
									</div>

									{log.format === "html" ? (
										<iframe
											// sandbox="" = 스크립트/동일출처 전부 차단. HTML/CSS만 표시.
											sandbox=""
											srcDoc={log.body}
											title={log.title ?? "session log"}
											className="w-full min-h-[70vh] bg-white"
										/>
									) : (
										<p className="px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap break-words">
											{log.body}
										</p>
									)}

									{owner && (
										<div className="flex gap-4 border-t rule px-4 py-2">
											<form action={toggleLogVisibilityAction}>
												<input type="hidden" name="id" value={log.id} />
												<input type="hidden" name="slug" value={slug} />
												<input
													type="hidden"
													name="to"
													value={
														log.visibility === "private"
															? "public"
															: "private"
													}
												/>
												<button
													type="submit"
													className="kicker hover:text-accent transition-colors"
												>
													{log.visibility === "private"
														? "공개로"
														: "비공개로"}
												</button>
											</form>
											<form action={deleteLogAction}>
												<input type="hidden" name="id" value={log.id} />
												<input type="hidden" name="slug" value={slug} />
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
							))}
						</ul>
					)}

					{/* 오너 도구 */}
					{owner && (
						<div className="mt-12 border-t-2 border-ink pt-6 grid gap-6">
							<p className="kicker text-accent">● Owner</p>

							<details open={logs.length === 0}>
								<summary className="kicker cursor-pointer select-none">
									로그 추가
								</summary>
								<form
									action={addLogAction}
									className="mt-4 grid gap-3 max-w-xl"
								>
									<input type="hidden" name="sessionId" value={s.id} />
									<input type="hidden" name="slug" value={slug} />
									<input
										name="title"
										placeholder="로그 제목 (선택)"
										className={inputCls}
									/>
									<div className="grid grid-cols-2 gap-3">
										<select name="format" defaultValue="text" className={inputCls}>
											<option value="text">텍스트</option>
											<option value="html">HTML (콕포 등)</option>
										</select>
										<select
											name="visibility"
											defaultValue="private"
											className={inputCls}
										>
											<option value="private">비공개</option>
											<option value="public">공개</option>
										</select>
									</div>
									<textarea
										name="body"
										required
										rows={8}
										placeholder="로그 붙여넣기 (HTML이면 HTML 통째로)"
										className={`${inputCls} resize-y font-mono`}
									/>
									<button
										type="submit"
										className="bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
									>
										로그 저장
									</button>
									<p className="kicker text-muted">
										HTML 로그는 스크립트 차단된 안전 프레임으로 표시돼요.
									</p>
								</form>
							</details>

							<details>
								<summary className="kicker cursor-pointer select-none">
									세션 정보 편집
								</summary>
								<form
									action={updateSessionAction}
									className="mt-4 grid gap-3 max-w-xl"
								>
									<input type="hidden" name="id" value={s.id} />
									<input type="hidden" name="slug" value={slug} />
									<input
										name="title"
										required
										defaultValue={s.title}
										placeholder="시나리오명"
										className={inputCls}
									/>
									<div className="grid grid-cols-2 gap-3">
										<input
											name="system"
											defaultValue={s.system ?? ""}
											placeholder="시스템"
											className={inputCls}
										/>
										<input
											name="played_on"
											type="date"
											defaultValue={s.played_on ?? ""}
											className={inputCls}
											aria-label="플레이 날짜"
										/>
									</div>
									<div className="grid grid-cols-2 gap-3">
										<input
											name="role"
											defaultValue={s.role ?? ""}
											placeholder="GM / PL"
											className={inputCls}
										/>
										<input
											name="party"
											defaultValue={s.party ?? ""}
											placeholder="같이 한 사람"
											className={inputCls}
										/>
									</div>
									<input
										name="result"
										defaultValue={s.result ?? ""}
										placeholder="결말"
										className={inputCls}
									/>
									<input
										name="review"
										defaultValue={s.review ?? ""}
										placeholder="한줄평"
										className={inputCls}
									/>
									<input
										name="tags"
										defaultValue={s.tags ?? ""}
										placeholder="태그 쉼표 구분"
										className={inputCls}
									/>
									<button
										type="submit"
										className="bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
									>
										저장
									</button>
								</form>
							</details>

							<form action={deleteSessionAction}>
								<input type="hidden" name="id" value={s.id} />
								<button
									type="submit"
									className="kicker text-accent hover:opacity-70 transition-opacity"
								>
									이 세션 삭제
								</button>
							</form>
						</div>
					)}
				</div>
			</section>
		</>
	);
}
