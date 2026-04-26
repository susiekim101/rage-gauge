import { File } from "expo-file-system";

export interface RageAnalysis {
  emotions: string[];
  rageLevel: 1 | 2 | 3 | 4 | 5;
  honks: number;
  slams: number;
  transcription: string;
}

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const PROMPT = `Analyze this audio for road rage. Respond with ONLY valid JSON, no other text:
{
  "emotions": ["emotion1"],
  "rageLevel": 1,
  "honks": 0,
  "slams": 0,
  "transcription": "what was said"
}
rageLevel is 1 (calm) to 5 (unhinged rage). Count actual car honks and dashboard/steering wheel slams.`;

export async function analyzeAudio(uri: string): Promise<RageAnalysis> {
  const file = new File(uri);
  const base64 = await file.base64();

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: "audio/wav", data: base64 } },
            { text: PROMPT },
          ],
        },
      ],
    }),
  });

  const data = await res.json();
  console.log("[gemini raw]", JSON.stringify(data).slice(0, 500));
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  console.log("[gemini text]", text);
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match?.[0] ?? "{}") as RageAnalysis;
}
