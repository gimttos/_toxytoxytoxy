// 세션 데이터 레이어 — TRPG 기록부 + 로그. D1. 서버 전용.
// 세션은 공개. 로그는 visibility('public'|'private')로 글마다 제어.

import { getDb } from "./db";
import { slugify, normalizeTags, type Result } from "./gallery";

export type LogFormat = "text" | "html";
export type Visibility = "public" | "private";

export type Session = {
	id: number;
	slug: string;
	title: string;
	system: string | null;
	played_on: string | null;
	party: string | null;
	role: string | null;
	result: string | null;
	review: string | null;
	tags: string | null;
	sort: number;
	created_at: number;
};

export type SessionLog = {
	id: number;
	session_id: number;
	title: string | null;
	format: LogFormat;
	visibility: Visibility;
	body: string;
	sort: number;
	created_at: number;
};

function clean(v: string | undefined): string | null {
	const t = (v ?? "").trim();
	return t || null;
}

export async function listSessions(): Promise<Session[]> {
	const { results } = await getDb()
		.prepare(
			`SELECT * FROM sessions
			 ORDER BY (played_on IS NULL), played_on DESC, created_at DESC`,
		)
		.all<Session>();
	return results ?? [];
}

export async function getSessionBySlug(slug: string): Promise<Session | null> {
	const row = await getDb()
		.prepare(`SELECT * FROM sessions WHERE slug = ?`)
		.bind(slug)
		.first<Session>();
	return row ?? null;
}

export async function listLogs(
	sessionId: number,
	opts: { owner: boolean },
): Promise<SessionLog[]> {
	const db = getDb();
	const { results } = await db
		.prepare(
			`SELECT * FROM session_logs
			 WHERE session_id = ? ${opts.owner ? "" : "AND visibility = 'public'"}
			 ORDER BY sort, created_at`,
		)
		.bind(sessionId)
		.all<SessionLog>();
	return results ?? [];
}

export type SessionInput = {
	title: string;
	slug?: string;
	system?: string;
	played_on?: string;
	party?: string;
	role?: string;
	result?: string;
	review?: string;
	tags?: string;
};

export async function createSession(input: SessionInput): Promise<Result> {
	const title = (input.title ?? "").trim();
	if (!title) return { ok: false, error: "시나리오명을 입력해 주세요." };
	const slug = slugify(input.slug || title);
	if (!slug)
		return { ok: false, error: "슬러그를 만들 수 없어요. 영문/숫자를 포함해 주세요." };
	try {
		await getDb()
			.prepare(
				`INSERT INTO sessions
				 (slug, title, system, played_on, party, role, result, review, tags, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				slug,
				title,
				clean(input.system),
				clean(input.played_on),
				clean(input.party),
				clean(input.role),
				clean(input.result),
				clean(input.review),
				normalizeTags(input.tags),
				Date.now(),
			)
			.run();
		return { ok: true };
	} catch {
		return { ok: false, error: `슬러그 "${slug}" 가 이미 있어요.` };
	}
}

export async function updateSession(
	id: number,
	input: SessionInput,
): Promise<Result> {
	const title = (input.title ?? "").trim();
	if (!title) return { ok: false, error: "시나리오명을 입력해 주세요." };
	await getDb()
		.prepare(
			`UPDATE sessions SET
			   title = ?, system = ?, played_on = ?, party = ?,
			   role = ?, result = ?, review = ?, tags = ?
			 WHERE id = ?`,
		)
		.bind(
			title,
			clean(input.system),
			clean(input.played_on),
			clean(input.party),
			clean(input.role),
			clean(input.result),
			clean(input.review),
			normalizeTags(input.tags),
			id,
		)
		.run();
	return { ok: true };
}

export async function deleteSession(id: number): Promise<void> {
	const db = getDb();
	await db
		.prepare(`DELETE FROM session_logs WHERE session_id = ?`)
		.bind(id)
		.run();
	await db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(id).run();
}

export async function addLog(input: {
	sessionId: number;
	title?: string;
	format?: string;
	visibility?: string;
	body: string;
}): Promise<Result> {
	const body = (input.body ?? "").trim();
	if (!body) return { ok: false, error: "로그 내용을 입력해 주세요." };
	const format: LogFormat = input.format === "html" ? "html" : "text";
	const visibility: Visibility =
		input.visibility === "public" ? "public" : "private";
	await getDb()
		.prepare(
			`INSERT INTO session_logs
			 (session_id, title, format, visibility, body, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			input.sessionId,
			clean(input.title),
			format,
			visibility,
			body,
			Date.now(),
		)
		.run();
	return { ok: true };
}

export async function setLogVisibility(
	id: number,
	visibility: Visibility,
): Promise<void> {
	await getDb()
		.prepare(`UPDATE session_logs SET visibility = ? WHERE id = ?`)
		.bind(visibility, id)
		.run();
}

export async function deleteLog(id: number): Promise<void> {
	await getDb().prepare(`DELETE FROM session_logs WHERE id = ?`).bind(id).run();
}
