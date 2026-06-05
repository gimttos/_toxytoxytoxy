"use client";

// 영감 카드 덱 — /inspire 의 인터랙티브 핵심. 오너 전용 페이지 안에서만 렌더된다.
//
// · 단어 모드: 서로 다른 결(tag)에서 한 장씩 뽑아 카드로 공개. 카드를 누르면 🔒 잠금,
//   "다시 뽑기" 는 잠그지 않은 카드만 재굴림(부분 리롤).
// · 번역: 카드의 ✎ 로 지금 뜬 단어에 한국어 번역을 단다. 번역이 있으면 한국어가 크게,
//   원래 영어가 작게 표시된다("보일 때마다 번역 추가" 흐름).
// · 비틀기 모드: 단어 대신 "한 마디" 한 장.
// · 저장: 지금 펼쳐진 조합 + 한 줄 메모를 아카이브에 박제(서버 액션).
//
// 뽑기/리롤은 전부 클라이언트에서 즉시 처리(서버 왕복 없음) — 풀은 서버에서 한 번 받아 둔다.

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { DrawnWord, Pool } from "@/lib/inspire";
import { saveNoteAction } from "@/app/inspire/actions";

type SaveState = { ok: boolean; error?: string; nonce: number };
type SaveAction = (prev: SaveState, fd: FormData) => Promise<SaveState>;

type Card = DrawnWord & { locked: boolean; nonce: number };

const TAG_LABEL: Record<string, string> = {
	place: "장소",
	emotion: "감정",
	object: "사물",
	nature: "자연",
	action: "행동",
	abstract: "추상",
	myth: "신화",
};

function rand<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function normKey(s: string): string {
	return s.trim().toLowerCase();
}

export function InspireDeck({
	pool,
	twists,
	notes: initialNotes,
	saveAction,
}: {
	pool: Pool;
	twists: string[];
	notes: Record<string, string>;
	saveAction: SaveAction;
}) {
	const liveTags = pool.tags.filter((t) => (pool.words[t]?.length ?? 0) > 0);
	const maxCount = Math.min(5, Math.max(2, liveTags.length || 2));

	const [mode, setMode] = useState<"words" | "twist">("words");
	const [count, setCount] = useState(Math.min(3, maxCount));
	const [cards, setCards] = useState<Card[]>([]);
	const [twist, setTwist] = useState<{ text: string; nonce: number } | null>(null);
	const [reduced, setReduced] = useState(false);

	// 단어 → 번역 맵(클라이언트 낙관 갱신). 서버 props 로 초기화.
	const [notes, setNotes] = useState<Record<string, string>>(initialNotes);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setReduced(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
	}, []);

	function pickWord(tag: string, avoid?: string): string {
		const list = pool.words[tag] ?? [];
		if (list.length === 0) return "—";
		if (list.length === 1) return list[0];
		let w = rand(list);
		for (let i = 0; i < 6 && w === avoid; i++) w = rand(list);
		return w;
	}

	// 잠그지 않은 슬롯만 다시 굴린다. 결은 가능한 한 서로 겹치지 않게.
	function drawWords(n: number) {
		setCards((prev) => {
			const next: Card[] = new Array(n);
			const used = new Set<string>();
			for (let i = 0; i < n; i++) {
				const p = prev[i];
				if (p?.locked && p.word) {
					next[i] = p;
					used.add(p.tag);
				}
			}
			for (let i = 0; i < n; i++) {
				if (next[i]) continue;
				const fresh = liveTags.filter((t) => !used.has(t));
				const tag = (fresh.length ? rand(fresh) : rand(liveTags)) ?? liveTags[0];
				used.add(tag);
				next[i] = {
					tag,
					word: pickWord(tag, prev[i]?.word),
					locked: false,
					nonce: (prev[i]?.nonce ?? 0) + 1,
				};
			}
			return next;
		});
	}

	function drawTwist() {
		if (twists.length === 0) {
			setTwist({ text: "— 한 마디가 없어요 —", nonce: (twist?.nonce ?? 0) + 1 });
			return;
		}
		let t = rand(twists);
		for (let i = 0; i < 6 && t === twist?.text; i++) t = rand(twists);
		setTwist({ text: t, nonce: (twist?.nonce ?? 0) + 1 });
	}

	// 첫 진입 시 한 번 자동으로 펼친다(클라이언트에서만 — 하이드레이션 안전).
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (liveTags.length) drawWords(Math.min(3, maxCount));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function toggleLock(i: number) {
		setCards((prev) =>
			prev.map((c, idx) => (idx === i ? { ...c, locked: !c.locked } : c)),
		);
	}

	function changeCount(n: number) {
		const c = Math.min(maxCount, Math.max(2, n));
		setCount(c);
		drawWords(c);
	}

	// ── 번역 달기 ──
	const [annotate, setAnnotate] = useState<{ word: string } | null>(null);
	const [annoVal, setAnnoVal] = useState("");
	const [annoErr, setAnnoErr] = useState<string | null>(null);
	const [saving, startSave] = useTransition();

	function openAnnotate(word: string) {
		setAnnoErr(null);
		setAnnoVal(notes[normKey(word)] ?? "");
		setAnnotate({ word });
	}

	function submitNote() {
		if (!annotate) return;
		const { word } = annotate;
		const value = annoVal;
		startSave(async () => {
			const res = await saveNoteAction(word, value);
			if (res.ok) {
				setNotes((prev) => {
					const next = { ...prev };
					if (res.note) next[res.key] = res.note;
					else delete next[res.key];
					return next;
				});
				setAnnotate(null);
			} else {
				setAnnoErr(res.error);
			}
		});
	}

	const allLocked = cards.length > 0 && cards.every((c) => c.locked);
	const currentWords: DrawnWord[] = cards.map((c) => ({ word: c.word, tag: c.tag }));

	return (
		<div>
			{/* 모드 전환 */}
			<div className="flex items-center gap-2">
				<ModeBtn active={mode === "words"} onClick={() => setMode("words")}>
					단어 카드
				</ModeBtn>
				<ModeBtn active={mode === "twist"} onClick={() => setMode("twist")}>
					비틀기 한마디
				</ModeBtn>
			</div>

			{mode === "words" ? (
				<>
					{/* 카드 줄 */}
					<div className="ins-deck mt-6">
						{cards.map((c, i) => {
							const tr = notes[normKey(c.word)];
							return (
								<div key={i} className={`ins-card ${c.locked ? "is-locked" : ""}`}>
									<button
										type="button"
										onClick={() => toggleLock(i)}
										title={c.locked ? "잠금 해제" : "이 카드 잠그기"}
										className="ins-card__hit"
									>
										<span
											key={c.nonce}
											className={`ins-card__face ${reduced ? "" : "ins-flip"}`}
											style={{ animationDelay: `${i * 90}ms` }}
										>
											<span className="ins-card__tag">
												{TAG_LABEL[c.tag] ?? c.tag}
											</span>
											<span className="ins-card__word">{tr || c.word}</span>
											{tr && <span className="ins-card__orig">{c.word}</span>}
											{c.locked && (
												<span className="ins-card__lock" aria-hidden>
													🔒
												</span>
											)}
										</span>
									</button>
									<button
										type="button"
										onClick={() => openAnnotate(c.word)}
										title="번역 달기"
										className="ins-card__note-btn"
									>
										{tr ? "✎" : "＋역"}
									</button>
								</div>
							);
						})}
					</div>

					{/* 번역 패널 */}
					{annotate && (
						<div className="mt-4 border rule rounded-md bg-paper-2 p-3 max-w-md">
							<p className="kicker">
								‘<span className="text-ink">{annotate.word}</span>’ 번역
							</p>
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<input
									autoFocus
									value={annoVal}
									onChange={(e) => setAnnoVal(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") submitNote();
										if (e.key === "Escape") setAnnotate(null);
									}}
									placeholder="한국어 번역 (비우면 삭제)"
									className="flex-1 min-w-[10rem] border rule rounded-md bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent"
								/>
								<button
									type="button"
									onClick={submitNote}
									disabled={saving}
									className="rounded-md bg-accent text-ink px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
								>
									{saving ? "저장 중…" : "저장"}
								</button>
								<button
									type="button"
									onClick={() => setAnnotate(null)}
									className="kicker text-muted hover:text-accent transition-colors"
								>
									취소
								</button>
							</div>
							{annoErr && <p className="kicker text-accent mt-1">{annoErr}</p>}
						</div>
					)}

					{/* 컨트롤 */}
					<div className="mt-6 flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={() => drawWords(count)}
							disabled={allLocked}
							className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40"
						>
							{cards.some((c) => c.locked) ? "나머지 다시 뽑기" : "다시 뽑기"} ↻
						</button>
						<div className="flex items-center gap-2">
							<span className="kicker">장수</span>
							<button
								type="button"
								onClick={() => changeCount(count - 1)}
								disabled={count <= 2}
								className="border rule rounded-md w-9 h-9 hover:bg-ink hover:text-paper transition-colors disabled:opacity-30"
							>
								−
							</button>
							<span className="w-5 text-center tabular-nums">{count}</span>
							<button
								type="button"
								onClick={() => changeCount(count + 1)}
								disabled={count >= maxCount}
								className="border rule rounded-md w-9 h-9 hover:bg-ink hover:text-paper transition-colors disabled:opacity-30"
							>
								+
							</button>
						</div>
						{allLocked && (
							<span className="kicker text-accent">
								전부 잠겨 있어요 — 카드를 눌러 풀면 다시 뽑혀요.
							</span>
						)}
					</div>
				</>
			) : (
				<>
					<div className="ins-deck mt-6">
						<div className="ins-card ins-card--wide" aria-live="polite">
							<span
								key={twist?.nonce ?? 0}
								className={`ins-card__face ${reduced ? "" : "ins-flip"}`}
							>
								<span className="ins-card__tag">twist</span>
								<span className="ins-card__twist">
									{twist?.text ?? "카드를 뒤집어 보세요"}
								</span>
							</span>
						</div>
					</div>
					<div className="mt-6">
						<button
							type="button"
							onClick={drawTwist}
							className="rounded-md bg-ink text-paper px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
						>
							{twist ? "다른 한 마디" : "뒤집기"} ↻
						</button>
					</div>
				</>
			)}

			<SavePanel
				saveAction={saveAction}
				words={mode === "words" ? currentWords : []}
				twist={mode === "twist" ? (twist?.text ?? "") : ""}
				ready={mode === "words" ? cards.length > 0 : !!twist}
			/>
		</div>
	);
}

function ModeBtn({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`text-sm border rule rounded-md px-3 py-1.5 transition-colors ${
				active ? "bg-ink text-paper" : "hover:bg-paper-2"
			}`}
		>
			{children}
		</button>
	);
}

function SavePanel({
	saveAction,
	words,
	twist,
	ready,
}: {
	saveAction: SaveAction;
	words: DrawnWord[];
	twist: string;
	ready: boolean;
}) {
	const [state, formAction, pending] = useActionState(saveAction, {
		ok: false,
		nonce: 0,
	});
	const memoRef = useRef<HTMLTextAreaElement>(null);

	// 저장 성공하면 메모 비우기.
	useEffect(() => {
		if (state.ok && memoRef.current) memoRef.current.value = "";
	}, [state.nonce, state.ok]);

	if (!ready) return null;

	return (
		<form action={formAction} className="mt-8 border-t rule pt-6 max-w-md">
			<p className="kicker">마음에 들면 — 저장</p>
			<input type="hidden" name="words" value={JSON.stringify(words)} />
			<input type="hidden" name="twist" value={twist} />
			<textarea
				ref={memoRef}
				name="memo"
				rows={2}
				placeholder="떠오른 영감 한 줄 (선택)"
				className="mt-3 w-full border rule rounded-md bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent resize-y"
			/>
			<div className="mt-3 flex items-center gap-3">
				<button
					type="submit"
					disabled={pending}
					className="rounded-md bg-accent text-ink px-5 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
				>
					{pending ? "저장 중…" : "이 조합 저장"}
				</button>
				{state.ok && <span className="kicker text-accent">저장됐어요 ✓</span>}
				{state.error && <span className="kicker text-accent">{state.error}</span>}
			</div>
		</form>
	);
}
