// 소개(About) 콘텐츠 — 단일 편집 지점. 코드로 직접 고친다.
// 말투: ~요체 금지. 평어/~함/~음, 본인 프로필 어투 유지.

export type AboutLink = { label: string; href?: string }; // href 없으면 그냥 표기
export type WishItem = { item: string; note?: string; got?: boolean };
export type Oshi = { name: string; from: string; note?: string };

export type About = {
	intro: {
		name: string;
		aka: string[];
		lines: string[];
		links: AboutLink[];
	};
	quote: { text: string; source: string };
	likes: string[];
	trpg: {
		note: string;
		owned: string[];
		gm: string[];
	};
	tendency: {
		note: string;
		embedUrl: string; // 구글 시트 /preview iframe
		linkUrl: string; // 새 탭 원본
	};
	byf: string[];
	dniNote: string;
	dni: string[];
	mute: string[];
	wishlist: WishItem[];
	oshi: Oshi[];
};

const SHEET_ID = "11KN6OPDgnaXKDWuXcc3jvRWBGVO_NNJlbxlBMQHkYuw";

export const about: About = {
	intro: {
		name: "똣",
		aka: ["@_toxytoxytoxy", "Don't let me"],
		lines: [
			"에이로맨틱 에이섹슈얼 논바이너리, 1차 / TRPG 위주 본계",
			"DX3rd / 은닉 CoC 주력",
			"FUB free",
		],
		links: [
			{ label: "X", href: "https://x.com/_toxytoxytoxy" },
			{ label: "Discord — ttos7067" },
			{ label: "오픈카톡", href: "https://open.kakao.com/o/sbG2hI9f" },
			{ label: "luv3r profile", href: "https://toxytoxytoxy.luv3r.me/" },
		],
	},

	quote: {
		text: "그대가 옳다. 모든 것은 지나갈 것이다.\n다시 한 번 그대가 옳다. 그대와 나의 이야기는 언제고 끝날 것이다.\n그러나 그것은 천천히 올 것이고, 그대와 나는 고통스러울 것이다.",
		source: "야만적인 앨리스씨",
	},

	likes: [
		"1차",
		"TRPG",
		"DX3rd",
		"CoC",
		"한국문학",
		"개발",
		"일상",
	],

	trpg: {
		note: "",
		owned: [
			"DX3rd",
			"CoC",
			"inSANe",
			"마기카로기아",
			"시노비가미",
			"어둠 속의 칼날",
			"아곤",
			"던전 월드",
			"은검의 스텔라나이츠",
			"둘이서 수사",
		],
		gm: [
			"CoC",
			"사이코로 픽션 전반",
			"DX3rd",
			"둘이서 수사",
		],
	},

	tendency: {
		note: "자세한 것은 스프레드 시트 참고해 주세요!",
		embedUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/preview`,
		linkUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing`,
	},

	byf: [
		"1차 / TRPG 위주 본계",
		"FUB free",
		"팔로워 수 300 넘지 않게 관리하고 있습니다.",
		"블블 악의 없습니다. 재연결도 Ok!",
	],

	dniNote: "대부분 팔안굽을 합니다만,",
	dni: [
		"인간 대 인간으로서의 무례한 언행",
		"필터 없는 실사 RG18 이미지",
		"빈도 높은 젠더퀴어혐오 발언",
		"블루레이디 / 맛터 계열 계정의 많은 유입",
		"타깃 지정 수동저격 / 뒷담",
		"충분히 친하지 않은 상태에서의 무례한 요구",
		"견제, 인간관계 싸움, 피곤한 일 일체",
		"시나리오의 과한 뉘앙스 스포일러",
	],

	mute: [],
	wishlist: [],
	oshi: [],
};
