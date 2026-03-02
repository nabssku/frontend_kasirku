import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem } from '../../../app/store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRp } from '../../../lib/format';

interface CartItemListProps {
    items: CartItem[];
    updateQuantity: (cartId: string, quantity: number) => void;
    removeItem: (cartId: string) => void;
}

export const CartItemList = ({ items, updateQuantity, removeItem }: CartItemListProps) => {
    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center py-20 px-10 text-center space-y-4 opacity-40">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                    <ShoppingCart size={40} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Keranjang Kosong</h3>
                    <p className="text-[11px] text-slate-300 mt-1">Pilih produk di sebelah kiri...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            <AnimatePresence initial={false}>
                {items.map((item) => (
                    <motion.div
                        key={item.cartId}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: -20, transition: { duration: 0.2 } }}
                        className="group p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-indigo-100/50"
                    >
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="font-bold text-slate-800 text-sm truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                        {item.name}
                                    </h4>
                                    <motion.span
                                        key={item.quantity}
                                        initial={{ scale: 1.2, color: '#4f46e5' }}
                                        animate={{ scale: 1, color: '#cbd5e1' }}
                                        className="text-[10px] font-bold"
                                    >
                                        × {item.quantity}
                                    </motion.span>
                                </div>
                                <p className="text-xs font-black text-indigo-600">{formatRp(item.price * item.quantity)}</p>

                                {item.modifiers.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {item.modifiers.map((mod, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100 uppercase tracking-tighter">
                                                {mod.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-all">
                                    <button
                                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all active:scale-75 shadow-none hover:shadow-sm"
                                    >
                                        <Minus size={14} strokeWidth={3} />
                                    </button>
                                    <span className="w-8 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all active:scale-75 shadow-none hover:shadow-sm"
                                    >
                                        <Plus size={14} strokeWidth={3} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeItem(item.cartId)}
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
