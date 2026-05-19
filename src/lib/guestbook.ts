// 방명록 데이터 레이어 (D1). 서버 전용.

import { getDb, getEnv } from "./db";

export type GuestEntry = {
	id: number;
	name: string;
	body: string;
	link: string | null;
	mood: string | null;
	secret: number; // 0 | 1
	hidden: number; // 0 | 1
	created_at: number; // unix ms
};

export const MAX_NAME = 24;
export const MAX_BODY = 1000;
export const MOODS = ["🩵", "✨", "🎲", "📖", "🌙", "🔖"] as const;

const RATE_WINDOW_MS = 30_000; // 같은 IP 30초에 1회
const PAGE_SIZE = 100;

const enc = new TextEncoder();

async function sha256hex(s: string): Promise<string> {
	const buf = await crypto.subtle.digest("SHA-256", enc.encode(s));
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function ipHash(ip: string): Promise<string> {
	const salt = getEnv().GUESTBOOK_SALT ?? "pb-static-salt";
	return sha256hex(`${salt}:${ip}`);
}

export async function listEntries(opts: { owner: boolean }): Promise<GuestEntry[]> {
	const db = getDb();
	const { results } = await db
		.prepare(
			`SELECT id, name, body, link, mood, secret, hidden, created_at
			 FROM guestbook
			 ${opts.owner ? "" : "WHERE hidden = 0"}
			 ORDER BY created_at DESC
			 LIMIT ?`,
		)
		.bind(PAGE_SIZE)
		.all<GuestEntry>();
	return results ?? [];
}

export type SignInput = {
	name: string;
	body: string;
	link?: string;
	mood?: string;
	secret?: boolean;
	honeypot?: string;
	ip: string;
};

export type SignResult = { ok: true } | { ok: false; error: string };

export async function createEntry(input: SignInput): Promise<SignResult> {
	// 허니팟 — 사람이면 비어 있어야 함.
	if (input.honeypot && input.honeypot.trim() !== "") {
		return { ok: false, error: "스팸으로 판단되었어요." };
	}

	const name = (input.name ?? "").trim();
	const body = (input.body ?? "").trim();
	if (!name || !body) return { ok: false, error: "이름과 내용을 모두 입력해 주세요." };
	if (name.length > MAX_NAME) return { ok: false, error: `이름은 ${MAX_NAME}자까지예요.` };
	if (body.length > MAX_BODY) return { ok: false, error: `내용은 ${MAX_BODY}자까지예요.` };

	let link: string | null = (input.link ?? "").trim() || null;
	if (link && !/^https?:\/\//i.test(link)) {
		return { ok: false, error: "링크는 http:// 또는 https:// 로 시작해야 해요." };
	}
	if (link && link.length > 300) link = link.slice(0, 300);

	const mood =
		input.mood && (MOODS as readonly string[]).includes(input.mood) ? input.mood : null;

	const db = getDb();
	const hash = await ipHash(input.ip);

	const recent = await db
		.prepare(`SELECT COUNT(*) AS n FROM guestbook WHERE ip_hash = ? AND created_at > ?`)
		.bind(hash, Date.now() - RATE_WINDOW_MS)
		.first<{ n: number }>();
	if (recent && recent.n > 0) {
		return { ok: false, error: "방금 남기셨어요. 잠시 후에 다시 시도해 주세요." };
	}

	await db
		.prepare(
			`INSERT INTO guestbook (name, body, link, mood, secret, hidden, ip_hash, created_at)
			 VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
		)
		.bind(name, body, link, mood, input.secret ? 1 : 0, hash, Date.now())
		.run();

	return { ok: true };
}

// 오너 전용 — 호출부(Server Action)에서 isOwner() 확인 후 호출.
export async function setHidden(id: number, hidden: boolean): Promise<void> {
	await getDb()
		.prepare(`UPDATE guestbook SET hidden = ? WHERE id = ?`)
		.bind(hidden ? 1 : 0, id)
		.run();
}

export async function deleteEntry(id: number): Promise<void> {
	await getDb().prepare(`DELETE FROM guestbook WHERE id = ?`).bind(id).run();
}
