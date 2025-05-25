// pages/api/openai-decode.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { deobfuscateWithOpenAI } from "../../lib/openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = (req as any).body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const decoded = await deobfuscateWithOpenAI(code);
    res.status(200).json({ decoded });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Unknown error" });
  }
}
