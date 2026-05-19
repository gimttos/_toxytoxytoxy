import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-shell";
import { listPosts, type PostKind } from "@/lib/log";
import { isOwner } from "@/lib/owner";
import { createPostAction, deletePostAction } from "./actions";

export const metadata: Metadata = { title: "로그" };
export const dynamic = "force-dynamic";

const inputCls =
	"border rule bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent";

const fmt = new Intl.DateTimeFormat("ko-KR", {
	dateStyle: "medium",
	timeStyle: "short",
	timeZone: "Asia/Seoul",
});

const TABS: { key: "" | PostKind; label: string }[] = [
	{ key: "", label: "전체" },
	{ key: "update", label: "갱신기록" },
	{ key: "diary", label: "잡담·일기" },
];

export default async function LogPage({
	searchParams,
}: {
	searchParams: Promise<{ kind?: string; err?: string; owner?: string }>;
}) {
	const sp = await searchParams;
	const owner = await isOwner();
	const kind: PostKind | undefined =
		sp.kind === "update" || sp.kind === "diary" ? sp.kind : undefined;
	const posts = await listPosts(kind);

	return (
		<>
			<PageHeader href="/log" />

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14 sm:py-20">
				{sp.err && (
					<p className="mb-6 border rule bg-paper-2 px-4 py-3 text-sm text-accent">
						{sp.err}
					</p>
				)}

				<div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-4">
					<h3 className="display-en text-2xl sm:text-4xl font-semibold">
						Log
					</h3>
					<div className="flex gap-2 text-sm">
						{TABS.map((t) => {
							const active = (kind ?? "") === t.key;
							return (
								<Link
									key={t.label}
									href={t.key ? `/log?kind=${t.key}` : "/log"}
									className={`border rule px-3 py-1 transition-colors ${
										active
											? "bg-ink text-paper"
											: "hover:bg-ink hover:text-paper"
									}`}
								>
									{t.label}
								</Link>
							);
						})}
					</div>
				</div>

				{posts.length === 0 ? (
					<div className="ticks border rule bg-paper-2 px-6 py-16 mt-6 text-center">
						<span className="dot mx-auto mb-4 block" aria-hidden />
						<p className="mt-2 text-sm text-muted">아직 글이 없어요.</p>
					</div>
				) : (
					<ul className="mt-6 grid gap-6">
						{posts.map((p) => (
							<li key={p.id} className="border-b rule pb-6">
								<div className="flex items-baseline gap-3 flex-wrap">
									<span
										className={`kicker ${
											p.kind === "update" ? "text-accent" : "text-muted"
										}`}
									>
										{p.kind === "update" ? "갱신" : "잡담"}
									</span>
									{p.title && <span className="font-medium">{p.title}</span>}
									<span className="kicker ml-auto">
										{fmt.format(new Date(p.created_at))}
									</span>
								</div>
								<p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words">
									{p.body}
								</p>
								{p.tags && (
									<p className="mt-2 kicker text-muted">
										{p.tags
											.split(",")
											.filter(Boolean)
											.map((t) => `#${t}`)
											.join(" ")}
									</p>
								)}
								{owner && (
									<form action={deletePostAction} className="mt-2">
										<input type="hidden" name="id" value={p.id} />
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

				{owner ? (
					<details className="mt-12 border-t rule pt-6">
						<summary className="kicker text-accent cursor-pointer select-none">
							● Owner — 글 쓰기
						</summary>
						<form
							action={createPostAction}
							className="mt-4 grid gap-3 max-w-md"
						>
							<select name="kind" defaultValue="diary" className={inputCls}>
								<option value="diary">잡담·일기</option>
								<option value="update">갱신기록</option>
							</select>
							<input
								name="title"
								placeholder="제목 (선택)"
								className={inputCls}
							/>
							<textarea
								name="body"
								required
								rows={4}
								placeholder="내용"
								className={`${inputCls} resize-y`}
							/>
							<input
								name="tags"
								placeholder="태그 쉼표 구분 (선택)"
								className={inputCls}
							/>
							<button
								type="submit"
								className="bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
							>
								등록
							</button>
						</form>
					</details>
				) : (
					<p className="mt-12 border-t rule pt-6 kicker text-muted">
						글은 오너만 쓸 수 있어요.
					</p>
				)}
			</section>
		</>
	);
}
