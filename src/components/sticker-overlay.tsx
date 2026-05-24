"use client";

// 스티커 오버레이 — readonly 모드는 그냥 절대좌표 렌더,
// editable(꾸미기 모드 + 오너) 일 때만 드래그·크기·회전·삭제·라이브러리 트레이 노출.
// 상위 컨테이너에 position: relative 가 필요.

import { useEffect, useRef, useState } from "react";
import type { PlacementCard, StickerLib } from "@/lib/stickers";
import {
	addPlacementAction,
	updatePlacementAction,
	removePlacementAction,
} from "@/app/admin/actions";

type Pos = { x_pct: number; y_pct: number; w_pct: number; rot: number };
type LocalPlacement = PlacementCard & Pos;

function clamp(v: number, min: number, max: number) {
	return Math.min(max, Math.max(min, v));
}

async function commit(
	id: number,
	patch: Partial<Pos & { z: number }>,
	back: string,
) {
	const fd = new FormData();
	fd.set("id", String(id));
	fd.set("back", back);
	for (const [k, v] of Object.entries(patch)) {
		if (v !== undefined) fd.set(k, String(v));
	}
	await updatePlacementAction(fd);
}

export function StickerOverlay({
	surface,
	placements,
	library,
	editable,
	back,
}: {
	surface: string;
	placements: PlacementCard[];
	library: StickerLib[];
	editable: boolean;
	back: string;
}) {
	// 서버 상태로 초기화. revalidate 후 새 props 가 오면 동기화.
	const [items, setItems] = useState<LocalPlacement[]>(() =>
		placements.map((p) => ({ ...p })),
	);
	const [focusId, setFocusId] = useState<number | null>(null);
	const overlayRef = useRef<HTMLDivElement>(null);

	// 서버가 revalidate 후 새 placements 를 내려주면 로컬도 동기화.
	// (드래그 중에는 이미 pointerup 에서 commit 끝났으므로 덮어써도 동일 결과.)
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setItems(placements.map((p) => ({ ...p })));
	}, [placements]);

	// ── readonly ─────────────────────────────────────────
	if (!editable) {
		if (placements.length === 0) return null;
		return (
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				{placements.map((p) => (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						key={p.id}
						src={`/media/${p.r2_key}`}
						alt=""
						draggable={false}
						style={{
							position: "absolute",
							left: `${p.x_pct}%`,
							top: `${p.y_pct}%`,
							width: `${p.w_pct}%`,
							transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
							zIndex: p.z,
							userSelect: "none",
						}}
					/>
				))}
			</div>
		);
	}

	// ── editable ────────────────────────────────────────

	function rectOf(): DOMRect | null {
		return overlayRef.current?.getBoundingClientRect() ?? null;
	}

	function startDrag(e: React.PointerEvent, id: number) {
		e.preventDefault();
		setFocusId(id);
		const rect = rectOf();
		if (!rect) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

		const item = items.find((i) => i.id === id);
		if (!item) return;
		const startX = e.clientX;
		const startY = e.clientY;
		const baseX = item.x_pct;
		const baseY = item.y_pct;

		function onMove(ev: PointerEvent) {
			const dx = ((ev.clientX - startX) / rect!.width) * 100;
			const dy = ((ev.clientY - startY) / rect!.height) * 100;
			setItems((prev) =>
				prev.map((p) =>
					p.id === id
						? {
								...p,
								x_pct: clamp(baseX + dx, 0, 100),
								y_pct: clamp(baseY + dy, 0, 100),
							}
						: p,
				),
			);
		}
		function onUp(ev: PointerEvent) {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			const dx = ((ev.clientX - startX) / rect!.width) * 100;
			const dy = ((ev.clientY - startY) / rect!.height) * 100;
			commit(
				id,
				{
					x_pct: clamp(baseX + dx, 0, 100),
					y_pct: clamp(baseY + dy, 0, 100),
				},
				back,
			);
		}
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
	}

	function update(id: number, patch: Partial<Pos & { z: number }>) {
		setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
		commit(id, patch, back);
	}

	async function add(stickerId: number) {
		const fd = new FormData();
		fd.set("stickerId", String(stickerId));
		fd.set("surface", surface);
		fd.set("back", back);
		// 중앙에 기본 크기로.
		fd.set("x_pct", "50");
		fd.set("y_pct", "50");
		fd.set("w_pct", "20");
		fd.set("rot", "0");
		fd.set("z", "0");
		await addPlacementAction(fd);
	}

	async function remove(id: number) {
		const fd = new FormData();
		fd.set("id", String(id));
		fd.set("back", back);
		setItems((prev) => prev.filter((p) => p.id !== id));
		setFocusId(null);
		await removePlacementAction(fd);
	}

	return (
		<>
			<div ref={overlayRef} className="absolute inset-0 overflow-hidden">
				{items.map((p) => {
					const focused = focusId === p.id;
					return (
						<div
							key={p.id}
							style={{
								position: "absolute",
								left: `${p.x_pct}%`,
								top: `${p.y_pct}%`,
								width: `${p.w_pct}%`,
								transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
								zIndex: focused ? 999 : p.z,
								touchAction: "none",
								cursor: "grab",
							}}
							onPointerDown={(e) => startDrag(e, p.id)}
							onClick={(e) => {
								e.stopPropagation();
								setFocusId(p.id);
							}}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={`/media/${p.r2_key}`}
								alt=""
								draggable={false}
								className="block w-full select-none"
								style={{
									outline: focused ? "2px dashed #9fbda3" : "none",
									outlineOffset: "4px",
								}}
							/>
						</div>
					);
				})}

				{/* 빈 공간 클릭 → 포커스 해제 */}
				<div
					className="absolute inset-0 -z-10"
					onClick={() => setFocusId(null)}
				/>
			</div>

			{/* 컨트롤 패널 (포커스된 스티커 있으면) */}
			{focusId !== null && (() => {
				const p = items.find((i) => i.id === focusId);
				if (!p) return null;
				return (
					<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] border rule rounded-lg bg-paper shadow-lg px-4 py-3 flex flex-wrap items-center gap-4">
						<span className="kicker text-accent">선택됨</span>
						<label className="flex items-center gap-2 text-xs">
							크기
							<input
								type="range"
								min={3}
								max={80}
								step={0.5}
								value={p.w_pct}
								onChange={(e) =>
									update(p.id, { w_pct: Number(e.target.value) })
								}
							/>
							<span className="kicker w-10 text-right text-sm">
								{Math.round(p.w_pct)}
							</span>
						</label>
						<label className="flex items-center gap-2 text-xs">
							회전
							<input
								type="range"
								min={-180}
								max={180}
								step={1}
								value={p.rot}
								onChange={(e) =>
									update(p.id, { rot: Number(e.target.value) })
								}
							/>
							<span className="kicker w-10 text-right text-sm">
								{Math.round(p.rot)}°
							</span>
						</label>
						<button
							type="button"
							onClick={() => remove(p.id)}
							className="kicker text-accent text-sm hover:opacity-70"
						>
							삭제
						</button>
					</div>
				);
			})()}

			{/* 라이브러리 트레이 */}
			<div className="fixed bottom-6 right-6 z-[1000] border rule rounded-lg bg-paper shadow-lg p-3 max-w-[320px]">
				<p className="kicker text-accent">스티커 라이브러리</p>
				{library.length === 0 ? (
					<p className="mt-2 text-xs text-muted">
						/admin 에서 PNG를 먼저 올려주세요.
					</p>
				) : (
					<ul className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
						{library.map((s) => (
							<li key={s.id}>
								<button
									type="button"
									onClick={() => add(s.id)}
									title={s.label ?? "스티커 붙이기"}
									className="border rule rounded-md bg-paper-2 p-1 hover:border-accent transition-colors"
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={`/media/${s.r2_key}`}
										alt={s.label ?? ""}
										className="block h-12 w-12 object-contain"
									/>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</>
	);
}
