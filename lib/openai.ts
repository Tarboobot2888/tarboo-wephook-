// lib/openai.ts
import axios from "axios";

// مفتاح OpenAI مباشر
const OPENAI_API_KEY = "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";

export async function deobfuscateWithOpenAI(code: string): Promise<string> {
  const prompt = `
فك شفرة هذا الكود المشفر بجافاسكريبت node.js، وأعد كتابته بشكل واضح ومنسق:

${code}

أعد كتابة الكود المفكوك فقط بدون شرح.
  `;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 2000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content || "لم يتم فك التشفير.";
  } catch (error: any) {
    return "حدث خطأ أثناء استخدام OpenAI: " + (error.message || "غير معروف");
  }
}
