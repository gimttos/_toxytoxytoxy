// 일정 — 구글 캘린더 비공개 .ics 를 가져와 D1 에 캐시. 서버 전용.
// 폰(삼성) → 구글 계정 캘린더 동기화 → 여기서 그 비공개 iCal 주소를 폴링.
// 의존성 없는 최소 ICS 파서. (반복 RRULE 확장은 추후 — 원문만 보관.)

import { getDb, getEnv } from "./db";
import { getMeta, setMeta } from "./meta";

const SYNC_KEY = "schedule_synced_at";
const FRESH_MS = 15 * 60 * 1000; // 15분
const WINDOW_BACK = 1 * 24 * 60 * 60 * 1000; // 지난 1일까지
const WINDOW_FWD = 120 * 24 * 60 * 60 * 1000; // 앞으로 120일

export type SchedEvent = {
	id: number;
	uid: string | null;
	summary: string | null;
	description: string | null;
	location: string | null;
	start_ms: number;
	end_ms: number | null;
	all_day: number;
	rrule: string | null;
};

export type SchedMemo = {
	id: number;
	on_date: string;
	body: string;
	created_at: number;
};

type ParsedEvent = {
	uid: string | null;
	summary: string | null;
	description: string | null;
	location: string | null;
	start_ms: number;
	end_ms: number | null;
	all_day: boolean;
	rrule: string | null;
};

// ── ICS 파싱 ────────────────────────────────────────────

function unfold(text: string): string[] {
	const raw = text.split(/\r\n|\n|\r/);
	const out: string[] = [];
	for (const line of raw) {
		if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
			out[out.length - 1] += line.slice(1);
		} else {
			out.push(line);
		}
	}
	return out;
}

function unescapeText(v: string): string {
	return v
		.replace(/\\n/gi, "\n")
		.replace(/\\,/g, ",")
		.replace(/\\;/g, ";")
		.replace(/\\\\/g, "\\");
}

// DTSTART 값 → {ms, allDay}. Z=UTC, 그 외(부동/TZID)는 Asia/Seoul 벽시계로 가정.
function parseDt(value: string): { ms: number; allDay: boolean } | null {
	const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
	if (dateOnly) {
		const [, y, m, d] = dateOnly;
		return { ms: Date.UTC(+y, +m - 1, +d), allDay: true };
	}
	const dt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(value);
	if (dt) {
		const [, y, m, d, h, mi, s, z] = dt;
		const utc = Date.UTC(+y, +m - 1, +d, +h, +mi, +s);
		// Z 면 그대로 UTC, 아니면 KST(UTC+9) 벽시계로 보고 UTC 로 환산.
		return { ms: z ? utc : utc - 9 * 60 * 60 * 1000, allDay: false };
	}
	return null;
}

export function parseIcs(text: string): ParsedEvent[] {
	const lines = unfold(text);
	const events: ParsedEvent[] = [];
	let cur: Partial<ParsedEvent> & { _start?: string; _end?: string } = {};
	let inEvent = false;

	for (const line of lines) {
		if (line === "BEGIN:VEVENT") {
			inEvent = true;
			cur = {};
			continue;
		}
		if (line === "END:VEVENT") {
			inEvent = false;
			const st = cur._start ? parseDt(cur._start) : null;
			if (st) {
				const en = cur._end ? parseDt(cur._end) : null;
				events.push({
					uid: cur.uid ?? null,
					summary: cur.summary ?? null,
					description: cur.description ?? null,
					location: cur.location ?? null,
					start_ms: st.ms,
					end_ms: en ? en.ms : null,
					all_day: st.allDay,
					rrule: cur.rrule ?? null,
				});
			}
			continue;
		}
		if (!inEvent) continue;

		const idx = line.indexOf(":");
		if (idx === -1) continue;
		const left = line.slice(0, idx);
		const value = line.slice(idx + 1);
		const name = left.split(";")[0].toUpperCase();

		switch (name) {
			case "UID":
				cur.uid = value;
				break;
			case "SUMMARY":
				cur.summary = unescapeText(value);
				break;
			case "DESCRIPTION":
				cur.description = unescapeText(value);
				break;
			case "LOCATION":
				cur.location = unescapeText(value);
				break;
			case "DTSTART":
				cur._start = value.trim();
				break;
			case "DTEND":
				cur._end = value.trim();
				break;
			case "RRULE":
				cur.rrule = value;
				break;
		}
	}
	return events;
}

// ── 가져오기 + 캐시 ─────────────────────────────────────

export type SyncState =
	| { configured: false; debug: { rawType: string; rawLen: number; trimmedLen: number; envKeys: string[] } }
	| { configured: true; ok: true; count: number }
	| { configured: true; ok: false; error: string };

export async function ensureFresh(force = false): Promise<SyncState> {
	const env = getEnv();
	const raw = env.GCAL_ICS_URL;
	const url = (raw ?? "").trim();
	if (!url) {
		return {
			configured: false,
			debug: {
				rawType: typeof raw,
				rawLen: typeof raw === "string" ? raw.length : 0,
				trimmedLen: url.length,
				envKeys: Object.keys(env as object).sort(),
			},
		};
	}

	if (!force) {
		const last = Number((await getMeta(SYNC_KEY)) ?? "0");
		if (last && Date.now() - last < FRESH_MS) {
			return { configured: true, ok: true, count: -1 }; // 캐시 신선 — 그대로 사용
		}
	}

	try {
		const res = await fetch(url, { redirect: "follow" });
		if (!res.ok) {
			return { configured: true, ok: false, error: `가져오기 실패 (HTTP ${res.status})` };
		}
		const text = await res.text();
		const parsed = parseIcs(text);
		const db = getDb();
		const now = Date.now();

		await db.prepare(`DELETE FROM schedule_events`).run();
		// 0개여도 동기화 시각은 갱신 (빈 캘린더 정상 처리)
		const stmts = parsed.map((e) =>
			db
				.prepare(
					`INSERT INTO schedule_events
					 (uid, summary, description, location, start_ms, end_ms, all_day, rrule, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				)
				.bind(
					e.uid,
					e.summary,
					e.description,
					e.location,
					e.start_ms,
					e.end_ms,
					e.all_day ? 1 : 0,
					e.rrule,
					now,
				),
		);
		if (stmts.length) await db.batch(stmts);
		await setMeta(SYNC_KEY, String(now));
		return { configured: true, ok: true, count: parsed.length };
	} catch (err) {
		return {
			configured: true,
			ok: false,
			error: err instanceof Error ? err.message : "알 수 없는 오류",
		};
	}
}

export async function syncedAt(): Promise<number | null> {
	const v = await getMeta(SYNC_KEY);
	return v ? Number(v) : null;
}

export async function listEvents(): Promise<SchedEvent[]> {
	const now = Date.now();
	const { results } = await getDb()
		.prepare(
			`SELECT id, uid, summary, description, location, start_ms, end_ms, all_day, rrule
			 FROM schedule_events
			 WHERE start_ms >= ? AND start_ms <= ?
			 ORDER BY start_ms
			 LIMIT 400`,
		)
		.bind(now - WINDOW_BACK, now + WINDOW_FWD)
		.all<SchedEvent>();
	return results ?? [];
}

// ── 비공개 메모 (오너 전용 — 호출부에서 isOwner 확인) ──

export async function listMemos(): Promise<SchedMemo[]> {
	const { results } = await getDb()
		.prepare(
			`SELECT id, on_date, body, created_at FROM schedule_memos
			 ORDER BY on_date DESC, created_at DESC LIMIT 200`,
		)
		.all<SchedMemo>();
	return results ?? [];
}

export async function addMemo(onDate: string, body: string): Promise<boolean> {
	const d = (onDate ?? "").trim();
	const b = (body ?? "").trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !b) return false;
	await getDb()
		.prepare(
			`INSERT INTO schedule_memos (on_date, body, created_at) VALUES (?, ?, ?)`,
		)
		.bind(d, b, Date.now())
		.run();
	return true;
}

export async function deleteMemo(id: number): Promise<void> {
	await getDb().prepare(`DELETE FROM schedule_memos WHERE id = ?`).bind(id).run();
}
