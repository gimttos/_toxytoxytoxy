// 오너(나만) 인증 — M2 임시판.
// 패스프레이즈(OWNER_SECRET)를 받아 일치하면 httpOnly 쿠키 토큰을 발급한다.
// M3에서 정식 세션으로 확장될 자리. 로직을 여기 한 곳에 모아 둔다.
//
// 로컬: .dev.vars 에 OWNER_SECRET="..." (gitignore됨)
// 운영: npx wrangler secret put OWNER_SECRET

import { cookies } from "next/headers";
import { getEnv } from "./db";

const COOKIE = "pb_owner";
const TOKEN_MSG = "owner-v1";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

const enc = new TextEncoder();

async function sha256hex(s: string): Promise<string> {
	const buf = await crypto.subtle.digest("SHA-256", enc.encode(s));
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 같은 길이 hex 문자열의 상수시간 비교 (조기 종료 없음).
function ctEq(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

// 쿠키에 들어갈 토큰 = sha256(secret + 고정메시지). secret 자체는 쿠키에 넣지 않는다.
async function expectedToken(secret: string): Promise<string> {
	return sha256hex(`${secret}:${TOKEN_MSG}`);
}

export async function isOwner(): Promise<boolean> {
	// 정적 프리렌더(예: /_not-found) 에서는 CF 컨텍스트가 없을 수 있다 — 그땐 비오너.
	let secret: string | undefined;
	try {
		secret = getEnv().OWNER_SECRET;
	} catch {
		return false;
	}
	if (!secret) return false;
	const jar = await cookies();
	const got = jar.get(COOKIE)?.value;
	if (!got) return false;
	return ctEq(got, await expectedToken(secret));
}

// 패스프레이즈 검증 후 쿠키 발급. 성공 여부 반환.
export async function tryUnlock(passphrase: string): Promise<boolean> {
	const secret = getEnv().OWNER_SECRET;
	if (!secret || !passphrase) return false;
	// 길이/타이밍 누출을 줄이려고 해시끼리 상수시간 비교.
	const ok = ctEq(await sha256hex(passphrase), await sha256hex(secret));
	if (!ok) return false;
	const jar = await cookies();
	jar.set(COOKIE, await expectedToken(secret), {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: MAX_AGE,
	});
	return true;
}

export async function lock(): Promise<void> {
	const jar = await cookies();
	jar.delete(COOKIE);
}
