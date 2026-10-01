import { HttpError } from "@/lib/errors";

/** Wraps route handlers so every failure becomes a clear JSON error message. */
export function route<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ ok: false, error: err.message }, { status: err.status });
      }
      console.error("[api]", err);
      return Response.json(
        { ok: false, error: "تعذّر الاتصال بقاعدة البيانات أو حدث خطأ غير متوقع. حاول مرة أخرى." },
        { status: 500 },
      );
    }
  };
}

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, data }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object") return body as Record<string, unknown>;
  } catch {
    /* fallthrough */
  }
  throw new HttpError(400, "البيانات المرسلة غير صالحة");
}

/** Client-side helper used by forms. */
export async function callApi<T = unknown>(
  url: string,
  options: { method?: string; body?: unknown; formData?: FormData } = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method: options.method ?? "POST",
      headers: options.formData ? undefined : { "Content-Type": "application/json" },
      body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    });
    const json = (await res.json().catch(() => null)) as
      | { ok: true; data: T }
      | { ok: false; error: string }
      | null;
    if (!json) return { ok: false, error: "استجابة غير متوقعة من الخادم" };
    return json;
  } catch {
    return { ok: false, error: "تعذّر الاتصال بالخادم. تحقق من اتصال الإنترنت." };
  }
}
