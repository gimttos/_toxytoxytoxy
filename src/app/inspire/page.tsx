import type { Metadata } from "next";
import Link from "next/link";
import { isOwner } from "@/lib/owner";
import { getPool, getTwists, listSaved, poolStats, TAGS, TAG_LABEL } from "@/lib/inspire";
import { InspireDeck } from "@/components/inspire-deck";
import {
	unlockInspire,
	lockInspire,
	saveComboAction,
	deleteSavedAction,
	addWordAction,
	removeWordAction,
	addTwistAction,
	removeTwistAction,
} from "./actions";

export const metadata: Metadata = {
	title: "영감 카드",
	robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("ko-KR", {
	dateStyle: "medium",
	timeZone: "Asia/Seoul",
});

const inputCls =
	"border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent";

export default async function InspirePage({
	searchParams,
}: {
	searchParams: Promise<{ err?: string; owner?: string }>;
}) {
	const sp = await searchParams;
	const owner = await isOwner();

	return (
		<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-16 sm:py-24">
			<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
				<h2 className="display-en text-3xl sm:text-5xl font-semibold flex items-baseline gap-2">
					Inspire
					<span className="dot" aria-hidden />
				</h2>
				<Link href="/" className="kicker hover:text-accent transition-colors">
					← Cover
				</Link>
			</div>
			<p className="mt-3 kicker text-muted">
				날것의 단어를 섞어 던지는 영감 덱 · 오너 전용
			</p>

			{sp.err && (
				<p className="mt-6 border rule rounded-md bg-paper-2 px-4 py-3 text-sm text-accent">
					{sp.err}
				</p>
			)}

			{!owner ? (
				<div className="mt-10 max-w-sm">
					<p className="kicker">Owner only · 오너 전용</p>
					<form action={unlockInspire} className="mt-4 grid gap-3">
						<input
							name="passphrase"
							type="password"
							autoComplete="off"
							required
							placeholder="패스프레이즈"
							className={inputCls}
						/>
						<button
							type="submit"
							className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
						>
							잠금 해제
						</button>
					</form>
				</div>
			) : (
				<OwnerView />
			)}
		</section>
	);
}

async function OwnerView() {
	const [pool, twists, saved, stats] = await Promise.all([
		getPool(),
		getTwists(),
		listSaved(),
		poolStats(),
	]);

	return (
		<div className="mt-8 grid gap-16">
			<form
				action={lockInspire}
				className="flex items-center justify-between gap-3 border rule rounded-md bg-paper-2 px-4 py-3"
			>
				<span className="kicker text-accent">● Owner mode</span>
				<button
					type="submit"
					className="text-sm border-b border-ink pb-0.5 hover:text-accent hover:border-accent transition-colors"
				>
					잠그기
				</button>
			</form>

			{/* 덱 */}
			<InspireDeck pool={pool} twists={twists} saveAction={saveComboAction} />

			{/* 저장한 조합 */}
			<div>
				<div className="flex items-baseline justify-between border-b rule pb-3">
					<h3 className="display-en text-xl sm:text-3xl font-semibold">Saved</h3>
					<span className="kicker">{saved.length}개 · 영감 사전</span>
				</div>
				{saved.length === 0 ? (
					<p className="mt-4 text-sm text-muted">
						아직 저장한 조합이 없어요. 마음에 드는 조합을 저장해 두면 여기 쌓여요.
					</p>
				) : (
					<ul className="mt-4 grid gap-3">
						{saved.map((s) => (
							<li key={s.id} className="border rule rounded-md p-4">
								<div className="flex items-baseline justify-between gap-3 flex-wrap">
									<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
										{s.words.map((w, i) => (
											<span key={i} className="inline-flex items-baseline gap-1">
												{i > 0 && (
													<span className="text-muted" aria-hidden>
														·
													</span>
												)}
												<span className="font-medium">{w.word}</span>
											</span>
										))}
										{s.twist && (
											<span className="text-sm text-accent-2 italic">
												“{s.twist}”
											</span>
										)}
									</div>
									<span className="kicker">
										{fmt.format(new Date(s.created_at))}
									</span>
								</div>
								{s.memo && (
									<p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words">
										{s.memo}
									</p>
								)}
								<form action={deleteSavedAction} className="mt-2">
									<input type="hidden" name="id" value={s.id} />
									<button
										type="submit"
										className="kicker text-accent hover:opacity-70 transition-opacity"
									>
										삭제
									</button>
								</form>
							</li>
						))}
					</ul>
				)}
			</div>

			{/* 풀 큐레이션 */}
			<div>
				<div className="flex items-baseline justify-between border-b rule pb-3">
					<h3 className="display-en text-xl sm:text-3xl font-semibold">Curate</h3>
					<span className="kicker">{stats.total}개 단어 · 풀 관리</span>
				</div>

				<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
					{pool.tags.map((t) => (
						<span key={t} className="kicker text-muted">
							{TAG_LABEL[t] ?? t}{" "}
							<span className="text-accent">{stats.perTag[t] ?? 0}</span>
						</span>
					))}
				</div>

				<div className="mt-6 grid gap-8 sm:grid-cols-2">
					{/* 단어 추가 */}
					<form action={addWordAction} className="grid gap-3">
						<p className="kicker">단어 추가</p>
						<input name="word" required placeholder="단어 (영어)" className={inputCls} />
						<select name="tag" required defaultValue="" className={inputCls}>
							<option value="" disabled>
								결(태그) 고르기
							</option>
							{TAGS.map((t) => (
								<option key={t} value={t}>
									{TAG_LABEL[t] ?? t} ({t})
								</option>
							))}
						</select>
						<button
							type="submit"
							className="rounded-md bg-ink text-paper px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
						>
							풀에 추가
						</button>
					</form>

					{/* 비틀기 한마디 추가 */}
					<form action={addTwistAction} className="grid gap-3">
						<p className="kicker">비틀기 한마디 추가</p>
						<textarea
							name="text"
							required
							rows={2}
							placeholder="Make the smallest object the whole point."
							className={`${inputCls} resize-y`}
						/>
						<button
							type="submit"
							className="rounded-md bg-ink text-paper px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
						>
							한마디 추가
						</button>
					</form>

					{/* 단어 솎기 */}
					<form action={removeWordAction} className="grid gap-3">
						<p className="kicker">단어 솎기</p>
						<input name="word" required placeholder="뺄 단어" className={inputCls} />
						<button
							type="submit"
							className="border rule rounded-md px-4 py-2.5 text-sm hover:bg-ink hover:text-paper transition-colors"
						>
							풀에서 빼기
						</button>
						<p className="kicker text-muted">시드 단어든 추가 단어든 풀에서 사라져요.</p>
					</form>

					{/* 한마디 솎기 */}
					<form action={removeTwistAction} className="grid gap-3">
						<p className="kicker">한마디 솎기</p>
						<textarea
							name="text"
							required
							rows={2}
							placeholder="뺄 한 마디 (전체 문장)"
							className={`${inputCls} resize-y`}
						/>
						<button
							type="submit"
							className="border rule rounded-md px-4 py-2.5 text-sm hover:bg-ink hover:text-paper transition-colors"
						>
							한마디 빼기
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
