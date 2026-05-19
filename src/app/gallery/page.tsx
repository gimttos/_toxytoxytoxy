import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-shell";
import { listAlbums } from "@/lib/gallery";
import { isOwner } from "@/lib/owner";
import { createAlbumAction, deleteAlbumAction } from "./actions";

export const metadata: Metadata = { title: "갤러리" };
export const dynamic = "force-dynamic";

export default async function GalleryPage({
	searchParams,
}: {
	searchParams: Promise<{ ok?: string; err?: string; owner?: string }>;
}) {
	const sp = await searchParams;
	const owner = await isOwner();
	const albums = await listAlbums();

	return (
		<>
			<PageHeader href="/gallery" />

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14 sm:py-20">
				{sp.err && (
					<p className="mb-6 border rule bg-paper-2 px-4 py-3 text-sm text-accent">
						{sp.err}
					</p>
				)}

				<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
					<h3 className="display-en text-2xl sm:text-4xl font-semibold">
						Albums
					</h3>
					<span className="kicker">{albums.length} · 앨범</span>
				</div>

				{albums.length === 0 ? (
					<div className="ticks border rule bg-paper-2 px-6 py-16 mt-6 text-center">
						<span className="dot mx-auto mb-4 block" aria-hidden />
						<p className="display-en text-2xl font-semibold">
							Empty<span className="text-accent">.</span>
						</p>
						<p className="mt-2 text-sm text-muted">아직 앨범이 없어요.</p>
					</div>
				) : (
					<ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{albums.map((a) => (
							<li key={a.id} className="group">
								<Link href={`/gallery/${a.slug}`} className="block">
									<div className="ticks relative aspect-[4/3] border rule bg-paper-2 overflow-hidden">
										{a.cover_key ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={`/media/${a.cover_key}`}
												alt={a.title}
												className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
											/>
										) : (
											<span
												className="dot absolute inset-0 m-auto"
												aria-hidden
											/>
										)}
									</div>
									<div className="mt-3 flex items-baseline justify-between gap-3">
										<span className="font-medium">{a.title}</span>
										<span className="kicker">
											{a.kind === "goods" ? "굿즈" : "사진"} · {a.image_count}
										</span>
									</div>
									{a.description && (
										<p className="mt-1 text-sm text-muted line-clamp-2">
											{a.description}
										</p>
									)}
								</Link>
								{owner && (
									<form action={deleteAlbumAction} className="mt-2">
										<input type="hidden" name="id" value={a.id} />
										<input type="hidden" name="slug" value={a.slug} />
										<button
											type="submit"
											className="kicker text-accent hover:opacity-70 transition-opacity"
										>
											앨범 삭제
										</button>
									</form>
								)}
							</li>
						))}
					</ul>
				)}

				{/* 오너 — 새 앨범 */}
				{owner ? (
					<details className="mt-12 border-t rule pt-6">
						<summary className="kicker text-accent cursor-pointer select-none">
							● Owner — 새 앨범 만들기
						</summary>
						<form action={createAlbumAction} className="mt-4 grid gap-3 max-w-md">
							<input
								name="title"
								required
								placeholder="앨범 제목"
								className="border rule bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
							/>
							<input
								name="slug"
								placeholder="슬러그 (비우면 제목에서 생성)"
								className="border rule bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
							/>
							<textarea
								name="description"
								rows={2}
								placeholder="설명 (선택)"
								className="border rule bg-paper px-3 py-2.5 text-sm resize-y focus:outline-none focus:border-accent"
							/>
							<select
								name="kind"
								defaultValue="photo"
								className="border rule bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent"
							>
								<option value="photo">사진</option>
								<option value="goods">굿즈 · 콜렉션</option>
							</select>
							<button
								type="submit"
								className="bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
							>
								앨범 생성
							</button>
						</form>
					</details>
				) : (
					<p className="mt-12 border-t rule pt-6 kicker text-muted">
						이미지는 오너만 올릴 수 있어요.
					</p>
				)}
			</section>
		</>
	);
}
