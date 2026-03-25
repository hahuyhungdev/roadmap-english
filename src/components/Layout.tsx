import { Outlet, Link, useLocation } from "react-router-dom";
import { BookOpen } from "lucide-react";

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isPhrasePage = location.pathname.startsWith("/phrase/");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-indigo-600 font-semibold text-base hover:text-indigo-700 transition-colors"
          >
            <BookOpen size={20} />
            <span>English System</span>
          </Link>
          {!isHome && (
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← {isPhrasePage ? "All Phases" : "Home"}
            </Link>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
