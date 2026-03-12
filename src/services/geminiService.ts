import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function solveMathProblem(problem: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are a mathematical expert. Solve the following math problem and provide a clear, step-by-step explanation. Problem: ${problem}`,
    config: {
      temperature: 0.1,
    },
  });

  return response.text;
}
