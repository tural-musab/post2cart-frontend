"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useLanguage } from '@/components/language-provider';
import { appApiFetch } from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { BootstrapPayload, OnboardingStatus } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSessionAndLoad = async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      try {
        const [bootstrapPayload, statusPayload] = await Promise.all([
          appApiFetch<BootstrapPayload>('/api/app/bootstrap'),
          appApiFetch<OnboardingStatus>('/api/app/onboarding/status'),
        ]);
        setBootstrap(bootstrapPayload);
        setStatus(statusPayload);
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : t('common_error'));
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndLoad();
  }, [router, t]);

  return (
    <AppShell title={t('settings_title')} subtitle={t('settings_subtitle')}>
      {loading ? (
        <div className="card rounded-3xl px-6 py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--brand)]" />
          <p className="mt-3 text-sm text-[var(--ink-500)]">{t('common_loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="card rounded-2xl p-5">
            <h2 className="text-lg font-black">{t('settings_user')}</h2>
            <p className="mt-3 text-sm text-[var(--ink-700)]">{bootstrap?.user?.email || '-'}</p>
          </section>

          <section className="card rounded-2xl p-5">
            <h2 className="text-lg font-black">{t('settings_tenant')}</h2>
            <p className="mt-3 text-sm text-[var(--ink-700)]">{bootstrap?.tenant?.name || '-'}</p>
            {bootstrap?.tenant?.id && (
              <p className="mt-1 break-all text-xs text-[var(--ink-500)]">{bootstrap.tenant.id}</p>
            )}
          </section>

          <section className="card rounded-2xl p-5 lg:col-span-2">
            <h2 className="text-lg font-black">{t('settings_status')}</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatusPill label="Tenant" ok={status?.has_tenant ?? false} />
              <StatusPill label="Social" ok={status?.has_social_account ?? false} />
              <StatusPill label="Sync" ok={status?.has_sync_state ?? false} />
              <StatusPill label="Token" ok={status?.token_valid ?? false} />
            </div>
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="mt-4 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white"
            >
              {t('settings_open_onboarding')}
            </button>
          </section>

          {error && (
            <p className="card rounded-xl px-4 py-3 text-sm text-[var(--danger)] lg:col-span-2">
              {error}
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}

function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-center text-sm font-black ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
      }`}
    >
      {label}
    </div>
  );
}
