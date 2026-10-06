import { useEffect, useState } from "react";

type Status = "checking" | "ok" | "error";

export function App() {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    // Through the Vite proxy, so this also proves the frontend can reach the API
    // the same way the real application's dev server does.
    fetch("/api/v1/health/db")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${String(response.status)}`);
        }
        return response.json() as Promise<{ database: string }>;
      })
      .then((body) => {
        setStatus("ok");
        setDetail(`database: ${body.database}`);
      })
      .catch((error: unknown) => {
        setStatus("error");
        setDetail(String(error));
      });
  }, []);

  const color = status === "ok" ? "#16a34a" : status === "error" ? "#dc2626" : "#666";

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", maxWidth: 640 }}>
      <h1>Environment Preflight</h1>
      <p>
        If you can read this and see a green check below, your machine can build and run the
        full stack — frontend, backend, and database all came up and can talk to each other.
      </p>
      <p style={{ fontSize: "1.5rem", color }}>
        {status === "ok"
          ? "✅ Stack is up"
          : status === "error"
            ? "❌ Stack check failed"
            : "⏳ Checking…"}
      </p>
      <pre style={{ color }}>{detail}</pre>
    </main>
  );
}
