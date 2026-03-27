// no external crypto usage required

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

type Review = {
  original_transcript?: string;
  corrected_version?: string;
  explanation?: string;
  better_alternatives?: string[];
};

type JsonResponse = {
  error?: string;
  reply?: string;
  review?: Review;
  audioContent?: string; // base64 mp3
};

type VercelLikeRequest = {
  method?: string;
  body?: RequestBody;
};

type VercelLikeResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { json: (data: JsonResponse) => void };
};

function normalizeSpacedTranscript(text: string): string {
  if (!text) return text;
  // 1) Normalize whitespace
  let s = text.replace(/\s+/g, " ").trim();
  // 2) Remove spaces before punctuation
  s = s.replace(/\s+([.,!?;:])/g, "$1");

  // 3) Join runs of single-letter tokens (e.g., "H e l l o" -> "Hello")
  s = s.replace(/\b(?:([A-Za-z])\s+){1,}([A-Za-z])\b/g, (m) => {
    return m.replace(/\s+/g, "");
  });

  // 4) Join short splits where a long token is followed by a very short token
  //    (fixes cases like "Hell o" -> "Hello"). This is heuristic.
  s = s
    .split(" ")
    .reduce((acc: string[], tok) => {
      const prev = acc[acc.length - 1];
      const raw = tok.replace(/[.,!?;:]$/g, "");
      if (
        prev &&
        prev.replace(/[.,!?;:]$/g, "").length >= 3 &&
        raw.length <= 1 &&
        /^[A-Za-z]+$/.test(raw)
      ) {
        // merge into previous token
        acc[acc.length - 1] =
          prev + raw + (/[.,!?;:]$/.test(tok) ? tok.slice(-1) : "");
      } else {
        acc.push(tok);
      }
      return acc;
    }, [] as string[])
    .join(" ");

  // Final cleanup: collapse accidental joins like "Canyou" into "Can you" is hard
  // heuristically ensure spacing around punctuation and keep single space separators.
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

function getEnv(name: string): string | undefined {
  const env = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env;
  return env?.[name];
}

const COACH_SYSTEM_PROMPT = `You are an English Speaking Coach. Listen to the transcript below and respond naturally like a human partner. Provide conversational feedback and, when appropriate, include a JSON "Review" block inside a fenced code block with the language label 'review' exactly as shown. The Review must contain these fields: original_transcript, corrected_version, explanation, better_alternatives.

Example of the Review block (must be a single JSON object):
${"```review"}
{
  "original_transcript": "...",
  "corrected_version": "...",
  "explanation": "...",
  "better_alternatives": ["...","..."]
}
${"```"}

If the user's speech is already natural and fluent, skip the Review block and respond conversationally.`;

export default async function handler(
  req: VercelLikeRequest,
  res: VercelLikeResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Accept either VITE_* (for local Vite setups) or plain DEEPSEEK_API_KEY env var
  const apiKey = getEnv("VITE_DEEPSEEK_API_KEY") || getEnv("DEEPSEEK_API_KEY");
  if (!apiKey)
    return res
      .status(500)
      .json({ error: "Missing VITE_DEEPSEEK_API_KEY or DEEPSEEK_API_KEY" });

  const body = req.body ?? {};
  const transcript = (body.transcript ?? "").trim();
  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history
    : [];
  const topic = (body.topic ?? "").trim();

  if (!transcript)
    return res.status(400).json({ error: "transcript is required" });

  const topicLine = topic ? `Current topic: ${topic}\n` : "";

  const messages: ChatMessage[] = [
    { role: "system", content: COACH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `${topicLine}User's most recent speech:\n"${transcript}"\n\nRespond as their English coach.`,
    },
  ];

  // Allow overriding the model via env var. Use DeepSeek-compatible model names
  // e.g. "deepseek-chat" or "deepseek-reasoner" (DeepSeek V3.2 variants).
  const model =
    getEnv("VITE_DEEPSEEK_MODEL") ||
    getEnv("DEEPSEEK_MODEL") ||
    "deepseek-chat";

  // If a message history is provided, include it after the system prompt
  if (history.length) {
    messages.splice(1, 0, ...history);
  }

  try {
    const upstream = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        messages,
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      const errMsg =
        data?.error?.message ||
        data?.message ||
        JSON.stringify(data) ||
        "DeepSeek API request failed";
      console.warn("DeepSeek API error:", errMsg, data);
      return res.status(upstream.status).json({ error: errMsg });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply)
      return res.status(502).json({ error: "Empty response from DeepSeek" });

    // Try to extract review JSON from fenced code block ```review ... ```
    const reviewMatch = reply.match(/```review\s*([\s\S]*?)\s*```/i);
    let reviewObj: Review | undefined = undefined;
    if (reviewMatch) {
      try {
        reviewObj = JSON.parse(reviewMatch[1]) as Review;
      } catch (err) {
        // ignore parse error
        console.warn("Failed to parse review JSON", err);
      }
    }

    let audioContent: string | undefined = undefined;
    // Prefer simple API-key-based TTS if provided, otherwise fall back to
    // service account JWT OAuth flow. Accept either VITE_ or plain env var.
    const googleApiKey =
      getEnv("VITE_GOOGLE_TTS_API_KEY") || getEnv("GOOGLE_TTS_API_KEY");
    // Choose TTS input text: prefer the corrected version if present, otherwise use the reply.
    const ttsInputRaw = reviewObj?.corrected_version || reply || "";
    const ttsInput = normalizeSpacedTranscript(ttsInputRaw);
    if (ttsInput && googleApiKey) {
      try {
        const ttsResp = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(
            googleApiKey,
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input: { text: ttsInput },
              voice: { languageCode: "en-US", name: "en-US-Neural2-J" },
              audioConfig: { audioEncoding: "MP3" },
            }),
          },
        );

        const ttsData = await ttsResp.json();
        if (ttsResp.ok && ttsData?.audioContent) {
          audioContent = ttsData.audioContent; // base64
        } else {
          console.warn("TTS failed", ttsData);
        }
      } catch (err) {
        console.warn("TTS request error", err);
      }
    }

    return res.status(200).json({ reply, review: reviewObj, audioContent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to call DeepSeek API" });
  }
}
