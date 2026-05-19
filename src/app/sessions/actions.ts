"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isOwner } from "@/lib/owner";
import {
	createSession,
	updateSession,
	deleteSession,
	addLog,
	setLogVisibility,
	deleteLog,
	type SessionInput,
} from "@/lib/sessions";

function deny(): never {
	redirect(`/sessions?err=${encodeURIComponent("권한이 없어요.")}`);
}

function sessionFields(fd: FormData): SessionInput {
	return {
		title: String(fd.get("title") ?? ""),
		slug: String(fd.get("slug") ?? ""),
		system: String(fd.get("system") ?? ""),
		played_on: String(fd.get("played_on") ?? ""),
		party: String(fd.get("party") ?? ""),
		role: String(fd.get("role") ?? ""),
		result: String(fd.get("result") ?? ""),
		review: String(fd.get("review") ?? ""),
		tags: String(fd.get("tags") ?? ""),
	};
}

export async function createSessionAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const res = await createSession(sessionFields(formData));
	revalidatePath("/sessions");
	if (!res.ok) redirect(`/sessions?err=${encodeURIComponent(res.error)}`);
	redirect("/sessions?owner=1");
}

export async function updateSessionAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	const slug = String(formData.get("slug") ?? "");
	const back = `/sessions/${slug}`;
	const res = await updateSession(id, sessionFields(formData));
	revalidatePath(back);
	if (!res.ok) redirect(`${back}?err=${encodeURIComponent(res.error)}`);
	redirect(`${back}?owner=1`);
}

export async function deleteSessionAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deleteSession(id);
	revalidatePath("/sessions");
	redirect("/sessions?owner=1");
}

export async function addLogAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const sessionId = Number(formData.get("sessionId"));
	const slug = String(formData.get("slug") ?? "");
	const back = `/sessions/${slug}`;
	const res = await addLog({
		sessionId,
		title: String(formData.get("title") ?? ""),
		format: String(formData.get("format") ?? "text"),
		visibility: String(formData.get("visibility") ?? "private"),
		body: String(formData.get("body") ?? ""),
	});
	revalidatePath(back);
	if (!res.ok) redirect(`${back}?err=${encodeURIComponent(res.error)}`);
	redirect(`${back}?owner=1`);
}

export async function toggleLogVisibilityAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	const slug = String(formData.get("slug") ?? "");
	const next = formData.get("to") === "public" ? "public" : "private";
	if (Number.isFinite(id)) await setLogVisibility(id, next);
	revalidatePath(`/sessions/${slug}`);
	redirect(`/sessions/${slug}?owner=1`);
}

export async function deleteLogAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	const slug = String(formData.get("slug") ?? "");
	if (Number.isFinite(id)) await deleteLog(id);
	revalidatePath(`/sessions/${slug}`);
	redirect(`/sessions/${slug}?owner=1`);
}
