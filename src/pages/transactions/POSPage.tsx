import { useState } from 'react';
import { Search, LayoutGrid, ShoppingCart, AlertCircle } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { ProductCard } from '../../features/transactions/components/ProductCard';
import { CartSidebar } from '../../features/transactions/components/CartSidebar';
import { useCartStore } from '../../app/store/useCartStore';
import { useBusinessType } from '../../hooks/useBusinessType';
import { motion, AnimatePresence } from 'framer-motion';

export default function POSPage() {
    const { items } = useCartStore();
    const itemsCount = items.length;
    const { outlet } = useBusinessType();
    const { data: products, isLoading, error } = useProducts(undefined, undefined, outlet?.id, {
        enabled: !!outlet?.id, // Prevent fetching global products while outlet resolves
    });
    const { data: categories = [] } = useCategories();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const filteredProducts = products?.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory ? product.category_id === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });


    return (
        <div className="h-full flex overflow-hidden bg-slate-50 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
            {/* Cart Sidebar - Pass props for responsiveness */}
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            {/* Product Area - Flex 1 */}
            <div className="flex-1 flex flex-col h-full overflow-hidden border-l border-slate-200">
                {/* Header Section: Search & Categories */}
                <div className="bg-white p-4 md:p-6 shadow-sm border-b border-slate-200 space-y-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari produk berdasarkan nama atau SKU..."
                            className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Category Selection Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 ${selectedCategory === null
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                                : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                                }`}
                        >
                            <LayoutGrid size={14} />
                            Semua Produk
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 ${selectedCategory === cat.id
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide no-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="font-bold text-xs uppercase tracking-widest animate-pulse">Menghubungkan ke pusat data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500 gap-3">
                            <div className="bg-red-50 p-4 rounded-full">
                                <AlertCircle size={48} className="opacity-80" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-lg uppercase tracking-tight">Terjadi Kesalahan</p>
                                <p className="text-sm text-red-400 font-medium">Gagal mengambil daftar produk.</p>
                            </div>
                        </div>
                    ) : filteredProducts?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 opacity-60">
                            <div className="bg-slate-100 p-6 rounded-full">
                                <ShoppingCart size={64} className="opacity-20" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-lg uppercase tracking-tight">Katalog Kosong</p>
                                <p className="text-sm font-medium">Tidak ada produk yang sesuai dengan kriteria.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6 pb-24">
                            {filteredProducts?.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Floating Cart Button for Mobile/Tablet */}
                <motion.button
                    layout
                    initial={false}
                    animate={{ scale: itemsCount > 0 ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setIsCartOpen(true)}
                    className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90 z-30"
                >
                    <div className="relative">
                        <ShoppingCart size={24} />
                        <AnimatePresence>
                            {itemsCount > 0 && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute -top-3 -right-3 w-7 h-7 bg-white text-indigo-600 rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-indigo-600"
                                >
                                    <motion.span
                                        key={itemsCount}
                                        initial={{ y: 5, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="inline-block"
                                    >
                                        {itemsCount}
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.button>
            </div>
        </div>
    );
}
