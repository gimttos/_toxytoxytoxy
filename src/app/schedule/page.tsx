import type { Metadata } from "next";
import { PageHeader } from "@/components/page-shell";
import {
	ensureFresh,
	listEvents,
	listMemos,
	syncedAt,
	type SchedEvent,
} from "@/lib/schedule";
import { isOwner } from "@/lib/owner";
import {
	refreshScheduleAction,
	addMemoAction,
	deleteMemoAction,
} from "./actions";

export const metadata: Metadata = { title: "일정" };
export const dynamic = "force-dynamic";

const inputCls =
	"border rule bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent";

function fmts(allDay: boolean) {
	const timeZone = allDay ? "UTC" : "Asia/Seoul";
	return {
		key: new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}),
		head: new Intl.DateTimeFormat("ko-KR", {
			timeZone,
			month: "long",
			day: "numeric",
			weekday: "short",
		}),
		time: new Intl.DateTimeFormat("ko-KR", {
			timeZone,
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		}),
	};
}

const syncFmt = new Intl.DateTimeFormat("ko-KR", {
	timeZone: "Asia/Seoul",
	dateStyle: "short",
	timeStyle: "short",
});

function groupKey(e: SchedEvent): { key: string; head: string } {
	const f = fmts(e.all_day === 1);
	const d = new Date(e.start_ms);
	return { key: f.key.format(d), head: f.head.format(d) };
}

function timeLabel(e: SchedEvent): string {
	if (e.all_day === 1) return "종일";
	const f = fmts(false);
	const s = f.time.format(new Date(e.start_ms));
	if (e.end_ms && e.end_ms > e.start_ms) {
		return `${s}–${f.time.format(new Date(e.end_ms))}`;
	}
	return s;
}

export default async function SchedulePage({
	searchParams,
}: {
	searchParams: Promise<{ err?: string; owner?: string }>;
}) {
	const sp = await searchParams;
	const owner = await isOwner();
	const state = await ensureFresh(false);
	const events = state.configured ? await listEvents() : [];
	const memos = owner ? await listMemos() : [];
	const synced = await syncedAt();

	// 날짜별 그룹 (events 는 start_ms 오름차순 → Map 삽입 순서 유지)
	const groups = new Map<string, { head: string; items: SchedEvent[] }>();
	for (const e of events) {
		const { key, head } = groupKey(e);
		if (!groups.has(key)) groups.set(key, { head, items: [] });
		groups.get(key)!.items.push(e);
	}

	return (
		<>
			<PageHeader href="/schedule" />

			<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14 sm:py-20 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
				{/* 일정 */}
				<div className="min-w-0">
					{sp.err && (
						<p className="mb-6 border rule bg-paper-2 px-4 py-3 text-sm text-accent">
							{sp.err}
						</p>
					)}

					<div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-4">
						<h3 className="display-en text-2xl sm:text-4xl font-semibold">
							Schedule
						</h3>
						<span className="kicker">
							{synced
								? `동기화 ${syncFmt.format(new Date(synced))}`
								: "미동기화"}
						</span>
					</div>

					{!state.configured ? (
						<div className="ticks border rule bg-paper-2 px-6 py-12 mt-6">
							<p className="display-en text-xl font-semibold">
								Not linked<span className="text-accent">.</span>
							</p>
							<p className="mt-2 text-sm text-muted">
								구글 캘린더가 아직 연결되지 않았어요.
							</p>
							{owner && (
								<ol className="mt-4 grid gap-1.5 text-sm text-muted list-decimal pl-5">
									<li>구글 캘린더 → 설정 → 내 캘린더 설정 → 해당 캘린더</li>
									<li>“캘린더 통합” → <b>iCal 형식의 비공개 주소</b> 복사</li>
									<li>
										<code className="text-ink">GCAL_ICS_URL</code> 시크릿으로
										등록 (아래 안내) 후 새로고침
									</li>
								</ol>
							)}
						</div>
					) : events.length === 0 ? (
						<div className="ticks border rule bg-paper-2 px-6 py-12 mt-6 text-center">
							<span className="dot mx-auto mb-4 block" aria-hidden />
							<p className="text-sm text-muted">
								{state.ok
									? "다가오는 일정이 없어요."
									: `불러오기 문제: ${state.error}`}
							</p>
						</div>
					) : (
						<div className="mt-6 grid gap-8">
							{[...groups.entries()].map(([key, g]) => (
								<div key={key}>
									<div className="flex items-baseline gap-3 border-b rule pb-2">
										<span className="font-medium">{g.head}</span>
										<span className="kicker text-muted">{key}</span>
									</div>
									<ul className="mt-3 grid gap-3">
										{g.items.map((e) => (
											<li
												key={e.id}
												className="grid grid-cols-[5.5rem_1fr] gap-3 text-sm"
											>
												<span className="kicker text-accent pt-0.5">
													{timeLabel(e)}
												</span>
												<div className="min-w-0">
													<p className="font-medium flex items-baseline gap-2 flex-wrap">
														{e.summary ?? "(제목 없음)"}
														{e.rrule && (
															<span className="kicker text-muted">반복</span>
														)}
													</p>
													{e.location && (
														<p className="text-muted">{e.location}</p>
													)}
													{e.description && (
														<p className="mt-1 text-muted whitespace-pre-wrap break-words line-clamp-3">
															{e.description}
														</p>
													)}
												</div>
											</li>
										))}
									</ul>
								</div>
							))}
							{events.some((e) => e.rrule) && (
								<p className="kicker text-muted">
									반복 일정은 우선 첫 회차만 표시돼요 (확장 추후).
								</p>
							)}
						</div>
					)}

					{owner && state.configured && (
						<form action={refreshScheduleAction} className="mt-8 border-t rule pt-5">
							<button
								type="submit"
								className="text-sm border-b border-ink pb-0.5 hover:text-accent hover:border-accent transition-colors"
							>
								지금 새로고침
							</button>
							{state.ok === false && (
								<span className="ml-3 kicker text-accent">{state.error}</span>
							)}
						</form>
					)}
				</div>

				{/* 비공개 메모 (오너 전용) */}
				{owner && (
					<aside className="lg:border-l rule lg:pl-8">
						<p className="kicker text-accent">● 비공개 메모</p>
						<form
							action={addMemoAction}
							className="mt-4 grid gap-3"
						>
							<input
								type="date"
								name="on_date"
								required
								className={inputCls}
								aria-label="날짜"
							/>
							<textarea
								name="body"
								required
								rows={3}
								placeholder="이 날 관련 비공개 메모"
								className={`${inputCls} resize-y`}
							/>
							<button
								type="submit"
								className="bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
							>
								메모 추가
							</button>
						</form>

						{memos.length === 0 ? (
							<p className="mt-6 text-sm text-muted">아직 메모가 없어요.</p>
						) : (
							<ul className="mt-6 grid gap-3">
								{memos.map((m) => (
									<li key={m.id} className="border rule p-3">
										<div className="flex items-baseline justify-between gap-2">
											<span className="kicker">{m.on_date}</span>
											<form action={deleteMemoAction}>
												<input type="hidden" name="id" value={m.id} />
												<button
													type="submit"
													className="kicker text-accent hover:opacity-70 transition-opacity"
												>
													삭제
												</button>
											</form>
										</div>
										<p className="mt-1 text-sm whitespace-pre-wrap break-words">
											{m.body}
										</p>
									</li>
								))}
							</ul>
						)}
						<p className="mt-4 kicker text-muted">
							메모는 너만 봐요. 공개 안 됨.
						</p>
					</aside>
				)}
			</section>
		</>
	);
}
