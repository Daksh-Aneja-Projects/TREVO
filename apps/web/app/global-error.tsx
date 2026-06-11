"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#0A0A0A", color: "#F0F0F0" }}>
        <div className="text-center">
          <div style={{ fontFamily: "monospace", fontSize: "6rem", fontWeight: "bold", color: "#FF3B30", opacity: 0.3, marginBottom: "1rem" }}>500</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Something broke</h1>
          <p style={{ fontSize: "0.875rem", color: "#888888", marginBottom: "1.5rem" }}>An unexpected error occurred. Our team has been notified.</p>
          <button
            onClick={reset}
            style={{
              fontFamily: "system-ui", fontWeight: 600, fontSize: "0.875rem",
              backgroundColor: "#E8FF00", color: "#0A0A0A",
              padding: "0.625rem 1.5rem", border: "none", cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
