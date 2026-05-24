-- 스티커 시스템 — 오너가 갠홈 곳곳에 스티커 붙여서 꾸미는 기능.
-- sticker_library: 한 번 올린 PNG 재사용 (R2 key 보관)
-- sticker_placements: 라이브러리 항목을 surface 위 특정 위치에 배치한 결과
--   surface 예시: 'page:/', 'page:/about', 'image:42', 'card:character:taira'

CREATE TABLE sticker_library (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    r2_key       TEXT NOT NULL,
    label        TEXT,
    width        INTEGER,
    height       INTEGER,
    created_at   INTEGER NOT NULL
);

CREATE TABLE sticker_placements (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    sticker_id   INTEGER NOT NULL REFERENCES sticker_library(id) ON DELETE CASCADE,
    surface      TEXT NOT NULL,           -- 'page:/about', 'image:42' 등
    x_pct        REAL NOT NULL,           -- 컨테이너 너비 대비 %
    y_pct        REAL NOT NULL,
    w_pct        REAL NOT NULL,           -- 너비 % (높이는 종횡비 유지)
    rot          REAL NOT NULL DEFAULT 0, -- 도(°)
    z            INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL
);

CREATE INDEX idx_placements_surface ON sticker_placements(surface);
