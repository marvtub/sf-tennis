"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DocsThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
};

const DocsThemeContext = createContext<DocsThemeContextValue | null>(null);

export function DocsThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const value = useMemo(
    () => ({
      isDark,
      toggleTheme: () => setIsDark((current) => !current),
    }),
    [isDark]
  );

  return (
    <DocsThemeContext.Provider value={value}>
      <div className={isDark ? "dark" : undefined}>{children}</div>
    </DocsThemeContext.Provider>
  );
}

export function DocsThemeToggle({ className = "" }: { className?: string }) {
  const context = useContext(DocsThemeContext);
  if (!context) return null;

  return (
    <button
      type="button"
      onClick={context.toggleTheme}
      aria-label={`Switch to ${context.isDark ? "light" : "dark"} mode`}
      aria-pressed={context.isDark}
      className={`inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white ${className}`}
    >
      {context.isDark ? <MoonIcon /> : <SunIcon />}
      <span>{context.isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 15.6A8.5 8.5 0 0 1 8.4 4a7 7 0 1 0 11.6 11.6Z" />
    </svg>
  );
}
