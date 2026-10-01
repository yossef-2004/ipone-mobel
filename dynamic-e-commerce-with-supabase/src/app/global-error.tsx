"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ background: "#07080d", color: "#fff", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 24 }}>حدث خطأ غير متوقع</h1>
          <p style={{ opacity: 0.6 }}>نعتذر عن ذلك، يرجى المحاولة مرة أخرى.</p>
          <button
            onClick={reset}
            style={{ marginTop: 12, padding: "10px 24px", borderRadius: 999, border: 0, background: "#7c5cff", color: "#fff", cursor: "pointer" }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
