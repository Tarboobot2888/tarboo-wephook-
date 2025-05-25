// pages/history.tsx
import { useEffect, useState } from "react";
import Link from "next/link";

interface HistoryItem {
  input: string;
  output: string;
  method: string;
  timestamp: number;
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  function clearHistory() {
    localStorage.removeItem("history");
    setHistory([]);
  }

  return (
    <main className="container">
      <header>
        <h1>سجل الاستخدام</h1>
        <nav>
          <Link href="/">العودة لفك التشفير</Link>
        </nav>
      </header>

      <section>
        {history.length === 0 && <p>لا توجد سجلات حتى الآن.</p>}

        {history.map((item, idx) => (
          <article key={idx} className="history-item">
            <p><strong>الطريقة:</strong> {item.method}</p>
            <p><strong>التاريخ:</strong> {new Date(item.timestamp).toLocaleString()}</p>
            <details>
              <summary>عرض الكود الأصلي</summary>
              <pre>{item.input}</pre>
            </details>
            <details>
              <summary>عرض النتيجة المفكوكة</summary>
              <pre>{item.output}</pre>
            </details>
          </article>
        ))}

        {history.length > 0 && (
          <button onClick={clearHistory} className="clear-btn">
            مسح السجل
          </button>
        )}
      </section>
    </main>
  );
}
