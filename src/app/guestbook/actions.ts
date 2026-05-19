"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createEntry, setHidden, deleteEntry } from "@/lib/guestbook";
import { isOwner } from "@/lib/owner";

function err(msg: string): never {
	redirect(`/guestbook?err=${encodeURIComponent(msg)}#sign`);
}

export async function signGuestbook(formData: FormData) {
	const h = await headers();
	const ip =
		h.get("cf-connecting-ip") ??
		h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		"0.0.0.0";

	const res = await createEntry({
		name: String(formData.get("name") ?? ""),
		body: String(formData.get("body") ?? ""),
		link: String(formData.get("link") ?? ""),
		mood: String(formData.get("mood") ?? ""),
		secret: formData.get("secret") === "on",
		honeypot: String(formData.get("website") ?? ""),
		ip,
	});

	revalidatePath("/guestbook");
	if (!res.ok) err(res.error);
	redirect("/guestbook?ok=1#entries");
}

export async function hideEntry(formData: FormData) {
	if (!(await isOwner())) err("권한이 없어요.");
	const id = Number(formData.get("id"));
	const hidden = formData.get("hidden") === "1";
	if (Number.isFinite(id)) await setHidden(id, hidden);
	revalidatePath("/guestbook");
	redirect("/guestbook?owner=1#entries");
}

export async function removeEntry(formData: FormData) {
	if (!(await isOwner())) err("권한이 없어요.");
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deleteEntry(id);
	revalidatePath("/guestbook");
	redirect("/guestbook?owner=1#entries");
}
