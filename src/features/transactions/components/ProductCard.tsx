import { Plus, Package } from 'lucide-react';
import { useCartStore } from '../../../app/store/useCartStore';
import type { Product, Modifier } from '../../../types';
import { useState } from 'react';
import { ModifierPicker } from './ModifierPicker';
import { triggerHaptic } from '../../../utils/capacitor';
import { formatRp } from '../../../lib/format';

interface ProductCardProps {
    product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
    const { addItem } = useCartStore();
    const [showModifiers, setShowModifiers] = useState(false);

    const handleAddToCart = () => {
        if (product.modifier_groups && product.modifier_groups.length > 0) {
            setShowModifiers(true);
        } else {
            triggerHaptic();
            addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                modifiers: [],
            });
        }
    };

    const onModifierConfirm = (mods: Modifier[]) => {
        triggerHaptic();
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            modifiers: mods.map(m => ({ modifier_id: m.id, name: m.name, price: m.price })),
        });
        setShowModifiers(false);
    };

    const isLowStock = product.stock <= product.min_stock;

    return (
        <>
            <div
                className={`
                    bg-white rounded-2xl border border-slate-100 p-3 md:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group relative
                    ${!product.is_active || product.stock <= 0 ? 'opacity-60 grayscale' : 'hover:border-indigo-200'}
                `}
                onClick={() => product.is_active && product.stock > 0 && handleAddToCart()}
            >
                <div className="relative aspect-square rounded-xl bg-slate-50 mb-4 overflow-hidden">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="text-slate-200" size={48} />
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold text-white ${isLowStock ? 'bg-red-500' : 'bg-slate-800/80'}`}>
                            {product.stock} pcs
                        </span>
                        {product.modifier_groups && product.modifier_groups.length > 0 && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-indigo-500">
                                Customizable
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1 truncate uppercase tracking-tight">{product.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{product.category?.name || 'Uncategorized'}</p>
                    <div className="flex items-center justify-between pt-2">
                        <p className="font-bold text-indigo-600">{formatRp(product.price)}</p>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Plus size={18} />
                        </div>
                    </div>
                </div>

                {/* Overlays */}
                {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-2xl">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">Habis</span>
                    </div>
                )}
            </div>

            {showModifiers && (
                <ModifierPicker
                    product={product}
                    onClose={() => setShowModifiers(false)}
                    onConfirm={onModifierConfirm}
                />
            )}
        </>
    );
};
