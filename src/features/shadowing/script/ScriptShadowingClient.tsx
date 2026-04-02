"use client";
import { useState, useRef, useEffect } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Trash2 } from "lucide-react";
import { useScriptShadowing } from "./useScriptShadowing";
import { TTSSettingsPanel } from "../shared/TTSSettingsPanel";
import { ScriptInputForm } from "./components/ScriptInputForm";
import { SessionProgress } from "./components/SessionProgress";
import { SentenceCard } from "./components/SentenceCard";
import { SessionTimer } from "./components/SessionTimer";
import { CelebrationOverlay } from "./components/CelebrationOverlay";
import type { Sentence } from "../shared/types";

interface Props {
  sessionId?: number;
  initialScriptText?: string;
  initialSentences?: Sentence[];
  initialActiveSentenceIdx?: number;
  initialTtsVoice?: string;
  initialTtsSpeed?: number;
  onSentencesChange?: (sentences: Sentence[]) => void;
  onActiveSentenceChange?: (idx: number) => void;
  onScriptTextChange?: (scriptText: string) => void;
}

export default function ScriptShadowingClient(props: Props) {
  const s = useScriptShadowing({
    sessionId: props.sessionId,
    initialScriptText: props.initialScriptText,
    initialSentences: props.initialSentences,
    initialActiveSentenceIdx: props.initialActiveSentenceIdx,
    onSentencesChange: props.onSentencesChange,
    onActiveSentenceChange: props.onActiveSentenceChange,
    onScriptTextChange: props.onScriptTextChange,
  });

  const [scriptCollapsed, setScriptCollapsed] = useState(false);

  // Celebration: fire once when all sentences have been practiced
  const [celebrationFired, setCelebrationFired] = useState(false);
  const hasSentences = s.sentences.length > 0;
  const allPracticed =
    hasSentences && s.activeSentenceIdx >= s.sentences.length - 1;
  const celebrationActive = allPracticed && !celebrationFired;

  // Reset celebration flag when a new script is loaded
  const prevSentenceLengthRef = useRef(s.sentences.length);

  useEffect(() => {
    if (s.sentences.length !== prevSentenceLengthRef.current) {
      prevSentenceLengthRef.current = s.sentences.length;
      setCelebrationFired(false);
    }
  }, [s.sentences.length]);

  const activeSentence = s.sentences[s.activeSentenceIdx];

  return (
    <>
      <CelebrationOverlay
        active={celebrationActive}
        message="🎉 All sentences practiced!"
        onDone={() => setCelebrationFired(true)}
      />

      <div className="max-w-3xl mx-auto space-y-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Script Shadowing
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Paste any text · practice sentence by sentence
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SessionTimer active={hasSentences} />

            {hasSentences && (
              <TTSSettingsPanel
                provider={s.tts.provider}
                accent={s.tts.accent}
                speed={s.tts.speed}
                onProviderChange={s.tts.setProvider}
                onAccentChange={s.tts.setAccent}
                onSpeedChange={s.tts.setSpeed}
                autoPronounceSentence={s.autoPronounceSentence}
                onAutoPronounceSentenceChange={s.setAutoPronounceSentence}
                loopSentence={s.loopSentence}
                onLoopSentenceChange={s.setLoopSentence}
                minSentenceLength={s.minSentenceLength}
                onMinSentenceLengthChange={s.setMinSentenceLength}
                maxSentenceLength={s.maxSentenceLength}
                onMaxSentenceLengthChange={s.setMaxSentenceLength}
              />
            )}

            {s.turns.length > 0 && (
              <Tooltip label="Clear session" position="bottom" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={s.onClearSession}
                >
                  <Trash2 size={13} />
                </ActionIcon>
              </Tooltip>
            )}
          </div>
        </div>

        {/* ── Script Input ── */}
        <ScriptInputForm
          value={s.scriptInput}
          onChange={s.setScriptInput}
          onSubmit={s.handleLoadScript}
          error={s.scriptError}
          hasSentences={hasSentences}
          collapsed={scriptCollapsed}
          onCollapse={() => setScriptCollapsed(true)}
          onExpand={() => setScriptCollapsed(false)}
        />

        {/* ── Practice Panel ── */}
        {hasSentences && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-3 space-y-2">
              <SessionProgress
                total={s.sentences.length}
                current={s.activeSentenceIdx}
                onJump={s.setActiveSentenceIdx}
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400">
                  A/D · ←/→ to navigate · R to record · S/Space to listen
                </p>
                {s.estimatedRemainingMs > 0 && (
                  <p className="text-[10px] text-gray-400 shrink-0">
                    ~{Math.ceil(s.estimatedRemainingMs / 60000)} min remaining
                  </p>
                )}
              </div>
            </div>

            {s.activeSentenceIdx >= 0 && activeSentence ? (
              <SentenceCard
                text={activeSentence.text}
                sentenceIdx={s.activeSentenceIdx}
                total={s.sentences.length}
                tts={s.tts}
                isRecording={s.isRecording}
                lastAudioUrl={s.lastAudioUrl}
                onListen={s.onListenSentence}
                onToggleRecording={s.onToggleRecording}
                onPrev={s.onPrev}
                onNext={s.onNext}
              />
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-400">
                  Select a sentence to start practicing.
                </p>
              </div>
            )}
          </div>
        )}

        {s.sonioxError && (
          <p className="text-[11px] text-red-500">{s.sonioxError}</p>
        )}
      </div>
    </>
  );
}
