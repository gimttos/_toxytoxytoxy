// 갤러리 데이터 레이어 — 메타데이터 D1, 이미지 바이너리 R2(MEDIA). 서버 전용.

import { getDb, getMedia } from "./db";

export type AlbumKind = "photo" | "goods";

export type Album = {
	id: number;
	slug: string;
	title: string;
	description: string | null;
	kind: AlbumKind;
	cover_image_id: number | null;
	created_at: number;
};

export type AlbumCard = Album & {
	cover_key: string | null;
	image_count: number;
};

export type GalleryImage = {
	id: number;
	album_id: number;
	r2_key: string;
	caption: string | null;
	tags: string | null;
	content_type: string | null;
	bytes: number | null;
	sort: number;
	created_at: number;
};

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12MB
const ALBUM_KINDS: readonly AlbumKind[] = ["photo", "goods"];

const EXT_BY_TYPE: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/avif": "avif",
};

export function slugify(input: string): string {
	return input
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9가-힣]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

export function normalizeTags(raw: string | undefined | null): string | null {
	if (!raw) return null;
	const tags = raw
		.split(",")
		.map((t) => t.trim().toLowerCase())
		.filter(Boolean);
	return tags.length ? [...new Set(tags)].join(",") : null;
}

export async function listAlbums(): Promise<AlbumCard[]> {
	const db = getDb();
	const { results } = await db
		.prepare(
			`SELECT a.id, a.slug, a.title, a.description, a.kind, a.cover_image_id, a.created_at,
			        ci.r2_key AS cover_key,
			        (SELECT COUNT(*) FROM images i WHERE i.album_id = a.id) AS image_count
			 FROM albums a
			 LEFT JOIN images ci ON ci.id = a.cover_image_id
			 ORDER BY a.created_at DESC`,
		)
		.all<AlbumCard>();
	return results ?? [];
}

export async function getAlbumBySlug(slug: string): Promise<Album | null> {
	const row = await getDb()
		.prepare(
			`SELECT id, slug, title, description, kind, cover_image_id, created_at
			 FROM albums WHERE slug = ?`,
		)
		.bind(slug)
		.first<Album>();
	return row ?? null;
}

export async function listImages(
	albumId: number,
	tag?: string,
): Promise<GalleryImage[]> {
	const db = getDb();
	if (tag) {
		const { results } = await db
			.prepare(
				`SELECT * FROM images
				 WHERE album_id = ? AND (',' || COALESCE(tags,'') || ',') LIKE ?
				 ORDER BY sort, created_at`,
			)
			.bind(albumId, `%,${tag.toLowerCase()},%`)
			.all<GalleryImage>();
		return results ?? [];
	}
	const { results } = await db
		.prepare(`SELECT * FROM images WHERE album_id = ? ORDER BY sort, created_at`)
		.bind(albumId)
		.all<GalleryImage>();
	return results ?? [];
}

export type Result = { ok: true } | { ok: false; error: string };

export async function createAlbum(input: {
	title: string;
	slug?: string;
	description?: string;
	kind?: string;
}): Promise<Result> {
	const title = (input.title ?? "").trim();
	if (!title) return { ok: false, error: "앨범 제목을 입력해 주세요." };
	const slug = slugify(input.slug || title);
	if (!slug) return { ok: false, error: "슬러그를 만들 수 없어요. 영문/숫자를 포함해 주세요." };
	const kind: AlbumKind = ALBUM_KINDS.includes(input.kind as AlbumKind)
		? (input.kind as AlbumKind)
		: "photo";

	try {
		await getDb()
			.prepare(
				`INSERT INTO albums (slug, title, description, kind, created_at)
				 VALUES (?, ?, ?, ?, ?)`,
			)
			.bind(slug, title, (input.description ?? "").trim() || null, kind, Date.now())
			.run();
		return { ok: true };
	} catch {
		return { ok: false, error: `슬러그 "${slug}" 가 이미 있어요.` };
	}
}

function extFor(type: string, filename: string): string {
	if (EXT_BY_TYPE[type]) return EXT_BY_TYPE[type];
	const m = filename.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
	return m ? m[1] : "bin";
}

export async function addImage(input: {
	albumId: number;
	file: File;
	caption?: string;
	tags?: string;
}): Promise<Result> {
	const { albumId, file } = input;
	if (!file || file.size === 0) return { ok: false, error: "파일이 비어 있어요." };
	if (!file.type.startsWith("image/"))
		return { ok: false, error: "이미지 파일만 올릴 수 있어요." };
	if (file.size > MAX_IMAGE_BYTES)
		return { ok: false, error: "이미지가 너무 커요 (최대 12MB)." };

	const db = getDb();
	const album = await db
		.prepare(`SELECT id, cover_image_id FROM albums WHERE id = ?`)
		.bind(albumId)
		.first<{ id: number; cover_image_id: number | null }>();
	if (!album) return { ok: false, error: "앨범을 찾을 수 없어요." };

	const key = `gallery/${albumId}/${crypto.randomUUID()}.${extFor(file.type, file.name)}`;
	await getMedia().put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type },
	});

	const res = await db
		.prepare(
			`INSERT INTO images (album_id, r2_key, caption, tags, content_type, bytes, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			albumId,
			key,
			(input.caption ?? "").trim() || null,
			normalizeTags(input.tags),
			file.type,
			file.size,
			Date.now(),
		)
		.run();

	// 앨범 대표 이미지가 없으면 이걸로 지정.
	if (album.cover_image_id == null && res.meta?.last_row_id) {
		await db
			.prepare(`UPDATE albums SET cover_image_id = ? WHERE id = ?`)
			.bind(res.meta.last_row_id, albumId)
			.run();
	}
	return { ok: true };
}

export async function deleteImage(id: number): Promise<void> {
	const db = getDb();
	const img = await db
		.prepare(`SELECT id, album_id, r2_key FROM images WHERE id = ?`)
		.bind(id)
		.first<{ id: number; album_id: number; r2_key: string }>();
	if (!img) return;

	await getMedia().delete(img.r2_key);
	await db.prepare(`DELETE FROM images WHERE id = ?`).bind(id).run();

	// 대표 이미지였다면 같은 앨범의 다른 이미지로 교체(없으면 NULL).
	const next = await db
		.prepare(
			`SELECT id FROM images WHERE album_id = ? ORDER BY sort, created_at LIMIT 1`,
		)
		.bind(img.album_id)
		.first<{ id: number }>();
	await db
		.prepare(
			`UPDATE albums SET cover_image_id = ?
			 WHERE id = ? AND (cover_image_id = ? OR cover_image_id IS NULL)`,
		)
		.bind(next?.id ?? null, img.album_id, id)
		.run();
}

export async function deleteAlbum(id: number): Promise<void> {
	const db = getDb();
	const { results } = await db
		.prepare(`SELECT r2_key FROM images WHERE album_id = ?`)
		.bind(id)
		.all<{ r2_key: string }>();
	const media = getMedia();
	for (const r of results ?? []) await media.delete(r.r2_key);
	await db.prepare(`DELETE FROM images WHERE album_id = ?`).bind(id).run();
	await db.prepare(`DELETE FROM albums WHERE id = ?`).bind(id).run();
}
