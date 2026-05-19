"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isOwner } from "@/lib/owner";
import { ensureFresh, addMemo, deleteMemo } from "@/lib/schedule";

function deny(): never {
	redirect(`/schedule?err=${encodeURIComponent("권한이 없어요.")}`);
}

export async function refreshScheduleAction() {
	if (!(await isOwner())) deny();
	const st = await ensureFresh(true);
	revalidatePath("/schedule");
	if (st.configured && !st.ok) {
		redirect(`/schedule?err=${encodeURIComponent(st.error)}`);
	}
	redirect("/schedule?owner=1");
}

export async function addMemoAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const ok = await addMemo(
		String(formData.get("on_date") ?? ""),
		String(formData.get("body") ?? ""),
	);
	revalidatePath("/schedule");
	if (!ok) {
		redirect(`/schedule?err=${encodeURIComponent("날짜와 메모를 확인해 주세요.")}`);
	}
	redirect("/schedule?owner=1");
}

export async function deleteMemoAction(formData: FormData) {
	if (!(await isOwner())) deny();
	const id = Number(formData.get("id"));
	if (Number.isFinite(id)) await deleteMemo(id);
	revalidatePath("/schedule");
	redirect("/schedule?owner=1");
}
