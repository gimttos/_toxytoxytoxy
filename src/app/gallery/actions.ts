"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isOwner } from "@/lib/owner";
import {
	createAlbum,
	addImage,
	deleteImage,
	deleteAlbum,
	getAlbumBySlug,
} from "@/lib/gallery";

function deny(): never {
	redirect(`/gallery?err=${encodeURIComponent("권한이 없어요.")}`);
}

export async function createAlbumAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const res = await createAlbum({
		title: String(formData.get("title") ?? ""),
		slug: String(formData.get("slug") ?? ""),
		description: String(formData.get("description") ?? ""),
		kind: String(formData.get("kind") ?? "photo"),
	});
	revalidatePath("/gallery");
	if (!res.ok) redirect(`/gallery?err=${encodeURIComponent(res.error)}`);
	redirect("/gallery?owner=1");
}

export async function uploadImagesAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const albumId = Number(formData.get("albumId"));
	const slug = String(formData.get("slug") ?? "");
	const files = formData.getAll("files").filter((f): f is File => f instanceof File);
	const caption = String(formData.get("caption") ?? "");
	const tags = String(formData.get("tags") ?? "");

	const back = `/gallery/${slug}`;
	if (!Number.isFinite(albumId) || files.length === 0) {
		redirect(`${back}?err=${encodeURIComponent("올릴 이미지를 골라 주세요.")}`);
	}

	let okCount = 0;
	let lastErr = "";
	for (const file of files) {
		const r = await addImage({ albumId, file, caption, tags });
		if (r.ok) okCount++;
		else lastErr = r.error;
	}
	revalidatePath(back);
	if (okCount === 0) {
		redirect(`${back}?err=${encodeURIComponent(lastErr || "업로드 실패")}`);
	}
	redirect(`${back}?owner=1&ok=${okCount}`);
}

export async function deleteImageAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	const slug = String(formData.get("slug") ?? "");
	if (Number.isFinite(id)) await deleteImage(id);
	revalidatePath(`/gallery/${slug}`);
	redirect(`/gallery/${slug}?owner=1`);
}

export async function deleteAlbumAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	const slug = String(formData.get("slug") ?? "");
	// 존재 확인(이미 지워졌어도 무해)
	if (slug) await getAlbumBySlug(slug);
	if (Number.isFinite(id)) await deleteAlbum(id);
	revalidatePath("/gallery");
	redirect("/gallery?owner=1");
}
