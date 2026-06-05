-- M10 영감 카드 (Inspire) — 날것 단어를 결(tag)별로 섞어 던지는 오너 전용 생성기.
-- 적용: 로컬  → npx wrangler d1 migrations apply pal3bluedot-db --local
--      원격  → npx wrangler d1 migrations apply pal3bluedot-db --remote
--
-- 기본 단어 풀은 src/data/inspire-seed.json (git 에 수집해 둠) 이 출발점.
-- D1 은 "큐레이션 레이어"만 담는다:
--   inspire_words  : 오너가 직접 더한 단어
--   inspire_twists : 오너가 더한 비틀기 한마디
--   inspire_hidden : 시드에서 솎아낸 단어/한마디 (정규화 키로 가림)
--   inspire_saved  : 마음에 든 조합 + 한 줄 메모 아카이브
-- 실효 풀 = (시드 ∪ inspire_words) − inspire_hidden.

CREATE TABLE IF NOT EXISTS inspire_words (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	word        TEXT    NOT NULL,
	tag         TEXT    NOT NULL,            -- place|emotion|object|nature|action|abstract|myth|…
	created_at  INTEGER NOT NULL,
	UNIQUE (tag, word)
);

CREATE TABLE IF NOT EXISTS inspire_twists (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	text        TEXT    NOT NULL UNIQUE,
	created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inspire_hidden (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	kind        TEXT    NOT NULL,            -- 'word' | 'twist'
	key         TEXT    NOT NULL,            -- 정규화 키 (소문자 trim)
	created_at  INTEGER NOT NULL,
	UNIQUE (kind, key)
);

CREATE TABLE IF NOT EXISTS inspire_saved (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	words_json  TEXT    NOT NULL,            -- JSON: [{word, tag}]
	twist       TEXT,                         -- 같이 뽑은 비틀기 한마디 (선택)
	memo        TEXT,                         -- 떠오른 영감 한 줄 (선택)
	created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inspire_words_tag ON inspire_words (tag, word);
CREATE INDEX IF NOT EXISTS idx_inspire_saved     ON inspire_saved (created_at DESC);
