"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isOwner } from "@/lib/owner";
import {
	addMyBanner,
	deleteMyBanner,
	addFriendLink,
	deleteFriendLink,
} from "@/lib/banners";

function deny(): never {
	redirect(`/banners?err=${encodeURIComponent("권한이 없어요.")}`);
}

export async function addMyBannerAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const file = formData.get("file");
	if (!(file instanceof File)) {
		redirect(`/banners?err=${encodeURIComponent("배너 이미지를 골라 주세요.")}`);
	}
	const res = await addMyBanner({
		file,
		label: String(formData.get("label") ?? ""),
		width: String(formData.get("width") ?? ""),
		height: String(formData.get("height") ?? ""),
	});
	revalidatePath("/banners");
	if (!res.ok) redirect(`/banners?err=${encodeURIComponent(res.error)}`);
	redirect("/banners?owner=1");
}

export async function deleteMyBannerAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deleteMyBanner(id);
	revalidatePath("/banners");
	redirect("/banners?owner=1");
}

export async function addFriendLinkAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const imgFile = formData.get("imgFile");
	const res = await addFriendLink({
		label: String(formData.get("label") ?? ""),
		url: String(formData.get("url") ?? ""),
		imgFile: imgFile instanceof File ? imgFile : null,
		imgUrl: String(formData.get("imgUrl") ?? ""),
	});
	revalidatePath("/banners");
	if (!res.ok) redirect(`/banners?err=${encodeURIComponent(res.error)}`);
	redirect("/banners?owner=1");
}

export async function deleteFriendLinkAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deleteFriendLink(id);
	revalidatePath("/banners");
	redirect("/banners?owner=1");
}
