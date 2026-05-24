// 배경 장식 영어 단어 — Homemade Apple 손글씨로 페이지 모서리에 옅게 흩뿌림.
// pointer-events 없음 → 본문 클릭 막지 않음.
// 단어 문자열은 페이지에서 결정 — 이 컴포넌트는 골격만.

export type DecoWord = {
	text: string;
	x: string;      // CSS left, 예: "8%", "-2rem"
	y: string;      // CSS top
	rot?: number;   // deg, 기본 0
	size?: string;  // CSS font-size, 기본 "4rem"
	opacity?: number; // 기본 0.12
};

export function DecoWords({ words }: { words: DecoWord[] }) {
	if (words.length === 0) return null;
	return (
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0 overflow-hidden"
			style={{ zIndex: 0 }}
		>
			{words.map((w, i) => (
				<span
					key={i}
					style={{
						position: "absolute",
						left: w.x,
						top: w.y,
						transform: `rotate(${w.rot ?? 0}deg)`,
						fontFamily: "var(--font-deco)",
						fontSize: w.size ?? "4rem",
						color: "var(--color-accent)",
						opacity: w.opacity ?? 0.12,
						userSelect: "none",
						whiteSpace: "nowrap",
						lineHeight: 1,
					}}
				>
					{w.text}
				</span>
			))}
		</div>
	);
}
