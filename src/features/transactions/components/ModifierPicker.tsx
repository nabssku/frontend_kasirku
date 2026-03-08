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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 safe-area-padding">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            {product.image ? (
                                <img src={getImageUrl(product.image)} className="w-full h-full object-cover rounded-2xl" alt="" />
                            ) : (
                                <div className="text-xl font-bold text-indigo-600">{product.name.charAt(0)}</div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{product.name}</h3>
                            <p className="text-sm text-slate-500">Pilih tambahan / opsi</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {groups.map(group => (
                        <div key={group.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-900">{group.name}</h4>
                                    <p className="text-xs text-slate-400">
                                        {group.min_select > 0 ? `Wajib pilih min. ${group.min_select}` : 'Opsional'}
                                        {group.max_select > 1 ? ` (Maks. ${group.max_select})` : ''}
                                    </p>
                                </div>
                                {(selections[group.id]?.length || 0) >= group.min_select && (
                                    <span className="text-emerald-500 bg-emerald-50 p-1 rounded-full"><Check size={12} /></span>
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
                        flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left
                        ${isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}
                      `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                          ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}
                        `}>
                                                    {isSelected && <Check size={12} className="text-white" />}
                                                </div>
                                                <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{m.name}</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-500">+ {formatRp(m.price)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center justify-between pt-2">
                        <p className="font-bold text-indigo-600">{formatRp(product.price)}</p>
                        <span className="text-lg font-bold text-slate-900">{formatRp(product.price + totalExtra)}</span>
                    </div>
                    <button
                        onClick={handleConfirm}
                        disabled={!isValid}
                        className={`
              w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95
              ${isValid ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-slate-300 cursor-not-allowed shadow-none'}
            `}
                    >
                        Tambah ke Keranjang
                    </button>
                </div>
            </div>
        </div>
    );
}
