import type { Metadata } from "next";
import Link from "next/link";
import { isOwner } from "@/lib/owner";
import { listRoomLinks, listNotes } from "@/lib/admin";
import { getSiteMeta } from "@/lib/meta";
import { listLibrary } from "@/lib/stickers";
import {
	unlockAdmin,
	lockAdmin,
	addRoomLinkAction,
	deleteRoomLinkAction,
	addNoteAction,
	deleteNoteAction,
	setStatusAction,
	uploadBgmAction,
	clearBgmAction,
	uploadCoverAction,
	clearCoverAction,
	uploadStickerAction,
	deleteStickerAction,
} from "./actions";

export const metadata: Metadata = {
	title: "어드민",
	robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("ko-KR", {
	dateStyle: "medium",
	timeStyle: "short",
	timeZone: "Asia/Seoul",
});

const inputCls =
	"border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent";

export default async function AdminPage({
	searchParams,
}: {
	searchParams: Promise<{ err?: string; owner?: string }>;
}) {
	const sp = await searchParams;
	const owner = await isOwner();
	const meta = owner ? await getSiteMeta() : null;
	const stickers = owner ? await listLibrary() : [];

	return (
		<section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-16 sm:py-24">
			<div className="flex items-baseline justify-between border-b-2 border-ink pb-4">
				<h2 className="display-en text-3xl sm:text-5xl font-semibold flex items-baseline gap-2">
					Admin
					<span className="dot" aria-hidden />
				</h2>
				<Link href="/" className="kicker hover:text-accent transition-colors">
					← Cover
				</Link>
			</div>

			{sp.err && (
				<p className="mt-6 border rule rounded-md bg-paper-2 px-4 py-3 text-sm text-accent">
					{sp.err}
				</p>
			)}

			{!owner ? (
				<div className="mt-10 max-w-sm">
					<p className="kicker">Owner only · 오너 전용</p>
					<form action={unlockAdmin} className="mt-4 grid gap-3">
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
					<p className="mt-4 kicker text-muted">
						해제하면 갤러리·캐릭터·방명록의 오너 도구도 함께 열려요.
					</p>
				</div>
			) : (
				<div className="mt-8 grid gap-16">
					<form
						action={lockAdmin}
						className="flex items-center justify-between gap-3 border rule rounded-md bg-paper-2 px-4 py-3"
					>
						<span className="kicker text-accent">
							● Owner mode — 사이트 전역 적용 중
						</span>
						<button
							type="submit"
							className="text-sm border-b border-ink pb-0.5 hover:text-accent hover:border-accent transition-colors"
						>
							잠그기
						</button>
					</form>

					{/* 영감 카드 — 오너 전용 생성기 바로가기 (강조) */}
					<Link
						href="/inspire"
						className="group flex items-center justify-between gap-3 border-2 border-accent rounded-md bg-paper-2 px-5 py-4 hover:bg-accent transition-colors"
					>
						<span>
							<span className="display-en text-xl font-semibold">Inspire</span>
							<span className="ml-2 kicker">영감 카드 · 단어 생성기</span>
						</span>
						<span className="text-accent group-hover:text-ink transition-colors" aria-hidden>
							열기 →
						</span>
					</Link>

					{/* 바로가기 */}
					<div>
						<p className="kicker">Manage · 바로가기</p>
						<div className="mt-3 flex flex-wrap gap-3 text-sm">
							{[
								["/inspire", "영감 카드"],
								["/guestbook", "방명록 관리"],
								["/gallery", "갤러리 업로드"],
								["/characters", "캐릭터 편집"],
							].map(([href, label]) => (
								<Link
									key={href}
									href={href}
									className="border rule rounded-md px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
								>
									{label} →
								</Link>
							))}
						</div>
						<p className="mt-2 kicker text-muted">
							각 페이지의 오너 도구는 잠금 해제 상태에서 바로 보여요.
						</p>
					</div>

					{/* 룸링크 정리함 */}
					<div>
						<div className="flex items-baseline justify-between border-b rule pb-3">
							<h3 className="display-en text-xl sm:text-3xl font-semibold">
								Room links
							</h3>
							<span className="kicker">룸링크 정리함</span>
						</div>
						<RoomLinks />
						<details className="mt-6">
							<summary className="kicker text-accent cursor-pointer select-none">
								+ 링크 추가
							</summary>
							<form
								action={addRoomLinkAction}
								className="mt-4 grid gap-3 max-w-md"
							>
								<input name="label" required placeholder="라벨" className={inputCls} />
								<input
									name="url"
									type="url"
									required
									placeholder="https:// 디코/콕포/VTT"
									className={inputCls}
								/>
								<input
									name="system"
									placeholder="시스템 (선택)"
									className={inputCls}
								/>
								<input name="note" placeholder="비고 (선택)" className={inputCls} />
								<button
									type="submit"
									className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
								>
									추가
								</button>
							</form>
						</details>
					</div>

					{/* 세션 준비 메모 */}
					<div>
						<div className="flex items-baseline justify-between border-b rule pb-3">
							<h3 className="display-en text-xl sm:text-3xl font-semibold">
								Notes
							</h3>
							<span className="kicker">세션 준비 · 비공개</span>
						</div>
						<AdminNotes />
						<details className="mt-6">
							<summary className="kicker text-accent cursor-pointer select-none">
								+ 메모 추가
							</summary>
							<form
								action={addNoteAction}
								className="mt-4 grid gap-3 max-w-md"
							>
								<input
									name="title"
									placeholder="제목 (선택)"
									className={inputCls}
								/>
								<textarea
									name="body"
									required
									rows={4}
									placeholder="메모 내용"
									className={`${inputCls} resize-y`}
								/>
								<button
									type="submit"
									className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
								>
									저장
								</button>
							</form>
						</details>
					</div>

					{/* 소품 — 한마디 · BGM (표지에 노출) */}
					<div>
						<div className="flex items-baseline justify-between border-b rule pb-3">
							<h3 className="display-en text-xl sm:text-3xl font-semibold">
								Widgets
							</h3>
							<span className="kicker">소품 · 표지</span>
						</div>

						<form
							action={setStatusAction}
							className="mt-4 grid gap-3 max-w-md"
						>
							<label className="kicker">한마디 (상태 한 줄)</label>
							<input
								name="status"
								defaultValue={meta?.status ?? ""}
								placeholder="지금 ○○ 굴리는 중 (비우면 숨김)"
								className={inputCls}
							/>
							<button
								type="submit"
								className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
							>
								한마디 저장
							</button>
						</form>

						<div className="mt-6 grid gap-3 max-w-md">
							<p className="kicker">
								BGM —{" "}
								{meta?.bgm_key ? (
									<span className="text-accent">
										등록됨{meta.bgm_title ? ` · ${meta.bgm_title}` : ""}
									</span>
								) : (
									<span className="text-muted">없음</span>
								)}
							</p>
							<form action={uploadBgmAction} className="grid gap-3">
								<input
									type="file"
									name="bgm"
									accept="audio/*"
									required
									className="text-sm file:mr-3 file:border file:rule file:rounded-md file:bg-paper-2 file:px-3 file:py-1.5 file:text-sm"
								/>
								<input
									name="bgm_title"
									placeholder="곡 제목 (선택)"
									className={inputCls}
								/>
								<button
									type="submit"
									className="border rule rounded-md px-4 py-2 text-sm hover:bg-ink hover:text-paper transition-colors"
								>
									BGM 업로드
								</button>
							</form>
							{meta?.bgm_key && (
								<form action={clearBgmAction}>
									<button
										type="submit"
										className="kicker text-accent hover:opacity-70 transition-opacity"
									>
										BGM 제거
									</button>
								</form>
							)}
							<p className="kicker text-muted">
								기본 OFF — 방문자가 표지에서 직접 켜요.
							</p>
						</div>

						<div className="mt-8 grid gap-3 max-w-md">
							<p className="kicker">
								표지 이미지 —{" "}
								{meta?.cover_key ? (
									<span className="text-accent">등록됨</span>
								) : (
									<span className="text-muted">없음</span>
								)}
							</p>
							{meta?.cover_key && (
								<div className="border rule rounded-md bg-paper-2 p-2 max-w-[200px]">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={`/media/${meta.cover_key}`}
										alt={meta.cover_alt ?? "표지"}
										className="block w-full aspect-[4/5] object-cover rounded"
									/>
								</div>
							)}
							<form action={uploadCoverAction} className="grid gap-3">
								<input
									type="file"
									name="cover"
									accept="image/*"
									required
									className="text-sm file:mr-3 file:border file:rule file:rounded-md file:bg-paper-2 file:px-3 file:py-1.5 file:text-sm"
								/>
								<input
									name="cover_alt"
									defaultValue={meta?.cover_alt ?? ""}
									placeholder="alt (스크린리더용 설명, 선택)"
									className={inputCls}
								/>
								<button
									type="submit"
									className="border rule rounded-md px-4 py-2 text-sm hover:bg-ink hover:text-paper transition-colors"
								>
									표지 이미지 업로드
								</button>
							</form>
							{meta?.cover_key && (
								<form action={clearCoverAction}>
									<button
										type="submit"
										className="kicker text-accent hover:opacity-70 transition-opacity"
									>
										표지 이미지 제거
									</button>
								</form>
							)}
							<p className="kicker text-muted">
								4:5 비율 권장. 최대 8MB.
							</p>
						</div>
					</div>

					{/* 스티커 라이브러리 — 꾸미기 모드에서 골라 붙임 */}
					<div>
						<div className="flex items-baseline justify-between border-b rule pb-3">
							<h3 className="text-xl sm:text-3xl font-semibold tracking-tight">
								스티커
							</h3>
							<span className="kicker">{stickers.length}개 · 라이브러리</span>
						</div>

						{stickers.length === 0 ? (
							<p className="mt-4 text-sm text-muted">
								아직 스티커가 없어요. PNG 올려두면 꾸미기 모드에서 골라서 붙여요.
							</p>
						) : (
							<ul className="mt-4 flex flex-wrap gap-3">
								{stickers.map((s) => (
									<li
										key={s.id}
										className="group relative border rule rounded-md bg-paper-2 p-3"
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={`/media/${s.r2_key}`}
											alt={s.label ?? "sticker"}
											className="block h-20 w-20 object-contain"
										/>
										{s.label && (
											<p className="mt-1 kicker text-muted text-center text-sm">
												{s.label}
											</p>
										)}
										<form action={deleteStickerAction} className="mt-1 text-center">
											<input type="hidden" name="id" value={s.id} />
											<button
												type="submit"
												className="kicker text-accent text-sm hover:opacity-70 transition-opacity"
											>
												삭제
											</button>
										</form>
									</li>
								))}
							</ul>
						)}

						<details className="mt-6">
							<summary className="kicker text-accent cursor-pointer select-none">
								+ 스티커 올리기
							</summary>
							<form
								action={uploadStickerAction}
								className="mt-4 grid gap-3 max-w-md"
							>
								<input
									type="file"
									name="file"
									accept="image/png,image/webp,image/gif"
									required
									className="text-sm file:mr-3 file:border file:rule file:rounded-md file:bg-paper-2 file:px-3 file:py-1.5 file:text-sm"
								/>
								<input
									name="label"
									placeholder="라벨 (선택)"
									className={inputCls}
								/>
								<button
									type="submit"
									className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
								>
									올리기
								</button>
								<p className="kicker text-muted">
									투명 배경 PNG가 가장 예쁨. 최대 4MB.
								</p>
							</form>
						</details>
					</div>
				</div>
			)}
		</section>
	);
}

async function RoomLinks() {
	const links = await listRoomLinks();
	if (links.length === 0)
		return <p className="mt-4 text-sm text-muted">아직 링크가 없어요.</p>;
	return (
		<ul className="mt-4">
			{links.map((l) => (
				<li
					key={l.id}
					className="flex items-baseline gap-3 border-b rule py-3 flex-wrap"
				>
					<a
						href={l.url}
						target="_blank"
						rel="noreferrer"
						className="font-medium hover:text-accent transition-colors"
					>
						{l.label}
					</a>
					{l.system && <span className="kicker text-accent">{l.system}</span>}
					{l.note && <span className="text-sm text-muted">— {l.note}</span>}
					<form action={deleteRoomLinkAction} className="ml-auto">
						<input type="hidden" name="id" value={l.id} />
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
	);
}

async function AdminNotes() {
	const notes = await listNotes();
	if (notes.length === 0)
		return <p className="mt-4 text-sm text-muted">아직 메모가 없어요.</p>;
	return (
		<ul className="mt-4 grid gap-4">
			{notes.map((n) => (
				<li key={n.id} className="border rule rounded-md p-4">
					<div className="flex items-baseline justify-between gap-3">
						<span className="font-medium">{n.title ?? "메모"}</span>
						<span className="kicker">{fmt.format(new Date(n.created_at))}</span>
					</div>
					<p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words">
						{n.body}
					</p>
					<form action={deleteNoteAction} className="mt-2">
						<input type="hidden" name="id" value={n.id} />
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
	);
}
