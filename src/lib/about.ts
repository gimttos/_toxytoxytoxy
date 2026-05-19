// 소개(About) 콘텐츠 — 단일 편집 지점.
// 지금은 코드로 직접 고친다. (M4 어드민 콘솔에서 화면 편집으로 이관 예정.)
// 아래 값만 네 걸로 바꾸면 /about 페이지가 그대로 따라온다.

export type AboutLink = { label: string; href: string };
export type TendencyRow = { topic: string; mark: "○" | "△" | "✕"; note?: string };
export type WishItem = { item: string; note?: string; got?: boolean };
export type Oshi = { name: string; from: string; note?: string };

export type About = {
	intro: {
		name: string;
		aka: string[];
		lines: string[];
		links: AboutLink[];
	};
	byf: string[]; // Before You Follow — 팔로우 전 알아둘 것
	dni: string[]; // Do Not Interact — 상호작용 사절
	mute: string[]; // 뮤트 권장 태그/단어 (없으면 빈 배열)
	tendency: {
		legend: string;
		rows: TendencyRow[];
	};
	wishlist: WishItem[];
	oshi: Oshi[];
};

export const about: About = {
	intro: {
		name: "PAL3BLUED0T",
		aka: ["토시", "@_toxytoxytoxy"],
		lines: [
			"좋아하는 것들을 모아두는 사적인 아카이브.",
			"TRPG 세션을 자주 다니고, 자캐와 사진을 모읍니다.",
		],
		links: [{ label: "X", href: "https://x.com/_toxytoxytoxy" }],
	},

	byf: [
		"잡담 많고 트윗이 잦아요.",
		"세션 로그·후기를 종종 올립니다.",
		"무단 펌·도용은 사절이에요.",
	],

	dni: [
		"혐오·차별 발언을 하는 분",
		"제 창작물을 무단으로 사용하는 분",
	],

	mute: [],

	tendency: {
		legend: "○ 가능 · △ 협의 필요 · ✕ 불가",
		rows: [
			{ topic: "세션 모집 DM", mark: "○" },
			{ topic: "합방·합작", mark: "△", note: "일정 협의" },
			{ topic: "2차 창작", mark: "△", note: "사전에 한마디" },
			{ topic: "상업적 이용", mark: "✕" },
		],
	},

	wishlist: [
		{ item: "여기에 갖고 싶은 것", note: "메모(선택)" },
		{ item: "이미 받은 것 예시", got: true },
	],

	oshi: [
		{ name: "최애 이름", from: "출처 작품", note: "한마디(선택)" },
	],
};
