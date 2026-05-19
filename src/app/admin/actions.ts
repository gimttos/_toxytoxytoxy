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

function deny(): never {
	redirect(`/admin?err=${encodeURIComponent("권한이 없어요.")}`);
}

export async function unlockAdmin(formData: FormData) {
	const ok = await tryUnlock(String(formData.get("passphrase") ?? ""));
	revalidatePath("/admin");
	if (!ok)
		redirect(`/admin?err=${encodeURIComponent("패스프레이즈가 맞지 않아요.")}`);
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
