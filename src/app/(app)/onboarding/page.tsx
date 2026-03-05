"use client";

import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useLanguage } from '@/components/language-provider';
import { appApiFetch } from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  BootstrapPayload,
  OnboardingStatus,
  OauthCandidate,
  PendingOauthSession,
} from '@/lib/types';

type StepItemProps = {
  label: string;
  ok: boolean;
};

function StepItem({ label, ok }: StepItemProps) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm">
      <span className="font-semibold text-[var(--ink-700)]">{label}</span>
      {ok ? (
        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> OK
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-bold text-rose-700">
          <XCircle className="h-4 w-4" /> Missing
        </span>
      )}
    </li>
  );
}

function humanizeOauthReason(reason: string | null) {
  if (!reason) {
    return null;
  }
  return reason.replaceAll('_', ' ');
}

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const oauth = searchParams.get('oauth');
  const oauthReason = searchParams.get('reason');
  const oauthSession = searchParams.get('session');

  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [tenantName, setTenantName] = useState('Post2Cart Default');
  const [platformAccountId, setPlatformAccountId] = useState('');
  const [platformUsername, setPlatformUsername] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [tokenExpiresAt, setTokenExpiresAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthCandidates, setOauthCandidates] = useState<OauthCandidate[]>([]);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [selectedPlatformAccountId, setSelectedPlatformAccountId] = useState<string>('');
  const [pendingLoading, setPendingLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bootstrapPayload, statusPayload] = await Promise.all([
        appApiFetch<BootstrapPayload>('/api/app/bootstrap'),
        appApiFetch<OnboardingStatus>('/api/app/onboarding/status'),
      ]);
      setBootstrap(bootstrapPayload);
      setStatus(statusPayload);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : t('common_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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

      await loadState();
    };

    checkSessionAndLoad();
  }, [router, loadState]);

  useEffect(() => {
    const syncOauthState = async () => {
      if (!oauth) {
        return;
      }

      if (oauth === 'success') {
        setMessage(t('onboarding_oauth_success'));
        setError(null);
        setOauthCandidates([]);
        setPendingSessionId(null);
        setSelectedPlatformAccountId('');
        await loadState();
        return;
      }

      if (oauth === 'error') {
        const reasonText = humanizeOauthReason(oauthReason);
        setError(
          reasonText
            ? `${t('onboarding_oauth_error')} (${t('onboarding_oauth_reason')}: ${reasonText})`
            : t('onboarding_oauth_error'),
        );
        setOauthCandidates([]);
        setPendingSessionId(null);
        setSelectedPlatformAccountId('');
        return;
      }

      if (oauth === 'select') {
        if (!oauthSession) {
          setError(t('onboarding_oauth_error'));
          return;
        }

        setPendingLoading(true);
        setError(null);
        try {
          const payload = await appApiFetch<PendingOauthSession>(
            `/api/app/social/instagram/oauth/pending/${oauthSession}`,
          );
          setPendingSessionId(payload.session_id);
          setOauthCandidates(payload.candidates ?? []);
          setSelectedPlatformAccountId(payload.candidates?.[0]?.platform_account_id ?? '');
          setMessage(null);
        } catch (pendingError: unknown) {
          setError(
            pendingError instanceof Error ? pendingError.message : t('common_error'),
          );
        } finally {
          setPendingLoading(false);
        }
      }
    };

    syncOauthState();
  }, [loadState, oauth, oauthReason, oauthSession, t]);

  const createTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await appApiFetch('/api/app/tenants', {
        method: 'POST',
        body: JSON.stringify({ name: tenantName }),
      });
      setMessage('Tenant created successfully.');
      await loadState();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t('common_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const connectInstagramManual = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await appApiFetch('/api/app/social-accounts/instagram/manual', {
        method: 'POST',
        body: JSON.stringify({
          platform_account_id: platformAccountId,
          platform_username: platformUsername || undefined,
          access_token: accessToken,
          token_expires_at: tokenExpiresAt
            ? new Date(tokenExpiresAt).toISOString()
            : undefined,
        }),
      });
      setMessage('Instagram account connected and sync state activated.');
      setAccessToken('');
      await loadState();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t('common_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const startOauth = async () => {
    setError(null);
    setMessage(null);

    try {
      const payload = await appApiFetch<{ authorization_url?: string }>(
        '/api/app/social/instagram/oauth/start',
      );
      if (!payload.authorization_url) {
        throw new Error('OAuth URL could not be created.');
      }
      window.location.href = payload.authorization_url;
    } catch (oauthError: unknown) {
      setError(oauthError instanceof Error ? oauthError.message : t('common_error'));
    }
  };

  const finalizeOauthSelection = async () => {
    if (!pendingSessionId) {
      setError(t('onboarding_oauth_error'));
      return;
    }

    if (!selectedPlatformAccountId) {
      setError(t('onboarding_oauth_select_none'));
      return;
    }

    setFinalizing(true);
    setError(null);
    try {
      await appApiFetch('/api/app/social/instagram/oauth/finalize', {
        method: 'POST',
        body: JSON.stringify({
          session_id: pendingSessionId,
          platform_account_id: selectedPlatformAccountId,
        }),
      });

      setMessage(t('onboarding_oauth_success'));
      setOauthCandidates([]);
      setPendingSessionId(null);
      setSelectedPlatformAccountId('');
      await loadState();
      router.replace('/onboarding');
    } catch (finalizeError: unknown) {
      setError(finalizeError instanceof Error ? finalizeError.message : t('common_error'));
    } finally {
      setFinalizing(false);
    }
  };

  const ready = status?.automation_ready ?? false;

  const hasPendingSelection = useMemo(
    () => Boolean(pendingSessionId && oauthCandidates.length > 0),
    [oauthCandidates.length, pendingSessionId],
  );

  return (
    <AppShell title={t('onboarding_title')} subtitle={t('onboarding_subtitle')}>
      {loading ? (
        <div className="card rounded-3xl px-6 py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--brand)]" />
          <p className="mt-3 text-sm text-[var(--ink-500)]">{t('common_loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <section className="card rounded-2xl p-5 xl:col-span-1">
            <h2 className="text-lg font-black">Readiness</h2>
            <ul className="mt-4 space-y-2">
              <StepItem label={t('onboarding_step_tenant')} ok={status?.has_tenant ?? false} />
              <StepItem label={t('onboarding_step_social')} ok={status?.has_social_account ?? false} />
              <StepItem label={t('onboarding_step_sync')} ok={status?.has_sync_state ?? false} />
              <StepItem label={t('onboarding_step_token')} ok={status?.token_valid ?? false} />
            </ul>
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${
                ready
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {ready ? t('dashboard_automation_ready') : t('dashboard_automation_not_ready')}
            </div>
            {ready && (
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white"
              >
                {t('onboarding_go_dashboard')}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </section>

          <section className="space-y-4 xl:col-span-2">
            {!bootstrap?.tenant && (
              <form onSubmit={createTenant} className="card rounded-2xl p-5">
                <h2 className="text-lg font-black">{t('onboarding_create_tenant')}</h2>
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-semibold text-[var(--ink-700)]">
                    {t('onboarding_tenant_name')}
                  </label>
                  <input
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder={t('onboarding_tenant_name_placeholder')}
                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--brand)]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('onboarding_create_tenant')}
                </button>
              </form>
            )}

            {bootstrap?.tenant && hasPendingSelection && (
              <section className="card rounded-2xl p-5">
                <h2 className="text-lg font-black">{t('onboarding_oauth_select_title')}</h2>
                <p className="mt-1 text-sm text-[var(--ink-500)]">
                  {t('onboarding_oauth_select_subtitle')}
                </p>

                <div className="mt-4 space-y-2">
                  {oauthCandidates.map((candidate) => {
                    const checked = selectedPlatformAccountId === candidate.platform_account_id;
                    return (
                      <label
                        key={candidate.platform_account_id}
                        className={`block cursor-pointer rounded-xl border p-3 transition ${
                          checked
                            ? 'border-[var(--brand)] bg-white'
                            : 'border-[var(--line)] bg-white/70'
                        }`}
                      >
                        <input
                          type="radio"
                          name="instagram-candidate"
                          value={candidate.platform_account_id}
                          checked={checked}
                          onChange={(event) =>
                            setSelectedPlatformAccountId(event.target.value)
                          }
                          className="sr-only"
                        />
                        <div className="text-sm font-semibold text-[var(--ink-700)]">
                          @{candidate.platform_username ?? candidate.platform_account_id}
                        </div>
                        <div className="mt-1 text-xs text-[var(--ink-500)]">
                          {candidate.page_name} ({candidate.page_id})
                        </div>
                      </label>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={finalizeOauthSelection}
                  disabled={finalizing || !selectedPlatformAccountId}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
                >
                  {(finalizing || pendingLoading) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {t('onboarding_oauth_select_cta')}
                </button>
              </section>
            )}

            {bootstrap?.tenant && (
              <form onSubmit={connectInstagramManual} className="card rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-black">{t('onboarding_connect_instagram')}</h2>
                  <button
                    type="button"
                    onClick={startOauth}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink-700)]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {t('onboarding_oauth_start')}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--ink-700)]">
                      {t('onboarding_account_id')}
                    </label>
                    <input
                      value={platformAccountId}
                      onChange={(e) => setPlatformAccountId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--brand)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--ink-700)]">
                      {t('onboarding_username')}
                    </label>
                    <input
                      value={platformUsername}
                      onChange={(e) => setPlatformUsername(e.target.value)}
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--brand)]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-[var(--ink-700)]">
                      {t('onboarding_access_token')}
                    </label>
                    <textarea
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      required
                      rows={4}
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--brand)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--ink-700)]">
                      {t('onboarding_expires_at')}
                    </label>
                    <input
                      type="datetime-local"
                      value={tokenExpiresAt}
                      onChange={(e) => setTokenExpiresAt(e.target.value)}
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--brand)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('onboarding_save')}
                </button>
              </form>
            )}

            {message && (
              <p className="card rounded-xl px-4 py-3 text-sm text-emerald-700">{message}</p>
            )}
            {error && (
              <p className="card rounded-xl px-4 py-3 text-sm text-[var(--danger)]">{error}</p>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="Post2Cart" subtitle="">
          <div className="card rounded-3xl px-6 py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--brand)]" />
          </div>
        </AppShell>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}
