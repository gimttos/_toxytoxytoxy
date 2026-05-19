import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// 상위 폴더의 lockfile 때문에 워크스페이스 루트가 잘못 잡히는 것 방지.
	turbopack: {
		root: import.meta.dirname,
	},
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
