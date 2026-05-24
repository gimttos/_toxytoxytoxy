"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isOwner, tryUnlock, lock } from "@/lib/owner";
import {
	addRoomLink,
	deleteRoomLink,
	addNote,
	deleteNote,
} from "@/lib/admin";
import { setMeta, setBgm, clearBgm, MAX_BGM_BYTES } from "@/lib/meta";
import {
	uploadToLibrary,
	deleteFromLibrary,
	addPlacement,
	updatePlacement,
	removePlacement,
} from "@/lib/stickers";

function deny(): never {
	redirect(`/admin?err=${encodeURIComponent("권한이 없어요.")}`);
}

export async function unlockAdmin(formData: FormData) {
	const ok = await tryUnlock(String(formData.get("passphrase") ?? ""));
	revalidatePath("/admin");
	if (!ok)
		redirect(`/admin?err=${encodeURIComponent("패스워드가 맞지 않아요.")}`);
	redirect("/admin?owner=1");
}

export async function lockAdmin() {
	await lock();
	revalidatePath("/admin");
	redirect("/admin");
}

export async function addRoomLinkAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const res = await addRoomLink({
		label: String(formData.get("label") ?? ""),
		url: String(formData.get("url") ?? ""),
		system: String(formData.get("system") ?? ""),
		note: String(formData.get("note") ?? ""),
	});
	revalidatePath("/admin");
	if (!res.ok) redirect(`/admin?err=${encodeURIComponent(res.error)}`);
	redirect("/admin?owner=1");
}

export async function deleteRoomLinkAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deleteRoomLink(id);
	revalidatePath("/admin");
	redirect("/admin?owner=1");
}

export async function addNoteAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const res = await addNote({
		title: String(formData.get("title") ?? ""),
		body: String(formData.get("body") ?? ""),
	});
	revalidatePath("/admin");
	if (!res.ok) redirect(`/admin?err=${encodeURIComponent(res.error)}`);
	redirect("/admin?owner=1");
}

export async function deleteNoteAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deleteNote(id);
	revalidatePath("/admin");
	redirect("/admin?owner=1");
}

// ── 소품 (한마디 · BGM) — 표지에 노출되므로 / 도 재검증 ──

export async function setStatusAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const status = String(formData.get("status") ?? "").trim();
	await setMeta("status", status || null);
	revalidatePath("/admin");
	revalidatePath("/");
	redirect("/admin?owner=1");
}

export async function uploadBgmAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const file = formData.get("bgm");
	if (!(file instanceof File) || file.size === 0) {
		redirect(`/admin?err=${encodeURIComponent("오디오 파일을 골라 주세요.")}`);
	}
	if (!file.type.startsWith("audio/")) {
		redirect(`/admin?err=${encodeURIComponent("오디오 파일만 올릴 수 있어요.")}`);
	}
	if (file.size > MAX_BGM_BYTES) {
		redirect(`/admin?err=${encodeURIComponent("BGM이 너무 커요 (최대 12MB).")}`);
	}
	await setBgm(file, String(formData.get("bgm_title") ?? ""));
	revalidatePath("/admin");
	revalidatePath("/");
	redirect("/admin?owner=1");
}

export async function clearBgmAction() {
	if (!(await isOwner())) deny();
	await clearBgm();
	revalidatePath("/admin");
	revalidatePath("/");
	redirect("/admin?owner=1");
}

// ── 스티커 라이브러리 (오너 전용) ──

export async function uploadStickerAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const file = formData.get("file");
	if (!(file instanceof File)) {
		redirect(`/admin?err=${encodeURIComponent("스티커 파일을 골라 주세요.")}`);
	}
	const res = await uploadToLibrary(file, String(formData.get("label") ?? ""));
	revalidatePath("/admin");
	if (!res.ok) redirect(`/admin?err=${encodeURIComponent(res.error)}`);
	redirect("/admin?owner=1");
}

export async function deleteStickerAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deleteFromLibrary(id);
	revalidatePath("/admin");
	// 배치가 사이트 전체에 흩어져 있으니 보수적으로 / 도 재검증.
	revalidatePath("/");
	redirect("/admin?owner=1");
}

// ── 스티커 배치 (꾸미기 모드에서 사용) ──

export async function addPlacementAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const res = await addPlacement({
		stickerId: Number(formData.get("stickerId")),
		surface: String(formData.get("surface") ?? ""),
		x_pct: Number(formData.get("x_pct") ?? 40),
		y_pct: Number(formData.get("y_pct") ?? 40),
		w_pct: Number(formData.get("w_pct") ?? 18),
		rot: Number(formData.get("rot") ?? 0),
		z: Number(formData.get("z") ?? 0),
	});
	const back = String(formData.get("back") ?? "/");
	if (!res.ok) {
		redirect(`${back}?err=${encodeURIComponent(res.error)}&edit=1`);
	}
	revalidatePath(back);
	redirect(`${back}?edit=1`);
}

export async function updatePlacementAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (!Number.isFinite(id)) return;
	const patch: { x_pct?: number; y_pct?: number; w_pct?: number; rot?: number; z?: number } = {};
	const x = formData.get("x_pct");
	const y = formData.get("y_pct");
	const w = formData.get("w_pct");
	const r = formData.get("rot");
	const z = formData.get("z");
	if (x !== null) patch.x_pct = Number(x);
	if (y !== null) patch.y_pct = Number(y);
	if (w !== null) patch.w_pct = Number(w);
	if (r !== null) patch.rot = Number(r);
	if (z !== null) patch.z = Number(z);
	await updatePlacement(id, patch);
	const back = String(formData.get("back") ?? "/");
	revalidatePath(back);
}

export async function removePlacementAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await removePlacement(id);
	const back = String(formData.get("back") ?? "/");
	revalidatePath(back);
	redirect(`${back}?edit=1`);
}
