import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	getCharacterBySlug,
	listRelations,
	listCharacters,
} from "@/lib/characters";
import { isOwner } from "@/lib/owner";
import {
	updateCharacterAction,
	uploadPortraitAction,
	deleteCharacterAction,
	addRelationAction,
	deleteRelationAction,
} from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const c = await getCharacterBySlug(slug);
	return { title: c ? `${c.name} · 캐릭터` : "캐릭터" };
}

const inputCls =
	"border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent";

export default async function CharacterPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ ok?: string; err?: string; owner?: string }>;
}) {
	const { slug } = await params;
	const sp = await searchParams;
	const c = await getCharacterBySlug(slug);
	if (!c) notFound();

	const owner = await isOwner();
	const relations = await listRelations(c.id);
	const others = owner
		? (await listCharacters()).filter((x) => x.id !== c.id)
		: [];
	const tags = c.tags ? c.tags.split(",").filter(Boolean) : [];
	const hasSheet = c.system || c.stats || c.before_after;

	return (
		<>
			<header className="border-b rule">
				<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-12 sm:py-16">
					<Link
						href="/characters"
						className="kicker hover:text-accent transition-colors"
					>
						← Characters · 캐릭터
					</Link>
					<h2 className="display-en mt-4 text-[clamp(2rem,7vw,4.5rem)] font-semibold flex items-baseline gap-4 flex-wrap">
						{c.name}
						{c.name_en && (
							<span className="text-muted text-[0.35em] font-sans font-normal">
								{c.name_en}
							</span>
						)}
					</h2>
					{c.tagline && (
						<p className="mt-3 text-muted max-w-prose">{c.tagline}</p>
					)}
				</div>
			</header>

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-12 sm:py-16 grid gap-12 lg:grid-cols-[360px_1fr]">
				{/* 일러스트 */}
				<div>
					<div className="relative aspect-[3/4] border rule bg-paper-2 overflow-hidden">
						{c.portrait_key ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={`/media/${c.portrait_key}`}
								alt={c.name}
								className="h-full w-full object-cover"
							/>
						) : (
							<span className="dot absolute inset-0 m-auto" aria-hidden />
						)}
					</div>
					{tags.length > 0 && (
						<p className="mt-3 kicker text-muted">
							{tags.map((t) => `#${t}`).join(" ")}
						</p>
					)}
				</div>

				{/* 본문 */}
				<div className="min-w-0">
					{sp.err && (
						<p className="mb-6 border rule rounded-md bg-paper-2 px-4 py-3 text-sm text-accent">
							{sp.err}
						</p>
					)}

					{c.profile && (
						<div>
							<p className="kicker">Profile · 프로필</p>
							<p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
								{c.profile}
							</p>
						</div>
					)}

					{hasSheet && (
						<div className="mt-10 border-t rule pt-6">
							<p className="kicker">Sheet · PC 시트</p>
							<dl className="mt-3 grid gap-4 text-sm">
								{c.system && (
									<div>
										<dt className="text-muted">시스템</dt>
										<dd className="mt-0.5">{c.system}</dd>
									</div>
								)}
								{c.stats && (
									<div>
										<dt className="text-muted">능력치 · 시트</dt>
										<dd className="mt-0.5 whitespace-pre-wrap break-words">
											{c.stats}
										</dd>
									</div>
								)}
								{c.before_after && (
									<div>
										<dt className="text-muted">비포 · 애프터</dt>
										<dd className="mt-0.5 whitespace-pre-wrap break-words">
											{c.before_after}
										</dd>
									</div>
								)}
							</dl>
						</div>
					)}

					{/* 관계도 */}
					<div className="mt-10 border-t rule pt-6">
						<p className="kicker">Relations · 관계</p>
						{relations.length === 0 ? (
							<p className="mt-3 text-sm text-muted">아직 관계가 없어요.</p>
						) : (
							<ul className="mt-3">
								{relations.map((r) => (
									<li
										key={r.id}
										className="flex items-baseline gap-3 border-b rule py-3 flex-wrap"
									>
										<span className="kicker text-accent">{r.label}</span>
										<Link
											href={`/characters/${r.b_slug}`}
											className="font-medium hover:text-accent transition-colors"
										>
											{r.b_name}
										</Link>
										{r.note && (
											<span className="text-sm text-muted">— {r.note}</span>
										)}
										{owner && (
											<form
												action={deleteRelationAction}
												className="ml-auto"
											>
												<input type="hidden" name="id" value={r.id} />
												<input type="hidden" name="slug" value={slug} />
												<button
													type="submit"
													className="kicker text-accent hover:opacity-70 transition-opacity"
												>
													삭제
												</button>
											</form>
										)}
									</li>
								))}
							</ul>
						)}
					</div>

					{/* 오너 도구 */}
					{owner && (
						<div className="mt-12 border-t-2 border-ink pt-6 grid gap-6">
							<p className="kicker text-accent">● Owner</p>

							<details>
								<summary className="kicker cursor-pointer select-none">
									프로필 편집
								</summary>
								<form
									action={updateCharacterAction}
									className="mt-4 grid gap-3 max-w-xl"
								>
									<input type="hidden" name="id" value={c.id} />
									<input type="hidden" name="slug" value={slug} />
									<input
										name="name"
										required
										defaultValue={c.name}
										placeholder="이름"
										className={inputCls}
									/>
									<input
										name="name_en"
										defaultValue={c.name_en ?? ""}
										placeholder="영문/별칭 (선택)"
										className={inputCls}
									/>
									<input
										name="tagline"
										defaultValue={c.tagline ?? ""}
										placeholder="한 줄 소개"
										className={inputCls}
									/>
									<textarea
										name="profile"
										rows={5}
										defaultValue={c.profile ?? ""}
										placeholder="프로필 본문"
										className={`${inputCls} resize-y`}
									/>
									<input
										name="system"
										defaultValue={c.system ?? ""}
										placeholder="TRPG 시스템 (선택)"
										className={inputCls}
									/>
									<textarea
										name="stats"
										rows={3}
										defaultValue={c.stats ?? ""}
										placeholder="능력치 · 시트 (자유서식)"
										className={`${inputCls} resize-y`}
									/>
									<textarea
										name="before_after"
										rows={3}
										defaultValue={c.before_after ?? ""}
										placeholder="비포 · 애프터 (선택)"
										className={`${inputCls} resize-y`}
									/>
									<input
										name="tags"
										defaultValue={c.tags ?? ""}
										placeholder="태그 쉼표 구분"
										className={inputCls}
									/>
									<button
										type="submit"
										className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
									>
										저장
									</button>
								</form>
							</details>

							<details>
								<summary className="kicker cursor-pointer select-none">
									일러스트 {c.portrait_key ? "교체" : "업로드"}
								</summary>
								<form
									action={uploadPortraitAction}
									className="mt-4 flex flex-wrap gap-3 items-center"
								>
									<input type="hidden" name="id" value={c.id} />
									<input type="hidden" name="slug" value={slug} />
									<input
										type="file"
										name="portrait"
										accept="image/*"
										required
										className="text-sm file:mr-3 file:border file:rule file:rounded-md file:bg-paper-2 file:px-3 file:py-1.5 file:text-sm"
									/>
									<button
										type="submit"
										className="border rule rounded-md px-4 py-2 text-sm hover:bg-ink hover:text-paper transition-colors"
									>
										업로드
									</button>
								</form>
							</details>

							<details>
								<summary className="kicker cursor-pointer select-none">
									관계 추가
								</summary>
								<form
									action={addRelationAction}
									className="mt-4 grid gap-3 max-w-md"
								>
									<input type="hidden" name="aId" value={c.id} />
									<input type="hidden" name="slug" value={slug} />
									<select name="bId" required className={inputCls} defaultValue="">
										<option value="" disabled>
											상대 캐릭터
										</option>
										{others.map((o) => (
											<option key={o.id} value={o.id}>
												{o.name}
											</option>
										))}
									</select>
									<input
										name="label"
										required
										placeholder="관계 라벨 (예: 동료, 라이벌)"
										className={inputCls}
									/>
									<input
										name="note"
										placeholder="메모 (선택)"
										className={inputCls}
									/>
									<button
										type="submit"
										className="border rule rounded-md px-4 py-2 text-sm hover:bg-ink hover:text-paper transition-colors"
									>
										관계 추가
									</button>
									{others.length === 0 && (
										<p className="kicker text-muted">
											상대로 지정할 다른 캐릭터가 필요해요.
										</p>
									)}
								</form>
							</details>

							<form action={deleteCharacterAction}>
								<input type="hidden" name="id" value={c.id} />
								<button
									type="submit"
									className="kicker text-accent hover:opacity-70 transition-opacity"
								>
									이 캐릭터 삭제
								</button>
							</form>
						</div>
					)}
				</div>
			</section>
		</>
	);
}
