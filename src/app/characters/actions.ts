"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isOwner } from "@/lib/owner";
import {
	createCharacter,
	updateCharacter,
	setPortrait,
	deleteCharacter,
	addRelation,
	deleteRelation,
	type CharacterInput,
} from "@/lib/characters";

function deny(): never {
	redirect(`/characters?err=${encodeURIComponent("권한이 없어요.")}`);
}

function fields(fd: FormData): CharacterInput {
	return {
		name: String(fd.get("name") ?? ""),
		slug: String(fd.get("slug") ?? ""),
		name_en: String(fd.get("name_en") ?? ""),
		tagline: String(fd.get("tagline") ?? ""),
		profile: String(fd.get("profile") ?? ""),
		system: String(fd.get("system") ?? ""),
		stats: String(fd.get("stats") ?? ""),
		before_after: String(fd.get("before_after") ?? ""),
		tags: String(fd.get("tags") ?? ""),
	};
}

export async function createCharacterAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const res = await createCharacter(fields(formData));
	revalidatePath("/characters");
	if (!res.ok) redirect(`/characters?err=${encodeURIComponent(res.error)}`);
	redirect("/characters?owner=1");
}

export async function updateCharacterAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	const slug = String(formData.get("slug") ?? "");
	const back = `/characters/${slug}`;
	const res = await updateCharacter(id, fields(formData));
	revalidatePath(back);
	if (!res.ok) redirect(`${back}?err=${encodeURIComponent(res.error)}`);
	redirect(`${back}?owner=1`);
}

export async function uploadPortraitAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	const slug = String(formData.get("slug") ?? "");
	const back = `/characters/${slug}`;
	const file = formData.get("portrait");
	if (!(file instanceof File)) {
		redirect(`${back}?err=${encodeURIComponent("이미지를 골라 주세요.")}`);
	}
	const res = await setPortrait(id, file);
	revalidatePath(back);
	if (!res.ok) redirect(`${back}?err=${encodeURIComponent(res.error)}`);
	redirect(`${back}?owner=1`);
}

export async function deleteCharacterAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deleteCharacter(id);
	revalidatePath("/characters");
	redirect("/characters?owner=1");
}

export async function addRelationAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const aId = Number(formData.get("aId"));
	const bId = Number(formData.get("bId"));
	const slug = String(formData.get("slug") ?? "");
	const back = `/characters/${slug}`;
	const res = await addRelation({
		aId,
		bId,
		label: String(formData.get("label") ?? ""),
		note: String(formData.get("note") ?? ""),
	});
	revalidatePath(back);
	if (!res.ok) redirect(`${back}?err=${encodeURIComponent(res.error)}`);
	redirect(`${back}?owner=1`);
}

export async function deleteRelationAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	const slug = String(formData.get("slug") ?? "");
	if (Number.isFinite(id)) await deleteRelation(id);
	revalidatePath(`/characters/${slug}`);
	redirect(`/characters/${slug}?owner=1`);
}
