"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
} from "react";
import type { YouTubeEvent } from "react-youtube";
import type { YTPlayer, Sentence, SessionOpts } from "../shared/types";
import { extractVideoId } from "../shared/utils";

// ─── Tactiq transcript parser ─────────────────────────────────────────────
function parseTimestampToMs(ts: string): number {
  const m = ts.match(/(\d+):(\d{2}):(\d{2})\.(\d{1,3})/);
  if (!m) return 0;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const sec = parseInt(m[3], 10);
  const ms = parseInt(m[4].padEnd(3, "0"), 10);
  return ((h * 60 + min) * 60 + sec) * 1000 + ms;
}

function parseTactiqTranscript(raw: string): Sentence[] | null {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const items: { startMs: number; text: string }[] = [];
  const tsRe = /^(\d{1,2}:\d{2}:\d{2}\.\d{1,3})\s+(.*)$/;

  for (const line of lines) {
    if (line.startsWith("#")) continue;
    const m = line.match(tsRe);
    if (m) {
      items.push({ startMs: parseTimestampToMs(m[1]), text: m[2].trim() });
    } else if (items.length > 0) {
      items[items.length - 1].text += " " + line;
    }
  }

  if (!items.length) return null;

  return items.map((it, i) => ({
    text: it.text.trim(),
    startMs: it.startMs,
    endMs: i < items.length - 1 ? items[i + 1].startMs : it.startMs + 3000,
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useYouTubeShadowing(opts?: SessionOpts) {
  // ── Video ──────────────────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [videoId, setVideoId] = useState<string | null>(
    opts?.initialVideoId ?? null,
  );
  const playerRef = useRef<YTPlayer | null>(null);

  // ── Sentences ──────────────────────────────────────────────────────────
  const [sentences, setSentences] = useState<Sentence[]>(
    opts?.initialSentences ?? [],
  );
  const [scriptError, setScriptError] = useState("");
  const [importingTranscript, setImportingTranscript] = useState(false);
  const [improvingTranscript, setImprovingTranscript] = useState(false);

  // ── Active sentence ─────────────────────────────────────────────────────
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(-1);
  const activeSentenceIdxRef = useRef(-1);
  const sentenceRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ── Recording ──────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [audioByIdx, setAudioByIdx] = useState<Record<number, string>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const blobUrlsRef = useRef<string[]>([]);
  const recordingForIdxRef = useRef<number | null>(null);
  useEffect(
    () => () => blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );

  // ── Session callbacks ──────────────────────────────────────────────────
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const notifySentences = useCallback((data: Sentence[]) => {
    setSentences(data);
    if (data.length > 0) {
      optsRef.current?.onSentencesChange?.(data);
      optsRef.current?.onScriptTextChange?.(data.map((s) => s.text).join("\n"));
    }
  }, []);

  // ── Video sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sentences.length) return;
    const timer = setInterval(() => {
      const ms = (playerRef.current?.getCurrentTime() ?? 0) * 1000;
      let idx = -1;
      for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].startMs <= ms) idx = i;
        else break;
      }
      if (idx !== activeSentenceIdxRef.current) {
        activeSentenceIdxRef.current = idx;
        setActiveSentenceIdx(idx);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [sentences]);

  // ── Auto-scroll sentence pills ──────────────────────────────────────────
  useEffect(() => {
    if (activeSentenceIdx < 0) return;
    sentenceRefs.current[activeSentenceIdx]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeSentenceIdx]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (
        document.activeElement as HTMLElement
      )?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const player = playerRef.current;

      const goTo = (idx: number) => {
        if (idx < 0 || idx >= sentences.length) return;
        player?.seekTo(sentences[idx].startMs / 1000, true);
        player?.playVideo();
        activeSentenceIdxRef.current = idx;
        setActiveSentenceIdx(idx);
      };

      switch (e.key) {
        case " ":
          e.preventDefault();
          player?.getPlayerState() === 1
            ? player?.pauseVideo()
            : player?.playVideo();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) goTo(activeSentenceIdxRef.current - 1);
          else player?.seekTo((player?.getCurrentTime() ?? 0) - 5, true);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) goTo(activeSentenceIdxRef.current + 1);
          else player?.seekTo((player?.getCurrentTime() ?? 0) + 5, true);
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sentences]);

  // ── Actions ────────────────────────────────────────────────────────────
  function handleLoadVideo(e?: FormEvent) {
    e?.preventDefault();
    setUrlError("");
    const id = extractVideoId(urlInput.trim());
    if (!id) {
      setUrlError("Invalid YouTube URL");
      return;
    }
    setVideoId(id);
    optsRef.current?.onVideoChange?.(id);
    setSentences([]);
    setScriptError("");
    setActiveSentenceIdx(-1);
    activeSentenceIdxRef.current = -1;
    sentenceRefs.current = [];
    setAudioByIdx({});
  }

  function handlePlayerReady(event: YouTubeEvent) {
    playerRef.current = event.target as unknown as YTPlayer;
  }

  async function handleImportFromYouTube() {
    if (!videoId || importingTranscript) return;
    setImportingTranscript(true);
    setScriptError("");
    try {
      const res = await fetch("/api/shadowing/youtube/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          mode: "auto",
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(json?.segments)) {
        setScriptError(
          json?.error ?? "Could not fetch transcript from Supadata",
        );
        return;
      }

      const segs = json.segments as any[];
      const starts = segs.map((s) => Number(s.start ?? s.timestamp ?? 0));
      const data: Sentence[] = segs
        .map((s, i) => {
          const startMs = Math.round(
            Number(s.start ?? s.timestamp ?? 0) * 1000,
          );
          const fallbackEndMs =
            startMs + Math.round(Number(s.duration ?? 3) * 1000);
          const endMs =
            i < starts.length - 1
              ? Math.round((starts[i + 1] ?? 0) * 1000)
              : fallbackEndMs;
          return {
            text: String(s.text ?? s.caption ?? "").trim(),
            startMs,
            endMs: endMs > startMs ? endMs : fallbackEndMs,
          };
        })
        .filter((s) => s.text.length > 0);

      if (!data.length) {
        setScriptError("Supadata returned an empty transcript");
        return;
      }

      notifySentences(data);
      sentenceRefs.current = [];
      setActiveSentenceIdx(-1);
      activeSentenceIdxRef.current = -1;
    } catch (e: any) {
      setScriptError(String(e?.message ?? e));
    } finally {
      setImportingTranscript(false);
    }
  }

  async function handleImportTranscript(
    raw: string,
    importOpts?: { useAI?: boolean },
  ) {
    if (!raw.trim()) return;
    setScriptError("");

    if (importOpts?.useAI) {
      setImportingTranscript(true);
      try {
        const res = await fetch("/api/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && Array.isArray(json?.segments)) {
          const segs = json.segments as any[];
          const starts = segs.map((s) => Number(s.start ?? s.timestamp ?? 0));
          const data: Sentence[] = segs.map((s, i) => {
            const startMs = Math.round(
              Number(s.start ?? s.timestamp ?? 0) * 1000,
            );
            const endMs =
              i < starts.length - 1
                ? Math.round((starts[i + 1] ?? 0) * 1000)
                : startMs + 3000;
            return {
              text: String(s.text ?? s.caption ?? "").trim(),
              startMs,
              endMs,
            };
          });
          if (data.length > 0) {
            notifySentences(data);
            sentenceRefs.current = [];
            return;
          }
        }
        setScriptError(json?.error ?? "AI import failed");
      } catch (e: any) {
        setScriptError(String(e?.message ?? e));
      } finally {
        setImportingTranscript(false);
      }
      return;
    }

    const parsed = parseTactiqTranscript(raw);
    if (parsed?.length) {
      notifySentences(parsed);
      sentenceRefs.current = [];
    } else {
      setScriptError("Could not parse pasted transcript");
    }
  }

  async function handleImproveWithAI() {
    if (!sentences.length) return;
    setImprovingTranscript(true);
    setScriptError("");
    try {
      const CHUNK = 25;
      const improved: Sentence[] = [];
      for (let start = 0; start < sentences.length; start += CHUNK) {
        const chunk = sentences.slice(start, start + CHUNK);
        const raw = chunk.map((s) => s.text).join("\n");
        const res = await fetch("/api/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(json?.segments)) {
          setScriptError(json?.error ?? "AI improvement failed");
          return;
        }
        const segs = json.segments as any[];
        const rangeStart = chunk[0].startMs;
        const rangeEnd = chunk[chunk.length - 1].endMs;
        const range = rangeEnd - rangeStart;
        segs.forEach((seg, i) => {
          improved.push({
            text: String(seg.text ?? seg.caption ?? "").trim(),
            startMs: Math.round(rangeStart + (i / segs.length) * range),
            endMs: Math.round(rangeStart + ((i + 1) / segs.length) * range),
          });
        });
      }
      notifySentences(improved);
      sentenceRefs.current = [];
      setActiveSentenceIdx(-1);
      activeSentenceIdxRef.current = -1;
    } catch (e: any) {
      setScriptError(String(e?.message ?? e));
    } finally {
      setImprovingTranscript(false);
    }
  }

  function goToSentence(idx: number) {
    if (idx < 0 || idx >= sentences.length) return;
    playerRef.current?.seekTo(sentences[idx].startMs / 1000, true);
    playerRef.current?.playVideo();
    activeSentenceIdxRef.current = idx;
    setActiveSentenceIdx(idx);
  }

  function onToggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    audioChunksRef.current = [];
    recordingForIdxRef.current =
      activeSentenceIdxRef.current >= 0 ? activeSentenceIdxRef.current : null;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";
        const mr = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined,
        );
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mr.onstart = () => setIsRecording(true);
        mr.onstop = () => {
          setIsRecording(false);
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          blobUrlsRef.current.push(url);
          const idx = recordingForIdxRef.current;
          if (idx !== null) {
            setAudioByIdx((prev) => ({ ...prev, [idx]: url }));
          }
        };
        mr.start(250);
        mediaRecorderRef.current = mr;
      })
      .catch(() => {});
  }

  return {
    urlInput,
    setUrlInput,
    urlError,
    videoId,
    playerRef,
    sentences,
    scriptError,
    importingTranscript,
    improvingTranscript,
    activeSentenceIdx,
    sentenceRefs,
    isRecording,
    lastAudioUrl:
      activeSentenceIdx >= 0 ? (audioByIdx[activeSentenceIdx] ?? null) : null,
    handleLoadVideo,
    handlePlayerReady,
    handleImportFromYouTube,
    handleImportTranscript,
    handleImproveWithAI,
    goToSentence,
    onToggleRecording,
  };
}
