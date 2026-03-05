"use client";

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/components/language-provider';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.replace('/dashboard');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : t('common_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md rounded-3xl p-7 md:p-8">
        <div className="mb-6 flex justify-end">
          <LanguageToggle />
        </div>
        <h1 className="brand-title text-3xl font-bold">{t('auth_login_title')}</h1>
        <p className="mt-2 text-sm text-[var(--ink-500)]">{t('auth_login_subtitle')}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--ink-700)]">
              {t('auth_email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--brand)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--ink-700)]">
              {t('auth_password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--brand)]"
            />
          </div>

          {message && <p className="text-sm text-[var(--danger)]">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('auth_signin')}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--ink-600)]">
          {t('auth_no_account')}{' '}
          <Link href="/signup" className="font-semibold text-[var(--brand)] hover:underline">
            {t('auth_signup')}
          </Link>
        </p>
      </div>
    </div>
  );
}
