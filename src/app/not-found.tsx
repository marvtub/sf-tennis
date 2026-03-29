import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="text-center px-6">
        <div className="text-8xl mb-6">🎾</div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-medium text-gray-600 mb-6">
          Ball out of bounds!
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          This court doesn&apos;t exist. Let&apos;s get you back to finding
          available tennis courts in San Francisco.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
        >
          ← Back to the courts
        </Link>
      </div>
    </main>
  );
}
