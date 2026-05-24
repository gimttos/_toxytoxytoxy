"use client";

// 스티커 표면 컨텍스트 — 한 페이지 안 여러 StickerOverlay 인스턴스 사이의
// "지금 활성된 표면" 상태와 라이브러리 카탈로그를 공유.
//
// 활성 표면 결정 규칙:
// - 사용자가 어떤 surface 의 빈 영역을 클릭하면 그 surface 가 active 가 됨.
// - 페이지 첫 마운트 시 가장 먼저 register 된 surface 가 default active.
// - readonly 모드에선 context 가 없어도 됨 (StickerOverlay 도 readonly 분기에선 안 씀).

import { createContext, useCallback, useContext, useState } from "react";
import type { StickerLib } from "@/lib/stickers";

type Ctx = {
	activeSurface: string | null;
	setActiveSurface: (surface: string) => void;
	registerSurface: (surface: string) => void;
	library: StickerLib[];
	back: string;
};

const StickerSurfaceContext = createContext<Ctx | null>(null);

export function StickerSurfaceProvider({
	library,
	back,
	children,
}: {
	library: StickerLib[];
	back: string;
	children: React.ReactNode;
}) {
	const [activeSurface, setActiveSurfaceState] = useState<string | null>(null);

	const setActiveSurface = useCallback((surface: string) => {
		setActiveSurfaceState(surface);
	}, []);

	// 첫 register 되는 surface 를 default active 로.
	const registerSurface = useCallback((surface: string) => {
		setActiveSurfaceState((prev) => prev ?? surface);
	}, []);

	return (
		<StickerSurfaceContext.Provider
			value={{ activeSurface, setActiveSurface, registerSurface, library, back }}
		>
			{children}
		</StickerSurfaceContext.Provider>
	);
}

// 옵션 컨슈머 — readonly 페이지에선 Provider 없이도 그냥 null 돌려줌.
export function useStickerSurface(): Ctx | null {
	return useContext(StickerSurfaceContext);
}
