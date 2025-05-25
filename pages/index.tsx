// pages/index.tsx
import { useState, useEffect } from "react";
import { deobfuscateLocal } from "../lib/webcrack-wrapper";
import axios from "axios";
import Link from "next/link";

export default function Home() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<"local" | "openai">("local");
  const [error, setError] = useState<string | null>(null);

  // سجل الاستخدام في localStorage
  useEffect(() => {
    if (output) {
      const history = JSON.parse(localStorage.getItem("history") || "[]");
      localStorage.setItem(
        "history",
        JSON.stringify([{ input: code, output, method, timestamp: Date.now() }, ...history].slice(0, 30))
      );
    }
  }, [output]);

  async function handleDecode() {
    setError(null);
    setOutput("");
    setLoading(true);
    try {
      if (method === "local") {
        const decoded = await deobfuscateLocal(code);
        setOutput(decoded);
      } else {
        const response = await axios.post("/api/openai-decode", { code });
        setOutput(response.data.decoded);
      }
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء فك التشفير");
    }
    setLoading(false);
  }

  return (
    <main className="container">
      <header>
        <h1>TARBOO Deobfuscate</h1>
        <nav>
          <Link href="/history">سجل الاستخدام</Link>
        </nav>
      </header>

      <section>
        <label>ألصق الكود المشفر هنا:</label>
        <textarea
          className="code-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={10}
          placeholder="أدخل كود Node.js المشفر أو المشوش"
        />

        <div className="method-select">
          <label>
            <input
              type="radio"
              checked={method === "local"}
              onChange={() => setMethod("local")}
            />
            فك تشفير محلي (سريع، بدون إنترنت)
          </label>
          <label>
            <input
              type="radio"
              checked={method === "openai"}
              onChange={() => setMethod("openai")}
            />
            فك تشفير OpenAI (أكثر دقة، يحتاج إنترنت)
          </label>
        </div>

        <button onClick={handleDecode} disabled={loading || !code.trim()}>
          {loading ? "جاري فك التشفير..." : "فك التشفير"}
        </button>

        {error && <p className="error">{error}</p>}

        {output && (
          <>
            <label>النتيجة المفكوكة:</label>
            <pre className="code-output">{output}</pre>
          </>
        )}
      </section>
    </main>
  );
}
