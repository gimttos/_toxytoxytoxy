"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isOwner, tryUnlock, lock } from "@/lib/owner";
import {
	saveCombo,
	deleteSaved,
	addWord,
	removeWord,
	addTwist,
	removeTwist,
	type DrawnWord,
} from "@/lib/inspire";

function deny(): never {
	redirect(`/inspire?err=${encodeURIComponent("권한이 없어요.")}`);
}

// ── 잠금 ──────────────────────────────────────────────────────

export async function unlockInspire(formData: FormData) {
	const ok = await tryUnlock(String(formData.get("passphrase") ?? ""));
	revalidatePath("/inspire");
	if (!ok)
		redirect(`/inspire?err=${encodeURIComponent("패스워드가 맞지 않아요.")}`);
	redirect("/inspire?owner=1");
}

export async function lockInspire() {
	await lock();
	revalidatePath("/inspire");
	redirect("/inspire");
}

// ── 저장 (클라이언트 덱 — useActionState) ─────────────────────

export type SaveState = { ok: boolean; error?: string; nonce: number };

export async function saveComboAction(
	prev: SaveState,
	formData: FormData,
): Promise<SaveState> {
	if (!(await isOwner()))
		return { ok: false, error: "권한이 없어요.", nonce: prev.nonce + 1 };
	let words: DrawnWord[] = [];
	try {
		const parsed = JSON.parse(String(formData.get("words") ?? "[]"));
		if (Array.isArray(parsed)) words = parsed;
	} catch {
		/* 빈 조합으로 처리 */
	}
	const res = await saveCombo({
		words,
		twist: String(formData.get("twist") ?? ""),
		memo: String(formData.get("memo") ?? ""),
	});
	revalidatePath("/inspire");
	return res.ok
		? { ok: true, nonce: prev.nonce + 1 }
		: { ok: false, error: res.error, nonce: prev.nonce + 1 };
}

export async function deleteSavedAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deleteSaved(id);
	revalidatePath("/inspire");
	redirect("/inspire?owner=1");
}

// ── 풀 큐레이션 ───────────────────────────────────────────────

export async function addWordAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const res = await addWord({
		word: String(formData.get("word") ?? ""),
		tag: String(formData.get("tag") ?? ""),
	});
	revalidatePath("/inspire");
	if (!res.ok) redirect(`/inspire?err=${encodeURIComponent(res.error)}`);
	redirect("/inspire?owner=1");
}

export async function removeWordAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const word = String(formData.get("word") ?? "").trim();
	if (word) await removeWord(word);
	revalidatePath("/inspire");
	redirect("/inspire?owner=1");
}

export async function addTwistAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const res = await addTwist(String(formData.get("text") ?? ""));
	revalidatePath("/inspire");
	if (!res.ok) redirect(`/inspire?err=${encodeURIComponent(res.error)}`);
	redirect("/inspire?owner=1");
}

export async function removeTwistAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const text = String(formData.get("text") ?? "").trim();
	if (text) await removeTwist(text);
	revalidatePath("/inspire");
	redirect("/inspire?owner=1");
}
