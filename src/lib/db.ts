// Cloudflare 바인딩 접근 단일 진입점.
// 규약: 서버(Server Component / Server Action / Route Handler)에서만 호출.
// 브라우저에서는 바인딩이 없다. process.env 가 아니라 이걸 쓴다.

import { getCloudflareContext } from "@opennextjs/cloudflare";

// cf-typegen 이 만드는 CloudflareEnv 에 더해, 시크릿(.dev.vars / wrangler secret)으로
// 들어오는 값은 타입에 안 잡히므로 여기서 선택 필드로 확장해 둔다.
type ExtraEnv = {
	OWNER_SECRET?: string;
	GUESTBOOK_SALT?: string;
	GCAL_ICS_URL?: string; // 구글 캘린더 비공개 iCal 주소
};

export function getEnv(): CloudflareEnv & ExtraEnv {
	return getCloudflareContext().env as CloudflareEnv & ExtraEnv;
}

export function getDb(): D1Database {
	return getEnv().DB;
}

// R2 — 갤러리/캐릭터/배너 이미지 바이너리. 메타데이터는 D1.
export function getMedia(): R2Bucket {
	return getEnv().MEDIA;
}
