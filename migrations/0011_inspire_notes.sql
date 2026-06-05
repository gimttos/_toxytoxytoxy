-- M11 영감 카드 — 단어별 번역/메모 레이어.
-- 적용: 로컬  → npx wrangler d1 migrations apply pal3bluedot-db --local
--      원격  → npx wrangler d1 migrations apply pal3bluedot-db --remote
--
-- 영어 시드를 뼈대로 두고, 오너가 단어를 만날 때마다 한국어 번역(또는 메모)을 단다.
-- 번역이 달린 단어는 카드에서 한국어가 크게, 원래 영어가 작게 표시된다.
-- key = 정규화한 단어(소문자 trim) — 시드 단어든 추가 단어든 같은 키로 묶인다.

CREATE TABLE IF NOT EXISTS inspire_notes (
	key         TEXT    PRIMARY KEY,     -- normKey(word)
	note        TEXT    NOT NULL,         -- 번역/메모 (한국어 등)
	created_at  INTEGER NOT NULL,
	updated_at  INTEGER NOT NULL
);
