"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isOwner } from "@/lib/owner";
import { createPost, deletePost } from "@/lib/log";

function deny(): never {
	redirect(`/log?err=${encodeURIComponent("권한이 없어요.")}`);
}

export async function createPostAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const res = await createPost({
		kind: String(formData.get("kind") ?? "diary"),
		title: String(formData.get("title") ?? ""),
		body: String(formData.get("body") ?? ""),
		tags: String(formData.get("tags") ?? ""),
	});
	revalidatePath("/log");
	revalidatePath("/");
	if (!res.ok) redirect(`/log?err=${encodeURIComponent(res.error)}`);
	redirect("/log?owner=1");
}

export async function deletePostAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deletePost(id);
	revalidatePath("/log");
	revalidatePath("/");
	redirect("/log?owner=1");
}
