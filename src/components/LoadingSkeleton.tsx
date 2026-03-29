"use client";

export function LoadingSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading courts...</p>
        <p className="text-gray-400 text-sm mt-1">
          Fetching availability from rec.us
        </p>
      </div>
    </div>
  );
}
