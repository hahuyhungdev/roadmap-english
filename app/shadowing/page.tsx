import Link from "next/link";

export default function ShadowingPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-600 mb-4">
            Shadowing Lab
          </h1>
          <p className="text-gray-600 text-lg">
            Choose a practice mode to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* YouTube Mode Card */}
          <Link href="/shadowing/youtube" className="block">
            <div className="rounded-lg  p-8 h-full cursor-pointer border border-slate-600 hover:border-slate-500">
              <div className="mb-4">
                <div className="text-5xl mb-4">🎥</div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                YouTube Mode
              </h2>
              <p className="text-slate-500 mb-6">
                Practice shadowing by following along with YouTube videos.
                Perfect for learning from native speakers.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-emerald-500 mt-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Video synchronization</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-emerald-500 mt-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>AI coaching feedback</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-emerald-500 mt-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Speech recognition</span>
                </li>
              </ul>
            </div>
          </Link>

          {/* Script Mode Card */}
          <Link href="/shadowing/script" className="block">
            <div className="rounded-lg  p-8 h-full cursor-pointer border border-slate-600 hover:border-slate-500">
              <div className="mb-4">
                <div className="text-5xl mb-4">📝</div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Script Mode
              </h2>
              <p className="text-slate-500 mb-6">
                Paste any text or script and practice with smart sentence
                splitting. Great for controlled, focused practice.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-emerald-500 mt-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Smart text splitting</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-emerald-500 mt-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Auto-pronounce option</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-emerald-500 mt-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Loop playback feature</span>
                </li>
              </ul>
            </div>
          </Link>
        </div>

        <div className="mt-12 p-6  rounded-lg border border-slate-600">
          <p className="text-slate-500 text-center text-sm">
            💡 Tip: Use keyboard shortcuts like{" "}
            <span className="font-mono px-2 py-1 rounded">Space</span> to
            listen, <span className="font-mono px-2 py-1 rounded">A/D</span> to
            navigate, and <span className="font-mono px-2 py-1 rounded">R</span>{" "}
            to record. Press{" "}
            <span className="font-mono px-2 py-1 rounded">?</span> for help.
          </p>
        </div>
      </div>
    </div>
  );
}
