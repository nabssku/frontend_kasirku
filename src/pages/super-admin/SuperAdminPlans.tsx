import { useState } from 'react';
import { useSuperAdminPlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '../../hooks/useSuperAdmin';
import { Plus, Edit2, Trash2, X, Check, ShieldCheck, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { formatRp } from '../../lib/format';
import type { Plan, PlanFeature } from '../../types';

// ─── Available Features Registry ─────────────────────────────────────────────
const AVAILABLE_FEATURES: { key: string; label: string; description: string }[] = [
    { key: 'pos_basic', label: 'Basic POS Terminal', description: 'Full access to POS terminal for transactions' },
    { key: 'inventory_basic', label: 'Basic Inventory', description: 'Stock tracking and low stock alerts' },
    { key: 'inventory_recipe', label: 'Advanced Inventory (Recipe)', description: 'Product recipes and ingredient auto-deduction' },
    { key: 'modifiers', label: 'Product Modifiers', description: 'Customization options (e.g. toppings, size, sugar)' },
    { key: 'customers', label: 'Customer CRM', description: 'Manage customer database and purchase history' },
    { key: 'expenses', label: 'Expense Tracking', description: 'Record and track operational costs' },
    { key: 'kitchen_display', label: 'Kitchen Display System', description: 'Live order dashboard for kitchen staff' },
    { key: 'advanced_reports', label: 'Advanced Analytics', description: 'Detailed sales reports and export options' },
    { key: 'audit_log', label: 'Audit Activity Logs', description: 'Complete track of all system changes' },
    { key: 'shift_management', label: 'Shift Management', description: 'Manage cashier shifts and cash drawer logs' },
    { key: 'qr_self_order', label: 'QR Self-Order', description: 'Scan QR at table to order directly' },
    { key: 'api_access', label: 'Open API Access', description: 'Access system data via REST API' },
    { key: 'white_label', label: 'Receipt Customization (Pro)', description: 'Custom branding and receipt layouts' },
];

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
    max_customers: number;
    max_tables: number;
    trial_days: number;
    description: string;
    is_active: boolean;
}

const defaultForm: PlanForm = {
    name: '', slug: '', price: 0, billing_cycle: 'monthly',
    max_outlets: 1, max_users: 5, max_products: 100,
    max_categories: 10, max_ingredients: 25, max_modifiers: 10, 
    max_customers: 100, max_tables: 10, trial_days: 14,
    description: '', is_active: true,
};

// Helper: convert PlanFeature[] → enabled keys Set
function toEnabledSet(features: PlanFeature[]): Set<string> {
    return new Set(features.filter(f => f.feature_value === 'true').map(f => f.feature_key));
}

// Helper: convert enabled keys Set → features record for API
function toFeaturesPayload(enabled: Set<string>): Record<string, string> {
    const payload: Record<string, string> = {};
    AVAILABLE_FEATURES.forEach(f => {
        payload[f.key] = enabled.has(f.key) ? 'true' : 'false';
    });
    return payload;
}

export default function SuperAdminPlans() {
    const { data: plans, isLoading } = useSuperAdminPlans();
    const createPlan = useCreatePlan();
    const updatePlan = useUpdatePlan();
    const deletePlan = useDeletePlan();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<PlanForm>(defaultForm);
    const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [showLimitsSection, setShowLimitsSection] = useState(true);
    const [managingFeaturesId, setManagingFeaturesId] = useState<number | null>(null);

    const startCreate = () => {
        setForm(defaultForm);
        setEnabledFeatures(new Set());
        setEditingId(null);
        setShowLimitsSection(true);
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
            max_customers: plan.max_customers ?? 100,
            max_tables: plan.max_tables ?? 10,
            trial_days: plan.trial_days ?? 14,
            description: plan.description ?? '',
            is_active: plan.is_active ?? true,
        });
        setEnabledFeatures(toEnabledSet(plan.features ?? []));
        setEditingId(plan.id);
        setShowLimitsSection(true);
        setShowForm(true);
    };

    const toggleFeature = (key: string) => {
        setEnabledFeatures(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleSubmit = () => {
        const payload = { ...form, features: toFeaturesPayload(enabledFeatures) };
        if (editingId) {
            updatePlan.mutate({ id: editingId, ...payload } as any, {
                onSuccess: () => { setShowForm(false); setEditingId(null); },
            });
        } else {
            createPlan.mutate(payload as any, {
                onSuccess: () => setShowForm(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        deletePlan.mutate(id, {
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    const inputCls = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors';
    const labelCls = 'block text-xs text-slate-400 mb-1.5 font-medium';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Plan Management</h1>
                    <p className="text-slate-400 mt-1 text-sm">Create and manage subscription plans with features</p>
                </div>
                <button
                    onClick={startCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-amber-500/20"
                >
                    <Plus size={18} /> New Plan
                </button>
            </div>

            {/* Plan Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <h2 className="text-lg font-semibold text-white">
                                {editingId ? 'Edit Plan' : 'Create New Plan'}
                            </h2>
                            <button
                                onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-300 mb-3 pb-2 border-b border-slate-800">Basic Information</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Plan Name</label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                                className={inputCls}
                                                placeholder="e.g. Professional"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Slug</label>
                                            <input
                                                type="text"
                                                value={form.slug}
                                                onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                                                className={inputCls}
                                                placeholder="professional"
                                                disabled={!!editingId}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Price (IDR)</label>
                                            <input
                                                type="number"
                                                value={form.price}
                                                onChange={(e) => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Billing Cycle</label>
                                            <select
                                                value={form.billing_cycle}
                                                onChange={(e) => setForm(f => ({ ...f, billing_cycle: e.target.value }))}
                                                className={inputCls}
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Description</label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                            className={`${inputCls} h-20 resize-none`}
                                            placeholder="Plan description..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Limits Section (Collapsible) */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowLimitsSection(!showLimitsSection)}
                                    className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 pb-2 border-b border-slate-800"
                                >
                                    Usage Limits
                                    {showLimitsSection ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                </button>
                                {showLimitsSection && (
                                    <div className="mt-4 grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Max Outlets', key: 'max_outlets' },
                                            { label: 'Max Users', key: 'max_users' },
                                            { label: 'Max Products', key: 'max_products' },
                                            { label: 'Max Categories', key: 'max_categories' },
                                            { label: 'Max Ingredients', key: 'max_ingredients' },
                                            { label: 'Max Modifiers', key: 'max_modifiers' },
                                            { label: 'Max Customers', key: 'max_customers' },
                                            { label: 'Max Tables', key: 'max_tables' },
                                        ].map(({ label, key }) => (
                                            <div key={key}>
                                                <label className={labelCls}>{label}</label>
                                                <input
                                                    type="number"
                                                    value={(form as any)[key]}
                                                    onChange={(e) => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 1 }))}
                                                    className={inputCls}
                                                />
                                            </div>
                                        ))}
                                        <div>
                                            <label className={labelCls}>Trial Days</label>
                                            <input
                                                type="number"
                                                value={form.trial_days}
                                                onChange={(e) => setForm(f => ({ ...f, trial_days: parseInt(e.target.value) || 0 }))}
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Features Section */}
                            <div>
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                                    <h3 className="text-sm font-semibold text-slate-300">Plan Features</h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEnabledFeatures(new Set(AVAILABLE_FEATURES.map(f => f.key)))}
                                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                                        >
                                            Enable All
                                        </button>
                                        <span className="text-slate-600">·</span>
                                        <button
                                            type="button"
                                            onClick={() => setEnabledFeatures(new Set())}
                                            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                                        >
                                            Disable All
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {AVAILABLE_FEATURES.map((feature) => {
                                        const isEnabled = enabledFeatures.has(feature.key);
                                        return (
                                            <button
                                                key={feature.key}
                                                type="button"
                                                onClick={() => toggleFeature(feature.key)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isEnabled
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
                                                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${isEnabled ? 'text-emerald-300' : 'text-slate-400'}`}>
                                                        {feature.label}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{feature.description}</p>
                                                </div>
                                                <div className={`ml-3 flex-shrink-0 transition-colors ${isEnabled ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                    {isEnabled
                                                        ? <ToggleRight size={24} />
                                                        : <ToggleLeft size={24} />
                                                    }
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-slate-600 mt-2">
                                    {enabledFeatures.size} of {AVAILABLE_FEATURES.length} features enabled
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={createPlan.isPending || updatePlan.isPending || !form.name}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20"
                            >
                                {createPlan.isPending || updatePlan.isPending ? 'Saving...' : (editingId ? 'Update Plan' : 'Create Plan')}
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
                    {plans?.map((plan) => {
                        const activeFeatures = (plan.features ?? []).filter(f => f.feature_value === 'true');
                        const isManaging = managingFeaturesId === plan.id;

                        return (
                            <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors flex flex-col">
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{plan.slug}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => startEdit(plan)}
                                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                                            title="Edit Plan"
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
                                                title="Delete Plan"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-white">
                                        {formatRp(plan.price)}
                                    </span>
                                    <span className="text-sm text-slate-400 ml-1">/{plan.billing_cycle === 'monthly' ? 'bln' : 'thn'}</span>
                                </div>

                                {plan.description && (
                                    <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
                                )}

                                {/* Limits */}
                                <div className="space-y-1.5 text-sm mb-4">
                                    {[
                                        ['Outlets', plan.max_outlets],
                                        ['Users', plan.max_users],
                                        ['Products', plan.max_products],
                                        ['Categories', plan.max_categories],
                                        ['Customers', plan.max_customers],
                                        ['Tables', plan.max_tables],
                                        ['Trial Days', plan.trial_days],
                                    ].map(([label, val]) => (
                                        <div key={label as string} className="flex justify-between text-slate-400">
                                            <span>{label}</span>
                                            <span className="text-white font-medium">{val}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Features */}
                                <div className="border-t border-slate-800 pt-4 mt-auto">
                                    <button
                                        onClick={() => setManagingFeaturesId(isManaging ? null : plan.id)}
                                        className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheck size={13} />
                                            <span className="uppercase tracking-wider font-semibold">
                                                {activeFeatures.length} Features Enabled
                                            </span>
                                        </div>
                                        {isManaging ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                    </button>

                                    {isManaging ? (
                                        <div className="space-y-1">
                                            {AVAILABLE_FEATURES.map(f => {
                                                const featureData = (plan.features ?? []).find(pf => pf.feature_key === f.key);
                                                const isOn = featureData?.feature_value === 'true';
                                                return (
                                                    <div key={f.key} className="flex items-center justify-between py-1">
                                                        <span className={`text-xs ${isOn ? 'text-slate-300' : 'text-slate-600'}`}>{f.label}</span>
                                                        {isOn
                                                            ? <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">ON</span>
                                                            : <span className="text-xs bg-slate-800 text-slate-600 px-2 py-0.5 rounded-full">OFF</span>
                                                        }
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {activeFeatures.length > 0 ? activeFeatures.map(f => (
                                                <span
                                                    key={f.feature_key}
                                                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400"
                                                >
                                                    {f.feature_key.replace(/_/g, ' ')}
                                                </span>
                                            )) : (
                                                <span className="text-xs text-slate-600 italic">No features enabled</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {!plans?.length && (
                        <div className="col-span-full text-center text-slate-500 py-12">
                            No plans found. Create your first plan to get started.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
