// 로그 데이터 레이어 — 갱신기록(update) + 잡담·일기(diary). D1. 서버 전용.

import { getDb } from "./db";
import { normalizeTags, type Result } from "./gallery";

export type PostKind = "update" | "diary";

export type Post = {
	id: number;
	kind: PostKind;
	title: string | null;
	body: string;
	tags: string | null;
	created_at: number;
};

function clean(v: string | undefined): string | null {
	const t = (v ?? "").trim();
	return t || null;
}

export async function listPosts(kind?: PostKind): Promise<Post[]> {
	const db = getDb();
	if (kind) {
		const { results } = await db
			.prepare(
				`SELECT * FROM posts WHERE kind = ? ORDER BY created_at DESC LIMIT 200`,
			)
			.bind(kind)
			.all<Post>();
		return results ?? [];
	}
	const { results } = await db
		.prepare(`SELECT * FROM posts ORDER BY created_at DESC LIMIT 200`)
		.all<Post>();
	return results ?? [];
}

export async function latestUpdate(): Promise<Post | null> {
	const row = await getDb()
		.prepare(
			`SELECT * FROM posts WHERE kind = 'update' ORDER BY created_at DESC LIMIT 1`,
		)
		.first<Post>();
	return row ?? null;
}

export async function createPost(input: {
	kind?: string;
	title?: string;
	body: string;
	tags?: string;
}): Promise<Result> {
	const body = (input.body ?? "").trim();
	if (!body) return { ok: false, error: "내용을 입력해 주세요." };
	const kind: PostKind = input.kind === "update" ? "update" : "diary";
	await getDb()
		.prepare(
			`INSERT INTO posts (kind, title, body, tags, created_at)
			 VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(kind, clean(input.title), body, normalizeTags(input.tags), Date.now())
		.run();
	return { ok: true };
}

export async function deletePost(id: number): Promise<void> {
	await getDb().prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
}
