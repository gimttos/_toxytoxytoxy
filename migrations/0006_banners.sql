-- M4 배너 (Banners) — 내 배너(퍼가기용) + 친구 배너·링크 교환
-- 적용: 로컬  → npx wrangler d1 migrations apply pal3bluedot-db --local
--      원격  → npx wrangler d1 migrations apply pal3bluedot-db --remote
-- 내 배너 이미지는 R2(MEDIA). 친구 배너는 R2 업로드 또는 외부 이미지 URL.

CREATE TABLE IF NOT EXISTS my_banners (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	r2_key      TEXT    NOT NULL,            -- MEDIA 오브젝트 키
	label       TEXT,                         -- alt / 설명
	width       INTEGER,                       -- 권장 표시 크기 (선택)
	height      INTEGER,
	sort        INTEGER NOT NULL DEFAULT 0,
	created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS friend_links (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	label       TEXT    NOT NULL,            -- 사이트/사람 이름
	url         TEXT    NOT NULL,            -- 이동할 주소
	img_key     TEXT,                         -- R2 업로드 배너 (있으면)
	img_url     TEXT,                         -- 외부 이미지 핫링크 (있으면)
	sort        INTEGER NOT NULL DEFAULT 0,
	created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_my_banners_sort   ON my_banners (sort, created_at);
CREATE INDEX IF NOT EXISTS idx_friend_links_sort ON friend_links (sort, created_at);
