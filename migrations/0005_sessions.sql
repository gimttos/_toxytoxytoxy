-- M4 세션 (Sessions) — TRPG 기록부 + 로그 아카이브
-- 적용: 로컬  → npx wrangler d1 migrations apply pal3bluedot-db --local
--      원격  → npx wrangler d1 migrations apply pal3bluedot-db --remote
-- 세션 자체는 공개. 로그는 visibility 로 글마다 공개/비공개.

CREATE TABLE IF NOT EXISTS sessions (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	slug        TEXT    NOT NULL UNIQUE,    -- /sessions/<slug>
	title       TEXT    NOT NULL,           -- 시나리오명
	system      TEXT,                        -- TRPG 시스템
	played_on   TEXT,                        -- 플레이 날짜 (YYYY-MM-DD)
	party       TEXT,                        -- 같이 한 사람
	role        TEXT,                        -- GM / PL 등
	result      TEXT,                        -- 결말
	review      TEXT,                        -- 한줄평
	tags        TEXT,                        -- 쉼표 구분, 소문자
	sort        INTEGER NOT NULL DEFAULT 0,
	created_at  INTEGER NOT NULL             -- unix epoch ms
);

CREATE TABLE IF NOT EXISTS session_logs (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	session_id  INTEGER NOT NULL,            -- sessions.id
	title       TEXT,
	format      TEXT    NOT NULL DEFAULT 'text',    -- 'text' | 'html'
	visibility  TEXT    NOT NULL DEFAULT 'private', -- 'public' | 'private'
	body        TEXT    NOT NULL,
	sort        INTEGER NOT NULL DEFAULT 0,
	created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_sort   ON sessions (sort, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_logs_s  ON session_logs (session_id, sort, created_at);
