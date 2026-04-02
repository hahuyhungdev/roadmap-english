/**
 * Shared Google TTS Client — Reusable across routes
 *
 * Configuration optimized for shadowing/speech practice:
 * - Chirp3-HD voices (highest quality)
 * - effectsProfileId: headphone-class-device (richer audio)
 * - speakingRate: passed to API so speed is baked into audio (no client-side distortion)
 */

export const GOOGLE_TTS_CONFIG = {
  audioEncoding: "MP3" as const,
  effectsProfileId: ["headphone-class-device"],
};

/**
 * Call Google TTS API directly (server-side only)
 *
 * @param speed — speakingRate (0.25–4.0). Baked into the audio by Google.
 */
export async function callGoogleTTS(
  apiKey: string,
  text: string,
  voiceName: string,
  speed = 1.0,
): Promise<string> {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "en-US",
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: GOOGLE_TTS_CONFIG.audioEncoding,
          effectsProfileId: GOOGLE_TTS_CONFIG.effectsProfileId,
          speakingRate: speed,
          pitch: 0,
        },
      }),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Google TTS request failed");
  }

  if (!data.audioContent) {
    throw new Error("No audio content returned from Google TTS");
  }

  return data.audioContent as string;
}
