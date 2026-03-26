import crypto from "crypto";

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
  review?: any;
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

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

function getEnv(name: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[name];
}

const COACH_SYSTEM_PROMPT = `You are an English Speaking Coach. Listen to the transcript below and respond naturally like a human partner. Provide conversational feedback and, when appropriate, include a JSON "Review" block inside a fenced code block with the language label 'review' exactly as shown. The Review must contain these fields: original_transcript, corrected_version, explanation, better_alternatives.

Example of the Review block (must be a single JSON object):
```review
{
  "original_transcript": "...",
  "corrected_version": "...",
  "explanation": "...",
  "better_alternatives": ["...","..."]
}
```

If the user's speech is already natural and fluent, skip the Review block and respond conversationally.`;

async function createGoogleAccessToken(serviceAccountJson: string) {
  try {
    const sa = JSON.parse(serviceAccountJson);
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;
    const header = { alg: "RS256", typ: "JWT" };
    const claim = {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp,
      iat,
    };

    const enc = (obj: any) => Buffer.from(JSON.stringify(obj)).toString("base64url");
    const unsigned = `${enc(header)}.${enc(claim)}`;
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(unsigned);
    const signature = sign.sign(sa.private_key, "base64url");
    const jwt = `${unsigned}.${signature}`;

    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(jwt)}`,
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Google token error: ${resp.status} ${txt}`);
    }

    const data = await resp.json();
    return data.access_token as string | undefined;
  } catch (err) {
    console.error("createGoogleAccessToken error", err);
    return undefined;
  }
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = getEnv("DEEPSEEK_API_KEY");
  if (!apiKey) return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });

  const body = req.body ?? {};
  const transcript = (body.transcript ?? "").trim();
  const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];
  const topic = (body.topic ?? "").trim();

  if (!transcript) return res.status(400).json({ error: "transcript is required" });

  const topicLine = topic ? `Current topic: ${topic}\n` : "";

  const messages: ChatMessage[] = [
    { role: "system", content: COACH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `${topicLine}User's most recent speech:\n"${transcript}"\n\nRespond as their English coach.`,
    },
  ];

  try {
    const upstream = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "deepseek-v3", temperature: 0.6, messages }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.error?.message || "DeepSeek API request failed" });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "Empty response from DeepSeek" });

    // Try to extract review JSON from fenced code block ```review ... ```
    const reviewMatch = reply.match(/```review\s*([\s\S]*?)\s*```/i);
    let reviewObj: any = undefined;
    if (reviewMatch) {
      try {
        reviewObj = JSON.parse(reviewMatch[1]);
      } catch (err) {
        // ignore parse error
        console.warn("Failed to parse review JSON", err);
      }
    }

    let audioContent: string | undefined = undefined;
    // Prefer simple API-key-based TTS if provided, otherwise fall back to
    // service account JWT OAuth flow.
    const googleApiKey = getEnv("GOOGLE_TTS_API_KEY");
    if (reviewObj?.corrected_version) {
      if (googleApiKey) {
        try {
          const ttsResp = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(
              googleApiKey,
            )}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                input: { text: reviewObj.corrected_version },
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
    }

    return res.status(200).json({ reply, review: reviewObj, audioContent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to call DeepSeek API" });
  }
}
