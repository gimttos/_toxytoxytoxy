"use client";

import { useEffect, useRef, useState } from "react";

// 갠홈 BGM 토글 — 기본 OFF(자동재생 안 함, 민폐 방지).
// 사용자가 켜면 localStorage 에 기억하고 다음 방문 때 알아서 재생 시도.
export function BgmToggle({
	src,
	title,
}: {
	src: string | null;
	title: string | null;
}) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [on, setOn] = useState(false);

	useEffect(() => {
		if (!src) return;
		const want = localStorage.getItem("bgm") === "on";
		if (want && audioRef.current) {
			audioRef.current.volume = 0.4;
			audioRef.current.play().then(
				() => setOn(true),
				() => setOn(false), // 브라우저가 막으면 OFF 상태 유지
			);
		}
	}, [src]);

	if (!src) return null;

	function toggle() {
		const el = audioRef.current;
		if (!el) return;
		if (on) {
			el.pause();
			setOn(false);
			localStorage.setItem("bgm", "off");
		} else {
			el.volume = 0.4;
			el.play().then(
				() => {
					setOn(true);
					localStorage.setItem("bgm", "on");
				},
				() => setOn(false),
			);
		}
	}

	return (
		<span className="inline-flex items-center gap-2">
			<audio ref={audioRef} src={src} loop preload="none" />
			<button
				type="button"
				onClick={toggle}
				aria-pressed={on}
				className="kicker border rule px-3 py-1 hover:bg-ink hover:text-paper transition-colors"
			>
				{on ? "♪ BGM 끄기" : "♪ BGM 켜기"}
			</button>
			{title && <span className="kicker text-muted">{title}</span>}
		</span>
	);
}
