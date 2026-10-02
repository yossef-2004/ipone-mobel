import { hasSupabaseConfig, supabase } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasSupabaseConfig) {
    return Response.json({ ok: true, mode: "supabase-not-configured" });
  }

  try {
    const { error } = await supabase.from("products").select("id").limit(1);
    return Response.json({ ok: !error, mode: "supabase" }, { status: error ? 500 : 200 });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
