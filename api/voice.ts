/**
 * api/voice.ts — Vercel Serverless Function
 *
 * POST /api/voice
 * Body: { transcript: string; history: ChatMessage[]; topic?: string }
 * Returns: { reply: string }
 *
 * DeepSeek acts as an English Speaking Coach, optionally including a
 * structured JSON review block for the user's last utterance.
 *
 * Environment variables (set in Vercel dashboard or .env.local):
 *   DEEPSEEK_API_KEY  — DeepSeek API key
 *
 * API docs: https://api-docs.deepseek.com/
 */

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type RequestBody = {
  transcript?: string;
  history?: ChatMessage[];
  topic?: string;
};

type JsonResponse = {
  error?: string;
  reply?: string;
};

type VercelLikeRequest = {
  method?: string;
  body?: RequestBody;
};

type VercelLikeResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { json: (data: JsonResponse) => void };
};

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

function getEnv(name: string): string | undefined {
  const env = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env;
  return env?.[name];
}

// ─── Coach system prompt ─────────────────────────────────────────────────────

const COACH_SYSTEM_PROMPT = `You are an expert English Speaking Coach helping a professional prepare for career contexts — tech interviews, workplace meetings, client calls, and professional networking.

Your role:
- Listen to the user's spoken English transcript.
- Respond naturally and encouragingly, like a supportive human conversation partner.
- Build on what they said — ask follow-up questions, affirm good points, gently push them to expand.
- Keep responses conversational: 2–5 sentences for a typical turn. Adjust length to context.

When providing feedback, include a structured "Review" block so the UI can display corrections. Format it exactly like this — as a fenced code block:

\`\`\`review
{
  "original_transcript": "what the user actually said",
  "corrected_version": "the natural, grammatically correct version",
  "explanation": "brief explanation of what was corrected and why (1-2 sentences)",
  "better_alternatives": ["alternative 1", "alternative 2", "alternative 3"]
}
\`\`\`

Guidelines for the Review:
- "original_transcript": exactly what the user said (copy verbatim, including any errors).
- "corrected_version": use natural, high-frequency B2-level vocabulary. Avoid rare or overly academic words.
- "explanation": focus on the single most impactful correction (grammar, word choice, or phrasing).
- "better_alternatives": 2–3 short, conversational alternatives using common everyday English.

When the user says something already natural and fluent, skip the Review block and just respond conversationally.

IMPORTANT: The Review goes ONLY inside the code block above. The rest of your response should be normal conversational text.`;

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: VercelLikeRequest,
  res: VercelLikeResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = getEnv("DEEPSEEK_API_KEY");
  if (!apiKey) {
    return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });
  }

  const body = req.body ?? {};
  const transcript = (body.transcript ?? "").trim();
  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history
    : [];
  const topic = (body.topic ?? "").trim();

  if (!transcript) {
    return res.status(400).json({ error: "transcript is required" });
  }

  // Keep recent turns verbatim; drop older ones to stay within context window
  const recent = history.slice(-6); // last 3 exchanges
  const older = history.slice(0, -6);

  let contextBlock = "";
  if (older.length > 0) {
    contextBlock =
      older
        .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
        .join("\n") +
      "\n[Earlier turns — focus only on the most recent topic above]\n";
  }

  const topicLine = topic ? `Current topic: ${topic}\n` : "";

  const messages: ChatMessage[] = [
    { role: "system", content: COACH_SYSTEM_PROMPT },
    ...recent.slice(0, -1),
    {
      role: "user",
      content:
        `${topicLine}${contextBlock}` +
        `User's most recent speech:\n"${transcript}"\n\nRespond as their English coach.`,
    },
  ];

  try {
    const upstream = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 800,
        messages,
      }),
    });

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || "Claude API request failed",
      });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: "Empty response from DeepSeek" });
    }

    return res.status(200).json({ reply });
  } catch {
    return res.status(500).json({ error: "Failed to call DeepSeek API" });
  }
}
