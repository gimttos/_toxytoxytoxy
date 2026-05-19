-- M3 갤러리 (Gallery) — 앨범 + 이미지
-- 적용: 로컬  → npx wrangler d1 migrations apply pal3bluedot-db --local
--      원격  → npx wrangler d1 migrations apply pal3bluedot-db --remote
-- 이미지 바이너리는 R2(MEDIA 버킷)에, 메타데이터만 D1에 둔다.

CREATE TABLE IF NOT EXISTS albums (
	id              INTEGER PRIMARY KEY AUTOINCREMENT,
	slug            TEXT    NOT NULL UNIQUE,         -- URL: /gallery/<slug>
	title           TEXT    NOT NULL,
	description     TEXT,
	kind            TEXT    NOT NULL DEFAULT 'photo', -- 'photo' | 'goods'(굿즈·콜렉션)
	cover_image_id  INTEGER,                          -- images.id (대표 이미지), 없으면 NULL
	created_at      INTEGER NOT NULL                  -- unix epoch ms
);

CREATE TABLE IF NOT EXISTS images (
	id           INTEGER PRIMARY KEY AUTOINCREMENT,
	album_id     INTEGER NOT NULL,                    -- albums.id
	r2_key       TEXT    NOT NULL UNIQUE,             -- MEDIA 버킷 오브젝트 키
	caption      TEXT,
	tags         TEXT,                                -- 쉼표 구분, 소문자
	content_type TEXT,
	bytes        INTEGER,
	sort         INTEGER NOT NULL DEFAULT 0,          -- 앨범 내 정렬
	created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_album      ON images (album_id, sort, created_at);
