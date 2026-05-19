// 소품 메타 — 방문자 수(hits) · 한마디(status) · BGM(bgm_key/bgm_title).
// 단순 key/value(site_meta). 서버 전용.

import { getDb, getMedia } from "./db";

const EXT_BY_TYPE: Record<string, string> = {
	"audio/mpeg": "mp3",
	"audio/mp3": "mp3",
	"audio/ogg": "ogg",
	"audio/wav": "wav",
	"audio/x-m4a": "m4a",
	"audio/mp4": "m4a",
};

export const MAX_BGM_BYTES = 12 * 1024 * 1024; // 12MB

export type SiteMeta = {
	status: string | null;
	bgm_key: string | null;
	bgm_title: string | null;
};

export async function getMeta(key: string): Promise<string | null> {
	const row = await getDb()
		.prepare(`SELECT value FROM site_meta WHERE key = ?`)
		.bind(key)
		.first<{ value: string | null }>();
	return row?.value ?? null;
}

export async function getSiteMeta(): Promise<SiteMeta> {
	const { results } = await getDb()
		.prepare(
			`SELECT key, value FROM site_meta
			 WHERE key IN ('status','bgm_key','bgm_title')`,
		)
		.all<{ key: string; value: string | null }>();
	const m = new Map((results ?? []).map((r) => [r.key, r.value]));
	return {
		status: m.get("status") ?? null,
		bgm_key: m.get("bgm_key") ?? null,
		bgm_title: m.get("bgm_title") ?? null,
	};
}

export async function setMeta(key: string, value: string | null): Promise<void> {
	await getDb()
		.prepare(
			`INSERT INTO site_meta (key, value, updated_at) VALUES (?, ?, ?)
			 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
		)
		.bind(key, value, Date.now())
		.run();
}

// 방문자 수 +1 (원자적 UPSERT) 후 새 값 반환.
export async function bumpHits(): Promise<number> {
	const db = getDb();
	const now = Date.now();
	await db
		.prepare(
			`INSERT INTO site_meta (key, value, updated_at) VALUES ('hits', '1', ?1)
			 ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1, updated_at = ?1`,
		)
		.bind(now)
		.run();
	const row = await db
		.prepare(`SELECT value FROM site_meta WHERE key = 'hits'`)
		.first<{ value: string }>();
	return Number(row?.value ?? "0") || 0;
}

export async function setBgm(file: File, title: string): Promise<void> {
	const ext = EXT_BY_TYPE[file.type] ?? "mp3";
	const key = `bgm/${crypto.randomUUID()}.${ext}`;
	await getMedia().put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type || "audio/mpeg" },
	});
	const prev = await getMeta("bgm_key");
	await setMeta("bgm_key", key);
	await setMeta("bgm_title", title.trim() || "BGM");
	if (prev) await getMedia().delete(prev);
}

export async function clearBgm(): Promise<void> {
	const prev = await getMeta("bgm_key");
	if (prev) await getMedia().delete(prev);
	await setMeta("bgm_key", null);
	await setMeta("bgm_title", null);
}
