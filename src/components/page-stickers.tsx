// 페이지 단위 스티커 오버레이 — 서버에서 배치만 가져와 클라이언트에 전달.
// 라이브러리는 StickerRoot 가 페이지에 한 번만 로딩 (트레이 1개).
// readonly: 배치가 0개면 아예 렌더 안 함 (DOM 비움).
// editable: 오너 + ?edit=1 일 때만 — 배치 0개여도 영역 클릭으로 표면 활성화 가능하게 렌더.

import { isOwner } from "@/lib/owner";
import { listPlacements } from "@/lib/stickers";
import { StickerOverlay } from "./sticker-overlay";

export async function PageStickers({
	surface,
	edit,
	back,
}: {
	surface: string;
	edit: boolean;
	back: string;
}) {
	const owner = await isOwner();
	const editable = owner && edit;
	const placements = await listPlacements(surface);
	if (!editable && placements.length === 0) return null;
	return (
		<StickerOverlay
			surface={surface}
			placements={placements}
			editable={editable}
			back={back}
		/>
	);
}
