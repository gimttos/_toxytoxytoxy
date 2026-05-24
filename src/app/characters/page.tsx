import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-shell";
import { PageStickers } from "@/components/page-stickers";
import { StickerRoot } from "@/components/sticker-root";
import { listCharacters } from "@/lib/characters";
import { isOwner } from "@/lib/owner";
import { createCharacterAction } from "./actions";

export const metadata: Metadata = { title: "캐릭터" };
export const dynamic = "force-dynamic";

export default async function CharactersPage({
	searchParams,
}: {
	searchParams: Promise<{ ok?: string; err?: string; owner?: string; edit?: string }>;
}) {
	const sp = await searchParams;
	const owner = await isOwner();
	const chars = await listCharacters();

	return (
		<StickerRoot edit={sp.edit === "1"} back="/characters">
		<div className="relative">
			<PageHeader href="/characters" />

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14 sm:py-20">
				{sp.err && (
					<p className="mb-6 border rule rounded-md bg-paper-2 px-4 py-3 text-sm text-accent">
						{sp.err}
					</p>
				)}

				<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
					<h3 className="display-en text-2xl sm:text-4xl font-semibold">
						Index
					</h3>
					<span className="kicker">{chars.length} · 도감</span>
				</div>

				{chars.length === 0 ? (
					<div className="border rule rounded-lg bg-paper-2 px-6 py-16 mt-6 text-center">
						<span className="dot mx-auto mb-4 block" aria-hidden />
						<p className="display-en text-2xl font-semibold">
							Empty<span className="text-accent">.</span>
						</p>
						<p className="mt-2 text-sm text-muted">아직 캐릭터가 없어요.</p>
					</div>
				) : (
					<ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{chars.map((c) => (
							<li key={c.id}>
								<Link href={`/characters/${c.slug}`} className="group block">
									<div className="relative aspect-[3/4] border rule bg-paper-2 overflow-hidden">
										{c.portrait_key ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={`/media/${c.portrait_key}`}
												alt={c.name}
												className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
											/>
										) : (
											<span
												className="dot absolute inset-0 m-auto"
												aria-hidden
											/>
										)}
									</div>
									<p className="mt-3 font-medium">{c.name}</p>
									{c.tagline && (
										<p className="text-sm text-muted line-clamp-2">
											{c.tagline}
										</p>
									)}
								</Link>
							</li>
						))}
					</ul>
				)}

				{owner ? (
					<details className="mt-12 border-t rule pt-6">
						<summary className="kicker text-accent cursor-pointer select-none">
							● Owner — 새 캐릭터 추가
						</summary>
						<form
							action={createCharacterAction}
							className="mt-4 grid gap-3 max-w-md"
						>
							<input
								name="name"
								required
								placeholder="이름"
								className="border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
							/>
							<input
								name="slug"
								placeholder="슬러그 (비우면 이름에서 생성)"
								className="border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
							/>
							<input
								name="tagline"
								placeholder="한 줄 소개 (선택)"
								className="border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
							/>
							<button
								type="submit"
								className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
							>
								캐릭터 생성
							</button>
							<p className="kicker text-muted">
								생성 후 상세 페이지에서 일러스트·프로필·관계를 채워요.
							</p>
						</form>
					</details>
				) : (
					<p className="mt-12 border-t rule pt-6 kicker text-muted">
						캐릭터는 오너만 추가할 수 있어요.
					</p>
				)}
			</section>

			<PageStickers
				surface="page:/characters"
				edit={sp.edit === "1"}
				back="/characters"
			/>
		</div>
		</StickerRoot>
	);
}
