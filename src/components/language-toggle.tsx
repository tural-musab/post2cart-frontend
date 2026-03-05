"use client";

import { useLanguage } from './language-provider';

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/80 p-1 text-xs font-semibold">
      <button
        type="button"
        onClick={() => setLocale('tr')}
        className={`rounded-full px-3 py-1 transition ${
          locale === 'tr' ? 'bg-[var(--brand)] text-white' : 'text-[var(--ink-700)]'
        }`}
      >
        TR
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded-full px-3 py-1 transition ${
          locale === 'en' ? 'bg-[var(--brand)] text-white' : 'text-[var(--ink-700)]'
        }`}
      >
        EN
      </button>
    </div>
  );
}
