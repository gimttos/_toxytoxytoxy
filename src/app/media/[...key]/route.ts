// R2(MEDIA) 오브젝트 서빙. 퍼블릭 버킷이 아니라 이 라우트가 게이트.
// 예: <img src="/media/gallery/3/uuid.jpg">

import { getMedia } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ key: string[] }> },
) {
	const { key } = await params;
	const objectKey = key.map(decodeURIComponent).join("/");

	const obj = await getMedia().get(objectKey);
	if (!obj) return new Response("Not found", { status: 404 });

	const headers = new Headers();
	obj.writeHttpMetadata(headers);
	headers.set("etag", obj.httpEtag);
	headers.set("cache-control", "public, max-age=31536000, immutable");
	if (!headers.has("content-type")) {
		headers.set(
			"content-type",
			obj.httpMetadata?.contentType ?? "application/octet-stream",
		);
	}
	return new Response(obj.body, { headers });
}
