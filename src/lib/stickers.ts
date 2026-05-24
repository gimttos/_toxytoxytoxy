// 스티커 — 오너가 갠홈 곳곳에 PNG 붙여 꾸미는 기능. 서버 전용.
// 라이브러리(한 번 올린 PNG) + 배치(어느 표면 어디에) 분리.

import { getDb, getMedia } from "./db";
import type { Result } from "./gallery";

export type StickerLib = {
	id: number;
	r2_key: string;
	label: string | null;
	width: number | null;
	height: number | null;
	created_at: number;
};

export type Placement = {
	id: number;
	sticker_id: number;
	surface: string;
	x_pct: number;
	y_pct: number;
	w_pct: number;
	rot: number;
	z: number;
	created_at: number;
};

export type PlacementCard = Placement & {
	r2_key: string;
	label: string | null;
};

export const MAX_STICKER_BYTES = 4 * 1024 * 1024; // 4MB

const EXT_BY_TYPE: Record<string, string> = {
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/jpeg": "jpg",
	"image/avif": "avif",
};

function extFor(type: string, filename: string): string {
	if (EXT_BY_TYPE[type]) return EXT_BY_TYPE[type];
	const m = filename.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
	return m ? m[1] : "png";
}

// ── 라이브러리 ───────────────────────────────────────────

export async function listLibrary(): Promise<StickerLib[]> {
	const { results } = await getDb()
		.prepare(
			`SELECT id, r2_key, label, width, height, created_at
			 FROM sticker_library
			 ORDER BY created_at DESC`,
		)
		.all<StickerLib>();
	return results ?? [];
}

export async function uploadToLibrary(
	file: File,
	label?: string,
): Promise<Result> {
	if (!file || file.size === 0) return { ok: false, error: "파일이 비어 있어요." };
	if (!file.type.startsWith("image/"))
		return { ok: false, error: "이미지 파일만 올릴 수 있어요." };
	if (file.size > MAX_STICKER_BYTES)
		return { ok: false, error: "스티커가 너무 커요 (최대 4MB)." };

	const key = `stickers/${crypto.randomUUID()}.${extFor(file.type, file.name)}`;
	await getMedia().put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type },
	});

	await getDb()
		.prepare(
			`INSERT INTO sticker_library (r2_key, label, width, height, created_at)
			 VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(key, (label ?? "").trim() || null, null, null, Date.now())
		.run();
	return { ok: true };
}

export async function deleteFromLibrary(id: number): Promise<void> {
	const db = getDb();
	const row = await db
		.prepare(`SELECT r2_key FROM sticker_library WHERE id = ?`)
		.bind(id)
		.first<{ r2_key: string }>();
	if (!row) return;

	// FK ON DELETE CASCADE 가 sticker_placements 정리.
	await db.prepare(`DELETE FROM sticker_library WHERE id = ?`).bind(id).run();
	await getMedia().delete(row.r2_key);
}

// ── 배치 ────────────────────────────────────────────────

export async function listPlacements(surface: string): Promise<PlacementCard[]> {
	const { results } = await getDb()
		.prepare(
			`SELECT p.id, p.sticker_id, p.surface, p.x_pct, p.y_pct, p.w_pct, p.rot, p.z, p.created_at,
			        s.r2_key, s.label
			 FROM sticker_placements p
			 JOIN sticker_library s ON s.id = p.sticker_id
			 WHERE p.surface = ?
			 ORDER BY p.z, p.id`,
		)
		.bind(surface)
		.all<PlacementCard>();
	return results ?? [];
}

function clampPct(v: number, min = 0, max = 100): number {
	if (!Number.isFinite(v)) return (min + max) / 2;
	return Math.min(max, Math.max(min, v));
}

export async function addPlacement(input: {
	stickerId: number;
	surface: string;
	x_pct?: number;
	y_pct?: number;
	w_pct?: number;
	rot?: number;
	z?: number;
}): Promise<Result> {
	const { stickerId, surface } = input;
	const s = (surface ?? "").trim();
	if (!s) return { ok: false, error: "표면이 비었어요." };

	const exists = await getDb()
		.prepare(`SELECT 1 FROM sticker_library WHERE id = ?`)
		.bind(stickerId)
		.first();
	if (!exists) return { ok: false, error: "스티커를 찾을 수 없어요." };

	await getDb()
		.prepare(
			`INSERT INTO sticker_placements
			 (sticker_id, surface, x_pct, y_pct, w_pct, rot, z, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			stickerId,
			s,
			clampPct(input.x_pct ?? 40),
			clampPct(input.y_pct ?? 40),
			clampPct(input.w_pct ?? 18, 2, 100),
			Number.isFinite(input.rot) ? Number(input.rot) : 0,
			Number.isInteger(input.z) ? Number(input.z) : 0,
			Date.now(),
		)
		.run();
	return { ok: true };
}

export async function updatePlacement(
	id: number,
	patch: { x_pct?: number; y_pct?: number; w_pct?: number; rot?: number; z?: number },
): Promise<Result> {
	const sets: string[] = [];
	const vals: (number)[] = [];
	if (patch.x_pct !== undefined) {
		sets.push("x_pct = ?");
		vals.push(clampPct(patch.x_pct));
	}
	if (patch.y_pct !== undefined) {
		sets.push("y_pct = ?");
		vals.push(clampPct(patch.y_pct));
	}
	if (patch.w_pct !== undefined) {
		sets.push("w_pct = ?");
		vals.push(clampPct(patch.w_pct, 2, 100));
	}
	if (patch.rot !== undefined && Number.isFinite(patch.rot)) {
		sets.push("rot = ?");
		vals.push(Number(patch.rot));
	}
	if (patch.z !== undefined && Number.isInteger(patch.z)) {
		sets.push("z = ?");
		vals.push(Number(patch.z));
	}
	if (sets.length === 0) return { ok: true };

	vals.push(id);
	await getDb()
		.prepare(`UPDATE sticker_placements SET ${sets.join(", ")} WHERE id = ?`)
		.bind(...vals)
		.run();
	return { ok: true };
}

export async function removePlacement(id: number): Promise<void> {
	await getDb().prepare(`DELETE FROM sticker_placements WHERE id = ?`).bind(id).run();
}
