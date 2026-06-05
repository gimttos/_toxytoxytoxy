// 영감 카드(/inspire) 데이터 레이어 — 서버 전용. 오너 전용 기능.
//
// 기본 풀: src/data/inspire-seed.json (git 에 수집해 둔 시드, 항상 동작).
// D1 은 큐레이션 레이어:
//   inspire_words(추가 단어) / inspire_twists(추가 한마디)
//   inspire_hidden(솎은 것) / inspire_saved(저장한 조합)
// 실효 풀 = (시드 ∪ 추가) − 솎음.
//
// D1 마이그레이션(0010)이 아직 안 올라간 환경에서도 생성기 자체는 시드만으로
// 돌아야 하므로, 모든 D1 읽기는 실패 시 빈 값으로 떨어진다(safe()).

import seed from "@/data/inspire-seed.json";
import { getDb } from "./db";
import { type Result } from "./gallery";

export type Tag = string;
export type DrawnWord = { word: string; tag: Tag };
export type Pool = { tags: Tag[]; words: Record<Tag, string[]> };

export type SavedCombo = {
	id: number;
	words: DrawnWord[];
	twist: string | null;
	memo: string | null;
	created_at: number;
};

export const TAGS: Tag[] = seed.tags as Tag[];

// UI 라벨(한국어) — 카드 결 표시·솎기 메뉴에서 쓴다.
export const TAG_LABEL: Record<string, string> = {
	place: "장소",
	emotion: "감정",
	object: "사물",
	nature: "자연",
	action: "행동",
	abstract: "추상",
	myth: "신화",
};

const SEED_WORDS = seed.words as Record<string, string[]>;
const SEED_TWISTS = seed.twists as string[];

function normKey(s: string): string {
	return s.trim().toLowerCase();
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
	try {
		return await fn();
	} catch {
		// 테이블 미존재(마이그레이션 전) 등 — 시드만으로 동작하도록 조용히 폴백.
		return fallback;
	}
}

// 스키마 자동 생성 — wrangler 마이그레이션(0010/0011)을 안 돌려도 쓰기가 동작하도록,
// 첫 쓰기 전에 테이블을 보장한다. CREATE TABLE IF NOT EXISTS 라 마이그레이션과 충돌 없음.
let schemaReady = false;
async function ensureSchema(): Promise<void> {
	if (schemaReady) return;
	const db = getDb();
	await db.batch([
		db.prepare(
			`CREATE TABLE IF NOT EXISTS inspire_words (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				word TEXT NOT NULL, tag TEXT NOT NULL,
				created_at INTEGER NOT NULL, UNIQUE (tag, word))`,
		),
		db.prepare(
			`CREATE TABLE IF NOT EXISTS inspire_twists (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				text TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL)`,
		),
		db.prepare(
			`CREATE TABLE IF NOT EXISTS inspire_hidden (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				kind TEXT NOT NULL, key TEXT NOT NULL,
				created_at INTEGER NOT NULL, UNIQUE (kind, key))`,
		),
		db.prepare(
			`CREATE TABLE IF NOT EXISTS inspire_saved (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				words_json TEXT NOT NULL, twist TEXT, memo TEXT,
				created_at INTEGER NOT NULL)`,
		),
		db.prepare(
			`CREATE TABLE IF NOT EXISTS inspire_notes (
				key TEXT PRIMARY KEY, note TEXT NOT NULL,
				created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
		),
	]);
	schemaReady = true;
}

// ── 실효 단어 풀 ───────────────────────────────────────────────

export async function getPool(): Promise<Pool> {
	const extras = await safe(
		async () =>
			(
				await getDb()
					.prepare(`SELECT word, tag FROM inspire_words`)
					.all<{ word: string; tag: string }>()
			).results ?? [],
		[] as { word: string; tag: string }[],
	);
	const hidden = await safe(
		async () =>
			new Set(
				(
					(
						await getDb()
							.prepare(`SELECT key FROM inspire_hidden WHERE kind = 'word'`)
							.all<{ key: string }>()
					).results ?? []
				).map((r) => r.key),
			),
		new Set<string>(),
	);

	const words: Record<Tag, string[]> = {};
	for (const tag of TAGS) {
		const set = new Set<string>();
		for (const w of SEED_WORDS[tag] ?? []) {
			if (!hidden.has(normKey(w))) set.add(w);
		}
		words[tag] = [...set];
	}
	for (const e of extras) {
		if (!TAGS.includes(e.tag)) (words[e.tag] ??= []);
		if (hidden.has(normKey(e.word))) continue;
		(words[e.tag] ??= []);
		if (!words[e.tag].includes(e.word)) words[e.tag].push(e.word);
	}
	for (const tag of Object.keys(words)) {
		words[tag].sort((a, b) => a.localeCompare(b));
	}
	const tags = [...new Set([...TAGS, ...Object.keys(words)])].filter(
		(t) => (words[t]?.length ?? 0) > 0,
	);
	return { tags, words };
}

export async function getTwists(): Promise<string[]> {
	const extras = await safe(
		async () =>
			(
				(
					await getDb()
						.prepare(`SELECT text FROM inspire_twists`)
						.all<{ text: string }>()
				).results ?? []
			).map((r) => r.text),
		[] as string[],
	);
	const hidden = await safe(
		async () =>
			new Set(
				(
					(
						await getDb()
							.prepare(`SELECT key FROM inspire_hidden WHERE kind = 'twist'`)
							.all<{ key: string }>()
					).results ?? []
				).map((r) => r.key),
			),
		new Set<string>(),
	);
	const out = new Set<string>();
	for (const t of [...SEED_TWISTS, ...extras]) {
		if (!hidden.has(normKey(t))) out.add(t);
	}
	return [...out];
}

// ── 저장한 조합 ───────────────────────────────────────────────

export async function listSaved(): Promise<SavedCombo[]> {
	const rows = await safe(
		async () =>
			(
				await getDb()
					.prepare(
						`SELECT id, words_json, twist, memo, created_at
						 FROM inspire_saved ORDER BY created_at DESC`,
					)
					.all<{
						id: number;
						words_json: string;
						twist: string | null;
						memo: string | null;
						created_at: number;
					}>()
			).results ?? [],
		[] as {
			id: number;
			words_json: string;
			twist: string | null;
			memo: string | null;
			created_at: number;
		}[],
	);
	return rows.map((r) => {
		let words: DrawnWord[] = [];
		try {
			const parsed = JSON.parse(r.words_json);
			if (Array.isArray(parsed)) words = parsed;
		} catch {
			/* 깨진 행은 단어 없이 표시 */
		}
		return { id: r.id, words, twist: r.twist, memo: r.memo, created_at: r.created_at };
	});
}

export async function saveCombo(input: {
	words: DrawnWord[];
	twist?: string | null;
	memo?: string | null;
}): Promise<Result> {
	const words = (input.words ?? []).filter(
		(w) => w && typeof w.word === "string" && w.word.trim(),
	);
	const twist = (input.twist ?? "").trim();
	if (words.length === 0 && !twist)
		return { ok: false, error: "저장할 조합이 없어요." };
	const memo = (input.memo ?? "").trim();
	await ensureSchema();
	await getDb()
		.prepare(
			`INSERT INTO inspire_saved (words_json, twist, memo, created_at)
			 VALUES (?, ?, ?, ?)`,
		)
		.bind(JSON.stringify(words), twist || null, memo || null, Date.now())
		.run();
	return { ok: true };
}

export async function deleteSaved(id: number): Promise<void> {
	await ensureSchema();
	await getDb().prepare(`DELETE FROM inspire_saved WHERE id = ?`).bind(id).run();
}

// ── 단어 번역/메모 ────────────────────────────────────────────
// key(정규화 단어) → 번역. 시드/추가 단어 공통으로 묶인다.

export async function getNotes(): Promise<Record<string, string>> {
	const rows = await safe(
		async () =>
			(
				await getDb()
					.prepare(`SELECT key, note FROM inspire_notes`)
					.all<{ key: string; note: string }>()
			).results ?? [],
		[] as { key: string; note: string }[],
	);
	const out: Record<string, string> = {};
	for (const r of rows) out[r.key] = r.note;
	return out;
}

// 번역 저장(빈 값이면 삭제). 반환: 정규화 키 + 정리된 번역('' = 삭제됨).
export async function setNote(
	word: string,
	note: string,
): Promise<{ ok: true; key: string; note: string } | { ok: false; error: string }> {
	const key = normKey(word);
	if (!key) return { ok: false, error: "단어가 비어 있어요." };
	const text = (note ?? "").trim();
	if (text.length > 80) return { ok: false, error: "번역이 너무 길어요." };
	await ensureSchema();
	const db = getDb();
	if (!text) {
		await db.prepare(`DELETE FROM inspire_notes WHERE key = ?`).bind(key).run();
		return { ok: true, key, note: "" };
	}
	const now = Date.now();
	await db
		.prepare(
			`INSERT INTO inspire_notes (key, note, created_at, updated_at)
			 VALUES (?, ?, ?, ?)
			 ON CONFLICT (key) DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at`,
		)
		.bind(key, text, now, now)
		.run();
	return { ok: true, key, note: text };
}

// ── 풀 큐레이션 (추가 / 솎기) ─────────────────────────────────

export async function addWord(input: { word: string; tag: string }): Promise<Result> {
	const word = (input.word ?? "").trim().replace(/\s+/g, " ");
	const tag = (input.tag ?? "").trim();
	if (!word) return { ok: false, error: "단어를 입력해 주세요." };
	if (!TAGS.includes(tag)) return { ok: false, error: "결(태그)을 골라 주세요." };
	if (word.length > 24) return { ok: false, error: "단어가 너무 길어요." };
	await ensureSchema();
	const db = getDb();
	// 솎음 목록에 있었다면 되살린다.
	await db
		.prepare(`DELETE FROM inspire_hidden WHERE kind = 'word' AND key = ?`)
		.bind(normKey(word))
		.run();
	await db
		.prepare(
			`INSERT INTO inspire_words (word, tag, created_at) VALUES (?, ?, ?)
			 ON CONFLICT (tag, word) DO NOTHING`,
		)
		.bind(word, tag, Date.now())
		.run();
	return { ok: true };
}

// 단어를 풀에서 뺀다 — 추가 단어면 삭제, 시드 단어면 솎음 처리.
export async function removeWord(word: string): Promise<void> {
	const key = normKey(word);
	await ensureSchema();
	const db = getDb();
	await db.prepare(`DELETE FROM inspire_words WHERE LOWER(word) = ?`).bind(key).run();
	await db
		.prepare(
			`INSERT INTO inspire_hidden (kind, key, created_at) VALUES ('word', ?, ?)
			 ON CONFLICT (kind, key) DO NOTHING`,
		)
		.bind(key, Date.now())
		.run();
}

export async function addTwist(text: string): Promise<Result> {
	const t = (text ?? "").trim().replace(/\s+/g, " ");
	if (!t) return { ok: false, error: "한 마디를 입력해 주세요." };
	if (t.length > 140) return { ok: false, error: "한 마디가 너무 길어요." };
	await ensureSchema();
	const db = getDb();
	await db
		.prepare(`DELETE FROM inspire_hidden WHERE kind = 'twist' AND key = ?`)
		.bind(normKey(t))
		.run();
	await db
		.prepare(
			`INSERT INTO inspire_twists (text, created_at) VALUES (?, ?)
			 ON CONFLICT (text) DO NOTHING`,
		)
		.bind(t, Date.now())
		.run();
	return { ok: true };
}

export async function removeTwist(text: string): Promise<void> {
	const key = normKey(text);
	await ensureSchema();
	const db = getDb();
	await db.prepare(`DELETE FROM inspire_twists WHERE LOWER(text) = ?`).bind(key).run();
	await db
		.prepare(
			`INSERT INTO inspire_hidden (kind, key, created_at) VALUES ('twist', ?, ?)
			 ON CONFLICT (kind, key) DO NOTHING`,
		)
		.bind(key, Date.now())
		.run();
}

// 풀 통계 — 어드민 화면 표시용.
export async function poolStats(): Promise<{ total: number; perTag: Record<string, number> }> {
	const pool = await getPool();
	const perTag: Record<string, number> = {};
	let total = 0;
	for (const tag of pool.tags) {
		perTag[tag] = pool.words[tag]?.length ?? 0;
		total += perTag[tag];
	}
	return { total, perTag };
}
