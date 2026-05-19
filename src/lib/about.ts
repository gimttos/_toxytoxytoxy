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
			"에이로맨틱 에이섹슈얼 논바이너리. 1차 / TRPG 위주 본계.",
			"TRPG 정말 좋아함. DX3rd / 은닉 CoC 주력.",
			"자캐관계 많음 + 세션 많음 + 체력 없음 + 돈 없음 4중 콤보라 관계를 잘 못 챙김. 그래도 더 놀고 싶으면 언제든 말 걸어도 됨.",
			"나한테 너무 많은 걸 바라면 안 됨⋯⋯.",
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
		"inSANe",
		"마기카로기아",
		"시노비가미",
		"한국문학",
		"개발",
		"일상",
	],

	trpg: {
		note: "박치기 중인 룰은 같이 헤매도 괜찮으면 환영.",
		owned: [
			"DX3rd (EA·IC·LM·UG·HR·PE·IA·BC)",
			"CoC",
			"inSANe",
			"마기카로기아",
			"시노비가미",
			"어둠 속의 칼날",
			"아곤",
			"던전 월드",
			"은검의 스텔라나이츠 (은스나)",
			"둘이서 수사 (둘수사)",
		],
		gm: [
			"CoC",
			"사이코로 픽션 (선호)",
			"DX3rd (박치기 중)",
			"둘이서 수사 (박치기 중)",
		],
	},

	tendency: {
		note: "성향표는 채우는 중. 큰 틀은 — 폭력·수위는 대체로 받는 편, 인세인은 PL로는 안 굴림, 일정은 보통 2개월 뒤까지만 구체화.",
		embedUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/preview`,
		linkUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing`,
	},

	byf: [
		"1차 / TRPG 위주 본계.",
		"FUB free.",
		"팔로워 수 300 넘지 않게 관리하고 있음.",
		"블블 악의 없음. 재연결 괜찮음.",
	],

	dniNote: "대부분 사랑으로 흐린 눈 하고 넘어가지만,",
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
