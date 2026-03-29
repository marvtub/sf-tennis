"use client";

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="absolute top-12 left-0 right-0 z-30 mx-4 mt-2">
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-lg">⚠</span>
          <div>
            <p className="text-sm font-medium text-red-800">
              Failed to load availability
            </p>
            <p className="text-xs text-red-600">{message}</p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
