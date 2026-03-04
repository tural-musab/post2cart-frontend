import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShoppingCart, CheckCircle2, ShieldCheck } from 'lucide-react';

// SSR/ISR Component
export const revalidate = 60; // Revalidate at most every 60 seconds

async function getProduct(slug: string) {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    // We fetch directly from the backend during Server Component rendering
    const res = await fetch(`${BACKEND_URL}/api/v1/products/public/${slug}`);

    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch product');
    }
    return res.json();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const product = await getProduct(params.slug);
    if (!product) return { title: 'Product Not Found - Post2Cart' };

    return {
        title: `${product.title} | ${product.price}$`,
        description: product.ai_generated_metadata?.description || 'Exclusive product on Post2Cart',
        openGraph: {
            title: product.title,
            description: product.ai_generated_metadata?.description,
            images: [product.product_media?.find((m: any) => m.is_primary)?.file_url || ''],
        }
    };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
    const product = await getProduct(params.slug);

    if (!product || product.status !== 'published') {
        notFound();
    }

    const { title, price, ai_generated_metadata, product_media } = product;
    const medias = product_media || [];
    const primaryMedia = medias.find((m: any) => m.is_primary) || medias[0];
    const otherMedias = medias.filter((m: any) => m.id !== primaryMedia?.id);

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-gray-100 p-4 flex justify-center">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Post2Cart Setup</h2>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* Media Gallery (Left) */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group">
                            {primaryMedia ? (
                                primaryMedia.media_type === 'video' ? (
                                    <video src={primaryMedia.file_url} controls className="w-full h-full object-cover" />
                                ) : (
                                    <img src={primaryMedia.file_url} alt={title} className="w-full h-full object-cover" />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No media available</div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {otherMedias.length > 0 && (
                            <div className="grid grid-cols-4 gap-4">
                                {otherMedias.slice(0, 4).map((media: any) => (
                                    <div key={media.id} className="aspect-square rounded-lg overflow-hidden border border-gray-100">
                                        {media.media_type === 'video' ? (
                                            <div className="w-full h-full bg-black/10 flex items-center justify-center text-xs">Video</div>
                                        ) : (
                                            <img src={media.file_url} className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details (Right) */}
                    <div className="flex flex-col">
                        <div className="mb-2 flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 w-max px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-4 h-4" /> In Stock & Ready to Ship
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                            {title}
                        </h1>

                        <div className="text-4xl font-bold text-blue-600 mb-8">
                            ${price ? Number(price).toFixed(2) : "0.00"}
                        </div>

                        <div className="prose prose-gray mb-10 max-w-none">
                            <p className="text-lg text-gray-600 leading-relaxed">
                                {ai_generated_metadata?.description || "A wonderful product exclusively listed here."}
                            </p>
                        </div>

                        <div className="space-y-4 mb-10">
                            {ai_generated_metadata?.features?.map((feat: string, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-gray-700 font-medium">{feat}</span>
                                </div>
                            ))}
                        </div>

                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg">
                            <ShoppingCart className="w-5 h-5" /> Add to Cart — ${price}
                        </button>

                        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-sm">
                            <ShieldCheck className="w-4 h-4" /> SECURE CHECKOUT • 30-DAY RETURNS
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
