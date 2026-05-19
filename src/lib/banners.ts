// 배너 데이터 레이어 — 내 배너(퍼가기) + 친구 배너·링크. D1 + R2(MEDIA). 서버 전용.

import { getDb, getMedia } from "./db";
import { type Result } from "./gallery";

export const MAX_BANNER_BYTES = 4 * 1024 * 1024; // 배너는 작게

export type MyBanner = {
	id: number;
	r2_key: string;
	label: string | null;
	width: number | null;
	height: number | null;
	sort: number;
	created_at: number;
};

export type FriendLink = {
	id: number;
	label: string;
	url: string;
	img_key: string | null;
	img_url: string | null;
	sort: number;
	created_at: number;
};

const EXT_BY_TYPE: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/avif": "avif",
};

function clean(v: string | undefined): string | null {
	const t = (v ?? "").trim();
	return t || null;
}

function toInt(v: string | undefined): number | null {
	const n = Number((v ?? "").trim());
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

async function putImage(prefix: string, file: File): Promise<string> {
	const ext = EXT_BY_TYPE[file.type] ?? "bin";
	const key = `banners/${prefix}/${crypto.randomUUID()}.${ext}`;
	await getMedia().put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type },
	});
	return key;
}

// ── 내 배너 ──────────────────────────────────────────────

export async function listMyBanners(): Promise<MyBanner[]> {
	const { results } = await getDb()
		.prepare(
			`SELECT id, r2_key, label, width, height, sort, created_at
			 FROM my_banners ORDER BY sort, created_at`,
		)
		.all<MyBanner>();
	return results ?? [];
}

export async function addMyBanner(input: {
	file: File;
	label?: string;
	width?: string;
	height?: string;
}): Promise<Result> {
	const { file } = input;
	if (!file || file.size === 0) return { ok: false, error: "파일이 비어 있어요." };
	if (!file.type.startsWith("image/"))
		return { ok: false, error: "이미지 파일만 올릴 수 있어요." };
	if (file.size > MAX_BANNER_BYTES)
		return { ok: false, error: "배너가 너무 커요 (최대 4MB)." };

	const key = await putImage("my", file);
	await getDb()
		.prepare(
			`INSERT INTO my_banners (r2_key, label, width, height, created_at)
			 VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(key, clean(input.label), toInt(input.width), toInt(input.height), Date.now())
		.run();
	return { ok: true };
}

export async function deleteMyBanner(id: number): Promise<void> {
	const db = getDb();
	const row = await db
		.prepare(`SELECT r2_key FROM my_banners WHERE id = ?`)
		.bind(id)
		.first<{ r2_key: string }>();
	if (row?.r2_key) await getMedia().delete(row.r2_key);
	await db.prepare(`DELETE FROM my_banners WHERE id = ?`).bind(id).run();
}

// ── 친구 배너·링크 ───────────────────────────────────────

export async function listFriendLinks(): Promise<FriendLink[]> {
	const { results } = await getDb()
		.prepare(
			`SELECT id, label, url, img_key, img_url, sort, created_at
			 FROM friend_links ORDER BY sort, created_at`,
		)
		.all<FriendLink>();
	return results ?? [];
}

export async function addFriendLink(input: {
	label: string;
	url: string;
	imgFile?: File | null;
	imgUrl?: string;
}): Promise<Result> {
	const label = (input.label ?? "").trim();
	const url = (input.url ?? "").trim();
	if (!label || !url) return { ok: false, error: "이름과 주소를 입력해 주세요." };
	if (!/^https?:\/\//i.test(url))
		return { ok: false, error: "주소는 http:// 또는 https:// 로 시작해야 해요." };

	let imgKey: string | null = null;
	let imgUrl: string | null = clean(input.imgUrl);
	if (imgUrl && !/^https?:\/\//i.test(imgUrl)) {
		return { ok: false, error: "외부 이미지 주소가 올바르지 않아요." };
	}

	if (input.imgFile && input.imgFile.size > 0) {
		if (!input.imgFile.type.startsWith("image/"))
			return { ok: false, error: "배너는 이미지 파일이어야 해요." };
		if (input.imgFile.size > MAX_BANNER_BYTES)
			return { ok: false, error: "배너가 너무 커요 (최대 4MB)." };
		imgKey = await putImage("friends", input.imgFile);
		imgUrl = null; // 업로드가 우선
	}

	await getDb()
		.prepare(
			`INSERT INTO friend_links (label, url, img_key, img_url, created_at)
			 VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(label, url, imgKey, imgUrl, Date.now())
		.run();
	return { ok: true };
}

export async function deleteFriendLink(id: number): Promise<void> {
	const db = getDb();
	const row = await db
		.prepare(`SELECT img_key FROM friend_links WHERE id = ?`)
		.bind(id)
		.first<{ img_key: string | null }>();
	if (row?.img_key) await getMedia().delete(row.img_key);
	await db.prepare(`DELETE FROM friend_links WHERE id = ?`).bind(id).run();
}

// 퍼가기 HTML 스니펫 — 절대 URL은 호출부(요청 host)에서 넘긴다.
export function embedSnippet(base: string, b: MyBanner): string {
	const wh = [
		b.width ? ` width="${b.width}"` : "",
		b.height ? ` height="${b.height}"` : "",
	].join("");
	const alt = (b.label ?? "PAL3BLUED0T").replace(/"/g, "&quot;");
	return `<a href="${base}/" target="_blank"><img src="${base}/media/${b.r2_key}" alt="${alt}"${wh}></a>`;
}
