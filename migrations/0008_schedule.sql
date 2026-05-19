-- M5 일정 (Schedule) — 구글 비공개 .ics 캐시 + 비공개 메모
-- 적용: 로컬  → npx wrangler d1 migrations apply pal3bluedot-db --local
--      원격  → npx wrangler d1 migrations apply pal3bluedot-db --remote
-- schedule_events 는 .ics 파싱 캐시(주기적으로 통째 갱신). 동기화 시각은 site_meta.

CREATE TABLE IF NOT EXISTS schedule_events (
	id           INTEGER PRIMARY KEY AUTOINCREMENT,
	uid          TEXT,
	summary      TEXT,
	description  TEXT,
	location     TEXT,
	start_ms     INTEGER NOT NULL,            -- 시작 (unix ms)
	end_ms       INTEGER,                      -- 종료 (없으면 NULL)
	all_day      INTEGER NOT NULL DEFAULT 0,   -- 날짜만 (시간 없음)
	rrule        TEXT,                          -- 반복 규칙 원문 (확장은 추후)
	created_at   INTEGER NOT NULL
);

-- 오너 전용 비공개 메모 (날짜별). 공개 안 함.
CREATE TABLE IF NOT EXISTS schedule_memos (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	on_date     TEXT    NOT NULL,             -- YYYY-MM-DD
	body        TEXT    NOT NULL,
	created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedule_events_start ON schedule_events (start_ms);
CREATE INDEX IF NOT EXISTS idx_schedule_memos_date   ON schedule_memos (on_date);
