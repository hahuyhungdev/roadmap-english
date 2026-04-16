"use client";

import { useRef, useEffect, useState, useEffectEvent } from "react";
import useSoniox from "@/hooks/useSoniox";
import { useCoachSession } from "../../hooks/useCoachSession";
import {
  StatusBar,
  PracticeCoachHeader,
  ConversationArea,
  ErrorBar,
  ExpandedPanel,
  CollapsedFAB,
} from "./Subcomponents";

interface PracticeCoachProps {
  lessonTitle?: string;
  lessonContent?: string;
}

export default function PracticeCoach({
  lessonTitle,
  lessonContent,
}: PracticeCoachProps) {
  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoContinue, setAutoContinue] = useState(true);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const hasStartedRef = useRef(false);
  const pendingRestartRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const AC_KEY = "practice_coach_auto_continue";

  // Session management (conversation, API calls, streaming)
  const { turns, loading, isPlaying, callCoach, clearSession } =
    useCoachSession({
      lessonTitle,
      lessonContent,
    });

  // Speech recognition
  const {
    start: startSoniox,
    stop: stopSoniox,
    reset: resetTranscript,
    isRecording,
    transcript,
    partial,
    error,
  } = useSoniox({
    source: "mic",
  });

  // Refs to stable function references (avoid dependency issues)
  const startRef = useRef(startSoniox);
  const stopRef = useRef(stopSoniox);

  // Keep function refs updated
  useEffect(() => {
    startRef.current = startSoniox;
    stopRef.current = stopSoniox;
  });

  // Load auto-continue preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AC_KEY);
      if (saved !== null) setAutoContinue(saved === "true");
    } catch {}
  }, []);

  // Recording timer
  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }
    const interval = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Reset the started flag when recording stops
  useEffect(() => {
    if (!isRecording) hasStartedRef.current = false;
  }, [isRecording]);

  // Auto-restart recording after coach finishes responding
  useEffect(() => {
    if (pendingRestartRef.current && !loading && !isPlaying) {
      pendingRestartRef.current = false;
      const timer = setTimeout(() => {
        startRef.current({ source: "mic" });
        hasStartedRef.current = true;
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [loading, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRef.current();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }, [turns]);

  const toggleAutoContinue = () => {
    setAutoContinue((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AC_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // ==== Handlers (useEffectEvent — fired from effects/async flows) ====
  const handleStart = useEffectEvent(() => {
    if (!hasStartedRef.current) {
      startRef.current({ source: "mic" });
      hasStartedRef.current = true;
    }
  });

  const handleStop = useEffectEvent(() => {
    stopRef.current();
    hasStartedRef.current = false;
  });

  const handleSend = useEffectEvent(async () => {
    const finalTranscript = (transcript || partial).trim();
    if (!finalTranscript) return;

    stopRef.current();
    hasStartedRef.current = false;

    if (autoContinue) pendingRestartRef.current = true;

    await callCoach(finalTranscript);
    resetTranscript();
  });

  const handleClear = () => {
    if (isRecording) stopRef.current();
    pendingRestartRef.current = false;
    clearSession();
    resetTranscript();
    hasStartedRef.current = false;
  };

  const handleCollapse = () => {
    if (isRecording) stopRef.current();
    pendingRestartRef.current = false;
    setIsExpanded(false);
  };

  return (
    <>
      {isExpanded && (
        <ExpandedPanel>
          <PracticeCoachHeader
            lessonTitle={lessonTitle}
            isRecording={isRecording}
            isPlaying={isPlaying}
            autoContinue={autoContinue}
            onToggleAutoContinue={toggleAutoContinue}
            onClear={handleClear}
            onCollapse={handleCollapse}
          />
          <ConversationArea
            turns={turns}
            transcript={transcript}
            partial={partial}
            loading={loading}
            isRecording={isRecording}
            lessonTitle={lessonTitle}
            bottomRef={bottomRef}
          />
          <ErrorBar error={error} />
          <StatusBar
            isRecording={isRecording}
            isPlaying={isPlaying}
            loading={loading}
            canSend={Boolean((transcript || partial).trim())}
            recordingSeconds={recordingSeconds}
            onStart={handleStart}
            onStop={handleStop}
            onSend={handleSend}
          />
        </ExpandedPanel>
      )}

      {!isExpanded && (
        <CollapsedFAB
          onExpand={() => setIsExpanded(true)}
          turnCount={turns.length}
        />
      )}

      <audio ref={audioRef} className="hidden" />
    </>
  );
}
