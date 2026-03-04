"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Edit2, PlayCircle, Loader2 } from "lucide-react";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";
const DASHBOARD_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || DEFAULT_TENANT_ID;

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: string;
  ai_generated_metadata: any;
  created_at: string;
  product_media: { file_url: string; media_type: string; is_primary: boolean }[];
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?tenantId=${encodeURIComponent(DASHBOARD_TENANT_ID)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error || errorData?.message || "Failed to fetch products");
      }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string, newPrice: number) => {
    try {
      const res = await fetch(`/api/products/${id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: DASHBOARD_TENANT_ID, price: newPrice, status: "published" }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error || errorData?.message || "Failed to publish product");
      }

      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("Failed to publish:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Post2Cart Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage your AI-generated products.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-medium border border-gray-100">
          Tenant: <span className="text-blue-600">{DASHBOARD_TENANT_ID}</span>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const primaryMedia = product.product_media?.find(m => m.is_primary) || product.product_media?.[0];
            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video relative bg-gray-100 group">
                  {primaryMedia?.media_type === "video" ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/5">
                      <PlayCircle className="w-12 h-12 text-gray-400" />
                    </div>
                  ) : primaryMedia?.file_url ? (
                    <img src={primaryMedia.file_url} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Media</div>
                  )}
                  {product.status === "published" && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow">
                      Published
                    </div>
                  )}
                  {product.status === "draft" && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded shadow">
                      Draft
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-lg line-clamp-1 mb-1">{product.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {product.ai_generated_metadata?.description || "No description provided."}
                  </p>

                  <div className="flex justify-between items-center mt-4">
                    <div className="font-medium text-lg">
                      ${product.price ? Number(product.price).toFixed(2) : "0.00"}
                    </div>
                    {product.status === "draft" ? (
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm transition-colors font-medium">
                        <Edit2 className="w-4 h-4" /> Edit & Publish
                      </button>
                    ) : (
                      <a href={`/products/${product.slug}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors font-medium">
                        <ExternalLink className="w-4 h-4" /> View Store
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Publish Product</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" readOnly value={editingProduct.title} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Description</label>
              <textarea readOnly value={editingProduct.ai_generated_metadata?.description || ''} rows={4} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 resize-none" />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Set Price ($)</label>
              <input
                type="number"
                step="0.01"
                defaultValue={editingProduct.price}
                id="price-input"
                className="w-full px-3 py-2 border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = (document.getElementById('price-input') as HTMLInputElement).value;
                  handlePublish(editingProduct.id, parseFloat(val));
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all">
                Publish Live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
