"use client";

import { useState } from "react";

interface LoginDialogProps {
  onLogin: (pin: string) => Promise<boolean>;
  onClose: () => void;
}

export function LoginDialog({ onLogin, onClose }: LoginDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const ok = await onLogin(pin);
    if (!ok) {
      setError(true);
      setPin("");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-80 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">🔐 Enter PIN</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className={`w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border rounded-lg mb-3 focus:outline-none focus:ring-2 ${
              error
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-200 focus:ring-blue-500"
            }`}
            autoFocus
            maxLength={10}
          />
          {error && (
            <p className="text-red-500 text-sm text-center mb-3">
              Wrong PIN. Try again.
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Checking..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
