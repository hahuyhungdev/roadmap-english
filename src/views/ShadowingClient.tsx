"use client";

import { Keyboard } from "lucide-react";

import { ShortcutsModal } from "./shadowing/ShortcutsModal";
import { useShadowingSession } from "./shadowing/useShadowingSession";
import { VideoPanel } from "./shadowing/VideoPanel";
import { ScriptPanel } from "./shadowing/ScriptPanel";
import { PracticeFeed } from "./shadowing/PracticeFeed";

export default function ShadowingClient() {
  const {
    mode,
    setMode,
    urlInput,
    setUrlInput,
    scriptInput,
    setScriptInput,
    videoId,
    urlError,
    playerRef,
    sentences,
    scriptLoading,
    scriptError,
    activeSentenceIdx,
    activeSentenceText,
    sentenceItemRefs,
    recordingForIdx,
    activeSentenceAudioUrl,
    ttsVoice,
    ttsSpeed,
    hearingIdx,
    ttsLoading,
    ttsPlaying,
    isRecording,
    sonioxError,
    turns,
    coachLoading,
    showShortcuts,
    setShowShortcuts,
    showTtsSettings,
    setShowTtsSettings,
    overallScore,
    hasTurns,
    autoPronounceSentence,
    setAutoPronounceSentence,
    loopSentence,
    setLoopSentence,
    handleLoadVideo,
    handleLoadScript,
    handlePlayerReady,
    handleFetchScript,
    goToSentenceIdx,
    onToggleRecording,
    onListenOriginal,
    onListenAIVoice,
    onPrevSentence,
    onNextSentence,
    onClearSession,
    setTtsVoice,
    setTtsSpeed,
  } = useShadowingSession();
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shadowing Lab</h1>
          <p className="text-sm text-gray-500 mt-1">
            Shadow native speakers sentence by sentence and get AI feedback.
          </p>
        </div>
        <button
          onClick={() => setShowShortcuts(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all shrink-0 mt-1"
        >
          <Keyboard size={13} /> Shortcuts (?)
        </button>
      </div>

      {/* URL form */}
      <div className="space-y-3">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode("youtube")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              mode === "youtube"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            YouTube
          </button>
          <button
            onClick={() => setMode("script")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              mode === "script"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Script/Text
          </button>
        </div>

        {/* YouTube mode */}
        {mode === "youtube" && (
          <form onSubmit={handleLoadVideo} className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste a YouTube URL…"
                className={
                  urlError
                    ? "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors border-red-300 bg-red-50 focus:border-red-400"
                    : "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors border-gray-200 bg-white focus:border-indigo-300"
                }
              />
              {urlError && (
                <p className="text-xs text-red-500 mt-1 pl-1">{urlError}</p>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              Load
            </button>
          </form>
        )}

        {/* Script mode */}
        {mode === "script" && (
          <form onSubmit={handleLoadScript} className="flex flex-col gap-2">
            <textarea
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              placeholder="Paste your script or text here (e.g., a paragraph, article, or lesson)..."
              className={
                scriptError
                  ? "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors border-red-300 bg-red-50 focus:border-red-400 resize-none h-24"
                  : "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors border-gray-200 bg-white focus:border-indigo-300 resize-none h-24"
              }
            />
            {scriptError && (
              <p className="text-xs text-red-500 pl-1">{scriptError}</p>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors self-start"
            >
              Process Script
            </button>
          </form>
        )}
      </div>

      {/* Main grid */}
      <div
        className={`grid gap-6 ${mode === "youtube" ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1"}`}
      >
        {/* Left: Video + Controls (YouTube mode only) */}
        {mode === "youtube" && (
          <div className="lg:col-span-3">
            <VideoPanel
              videoId={videoId}
              playerRef={playerRef}
              onPlayerReady={handlePlayerReady}
            />
          </div>
        )}

        {/* Right: Script + Practice */}
        <div
          className={`flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ${
            mode === "youtube" ? "lg:col-span-2" : ""
          }`}
          style={{ minHeight: "600px" }}
        >
          {/* Script section */}
          <div
            className="flex flex-col border-b border-gray-100"
            style={{ flex: "3 1 0", minHeight: 0, overflow: "hidden" }}
          >
            <ScriptPanel
              videoId={videoId}
              sentences={sentences}
              activeSentenceIdx={activeSentenceIdx}
              sentenceItemRefs={sentenceItemRefs}
              scriptLoading={scriptLoading}
              scriptError={scriptError}
              hearingIdx={hearingIdx}
              ttsLoading={ttsLoading}
              ttsPlaying={ttsPlaying}
              isRecording={isRecording}
              recordingForIdx={recordingForIdx}
              showTtsSettings={showTtsSettings}
              ttsProvider="google"
              ttsAccent="en-US"
              ttsVoice={ttsVoice}
              ttsSpeed={ttsSpeed}
              autoPronounceSentence={autoPronounceSentence}
              loopSentence={loopSentence}
              overallScore={overallScore}
              hasTurns={hasTurns}
              onFetchScript={handleFetchScript}
              onJumpToSentence={goToSentenceIdx}
              onToggleTtsSettings={() => setShowTtsSettings((v: boolean) => !v)}
              onClearSession={onClearSession}
              onSetTtsProvider={() => {}}
              onSetTtsAccent={() => {}}
              onSetTtsVoice={setTtsVoice}
              onSetTtsSpeed={setTtsSpeed}
              onSetAutoPronounceSentence={setAutoPronounceSentence}
              onSetLoopSentence={setLoopSentence}
            />
          </div>

          {/* Practice feed section */}
          <div
            className="flex flex-col"
            style={{ flex: "2 1 0", minHeight: 0, overflow: "hidden" }}
          >
            <PracticeFeed
              activeSentenceIdx={activeSentenceIdx}
              activeSentenceText={activeSentenceText}
              activeSentenceAudioUrl={activeSentenceAudioUrl}
              isRecording={isRecording}
              sonioxError={sonioxError}
              onListenOriginal={onListenOriginal}
              onListenAIVoice={onListenAIVoice}
              onToggleRecording={onToggleRecording}
              onPrevSentence={onPrevSentence}
              onNextSentence={onNextSentence}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
