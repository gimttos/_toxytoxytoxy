"use client";

// 스티커 라이브러리 트레이 — 한 페이지에 1개만 (StickerRoot 가 마운트).
// "지금 활성된 표면" 에 클릭한 PNG 를 가운데에 새로 배치.

import { useStickerSurface } from "./sticker-surface-context";
import { addPlacementAction } from "@/app/admin/actions";

export function StickerTray() {
	const ctx = useStickerSurface();
	if (!ctx) return null;
	const { activeSurface, library, back } = ctx;

	async function add(stickerId: number) {
		if (!activeSurface) return;
		const fd = new FormData();
		fd.set("stickerId", String(stickerId));
		fd.set("surface", activeSurface);
		fd.set("back", back);
		fd.set("x_pct", "50");
		fd.set("y_pct", "50");
		fd.set("w_pct", "20");
		fd.set("rot", "0");
		fd.set("z", "0");
		await addPlacementAction(fd);
	}

	return (
		<div className="fixed bottom-6 right-6 z-[1000] border rule rounded-lg bg-paper shadow-lg p-3 max-w-[320px]">
			<div className="flex items-baseline justify-between gap-3">
				<p className="kicker text-accent">스티커 라이브러리</p>
				<p className="kicker text-muted text-xs truncate max-w-[160px]" title={activeSurface ?? ""}>
					{activeSurface ? `→ ${activeSurface}` : "표면 선택"}
				</p>
			</div>
			{library.length === 0 ? (
				<p className="mt-2 text-xs text-muted">
					/admin 에서 PNG를 먼저 올려주세요.
				</p>
			) : !activeSurface ? (
				<p className="mt-2 text-xs text-muted">
					아래 페이지의 영역을 클릭해 표면을 먼저 골라주세요.
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
	);
}
