"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCcw, RotateCcw, XCircle } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useLanguage } from '@/components/language-provider';
import { appApiFetch } from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  AutomationExecution,
  AutomationExecutionsResponse,
  AutomationFailedItem,
  AutomationFailedItemsResponse,
  AutomationOpsPayload,
} from '@/lib/types';

type FailedFilter = 'all' | 'pending' | 'resolved' | 'ignored';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function statusClass(status: string) {
  if (status === 'success' || status === 'resolved') {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (status === 'failed' || status === 'pending') {
    return 'bg-rose-100 text-rose-700';
  }
  if (status === 'started' || status === 'processing') {
    return 'bg-amber-100 text-amber-800';
  }
  return 'bg-zinc-100 text-zinc-700';
}

export default function AutomationOpsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [opsSummary, setOpsSummary] = useState<AutomationOpsPayload | null>(null);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [failedItems, setFailedItems] = useState<AutomationFailedItem[]>([]);

  const [executionCursor, setExecutionCursor] = useState<string | null>(null);
  const [failedCursor, setFailedCursor] = useState<string | null>(null);
  const [failedFilter, setFailedFilter] = useState<FailedFilter>('pending');

  const [loadingMoreExecutions, setLoadingMoreExecutions] = useState(false);
  const [loadingMoreFailed, setLoadingMoreFailed] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadData = useCallback(
    async (filter: FailedFilter, withSpinner = true) => {
      if (withSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      setMessage(null);

      try {
        const [summary, executionResponse, failedResponse] = await Promise.all([
          appApiFetch<AutomationOpsPayload>('/api/app/automation/ops'),
          appApiFetch<AutomationExecutionsResponse>(
            '/api/app/automation/executions?limit=20',
          ),
          appApiFetch<AutomationFailedItemsResponse>(
            `/api/app/automation/failed-items?status=${filter}&limit=20`,
          ),
        ]);

        setOpsSummary(summary);
        setExecutions(executionResponse.items ?? []);
        setFailedItems(failedResponse.items ?? []);
        setExecutionCursor(executionResponse.next_cursor ?? null);
        setFailedCursor(failedResponse.next_cursor ?? null);
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : t('ops_error_load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

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

      await loadData(failedFilter, true);
    };

    checkSessionAndLoad();
  }, [router, loadData, failedFilter]);

  const loadMoreExecutions = async () => {
    if (!executionCursor || loadingMoreExecutions) {
      return;
    }

    setLoadingMoreExecutions(true);
    setError(null);

    try {
      const next = await appApiFetch<AutomationExecutionsResponse>(
        `/api/app/automation/executions?limit=20&cursor=${encodeURIComponent(
          executionCursor,
        )}`,
      );
      setExecutions((prev) => [...prev, ...(next.items ?? [])]);
      setExecutionCursor(next.next_cursor ?? null);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : t('common_error'));
    } finally {
      setLoadingMoreExecutions(false);
    }
  };

  const loadMoreFailed = async () => {
    if (!failedCursor || loadingMoreFailed) {
      return;
    }

    setLoadingMoreFailed(true);
    setError(null);

    try {
      const next = await appApiFetch<AutomationFailedItemsResponse>(
        `/api/app/automation/failed-items?status=${failedFilter}&limit=20&cursor=${encodeURIComponent(
          failedCursor,
        )}`,
      );
      setFailedItems((prev) => [...prev, ...(next.items ?? [])]);
      setFailedCursor(next.next_cursor ?? null);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : t('common_error'));
    } finally {
      setLoadingMoreFailed(false);
    }
  };

  const onRetry = async (failedItem: AutomationFailedItem) => {
    if (!failedItem.retryable) {
      return;
    }

    setRetryingId(failedItem.id);
    setError(null);
    setMessage(null);

    try {
      await appApiFetch(`/api/app/automation/failed-items/${failedItem.id}/retry`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setMessage(t('ops_retry_queued'));
      await loadData(failedFilter, false);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : t('common_error'));
    } finally {
      setRetryingId(null);
    }
  };

  const rightSlot = useMemo(() => {
    return (
      <button
        type="button"
        onClick={() => loadData(failedFilter, false)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--ink-700)]"
      >
        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        Refresh
      </button>
    );
  }, [refreshing, loadData, failedFilter]);

  return (
    <AppShell title={t('ops_title')} subtitle={t('ops_subtitle')} rightSlot={rightSlot}>
      {loading ? (
        <div className="card rounded-3xl px-6 py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--brand)]" />
          <p className="mt-3 text-sm text-[var(--ink-500)]">{t('common_loading')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <div className="card rounded-2xl px-5 py-4 text-sm text-[var(--danger)]">{error}</div>}
          {message && (
            <div className="card rounded-2xl border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
              {message}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label={t('dashboard_ops_pending_failed')} value={opsSummary?.summary.pending_failed_count ?? 0} />
            <MetricCard label={t('dashboard_ops_queue')} value={opsSummary?.summary.queued_retry_count ?? 0} />
            <MetricCard label="Processing" value={opsSummary?.summary.processing_retry_count ?? 0} />
            <MetricCard label="Success (24h)" value={opsSummary?.summary.success_last_24h ?? 0} />
            <MetricCard label="Failed (24h)" value={opsSummary?.summary.failed_last_24h ?? 0} />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="card rounded-2xl p-5">
              <h2 className="text-lg font-black">{t('ops_executions_title')}</h2>
              <div className="mt-4 space-y-3">
                {executions.length === 0 && (
                  <p className="text-sm text-[var(--ink-500)]">{t('ops_empty_executions')}</p>
                )}
                {executions.map((item) => (
                  <article key={item.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-[var(--ink-900)]">{item.workflow_name}</p>
                      <span className={`rounded-full px-2 py-1 text-xs font-black ${statusClass(item.status)}`}>
                        {labelForExecutionStatus(item.status, t)}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-xs text-[var(--ink-500)]">
                      exec: {item.external_execution_id}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-500)]">
                      {formatDateTime(item.created_at)}
                    </p>
                    {item.error_reason && (
                      <p className="mt-2 text-xs text-rose-700">{item.error_reason}</p>
                    )}
                  </article>
                ))}
              </div>
              {executionCursor && (
                <button
                  type="button"
                  onClick={loadMoreExecutions}
                  disabled={loadingMoreExecutions}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--ink-700)]"
                >
                  {loadingMoreExecutions && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('ops_load_more')}
                </button>
              )}
            </div>

            <div className="card rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black">{t('ops_failed_title')}</h2>
                <div className="flex items-center gap-2">
                  {(['pending', 'resolved', 'ignored', 'all'] as FailedFilter[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFailedFilter(value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${
                        failedFilter === value
                          ? 'bg-[var(--brand)] text-white'
                          : 'border border-[var(--line)] bg-white text-[var(--ink-700)]'
                      }`}
                    >
                      {labelForFailedFilter(value, t)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {failedItems.length === 0 && (
                  <p className="text-sm text-[var(--ink-500)]">{t('ops_empty_failed')}</p>
                )}

                {failedItems.map((item) => (
                  <article key={item.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-[var(--ink-900)]">{item.workflow_name}</p>
                      <span className={`rounded-full px-2 py-1 text-xs font-black ${statusClass(item.status)}`}>
                        {labelForFailedStatus(item.status, t)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--ink-500)]">{item.node_name || '-'}</p>
                    <p className="mt-1 text-xs text-rose-700">{item.error_reason}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-[var(--ink-500)]">
                        retry_count: {item.retry_count} · {formatDateTime(item.created_at)}
                      </p>
                      <button
                        type="button"
                        disabled={
                          retryingId === item.id || item.status !== 'pending' || !item.retryable
                        }
                        onClick={() => onRetry(item)}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-black text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {retryingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : item.retryable ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {retryingId === item.id
                          ? t('ops_retrying')
                          : item.retryable
                            ? t('ops_retry')
                            : t('ops_not_retryable')}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {failedCursor && (
                <button
                  type="button"
                  onClick={loadMoreFailed}
                  disabled={loadingMoreFailed}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--ink-700)]"
                >
                  {loadingMoreFailed && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('ops_load_more')}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[var(--ink-900)]">{value}</p>
    </div>
  );
}

function labelForExecutionStatus(status: string, t: (key: string) => string) {
  if (status === 'started') return t('ops_status_started');
  if (status === 'success') return t('ops_status_success');
  if (status === 'failed') return t('ops_status_failed');
  return status;
}

function labelForFailedStatus(status: string, t: (key: string) => string) {
  if (status === 'pending') return t('ops_status_pending');
  if (status === 'resolved') return t('ops_status_resolved');
  if (status === 'ignored') return t('ops_status_ignored');
  return status;
}

function labelForFailedFilter(filter: FailedFilter, t: (key: string) => string) {
  if (filter === 'pending') return t('ops_filter_pending');
  if (filter === 'resolved') return t('ops_filter_resolved');
  if (filter === 'ignored') return t('ops_filter_ignored');
  return t('ops_filter_all');
}
