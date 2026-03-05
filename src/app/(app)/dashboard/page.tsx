"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, Loader2, Pencil, Rocket } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useLanguage } from '@/components/language-provider';
import { appApiFetch } from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { BootstrapPayload, ProductItem } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [publishPrice, setPublishPrice] = useState('0');
  const [publishing, setPublishing] = useState(false);

  const automationReady = bootstrap?.onboarding_status?.automation_ready ?? false;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bootstrapPayload, productsPayload] = await Promise.all([
        appApiFetch<BootstrapPayload>('/api/app/bootstrap'),
        appApiFetch<ProductItem[]>('/api/app/products'),
      ]);
      setBootstrap(bootstrapPayload);
      setProducts(productsPayload ?? []);
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : t('common_error');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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

      await refresh();
    };

    checkSessionAndLoad();
  }, [router]);

  const rightSlot = useMemo(() => {
    if (!bootstrap) return null;

    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${
          automationReady
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-800'
        }`}
      >
        <CheckCircle2 className="h-4 w-4" />
        {automationReady
          ? t('dashboard_automation_ready')
          : t('dashboard_automation_not_ready')}
      </div>
    );
  }, [automationReady, bootstrap, t]);

  const startPublish = (product: ProductItem) => {
    setEditingProduct(product);
    setPublishPrice(String(product.price ?? 0));
  };

  const onPublish = async () => {
    if (!editingProduct) return;

    const parsedPrice = Number(publishPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      await appApiFetch(`/api/app/products/${editingProduct.id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ price: parsedPrice }),
      });

      setEditingProduct(null);
      await refresh();
    } catch (publishError: unknown) {
      setError(publishError instanceof Error ? publishError.message : t('common_error'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AppShell
      title={t('dashboard_title')}
      subtitle={t('dashboard_subtitle')}
      rightSlot={rightSlot}
    >
      {loading ? (
        <div className="card rounded-3xl px-6 py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--brand)]" />
          <p className="mt-3 text-sm text-[var(--ink-500)]">{t('common_loading')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="card rounded-2xl px-5 py-4 text-sm text-[var(--danger)]">{error}</div>
          )}

          {!bootstrap?.tenant && (
            <div className="card rounded-2xl px-5 py-4">
              <p className="text-sm text-[var(--ink-700)]">
                Tenant bulunamadı. Önce onboarding ekranında tenant oluşturmalısın.
              </p>
              <Link
                href="/onboarding"
                className="mt-3 inline-flex rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white"
              >
                {t('dashboard_fix_setup')}
              </Link>
            </div>
          )}

          {bootstrap?.tenant && !automationReady && (
            <div className="card rounded-2xl border-amber-200 bg-amber-50/70 px-5 py-4">
              <p className="text-sm text-amber-900">
                Otomasyon henüz hazır değil. Sosyal hesap + sync state + token adımlarını tamamla.
              </p>
              <Link
                href="/onboarding"
                className="mt-3 inline-flex rounded-full bg-amber-600 px-4 py-2 text-sm font-bold text-white"
              >
                {t('dashboard_fix_setup')}
              </Link>
            </div>
          )}

          {products.length === 0 ? (
            <div className="card rounded-2xl px-6 py-10 text-center text-[var(--ink-500)]">
              {t('dashboard_empty')}
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => {
                const primaryMedia =
                  product.product_media?.find((item) => item.is_primary) ||
                  product.product_media?.[0];

                return (
                  <article
                    key={product.id}
                    className="card rounded-2xl overflow-hidden"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="aspect-video bg-zinc-100">
                      {primaryMedia?.file_url ? (
                        <img
                          src={primaryMedia.file_url}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-[var(--ink-500)]">
                          No media
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-extrabold leading-tight text-[var(--ink-900)]">
                          {product.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-black ${
                            product.status === 'published'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {product.status === 'published'
                            ? t('dashboard_status_published')
                            : t('dashboard_status_draft')}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm text-[var(--ink-500)]">
                        {product.ai_generated_metadata?.description || '-'}
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xl font-black text-[var(--ink-900)]">
                          ${Number(product.price ?? 0).toFixed(2)}
                        </p>
                        {product.status === 'draft' ? (
                          <button
                            type="button"
                            onClick={() => startPublish(product)}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-4 py-2 text-sm font-bold text-[var(--brand)]"
                          >
                            <Pencil className="h-4 w-4" />
                            {t('dashboard_publish')}
                          </button>
                        ) : (
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink-700)]"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {t('dashboard_view_store')}
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-lg rounded-3xl p-6">
            <h2 className="text-2xl font-black">{t('modal_publish_title')}</h2>
            <p className="mt-1 text-sm text-[var(--ink-500)]">{editingProduct.title}</p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-[var(--ink-700)]">
                {t('modal_publish_price')}
              </label>
              <input
                type="number"
                step="0.01"
                value={publishPrice}
                onChange={(event) => setPublishPrice(event.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--brand)]"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--ink-700)]"
              >
                {t('common_cancel')}
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={publishing}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-bold text-white disabled:opacity-70"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                {t('modal_publish_cta')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
