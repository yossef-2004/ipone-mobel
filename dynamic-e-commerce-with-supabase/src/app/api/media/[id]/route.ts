import { readMedia } from "@/services/media";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  try {
    const size = new URL(req.url).searchParams.get("size") === "thumb" ? "thumb" : "full";
    const file = await readMedia(id, size);
    if (!file) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.contentType,
        // Content is immutable per id → cache aggressively for fast loads.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Server error", { status: 500 });
  }
}
