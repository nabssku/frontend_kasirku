import type { Product, ModifierGroup, Modifier } from '../../../types';
import { formatRp } from '../../../lib/format';
import { useState, useMemo } from 'react'; // Added useState and useMemo imports
import { X, Check } from 'lucide-react'; // Added X and Check imports
import { getImageUrl } from '../../../utils/url';

interface ModifierPickerProps {
    product: Product;
    onClose: () => void;
    onConfirm: (selectedModifiers: Modifier[]) => void;
}

export function ModifierPicker({ product, onClose, onConfirm }: ModifierPickerProps) {
    const [selections, setSelections] = useState<Record<string, Modifier[]>>({});

    const groups = product.modifier_groups || [];

    const handleToggle = (group: ModifierGroup, modifier: Modifier) => {
        setSelections(prev => {
            const current = prev[group.id] || [];
            const isSelected = current.some(m => m.id === modifier.id);

            if (isSelected) {
                return { ...prev, [group.id]: current.filter(m => m.id !== modifier.id) };
            }

            // Max select check
            if (group.max_select > 1 && current.length >= group.max_select) {
                return prev;
            }

            // Single select (radio behavior)
            if (group.max_select === 1) {
                return { ...prev, [group.id]: [modifier] };
            }

            return { ...prev, [group.id]: [...current, modifier] };
        });
    };

    const isValid = useMemo(() => {
        return groups.every(group => {
            const count = (selections[group.id] || []).length;
            return count >= group.min_select && count <= group.max_select;
        });
    }, [groups, selections]);

    const totalExtra = useMemo(() => {
        return Object.values(selections).flat().reduce((sum, m) => sum + m.price, 0);
    }, [selections]);

    const handleConfirm = () => {
        if (!isValid) return;
        onConfirm(Object.values(selections).flat());
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-0 sm:p-4 safe-area-padding animate-in fade-in duration-300">
            <div className="bg-white rounded-t-[32px] sm:rounded-[28px] shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden mt-auto sm:mt-0 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                            {product.image ? (
                                <img src={getImageUrl(product.image)} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="text-lg font-black text-slate-300">{product.name.charAt(0)}</div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-sm leading-tight uppercase tracking-tight">{product.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pilih Tambahan</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 no-scrollbar">
                    {groups.map(group => (
                        <div key={group.id} className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <div>
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{group.name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                        {group.min_select > 0 ? `Wajib pilih min. ${group.min_select}` : 'Opsional'}
                                        {group.max_select > 1 ? ` (Maks. ${group.max_select})` : ''}
                                    </p>
                                </div>
                                {(selections[group.id]?.length || 0) >= group.min_select && (
                                    <div className="w-5 h-5 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {group.modifiers?.map(m => {
                                    const isSelected = (selections[group.id] || []).some(s => s.id === m.id);
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => handleToggle(group, m)}
                                            className={`
                                                flex items-center justify-between p-3 rounded-2xl border transition-all text-left
                                                ${isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                                                    ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}
                                                `}>
                                                    {isSelected && <Check size={10} className="text-white" strokeWidth={4} />}
                                                </div>
                                                <span className={`font-bold text-xs ${isSelected ? 'text-indigo-900 font-black' : 'text-slate-600'}`}>{m.name}</span>
                                            </div>
                                            <span className={`text-[10px] font-black ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>+ {formatRp(m.price)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 bg-white border-t border-slate-50 space-y-4 pb-8 sm:pb-5">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Harga</span>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-300 line-through font-bold">{formatRp(product.price)}</span>
                            <span className="text-lg font-black text-slate-900 tracking-tight">{formatRp(product.price + totalExtra)}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleConfirm}
                        disabled={!isValid}
                        className={`
                            w-full h-12 rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] shadow-xl transition-all active:scale-95
                            ${isValid ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
                        `}
                    >
                        Tambah ke Keranjang
                    </button>
                </div>
            </div>
        </div>
    );
}
