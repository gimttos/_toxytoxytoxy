import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Next 16 의 eslint-config-next 는 flat config 를 직접 export 한다.
// (FlatCompat 경유는 ESLint 9 에서 순환참조로 깨짐)
const eslintConfig = [
	{ ignores: [".next/**", ".open-next/**", ".wrangler/**", "node_modules/**", "cloudflare-env.d.ts"] },
	...nextCoreWebVitals,
	...nextTypescript,
];

export default eslintConfig;
