import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageHeader } from "@/components/page-shell";
import { PageStickers } from "@/components/page-stickers";
import { listMyBanners, listFriendLinks, embedSnippet } from "@/lib/banners";
import { isOwner } from "@/lib/owner";
import {
	addMyBannerAction,
	deleteMyBannerAction,
	addFriendLinkAction,
	deleteFriendLinkAction,
} from "./actions";

export const metadata: Metadata = { title: "배너" };
export const dynamic = "force-dynamic";

const inputCls =
	"border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent";

export default async function BannersPage({
	searchParams,
}: {
	searchParams: Promise<{ err?: string; owner?: string; edit?: string }>;
}) {
	const sp = await searchParams;
	const owner = await isOwner();
	const [mine, friends] = await Promise.all([
		listMyBanners(),
		listFriendLinks(),
	]);

	const h = await headers();
	const host = h.get("host") ?? "localhost:3000";
	const proto =
		h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
	const base = `${proto}://${host}`;

	return (
		<div className="relative">
			<PageHeader href="/banners" />

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14 sm:py-20 grid gap-16">
				{sp.err && (
					<p className="border rule rounded-md bg-paper-2 px-4 py-3 text-sm text-accent">
						{sp.err}
					</p>
				)}

				{/* 내 배너 — 퍼가요 */}
				<div>
					<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
						<h3 className="display-en text-2xl sm:text-4xl font-semibold">
							Take one
						</h3>
						<span className="kicker">내 배너 · 퍼가요</span>
					</div>

					{mine.length === 0 ? (
						<p className="mt-6 text-sm text-muted">아직 등록된 배너가 없어요.</p>
					) : (
						<ul className="mt-6 grid gap-8">
							{mine.map((b) => (
								<li
									key={b.id}
									className="grid gap-4 sm:grid-cols-[auto_1fr] items-start"
								>
									<div className="border rule rounded-md bg-paper-2 p-3 inline-block">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={`/media/${b.r2_key}`}
											alt={b.label ?? "banner"}
											width={b.width ?? undefined}
											height={b.height ?? undefined}
											className="block"
										/>
									</div>
									<div className="min-w-0">
										<p className="kicker">
											HTML — 네 갠홈에 붙여넣기
										</p>
										<textarea
											readOnly
											rows={3}
											defaultValue={embedSnippet(base, b)}
											className={`${inputCls} mt-2 w-full font-mono text-xs`}
										/>
										<p className="mt-1 kicker text-muted">
											드래그해서 복사하세요.
										</p>
										{owner && (
											<form action={deleteMyBannerAction} className="mt-2">
												<input type="hidden" name="id" value={b.id} />
												<button
													type="submit"
													className="kicker text-accent hover:opacity-70 transition-opacity"
												>
													삭제
												</button>
											</form>
										)}
									</div>
								</li>
							))}
						</ul>
					)}

					{owner && (
						<details className="mt-8 border-t rule pt-6">
							<summary className="kicker text-accent cursor-pointer select-none">
								● Owner — 내 배너 등록
							</summary>
							<form
								action={addMyBannerAction}
								className="mt-4 grid gap-3 max-w-md"
							>
								<input
									type="file"
									name="file"
									accept="image/*"
									required
									className="text-sm file:mr-3 file:border file:rule file:rounded-md file:bg-paper-2 file:px-3 file:py-1.5 file:text-sm"
								/>
								<input
									name="label"
									placeholder="alt / 설명 (선택)"
									className={inputCls}
								/>
								<div className="grid grid-cols-2 gap-3">
									<input
										name="width"
										inputMode="numeric"
										placeholder="너비 px (선택)"
										className={inputCls}
									/>
									<input
										name="height"
										inputMode="numeric"
										placeholder="높이 px (선택)"
										className={inputCls}
									/>
								</div>
								<button
									type="submit"
									className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
								>
									배너 등록
								</button>
							</form>
						</details>
					)}
				</div>

				{/* 친구 배너·링크 */}
				<div>
					<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
						<h3 className="display-en text-2xl sm:text-4xl font-semibold">
							Links
						</h3>
						<span className="kicker">{friends.length} · 친구 배너·링크</span>
					</div>

					{friends.length === 0 ? (
						<p className="mt-6 text-sm text-muted">아직 링크가 없어요.</p>
					) : (
						<ul className="mt-6 flex flex-wrap gap-4">
							{friends.map((f) => {
								const src = f.img_key
									? `/media/${f.img_key}`
									: f.img_url ?? null;
								return (
									<li key={f.id} className="group">
										<a
											href={f.url}
											target="_blank"
											rel="noreferrer"
											title={f.label}
											className="block border rule hover:border-accent transition-colors"
										>
											{src ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={src}
													alt={f.label}
													loading="lazy"
													className="block max-h-24"
												/>
											) : (
												<span className="block px-4 py-3 text-sm">
													{f.label} →
												</span>
											)}
										</a>
										{owner && (
											<form
												action={deleteFriendLinkAction}
												className="mt-1"
											>
												<input type="hidden" name="id" value={f.id} />
												<button
													type="submit"
													className="kicker text-accent hover:opacity-70 transition-opacity"
												>
													삭제
												</button>
											</form>
										)}
									</li>
								);
							})}
						</ul>
					)}

					{owner && (
						<details className="mt-8 border-t rule pt-6">
							<summary className="kicker text-accent cursor-pointer select-none">
								● Owner — 링크 추가
							</summary>
							<form
								action={addFriendLinkAction}
								className="mt-4 grid gap-3 max-w-md"
							>
								<input
									name="label"
									required
									placeholder="이름"
									className={inputCls}
								/>
								<input
									name="url"
									type="url"
									required
									placeholder="https:// 이동할 주소"
									className={inputCls}
								/>
								<input
									name="imgUrl"
									type="url"
									placeholder="외부 배너 이미지 주소 (선택)"
									className={inputCls}
								/>
								<input
									type="file"
									name="imgFile"
									accept="image/*"
									className="text-sm file:mr-3 file:border file:rule file:rounded-md file:bg-paper-2 file:px-3 file:py-1.5 file:text-sm"
								/>
								<p className="kicker text-muted">
									배너 이미지는 업로드나 외부 주소 중 하나 (업로드 우선).
								</p>
								<button
									type="submit"
									className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
								>
									링크 추가
								</button>
							</form>
						</details>
					)}
				</div>
			</section>

			<PageStickers
				surface="page:/banners"
				edit={sp.edit === "1"}
				back="/banners"
			/>
		</div>
	);
}
