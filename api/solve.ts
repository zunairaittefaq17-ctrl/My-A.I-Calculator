import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { problem } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(401).json({ 
        error: "API_KEY_MISSING", 
        message: "Gemini API Key is missing. Please add GEMINI_API_KEY to your Vercel Environment Variables." 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are a mathematical expert. Solve the following math problem and provide a clear, step-by-step explanation. Problem: ${problem}`,
      config: { temperature: 0.1 },
    });

    res.status(200).json({ text: response.text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "FAILED", message: "The AI service encountered an error." });
  }
}
