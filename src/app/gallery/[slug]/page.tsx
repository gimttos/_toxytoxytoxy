import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlbumBySlug, listImages } from "@/lib/gallery";
import { isOwner } from "@/lib/owner";
import { uploadImagesAction, deleteImageAction } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const album = await getAlbumBySlug(slug);
	return { title: album ? `${album.title} · 갤러리` : "갤러리" };
}

function tagList(tags: string | null): string[] {
	return tags ? tags.split(",").filter(Boolean) : [];
}

export default async function AlbumPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ tag?: string; ok?: string; err?: string; owner?: string }>;
}) {
	const { slug } = await params;
	const sp = await searchParams;
	const album = await getAlbumBySlug(slug);
	if (!album) notFound();

	const owner = await isOwner();
	const all = await listImages(album.id);
	const allTags = [...new Set(all.flatMap((i) => tagList(i.tags)))].sort();
	const activeTag = sp.tag?.toLowerCase();
	const images = activeTag
		? all.filter((i) => tagList(i.tags).includes(activeTag))
		: all;

	return (
		<>
			<header className="border-b rule">
				<div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-12 sm:py-16">
					<Link
						href="/gallery"
						className="kicker hover:text-accent transition-colors"
					>
						← Gallery · 갤러리
					</Link>
					<h2 className="display-en mt-4 text-[clamp(2rem,7vw,4.5rem)] font-semibold flex items-baseline gap-4 flex-wrap">
						{album.title}
						<span className="text-muted text-[0.35em] font-sans font-normal">
							{album.kind === "goods" ? "굿즈 · 콜렉션" : "사진"} · {all.length}
						</span>
					</h2>
					{album.description && (
						<p className="mt-3 text-muted max-w-prose">{album.description}</p>
					)}

					{allTags.length > 0 && (
						<div className="mt-5 flex flex-wrap gap-2 text-sm">
							<Link
								href={`/gallery/${slug}`}
								className={`border rule px-3 py-1 transition-colors ${
									activeTag ? "hover:bg-ink hover:text-paper" : "bg-ink text-paper"
								}`}
							>
								전체
							</Link>
							{allTags.map((t) => (
								<Link
									key={t}
									href={`/gallery/${slug}?tag=${encodeURIComponent(t)}`}
									className={`border rule px-3 py-1 transition-colors ${
										activeTag === t
											? "bg-accent text-on-accent"
											: "hover:bg-ink hover:text-paper"
									}`}
								>
									#{t}
								</Link>
							))}
						</div>
					)}
				</div>
			</header>

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-12 sm:py-16">
				{sp.err && (
					<p className="mb-6 border rule bg-paper-2 px-4 py-3 text-sm text-accent">
						{sp.err}
					</p>
				)}
				{sp.ok && (
					<p className="mb-6 border rule bg-paper-2 px-4 py-3 text-sm">
						{sp.ok}장 올렸어요.
					</p>
				)}

				{images.length === 0 ? (
					<div className="ticks border rule bg-paper-2 px-6 py-16 text-center">
						<span className="dot mx-auto mb-4 block" aria-hidden />
						<p className="text-sm text-muted">
							{activeTag ? "이 태그의 이미지가 없어요." : "아직 이미지가 없어요."}
						</p>
					</div>
				) : (
					<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{images.map((img) => (
							<li key={img.id} className="group">
								<div className="ticks relative border rule bg-paper-2 overflow-hidden">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={`/media/${img.r2_key}`}
										alt={img.caption ?? ""}
										loading="lazy"
										className="w-full h-auto block"
									/>
								</div>
								{(img.caption || tagList(img.tags).length > 0) && (
									<div className="mt-2">
										{img.caption && (
											<p className="text-sm">{img.caption}</p>
										)}
										{tagList(img.tags).length > 0 && (
											<p className="mt-1 kicker text-muted">
												{tagList(img.tags)
													.map((t) => `#${t}`)
													.join(" ")}
											</p>
										)}
									</div>
								)}
								{owner && (
									<form action={deleteImageAction} className="mt-1">
										<input type="hidden" name="id" value={img.id} />
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

				{/* 오너 — 업로드 */}
				{owner && (
					<details className="mt-12 border-t rule pt-6" open={images.length === 0}>
						<summary className="kicker text-accent cursor-pointer select-none">
							● Owner — 이미지 올리기
						</summary>
						<form
							action={uploadImagesAction}
							className="mt-4 grid gap-3 max-w-md"
						>
							<input type="hidden" name="albumId" value={album.id} />
							<input type="hidden" name="slug" value={slug} />
							<input
								type="file"
								name="files"
								accept="image/*"
								multiple
								required
								className="text-sm file:mr-3 file:border file:rule file:bg-paper-2 file:px-3 file:py-1.5 file:text-sm"
							/>
							<input
								name="caption"
								placeholder="캡션 (선택, 전체 적용)"
								className="border rule bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
							/>
							<input
								name="tags"
								placeholder="태그 쉼표 구분 (선택, 전체 적용)"
								className="border rule bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
							/>
							<button
								type="submit"
								className="bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
							>
								업로드
							</button>
						</form>
					</details>
				)}
			</section>
		</>
	);
}
