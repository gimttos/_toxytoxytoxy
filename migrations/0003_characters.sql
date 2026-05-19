-- M3 캐릭터 (Characters) — 자캐 도감 + PC 시트 + 관계도
-- 적용: 로컬  → npx wrangler d1 migrations apply pal3bluedot-db --local
--      원격  → npx wrangler d1 migrations apply pal3bluedot-db --remote
-- 일러스트는 R2(MEDIA, portrait_key), 메타데이터만 D1.

CREATE TABLE IF NOT EXISTS characters (
	id            INTEGER PRIMARY KEY AUTOINCREMENT,
	slug          TEXT    NOT NULL UNIQUE,   -- /characters/<slug>
	name          TEXT    NOT NULL,
	name_en       TEXT,
	tagline       TEXT,                       -- 한 줄 소개
	profile       TEXT,                       -- 본문(자유서식, 줄바꿈 유지)
	system        TEXT,                       -- TRPG 시스템 (PC면)
	stats         TEXT,                       -- 능력치/시트 자유서식
	before_after  TEXT,                       -- 비포애프터
	portrait_key  TEXT,                       -- R2 오브젝트 키 (없으면 NULL)
	tags          TEXT,                       -- 쉼표 구분, 소문자
	sort          INTEGER NOT NULL DEFAULT 0,
	created_at    INTEGER NOT NULL            -- unix epoch ms
);

CREATE TABLE IF NOT EXISTS character_relations (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	a_id        INTEGER NOT NULL,             -- characters.id (이 캐릭터)
	b_id        INTEGER NOT NULL,             -- characters.id (상대)
	label       TEXT    NOT NULL,             -- 관계 라벨 (예: 동료, 라이벌)
	note        TEXT,
	created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_characters_sort     ON characters (sort, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_relations_a         ON character_relations (a_id);
CREATE INDEX IF NOT EXISTS idx_relations_b         ON character_relations (b_id);
