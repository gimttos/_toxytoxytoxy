-- M2 방명록 (Guestbook)
-- 적용: 로컬  → npx wrangler d1 migrations apply pal3bluedot-db --local
--      원격  → npx wrangler d1 migrations apply pal3bluedot-db --remote

CREATE TABLE IF NOT EXISTS guestbook (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	name        TEXT    NOT NULL,
	body        TEXT    NOT NULL,
	link        TEXT,                          -- 선택: 홈피/X 주소
	mood        TEXT,                          -- 선택: 무드 이모지
	secret      INTEGER NOT NULL DEFAULT 0,    -- 1이면 비밀글(오너만 본문 열람)
	hidden      INTEGER NOT NULL DEFAULT 0,    -- 1이면 오너가 숨김 처리
	ip_hash     TEXT,                          -- sha-256(ip+salt) — 스팸/레이트리밋용
	created_at  INTEGER NOT NULL               -- unix epoch ms
);

CREATE INDEX IF NOT EXISTS idx_guestbook_created_at
	ON guestbook (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guestbook_ip_recent
	ON guestbook (ip_hash, created_at);
