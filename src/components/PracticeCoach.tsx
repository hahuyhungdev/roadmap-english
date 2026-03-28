"use client";

import { useRef, useEffect, useState, useEffectEvent } from "react";
import useSoniox from "../hooks/useSoniox";
import { useCoachSession } from "../hooks/useCoachSession";
import {
  StatusBar,
  PracticeCoachHeader,
  ConversationArea,
  ErrorBar,
  ExpandedPanel,
  CollapsedFAB,
} from "./PracticeCoachSubcomponents";

interface PracticeCoachProps {
  lessonTitle?: string;
  lessonContent?: string;
}

/**
 * PracticeCoach - Main component for speaking practice
 * Orchestrates UI state and delegates logic to custom hooks
 */
export default function PracticeCoach({
  lessonTitle,
  lessonContent,
}: PracticeCoachProps) {
  // UI state - use state for rendering, not refs
  const [isExpanded, setIsExpanded] = useState(false);
  const hasStartedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  // Reset the started flag when recording stops
  useEffect(() => {
    if (!isRecording) {
      hasStartedRef.current = false;
    }
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRef.current();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }, [turns]);

  // ==== Handlers ====
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
    await callCoach(finalTranscript);
    resetTranscript();
  });

  const handleClear = () => {
    if (isRecording) stopRef.current();
    clearSession();
    resetTranscript();
    hasStartedRef.current = false;
  };

  const handleCollapse = () => {
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
            draftText={(transcript || partial).trim()}
            canSend={Boolean((transcript || partial).trim())}
            onStart={handleStart}
            onStop={handleStop}
            onSend={handleSend}
          />
        </ExpandedPanel>
      )}

      {!isExpanded && <CollapsedFAB onExpand={() => setIsExpanded(true)} />}

      <audio ref={audioRef} className="hidden" />
    </>
  );
}
