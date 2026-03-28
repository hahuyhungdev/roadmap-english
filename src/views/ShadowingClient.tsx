"use client";

import { Keyboard } from "lucide-react";
import { useShadowingSession } from "./shadowing/useShadowingSession";
import { ShortcutsModal } from "./shadowing/ShortcutsModal";
import { VideoPanel } from "./shadowing/VideoPanel";
import { ScriptPanel } from "./shadowing/ScriptPanel";
import { PracticeFeed } from "./shadowing/PracticeFeed";

export default function ShadowingClient() {
  const {
    urlInput,
    setUrlInput,
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
    handleLoadVideo,
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

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Video + Controls */}
        <div className="lg:col-span-3">
          <VideoPanel
            videoId={videoId}
            playerRef={playerRef}
            onPlayerReady={handlePlayerReady}
          />
        </div>

        {/* Right: Script + Practice */}
        <div
          className="lg:col-span-2 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
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
              ttsVoice={ttsVoice}
              ttsSpeed={ttsSpeed}
              overallScore={overallScore}
              hasTurns={hasTurns}
              onFetchScript={handleFetchScript}
              onJumpToSentence={goToSentenceIdx}
              onToggleTtsSettings={() => setShowTtsSettings((v) => !v)}
              onClearSession={onClearSession}
              onSetTtsVoice={setTtsVoice}
              onSetTtsSpeed={setTtsSpeed}
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
