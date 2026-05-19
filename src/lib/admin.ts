// 어드민(오너 전용) 데이터 레이어 — 룸링크 정리함 + 비공개 메모. 서버 전용.
// 공개되지 않는다. 호출부(/admin actions)에서 isOwner() 확인 후 사용.

import { getDb } from "./db";
import { type Result } from "./gallery";

export type RoomLink = {
	id: number;
	label: string;
	url: string;
	system: string | null;
	note: string | null;
	sort: number;
	created_at: number;
};

export type AdminNote = {
	id: number;
	title: string | null;
	body: string;
	created_at: number;
};

function clean(v: string | undefined): string | null {
	const t = (v ?? "").trim();
	return t || null;
}

export async function listRoomLinks(): Promise<RoomLink[]> {
	const { results } = await getDb()
		.prepare(
			`SELECT id, label, url, system, note, sort, created_at
			 FROM room_links ORDER BY sort, created_at DESC`,
		)
		.all<RoomLink>();
	return results ?? [];
}

export async function addRoomLink(input: {
	label: string;
	url: string;
	system?: string;
	note?: string;
}): Promise<Result> {
	const label = (input.label ?? "").trim();
	const url = (input.url ?? "").trim();
	if (!label || !url) return { ok: false, error: "라벨과 URL을 입력해 주세요." };
	if (!/^https?:\/\//i.test(url))
		return { ok: false, error: "http:// 또는 https:// 로 시작하는 URL을 입력해 주세요." };
	await getDb()
		.prepare(
			`INSERT INTO room_links (label, url, system, note, created_at)
			 VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(label, url, clean(input.system), clean(input.note), Date.now())
		.run();
	return { ok: true };
}

export async function deleteRoomLink(id: number): Promise<void> {
	await getDb().prepare(`DELETE FROM room_links WHERE id = ?`).bind(id).run();
}

export async function listNotes(): Promise<AdminNote[]> {
	const { results } = await getDb()
		.prepare(
			`SELECT id, title, body, created_at
			 FROM admin_notes ORDER BY created_at DESC`,
		)
		.all<AdminNote>();
	return results ?? [];
}

export async function addNote(input: {
	title?: string;
	body: string;
}): Promise<Result> {
	const body = (input.body ?? "").trim();
	if (!body) return { ok: false, error: "메모 내용을 입력해 주세요." };
	await getDb()
		.prepare(
			`INSERT INTO admin_notes (title, body, created_at) VALUES (?, ?, ?)`,
		)
		.bind(clean(input.title), body, Date.now())
		.run();
	return { ok: true };
}

export async function deleteNote(id: number): Promise<void> {
	await getDb().prepare(`DELETE FROM admin_notes WHERE id = ?`).bind(id).run();
}
