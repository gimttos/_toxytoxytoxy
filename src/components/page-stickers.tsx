// 페이지 단위 스티커 오버레이 — 서버에서 라이브러리·배치 가져와 클라이언트에 전달.
// readonly: 배치가 0개면 아예 렌더 안 함 (DOM 비움).
// editable: 오너 + ?edit=1 일 때만.

import { isOwner } from "@/lib/owner";
import { listLibrary, listPlacements } from "@/lib/stickers";
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
	const [placements, library] = await Promise.all([
		listPlacements(surface),
		editable ? listLibrary() : Promise.resolve([]),
	]);
	if (!editable && placements.length === 0) return null;
	return (
		<StickerOverlay
			surface={surface}
			placements={placements}
			library={library}
			editable={editable}
			back={back}
		/>
	);
}
