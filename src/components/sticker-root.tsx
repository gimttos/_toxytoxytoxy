// 스티커 루트 — 페이지 최상단을 감싸 SurfaceContext Provider + 라이브러리 트레이 마운트.
// editable(오너 + ?edit=1) 일 때만 트레이가 뜸. readonly 모드에선 Provider 도 생략 가능하지만,
// 페이지 코드 단순화를 위해 항상 감싸도 됨 (Provider 자체는 가볍다).

import { isOwner } from "@/lib/owner";
import { listLibrary } from "@/lib/stickers";
import { StickerSurfaceProvider } from "./sticker-surface-context";
import { StickerTray } from "./sticker-tray";

export async function StickerRoot({
	edit,
	back,
	children,
}: {
	edit: boolean;
	back: string;
	children: React.ReactNode;
}) {
	const owner = await isOwner();
	const editable = owner && edit;

	if (!editable) {
		// readonly 페이지엔 Provider 없이도 됨.
		return <>{children}</>;
	}

	const library = await listLibrary();
	return (
		<StickerSurfaceProvider library={library} back={back}>
			{children}
			<StickerTray />
		</StickerSurfaceProvider>
	);
}
