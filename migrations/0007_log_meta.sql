-- M4 로그(갱신·잡담) + 소품 메타(방문자 수·한마디·BGM)
-- 적용: 로컬  → npx wrangler d1 migrations apply pal3bluedot-db --local
--      원격  → npx wrangler d1 migrations apply pal3bluedot-db --remote

CREATE TABLE IF NOT EXISTS posts (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	kind        TEXT    NOT NULL DEFAULT 'diary', -- 'update'(갱신기록) | 'diary'(잡담·일기)
	title       TEXT,
	body        TEXT    NOT NULL,
	tags        TEXT,                              -- 쉼표 구분, 소문자
	created_at  INTEGER NOT NULL                   -- unix epoch ms
);

-- 단순 key/value — 방문자 수(hits), 한마디(status), BGM(bgm_key/bgm_title)
CREATE TABLE IF NOT EXISTS site_meta (
	key         TEXT    PRIMARY KEY,
	value       TEXT,
	updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_kind_at ON posts (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_at      ON posts (created_at DESC);
