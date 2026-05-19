// 캐릭터 데이터 레이어 — 메타데이터 D1, 일러스트 R2(MEDIA). 서버 전용.
// 공통 유틸(slugify/normalizeTags/Result)은 gallery 레이어에서 재사용.

import { getDb, getMedia } from "./db";
import { slugify, normalizeTags, type Result } from "./gallery";

export const MAX_PORTRAIT_BYTES = 12 * 1024 * 1024;

export type Character = {
	id: number;
	slug: string;
	name: string;
	name_en: string | null;
	tagline: string | null;
	profile: string | null;
	system: string | null;
	stats: string | null;
	before_after: string | null;
	portrait_key: string | null;
	tags: string | null;
	sort: number;
	created_at: number;
};

export type CharacterCard = Pick<
	Character,
	"id" | "slug" | "name" | "tagline" | "portrait_key" | "tags"
>;

export type Relation = {
	id: number;
	label: string;
	note: string | null;
	b_id: number;
	b_slug: string;
	b_name: string;
};

export async function listCharacters(): Promise<CharacterCard[]> {
	const { results } = await getDb()
		.prepare(
			`SELECT id, slug, name, tagline, portrait_key, tags
			 FROM characters ORDER BY sort, created_at DESC`,
		)
		.all<CharacterCard>();
	return results ?? [];
}

export async function getCharacterBySlug(
	slug: string,
): Promise<Character | null> {
	const row = await getDb()
		.prepare(`SELECT * FROM characters WHERE slug = ?`)
		.bind(slug)
		.first<Character>();
	return row ?? null;
}

export async function listRelations(charId: number): Promise<Relation[]> {
	const { results } = await getDb()
		.prepare(
			`SELECT r.id, r.label, r.note, r.b_id, c.slug AS b_slug, c.name AS b_name
			 FROM character_relations r
			 JOIN characters c ON c.id = r.b_id
			 WHERE r.a_id = ?
			 ORDER BY r.created_at`,
		)
		.bind(charId)
		.all<Relation>();
	return results ?? [];
}

export type CharacterInput = {
	name: string;
	slug?: string;
	name_en?: string;
	tagline?: string;
	profile?: string;
	system?: string;
	stats?: string;
	before_after?: string;
	tags?: string;
};

function clean(v: string | undefined): string | null {
	const t = (v ?? "").trim();
	return t || null;
}

export async function createCharacter(input: CharacterInput): Promise<Result> {
	const name = (input.name ?? "").trim();
	if (!name) return { ok: false, error: "이름을 입력해 주세요." };
	const slug = slugify(input.slug || name);
	if (!slug)
		return { ok: false, error: "슬러그를 만들 수 없어요. 영문/숫자를 포함해 주세요." };
	try {
		await getDb()
			.prepare(
				`INSERT INTO characters
				 (slug, name, name_en, tagline, profile, system, stats, before_after, tags, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				slug,
				name,
				clean(input.name_en),
				clean(input.tagline),
				clean(input.profile),
				clean(input.system),
				clean(input.stats),
				clean(input.before_after),
				normalizeTags(input.tags),
				Date.now(),
			)
			.run();
		return { ok: true };
	} catch {
		return { ok: false, error: `슬러그 "${slug}" 가 이미 있어요.` };
	}
}

// slug 는 링크 안정성을 위해 수정하지 않는다.
export async function updateCharacter(
	id: number,
	input: CharacterInput,
): Promise<Result> {
	const name = (input.name ?? "").trim();
	if (!name) return { ok: false, error: "이름을 입력해 주세요." };
	await getDb()
		.prepare(
			`UPDATE characters SET
			   name = ?, name_en = ?, tagline = ?, profile = ?,
			   system = ?, stats = ?, before_after = ?, tags = ?
			 WHERE id = ?`,
		)
		.bind(
			name,
			clean(input.name_en),
			clean(input.tagline),
			clean(input.profile),
			clean(input.system),
			clean(input.stats),
			clean(input.before_after),
			normalizeTags(input.tags),
			id,
		)
		.run();
	return { ok: true };
}

const EXT_BY_TYPE: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/avif": "avif",
};

export async function setPortrait(id: number, file: File): Promise<Result> {
	if (!file || file.size === 0) return { ok: false, error: "파일이 비어 있어요." };
	if (!file.type.startsWith("image/"))
		return { ok: false, error: "이미지 파일만 올릴 수 있어요." };
	if (file.size > MAX_PORTRAIT_BYTES)
		return { ok: false, error: "이미지가 너무 커요 (최대 12MB)." };

	const db = getDb();
	const row = await db
		.prepare(`SELECT id, portrait_key FROM characters WHERE id = ?`)
		.bind(id)
		.first<{ id: number; portrait_key: string | null }>();
	if (!row) return { ok: false, error: "캐릭터를 찾을 수 없어요." };

	const ext = EXT_BY_TYPE[file.type] ?? "bin";
	const key = `characters/${id}/${crypto.randomUUID()}.${ext}`;
	await getMedia().put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type },
	});
	await db
		.prepare(`UPDATE characters SET portrait_key = ? WHERE id = ?`)
		.bind(key, id)
		.run();
	if (row.portrait_key) await getMedia().delete(row.portrait_key);
	return { ok: true };
}

export async function deleteCharacter(id: number): Promise<void> {
	const db = getDb();
	const row = await db
		.prepare(`SELECT portrait_key FROM characters WHERE id = ?`)
		.bind(id)
		.first<{ portrait_key: string | null }>();
	if (row?.portrait_key) await getMedia().delete(row.portrait_key);
	await db
		.prepare(`DELETE FROM character_relations WHERE a_id = ? OR b_id = ?`)
		.bind(id, id)
		.run();
	await db.prepare(`DELETE FROM characters WHERE id = ?`).bind(id).run();
}

export async function addRelation(input: {
	aId: number;
	bId: number;
	label: string;
	note?: string;
}): Promise<Result> {
	const label = (input.label ?? "").trim();
	if (!label) return { ok: false, error: "관계 라벨을 입력해 주세요." };
	if (!Number.isFinite(input.bId) || input.aId === input.bId)
		return { ok: false, error: "상대 캐릭터를 올바르게 골라 주세요." };
	await getDb()
		.prepare(
			`INSERT INTO character_relations (a_id, b_id, label, note, created_at)
			 VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(input.aId, input.bId, label, clean(input.note), Date.now())
		.run();
	return { ok: true };
}

export async function deleteRelation(id: number): Promise<void> {
	await getDb()
		.prepare(`DELETE FROM character_relations WHERE id = ?`)
		.bind(id)
		.run();
}
