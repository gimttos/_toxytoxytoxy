// 사이트 전역 설정 — 이름·문구·목차를 여기서 한 곳에서 관리.
// 색/폰트는 src/app/globals.css 의 @theme 토큰에서 바꾼다.

export const site = {
	name: "PAL3BLUED0T",
	// 짧은 영문 태그라인 (제호 아래 / 콜로폰)
	tagline: "TOXY TOXY TOXY",
	// 한글 보조 한 줄 (담백하게)
	taglineKo: "아카이브",
	// X(트위터) 핸들 — @ 없이. 마스트헤드/푸터에 링크로 노출됨.
	x: "_toxytoxytoxy",
	// 발행 정보
	issue: "VOL. 01",
	since: "2026",
	// 표지 카피 (잡지 표지 블러브처럼 — 짧고 담백하게)
	coverLines: [
		"Sign the guestbook",
		"Characters & relations",
		"The photo archive",
		"TRPG sessions, logged",
	],
} as const;

export const xUrl = `https://x.com/${site.x}`;

export type NavItem = {
	no: string;
	label: string;
	en: string;
	href: string;
	desc: string;
	status: "live" | "soon";
	// true면 공개 네비게이션(헤더/푸터/표지 목차)에서 숨김 — 어드민 전용.
	admin?: boolean;
};

// 네비게이션 = 잡지 목차. 순서/번호가 그대로 화면에 노출됨.
// 섹션을 추가/이동하려면 여기만 고치면 헤더·푸터·표지 목차가 전부 따라온다.
export const nav: NavItem[] = [
	{ no: "01", label: "표지", en: "Cover", href: "/", desc: "커버", status: "live" },
	{ no: "02", label: "방명록", en: "Guestbook", href: "/guestbook", desc: "댓글", status: "live" },
	{ no: "03", label: "캐릭터", en: "Characters", href: "/characters", desc: "관계", status: "live" },
	{ no: "04", label: "갤러리", en: "Gallery", href: "/gallery", desc: "사진 아카이브", status: "live" },
	{ no: "05", label: "세션", en: "Sessions", href: "/sessions", desc: "TRPG 기록 · 로그", status: "live" },
	{ no: "06", label: "배너", en: "Banners", href: "/banners", desc: "배너 교환 · 링크", status: "live" },
	{ no: "07", label: "로그", en: "Log", href: "/log", desc: "기록 · 잡담", status: "live" },
	{ no: "08", label: "일정", en: "Schedule", href: "/schedule", desc: "캘린더", status: "live" },
	{ no: "09", label: "소개", en: "About", href: "/about", desc: "성향표 · 자기소개", status: "live" },
	{ no: "00", label: "어드민", en: "Admin", href: "/admin", desc: "관리자 메뉴", status: "live", admin: true },
];

// 공개 네비게이션 — 헤더/푸터/표지 목차는 이걸 쓴다(어드민 제외).
export const publicNav: NavItem[] = nav.filter((n) => !n.admin);
