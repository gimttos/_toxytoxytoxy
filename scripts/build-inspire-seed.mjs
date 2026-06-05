// 영감 카드(/inspire) 단어 시드 빌더.
//
// dariusk/corpora (CC0) 의 공개 단어 데이터셋을 결(tag)별로 모아 필터링·정제하여
// src/data/inspire-seed.json 으로 떨어뜨린다. 수집된 시드는 "출발점"이고,
// 최종 큐레이션(추가·솎기)은 어드민이 D1 에서 한다.
//
// 실행:  node scripts/build-inspire-seed.mjs
// 재현성: 고정 시드 셔플을 써서 매번 같은 결과가 나온다.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://raw.githubusercontent.com/dariusk/corpora/master/data";
const OUT = fileURLToPath(new URL("../src/data/inspire-seed.json", import.meta.url));

// 결(tag)별 소스: [경로, 응답 안의 키, 옵션]
// kind: "word" 면 소문자 정규화, "name" 이면 고유명사라 원형 유지(최대 2어절 허용).
const SOURCES = [
	{ tag: "place", path: "architecture/rooms.json", key: "rooms", cap: 200 },
	{ tag: "emotion", path: "humans/moods.json", key: "moods", cap: 220 },
	{ tag: "object", path: "objects/objects.json", key: "objects", cap: 160 },
	{ tag: "object", path: "music/instruments.json", key: "instruments", cap: 90 },
	{ tag: "nature", path: "plants/flowers.json", key: "flowers", cap: 110 },
	{ tag: "nature", path: "animals/common.json", key: "animals", cap: 130 },
	{ tag: "nature", path: "plants/plants.json", key: "plants", cap: 90, pick: (e) => e?.name },
	{ tag: "action", path: "words/verbs.json", key: "verbs", cap: 220, pick: (e) => e?.present },
	{ tag: "abstract", path: "words/literature/shakespeare_words.json", key: "words", cap: 220 },
	{ tag: "myth", path: "mythology/greek_gods.json", key: "greek_gods", cap: 60, kind: "name" },
	{ tag: "myth", path: "mythology/greek_monsters.json", key: "greek_monsters", cap: 60, kind: "name" },
];

// 결과물이 흔하거나 김새는 기능어/잡토큰 — 솎아낸다.
const STOP = new Set([
	"the", "and", "for", "are", "was", "were", "this", "that", "with", "from",
	"have", "has", "had", "not", "but", "they", "you", "your", "she", "him",
	"her", "his", "its", "our", "their", "what", "when", "where", "which",
	"accept", "add", "allow", "apply", "ask", "be", "become", "begin", "call",
	"can", "come", "could", "do", "get", "give", "go", "happen", "help",
	"include", "keep", "know", "let", "like", "live", "look", "make", "may",
	"mean", "might", "move", "need", "play", "provide", "put", "run", "say",
	"see", "seem", "set", "should", "show", "start", "take", "talk", "tell",
	"think", "try", "turn", "use", "want", "will", "work", "would", "write",
]);

function mulberry32(a) {
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function shuffle(arr, rnd) {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rnd() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function cleanWord(raw, kind) {
	if (typeof raw !== "string") return null;
	let s = raw.trim().replace(/\s+/g, " ");
	if (!s) return null;
	if (kind === "name") {
		// 고유명사: 글자/공백/하이픈만, 1~2어절, 길이 3~22.
		if (!/^[A-Za-z][A-Za-z' -]*$/.test(s)) return null;
		if (s.split(" ").length > 2) return null;
		if (s.length < 3 || s.length > 22) return null;
		return s;
	}
	// 일반 단어: 소문자 한 어절, 알파벳만, 길이 3~13.
	s = s.toLowerCase();
	if (s.includes(" ")) return null;
	if (!/^[a-z]+$/.test(s)) return null;
	if (s.length < 3 || s.length > 13) return null;
	if (STOP.has(s)) return null;
	return s;
}

async function fetchJson(path) {
	const res = await fetch(`${BASE}/${path}`);
	if (!res.ok) throw new Error(`fetch ${path} → HTTP ${res.status}`);
	return res.json();
}

async function main() {
	const rnd = mulberry32(0x70c5);
	/** @type {Record<string, Set<string>>} */
	const byTag = {};
	const seen = new Set(); // 결 간 중복 방지(소문자 키)

	for (const src of SOURCES) {
		const json = await fetchJson(src.path);
		const list = json[src.key];
		if (!Array.isArray(list)) {
			console.warn(`! ${src.path}: key "${src.key}" 가 배열이 아님 — 건너뜀`);
			continue;
		}
		const picked = [];
		for (const entry of list) {
			const raw = src.pick ? src.pick(entry) : entry;
			const w = cleanWord(raw, src.kind);
			if (!w) continue;
			const dedupeKey = w.toLowerCase();
			if (seen.has(dedupeKey)) continue;
			seen.add(dedupeKey);
			picked.push(w);
		}
		const capped = shuffle(picked, rnd).slice(0, src.cap);
		(byTag[src.tag] ??= new Set());
		for (const w of capped) byTag[src.tag].add(w);
		console.log(`  ${src.tag.padEnd(8)} ← ${src.path}  (+${capped.length})`);
	}

	const words = {};
	let total = 0;
	for (const [tag, set] of Object.entries(byTag)) {
		const arr = [...set].sort((a, b) => a.localeCompare(b));
		words[tag] = arr;
		total += arr.length;
	}

	// 비틀기 모드용 한 마디 — 직접 쓴 오리지널 디렉티브 (저작권 클린).
	const twists = [
		"Cut the scene exactly where it hurts.",
		"Give the villain the line you wish you'd said.",
		"Make the smallest object the whole point.",
		"Start at the ending and refuse to explain.",
		"Let the weather know something the characters don't.",
		"Trade one truth for one lie and keep going.",
		"Put the kindest person in the worst room.",
		"Name the thing nobody wants named.",
		"Make a promise on page one. Break it on the last.",
		"Follow the character who left.",
		"Turn the rescue into the trap.",
		"Let silence answer the most important question.",
		"Give the monster a reason and the hero a doubt.",
		"Burn the map. Keep walking.",
		"Make the reunion worse than the parting.",
		"Hand the secret to the one who can't keep it.",
		"Let the building remember what the people forgot.",
		"Make the cure cost the thing it saves.",
		"Start the war over something small.",
		"Let the dead keep a schedule.",
		"Give two people the same memory, told wrong.",
		"Make the door open from the wrong side.",
		"Reward the worst decision.",
		"Let the light come from a bad place.",
		"Make the smallest character right.",
		"End the chapter on a question, not a fact.",
		"Make the gift a debt.",
		"Let the city keep score.",
		"Make the witness the one who can't speak.",
		"Turn the homecoming into an exile.",
		"Give the clock to the wrong hands.",
		"Make mercy the dangerous choice.",
		"Let the song arrive before the singer.",
		"Make the map older than the country.",
		"Give the hero an audience they can't see.",
		"Let the rain fall only on one of them.",
		"Make the apology too late by an hour.",
		"Bury the answer under a smaller question.",
		"Let the ghost want something ordinary.",
		"Make the key fit a lock that's gone.",
	];

	await mkdir(dirname(OUT), { recursive: true });
	await writeFile(
		OUT,
		JSON.stringify(
			{
				_meta: {
					source: "dariusk/corpora (CC0)",
					url: "https://github.com/dariusk/corpora",
					note: "결(tag)별로 모은 영어 단어 시드. 어드민이 D1 에서 추가/솎기로 큐레이션함.",
					generatedBy: "scripts/build-inspire-seed.mjs",
				},
				tags: Object.keys(words),
				words,
				twists,
			},
			null,
			"\t",
		) + "\n",
		"utf8",
	);
	console.log(`\n✓ ${total} words across ${Object.keys(words).length} tags + ${twists.length} twists`);
	console.log(`  → ${OUT}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
