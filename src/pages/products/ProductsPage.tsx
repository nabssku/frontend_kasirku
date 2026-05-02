import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Package, Beef, ListTree, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts, useDeleteProduct } from '../../hooks/useProducts';
import { formatRp } from '../../lib/format';
import { useBusinessType } from '../../hooks/useBusinessType';
import { getImageUrl } from '../../utils/url';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useCurrentSubscription } from '../../hooks/useSubscription';

export default function ProductsPage() {
    const { isFnb, outlet } = useBusinessType();
    const { data: products, isLoading, error } = useProducts(undefined, undefined, outlet?.id, {
        enabled: !!outlet?.id, // Wait for outlet to load to avoid fetching all products globally
    });
    const { mutate: deleteProduct } = useDeleteProduct();
    const { user } = useAuthStore();
    const { data: subData } = useCurrentSubscription();
    const isCashier = user?.roles?.some(r => r.slug === 'cashier');
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const hasRecipeFeature = subData?.subscription?.plan?.features?.some(
        f => f.feature_key === 'inventory_recipe' && f.feature_value === 'true'
    );

    const filtered = products?.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku?.toLowerCase().includes(search.toLowerCase()))
    );

    const hasModifierFeature = subData?.subscription?.plan?.features?.some(
        f => f.feature_key === 'modifiers' && f.feature_value === 'true'
    );

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Hapus produk "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        setDeletingId(id);
        deleteProduct(id, {
            onSettled: () => setDeletingId(null),
            onSuccess: () => toast.success('Produk berhasil dihapus')
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Katalog Produk</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola produk, resep, dan stok toko Anda</p>
                </div>
                {!isCashier && (
                    <div className="flex items-center gap-2">
                        {isFnb && (
                            hasModifierFeature ? (
                                <Link
                                    to="/modifiers"
                                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm"
                                >
                                    <ListTree size={18} />
                                    Kelola Modifiers
                                </Link>
                            ) : (
                                <button
                                    onClick={() => toast.info('Fitur Modifiers memerlukan paket Professional/Enterprise')}
                                    className="flex items-center gap-2 bg-slate-50 border border-slate-100 text-slate-400 px-4 py-2.5 rounded-xl font-semibold cursor-not-allowed shadow-sm text-sm"
                                >
                                    <ListTree size={18} className="opacity-50" />
                                    Kelola Modifiers
                                    <Lock size={12} />
                                </button>
                            )
                        )}
                        <Link
                            to="/products/new"
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm"
                        >
                            <Plus size={18} />
                            Tambah Produk
                        </Link>
                    </div>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari nama atau SKU produk..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="p-10 text-center text-red-500">
                        <p>Gagal memuat produk</p>
                    </div>
                ) : filtered?.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <Package size={48} className="mx-auto mb-3 opacity-10" />
                        <p className="font-bold text-slate-900">Belum ada produk</p>
                        <p className="text-sm mt-1">Klik "Tambah Produk" untuk memulai</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                                    <th className="px-6 py-4 text-left">Produk</th>
                                    <th className="px-6 py-4 text-right">Stok</th>
                                    {isFnb && <th className="px-6 py-4 text-left hidden sm:table-cell">Resep / Mod</th>}
                                    <th className="px-6 py-4 text-left hidden md:table-cell">Kategori</th>
                                    <th className="px-6 py-4 text-right">Harga</th>
                                    <th className="px-6 py-4 text-center hidden lg:table-cell">Status</th>
                                    {!isCashier && <th className="px-6 py-4 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered?.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                                    {product.image ? (
                                                        <img 
                                                            src={getImageUrl(product.image)} 
                                                            className="w-full h-full object-cover rounded-xl" 
                                                            loading="lazy" 
                                                            decoding="async"
                                                            alt={product.name}
                                                        />
                                                    ) : (
                                                        <Package size={16} className="text-indigo-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 uppercase text-[10px] md:text-xs tracking-tight truncate">{product.name}</p>
                                                    <p className="text-[9px] md:text-[10px] text-slate-400 font-mono truncate">{product.sku || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {product.stock <= product.min_stock ? (
                                                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Limit: {product.stock}</span>
                                                ) : (
                                                    <span className="text-slate-700 font-semibold">{product.stock}</span>
                                                )}
                                            </div>
                                        </td>
                                        {isFnb && (
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                <div className="flex items-center gap-2">
                                                    {product.has_recipe && (
                                                        <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600" title="Ada Resep"><Beef size={14} /></span>
                                                    )}
                                                    {product.modifier_groups && product.modifier_groups.length > 0 && (
                                                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600" title="Ada Modifiers"><ListTree size={14} /></span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase">{product.category?.name || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900 border-r-0 whitespace-nowrap">
                                            {formatRp(product.price)}
                                        </td>
                                        <td className="px-6 py-4 text-center hidden lg:table-cell">
                                            <div className={`w-2 h-2 rounded-full mx-auto ${product.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        </td>
                                        {!isCashier && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1 transition-opacity">
                                                    {isFnb && (
                                                        hasRecipeFeature ? (
                                                            <Link
                                                                to={`/products/${product.id}/recipe`}
                                                                className="p-1.5 md:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                title="Kelola Resep"
                                                            >
                                                                <Beef size={15} />
                                                            </Link>
                                                        ) : (
                                                            <button
                                                                onClick={() => toast.info('Fitur Resep & HPP memerlukan paket Professional/Enterprise')}
                                                                className="p-1.5 md:p-2 text-slate-300 cursor-not-allowed hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1"
                                                                title="Fitur Terkunci (Butuh Upgrade)"
                                                            >
                                                                <Beef size={15} className="grayscale opacity-50" />
                                                                <Lock size={10} className="text-slate-400" />
                                                            </button>
                                                        )
                                                    )}
                                                    <Link
                                                        to={`/products/${product.id}`}
                                                        className="p-1.5 md:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={15} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(product.id, product.name)}
                                                        disabled={deletingId === product.id}
                                                        className="p-1.5 md:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
