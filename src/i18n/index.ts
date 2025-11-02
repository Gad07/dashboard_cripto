/**
 * Minimal i18n utility for the dashboard.
 * Exports a hook `useTranslation` which provides `t(key, vars)` and `locale`/`setLocale`.
 * This keeps the approach lightweight and framework-agnostic for this small app.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import translations from "./translations";

export type Locale = "en" | "es";

const DEFAULT_LOCALE: Locale = (typeof window !== "undefined" && (localStorage.getItem("lang") as Locale)) || "es";

/**
 * Simple interpolation for `{var}` placeholders in strings.
 */
function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

/**
 * Hook returning translation function and locale setter.
 */
type TranslationAPI = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const TranslationContext = createContext<TranslationAPI | undefined>(undefined);

export function TranslationProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>((initialLocale as Locale) || DEFAULT_LOCALE);

  useEffect(() => {
    try {
      localStorage.setItem("lang", locale);
      document.documentElement.lang = locale;
    } catch {
      // ignore (SSR or restricted env)
    }
  }, [locale]);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const langPack = translations[locale] || translations["en"];
    const raw = langPack[key] ?? translations["en"][key] ?? key;
    return interpolate(raw, vars as Record<string, string | number> | undefined);
  }, [locale]);

  const api = useMemo(() => ({ locale, setLocale: setLocaleState, t }), [locale, t]);

  return React.createElement(TranslationContext.Provider, { value: api }, children);
}

/**
 * Hook returning translation API. Prefer calling this from components wrapped by TranslationProvider
 * so a single shared locale state causes all components to re-render when the language changes.
 * If a provider is not present, this hook falls back to a local state (backwards-compatible).
 */
export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (ctx) return ctx;

  // Fallback (component-local state) when provider is not used.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE as Locale);

  useEffect(() => {
    try {
      localStorage.setItem("lang", locale);
      document.documentElement.lang = locale;
    } catch {
      // ignore
    }
  }, [locale]);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const langPack = translations[locale] || translations["en"];
    const raw = langPack[key] ?? translations["en"][key] ?? key;
    return interpolate(raw, vars as Record<string, string | number> | undefined);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  return { t, locale, setLocale } as const;
}

/**
 * Non-hook helper for quick one-off translations using current localStorage value.
 * Avoid using this in components (prefer `useTranslation`).
 */
export function tOnce(key: string, vars?: Record<string, string | number>) {
  const locale = (typeof window !== "undefined" && (localStorage.getItem("lang") as Locale)) || "es";
  const langPack = translations[locale] || translations["en"];
  const raw = langPack[key] ?? translations["en"][key] ?? key;
  return interpolate(raw, vars as Record<string, string | number> | undefined);
}

export default useTranslation;
