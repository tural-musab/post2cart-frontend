import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CheckCircle2, ShieldCheck, ShoppingBag } from 'lucide-react';

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

async function getProduct(slug: string) {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3000';

  const response = await fetch(`${backendUrl}/api/v1/products/public/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch product');
  }

  return response.json();
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Post2Cart',
    };
  }

  return {
    title: `${product.title} | $${Number(product.price ?? 0).toFixed(2)}`,
    description:
      product.ai_generated_metadata?.description || 'AI-generated product listing powered by Post2Cart.',
    openGraph: {
      title: product.title,
      description: product.ai_generated_metadata?.description,
      images: [product.product_media?.find((item: any) => item.is_primary)?.file_url || ''],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || product.status !== 'published') {
    notFound();
  }

  const mediaList = product.product_media || [];
  const primaryMedia = mediaList.find((item: any) => item.is_primary) || mediaList[0];

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="card rounded-3xl p-6">
          <Image
            src="/brand/logo-p2c.jpg"
            width={512}
            height={279}
            alt="Post2Cart"
            className="h-14 w-auto rounded-lg object-contain"
          />
          <p className="mt-1 text-sm text-[var(--ink-500)]">AI-powered social commerce listing</p>
        </header>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="card rounded-3xl p-4 md:p-6">
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-zinc-100">
              {primaryMedia ? (
                primaryMedia.media_type === 'video' ? (
                  <video src={primaryMedia.file_url} controls className="aspect-square w-full object-cover" />
                ) : (
                  <img src={primaryMedia.file_url} alt={product.title} className="aspect-square w-full object-cover" />
                )
              ) : (
                <div className="flex aspect-square items-center justify-center text-sm text-[var(--ink-500)]">
                  No media available
                </div>
              )}
            </div>
          </section>

          <section className="card rounded-3xl p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> VERIFIED LISTING
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight text-[var(--ink-900)] md:text-4xl">
              {product.title}
            </h1>
            <p className="mt-4 text-4xl font-black text-[var(--brand)]">
              ${Number(product.price ?? 0).toFixed(2)}
            </p>

            <p className="mt-6 text-base leading-relaxed text-[var(--ink-600)]">
              {product.ai_generated_metadata?.description ||
                'AI-generated product listing from social content.'}
            </p>

            {Array.isArray(product.ai_generated_metadata?.features) && (
              <ul className="mt-6 space-y-3">
                {product.ai_generated_metadata.features.map((feature: string, index: number) => (
                  <li key={`${feature}-${index}`} className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-black text-white hover:bg-[var(--brand-strong)]"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </button>

            <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-500)]">
              <ShieldCheck className="h-4 w-4" />
              Secure checkout and protected payment flow
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
