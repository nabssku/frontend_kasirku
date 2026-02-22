import { useState } from 'react';
import { useSuperAdminPlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '../../hooks/useSuperAdmin';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import type { Plan } from '../../types';

interface PlanForm {
    name: string;
    slug: string;
    price: number;
    billing_cycle: string;
    max_outlets: number;
    max_users: number;
    max_products: number;
    max_categories: number;
    max_ingredients: number;
    max_modifiers: number;
    trial_days: number;
    description: string;
    is_active: boolean;
}

const defaultForm: PlanForm = {
    name: '', slug: '', price: 0, billing_cycle: 'monthly',
    max_outlets: 1, max_users: 5, max_products: 100,
    max_categories: 10, max_ingredients: 25, max_modifiers: 10, trial_days: 14,
    description: '', is_active: true,
};

export default function SuperAdminPlans() {
    const { data: plans, isLoading } = useSuperAdminPlans();
    const createPlan = useCreatePlan();
    const updatePlan = useUpdatePlan();
    const deletePlan = useDeletePlan();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<PlanForm>(defaultForm);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const startCreate = () => {
        setForm(defaultForm);
        setEditingId(null);
        setShowForm(true);
    };

    const startEdit = (plan: Plan) => {
        setForm({
            name: plan.name,
            slug: plan.slug,
            price: plan.price,
            billing_cycle: plan.billing_cycle,
            max_outlets: plan.max_outlets,
            max_users: plan.max_users,
            max_products: plan.max_products,
            max_categories: plan.max_categories ?? 10,
            max_ingredients: plan.max_ingredients ?? 25,
            max_modifiers: plan.max_modifiers ?? 10,
            trial_days: plan.trial_days ?? 14,
            description: plan.description ?? '',
            is_active: true,
        });
        setEditingId(plan.id);
        setShowForm(true);
    };

    const handleSubmit = () => {
        if (editingId) {
            updatePlan.mutate({ id: editingId, ...form } as any, {
                onSuccess: () => { setShowForm(false); setEditingId(null); },
            });
        } else {
            createPlan.mutate(form as any, {
                onSuccess: () => { setShowForm(false); },
            });
        }
    };

    const handleDelete = (id: number) => {
        deletePlan.mutate(id, {
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Plan Management</h1>
                    <p className="text-slate-400 mt-1">Create and manage subscription plans</p>
                </div>
                <button
                    onClick={startCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-xl transition-colors text-sm"
                >
                    <Plus size={18} /> New Plan
                </button>
            </div>

            {/* Plan Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            {editingId ? 'Edit Plan' : 'Create New Plan'}
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Plan Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                        placeholder="e.g. Professional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Slug</label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                        placeholder="professional"
                                        disabled={!!editingId}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Price (IDR)</label>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Billing Cycle</label>
                                    <select
                                        value={form.billing_cycle}
                                        onChange={(e) => setForm(f => ({ ...f, billing_cycle: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Max Outlets</label>
                                    <input
                                        type="number"
                                        value={form.max_outlets}
                                        onChange={(e) => setForm(f => ({ ...f, max_outlets: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Max Users</label>
                                    <input
                                        type="number"
                                        value={form.max_users}
                                        onChange={(e) => setForm(f => ({ ...f, max_users: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Max Products</label>
                                    <input
                                        type="number"
                                        value={form.max_products}
                                        onChange={(e) => setForm(f => ({ ...f, max_products: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Max Categories</label>
                                    <input
                                        type="number"
                                        value={form.max_categories}
                                        onChange={(e) => setForm(f => ({ ...f, max_categories: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Max Ingredients</label>
                                    <input
                                        type="number"
                                        value={form.max_ingredients}
                                        onChange={(e) => setForm(f => ({ ...f, max_ingredients: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Max Modifiers</label>
                                    <input
                                        type="number"
                                        value={form.max_modifiers}
                                        onChange={(e) => setForm(f => ({ ...f, max_modifiers: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Trial Days</label>
                                    <input
                                        type="number"
                                        value={form.trial_days}
                                        onChange={(e) => setForm(f => ({ ...f, trial_days: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 h-20 resize-none"
                                    placeholder="Plan description..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={createPlan.isPending || updatePlan.isPending}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
                            >
                                {editingId ? 'Update' : 'Create'} Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Plans Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans?.map((plan) => (
                        <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{plan.slug}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => startEdit(plan)}
                                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    {deleteConfirm === plan.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(plan.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                                disabled={deletePlan.isPending}
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirm(plan.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <span className="text-3xl font-bold text-white">
                                    Rp {plan.price.toLocaleString('id-ID')}
                                </span>
                                <span className="text-sm text-slate-400 ml-1">/{plan.billing_cycle === 'monthly' ? 'bln' : 'thn'}</span>
                            </div>

                            {plan.description && (
                                <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
                            )}

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-slate-400">
                                    <span>Max Outlets</span>
                                    <span className="text-white font-medium">{plan.max_outlets}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Max Users</span>
                                    <span className="text-white font-medium">{plan.max_users}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Max Products</span>
                                    <span className="text-white font-medium">{plan.max_products}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Max Categories</span>
                                    <span className="text-white font-medium">{plan.max_categories}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Max Ingredients</span>
                                    <span className="text-white font-medium">{plan.max_ingredients}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Max Modifiers</span>
                                    <span className="text-white font-medium">{plan.max_modifiers}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Trial Days</span>
                                    <span className="text-white font-medium">{plan.trial_days}</span>
                                </div>
                            </div>

                            {plan.features?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-800">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Features</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {plan.features.map((f) => (
                                            <span
                                                key={f.feature_key}
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.feature_value === 'true'
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'bg-slate-700 text-slate-500'
                                                    }`}
                                            >
                                                {f.feature_key.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {!plans?.length && (
                        <div className="col-span-full text-center text-slate-500 py-12">No plans found</div>
                    )}
                </div>
            )}
        </div>
    );
}
