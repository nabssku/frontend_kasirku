import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, Loader2, Info, Beef, Package } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useIngredients } from '../../hooks/useIngredients';
import { useRecipe, useUpsertRecipe, useDeleteRecipe } from '../../hooks/useRecipes';
import { useBusinessType } from '../../hooks/useBusinessType';
import type { RecipeItem } from '../../types';
import { toast } from 'sonner';
import { formatRp } from '../../lib/format';

export default function RecipePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: products } = useProducts();
    const { data: ingredients = [] } = useIngredients();
    const { data: recipe, isLoading: loadingRecipe } = useRecipe(id!);
    const upsertRecipe = useUpsertRecipe();
    const deleteRecipe = useDeleteRecipe();

    const product = products?.find(p => p.id === id);

    const { isRetail } = useBusinessType();
    const [items, setItems] = useState<Partial<RecipeItem>[]>([]);
    const [yieldQty, setYieldQty] = useState(1);

    useMemo(() => {
        if (isRetail) {
            toast.error('Resep tidak tersedia untuk bisnis tipe Retail');
            navigate('/products');
        }
    }, [isRetail, navigate]);

    // Sync state when recipe loads
    useMemo(() => {
        if (recipe) {
            setItems(recipe.items);
            setYieldQty(recipe.yield);
        }
    }, [recipe]);

    const addItem = () => {
        setItems([...items, { ingredient_id: '', quantity: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof RecipeItem, value: any) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: value };
        setItems(next);
    };

    const totalCost = useMemo(() => {
        return items.reduce((sum, item) => {
            const ing = ingredients.find(i => i.id === item.ingredient_id);
            return sum + (ing ? (ing.cost_per_unit * (item.quantity || 0)) : 0);
        }, 0);
    }, [items, ingredients]);

    const handleSave = async () => {
        if (!id) return;
        await upsertRecipe.mutateAsync({
            productId: id,
            payload: {
                yield: yieldQty,
                items: items.filter(item => item.ingredient_id && (item.quantity || 0) > 0) as RecipeItem[]
            }
        });
        toast.success('Resep berhasil disimpan!');
        navigate('/products');
    };

    if (loadingRecipe) return <div className="p-10 text-center text-slate-400">Memuat resep...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/products')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Resep Produk</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Produk: <span className="font-bold text-slate-900 uppercase">{product?.name || 'Loading...'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {recipe && (
                        <button
                            onClick={() => confirm('Hapus resep ini?') && deleteRecipe.mutate(id!, { onSuccess: () => navigate('/products') })}
                            className="text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-2 rounded-xl"
                        >
                            Hapus Resep
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={upsertRecipe.isPending}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                        {upsertRecipe.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Simpan Resep
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <Package size={16} className="text-indigo-500" /> Komposisi Bahan
                            </h3>
                            <button onClick={addItem} className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                <Plus size={14} /> Tambah Bahan
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {items.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                    <p className="text-sm">Belum ada bahan yang ditambahkan.</p>
                                </div>
                            ) : (
                                items.map((item, index) => (
                                    <div key={index} className="flex items-end gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Bahan Baku</label>
                                            <select
                                                value={item.ingredient_id}
                                                onChange={e => updateItem(index, 'ingredient_id', e.target.value)}
                                                className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
                                            >
                                                <option value="">Pilih Bahan...</option>
                                                {ingredients.map(ing => (
                                                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-32">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Jumlah</label>
                                            <input
                                                type="number"
                                                value={item.quantity || ''}
                                                onChange={e => updateItem(index, 'quantity', +e.target.value)}
                                                className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                        <button onClick={() => removeItem(index)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl mb-0.5 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase text-xs tracking-wider">
                            <Info size={16} className="text-indigo-500" /> Ringkasan Biaya
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hasil (Yield)</label>
                                <div className="flex items-center gap-3 mt-1">
                                    <input
                                        type="number"
                                        value={yieldQty}
                                        onChange={e => setYieldQty(+e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                                    />
                                    <span className="text-sm font-bold text-slate-400">Porsi</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 italic">Jumlah porsi yang dihasilkan dari bahan di sebelah.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-50 space-y-2">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Total Biaya Bahan</span>
                                    <span className="font-bold text-slate-900">{formatRp(totalCost)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-xs font-bold text-indigo-600 uppercase">HPP per Porsi</span>
                                    <span className="text-xl font-black text-indigo-600">{formatRp(Math.round(totalCost / (yieldQty || 1)))}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <div className="flex justify-between text-sm text-slate-500 mb-1">
                                    <span>Harga Jual</span>
                                    <span className="font-bold text-slate-900">{formatRp(product?.price || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-emerald-600 uppercase">Estimasi Laba per Porsi</span>
                                    <span className="text-lg font-bold text-emerald-600">
                                        {formatRp(Math.max(0, (product?.price || 0) - (totalCost / (yieldQty || 1))))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                        <div className="flex items-start gap-3 text-indigo-700">
                            <Beef size={20} className="shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-tight">Info Stok Otomatis</p>
                                <p className="text-xs leading-relaxed opacity-80">
                                    Stok bahan baku akan terpotong secara otomatis setiap kali produk ini terjual di Kasir.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
