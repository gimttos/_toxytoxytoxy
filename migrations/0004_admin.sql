-- M4 어드민 — 룸링크 정리함 + 세션 준비 비공개 메모 (오너 전용, 공개 안 함)
-- 적용: 로컬  → npx wrangler d1 migrations apply pal3bluedot-db --local
--      원격  → npx wrangler d1 migrations apply pal3bluedot-db --remote

CREATE TABLE IF NOT EXISTS room_links (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	label       TEXT    NOT NULL,            -- 방 이름/메모성 라벨
	url         TEXT    NOT NULL,            -- 디코/콕포/VTT 등 링크
	system      TEXT,                         -- TRPG 시스템 (선택)
	note        TEXT,                         -- 비고 (선택)
	sort        INTEGER NOT NULL DEFAULT 0,
	created_at  INTEGER NOT NULL              -- unix epoch ms
);

CREATE TABLE IF NOT EXISTS admin_notes (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	title       TEXT,                         -- 제목 (선택)
	body        TEXT    NOT NULL,             -- 메모 본문
	created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_room_links_sort ON room_links (sort, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notes_at  ON admin_notes (created_at DESC);
