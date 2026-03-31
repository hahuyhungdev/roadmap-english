import Link from "next/link";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <AlertCircle size={64} className="text-indigo-500" />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Page Not Found
        </h2>

        <p className="text-gray-500 mb-8">
          The lesson or page you&apos;re looking for doesn&apos;t exist or has
          been moved. Let&apos;s get you back on track!
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Home size={18} />
          Back to Home
        </Link>

        <p className="text-xs text-gray-500 mt-6">
          If you think this is a mistake, please check the URL and try again.
        </p>
      </div>
    </div>
  );
}
