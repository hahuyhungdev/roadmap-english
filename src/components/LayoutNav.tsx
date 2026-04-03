"use client";

import Link from "next/link";
import { BookOpen, FileText, Video } from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";

export default function LayoutNav() {
  // Avoid using `usePathname` directly in render because it can cause
  // server/client HTML mismatches. Instead, compute active path on the
  // client after mount and render neutral markup on the server.
  const [clientPath, setClientPath] = useState<string | null>(null);

  useEffect(() => {
    setClientPath(window.location.pathname || "/");
  }, []);

  const isHome = clientPath === "/" || !!clientPath?.startsWith("/phase");
  const isYouTube = !!clientPath && clientPath.startsWith("/shadowing/youtube");
  const isScript = !!clientPath && clientPath.startsWith("/shadowing/script");

  return (
    <header className=" border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2 overflow-x-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-indigo-600 font-semibold text-base hover:text-indigo-700 transition-colors"
        >
          <BookOpen size={20} />
          <span>English System</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isHome
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
            )}
          >
            <BookOpen size={15} />
            English
          </Link>
          <Link
            href="/shadowing/youtube"
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isYouTube
                ? "bg-red-50 text-red-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
            )}
          >
            <Video size={15} />
            YouTube
          </Link>
          <Link
            href="/shadowing/script"
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isScript
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
            )}
          >
            <FileText size={15} />
            Script
          </Link>
        </div>
      </div>
    </header>
  );
}
