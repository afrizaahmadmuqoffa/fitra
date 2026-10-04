"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "fitra-theme";

const MEDIA_QUERY = "(prefers-color-scheme: dark)";
/** Event lokal untuk menyinkronkan tab yang sama setelah setTheme. */
const THEME_EVENT = "fitra-theme-change";

/**
 * Script blocking untuk root layout. Logikanya wajib identik dengan
 * `applyThemeClass` di bawah supaya tidak ada kedipan tema sebelum hydration.
 */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var s=localStorage.getItem(k);if(s!=="light"&&s!=="dark"&&s!=="system"){s="system"}var r=s==="system"?(window.matchMedia(${JSON.stringify(
  MEDIA_QUERY,
)}).matches?"dark":"light"):s;var e=document.documentElement;e.classList.remove("light","dark");e.classList.add(r);e.style.colorScheme=r}catch(e){}})();`;

function readStoredTheme(): Theme {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // localStorage diblokir (mode privat / iframe tanpa izin) -> pakai system
  }
  return "system";
}

function readSystemTheme(): ResolvedTheme {
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

function subscribeSystemTheme(onStoreChange: () => void) {
  const media = window.matchMedia(MEDIA_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function applyThemeClass(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

/** Mematikan transisi saat tema berganti supaya tidak ada "lompat" warna. */
function withoutTransitions(run: () => void) {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important;animation-duration:-1ms!important;animation-delay:0ms!important}",
    ),
  );
  document.head.appendChild(style);
  run();
  window.getComputedStyle(document.body);
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = React.useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    () => "system" as Theme,
  );
  const systemTheme = React.useSyncExternalStore(
    subscribeSystemTheme,
    readSystemTheme,
    () => "light" as ResolvedTheme,
  );

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  React.useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = React.useCallback((next: Theme) => {
    withoutTransitions(() => {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Gagal menyimpan tidak boleh membatalkan pergantian tema
      }
      window.dispatchEvent(new Event(THEME_EVENT));
    });
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error("useTheme harus dipakai di dalam ThemeProvider");
  return context;
}

const subscribeNothing = () => () => {};

/**
 * Guard SSR untuk UI yang bergantung pada tema. Server selalu merender
 * `false`; browser merender `true` setelah hydration.
 */
export function useThemeMounted(): boolean {
  return React.useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}
