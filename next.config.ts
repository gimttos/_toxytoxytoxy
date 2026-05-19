import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// 상위 폴더의 lockfile 때문에 워크스페이스 루트가 잘못 잡히는 것 방지.
	turbopack: {
		root: import.meta.dirname,
	},
	experimental: {
		// 서버 액션 본문 기본 한도는 1MB — 사진/배너 업로드가 그걸 넘어 죽으면
		// 라우터까지 멈춰서 이후 링크 이동도 안 됨. 갤러리 다중 업로드 고려해 넉넉히.
		serverActions: {
			bodySizeLimit: "25mb",
		},
	},
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
