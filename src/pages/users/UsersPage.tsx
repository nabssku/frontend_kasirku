import { useState } from 'react';
import { Plus, Pencil, Trash2, Users, X, ShieldCheck } from 'lucide-react';
import { useUsers, useInviteUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { useOutlets } from '../../hooks/useOutlets';
import type { User } from '../../types';

const ROLE_OPTIONS = [
    { value: 'owner', label: 'Owner', color: 'bg-purple-100 text-purple-700' },
    { value: 'admin', label: 'Admin', color: 'bg-blue-100 text-blue-700' },
    { value: 'cashier', label: 'Kasir', color: 'bg-green-100 text-green-700' },
    { value: 'kitchen', label: 'Dapur', color: 'bg-orange-100 text-orange-700' },
];

function roleBadge(slug: string) {
    const r = ROLE_OPTIONS.find(r => r.value === slug);
    return r ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.color}`}>{r.label}</span> : null;
}

export default function UsersPage() {
    const { data: users = [], isLoading } = useUsers();
    const { data: outlets = [] } = useOutlets();
    const inviteUser = useInviteUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<User | null>(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role_slug: 'cashier', outlet_id: '', is_active: true });

    const resetForm = () => { setForm({ name: '', email: '', password: '', role_slug: 'cashier', outlet_id: '', is_active: true }); setEditItem(null); };

    const openEdit = (item: User) => {
        setEditItem(item);
        setForm({ name: item.name, email: item.email, password: '', role_slug: item.roles?.[0]?.slug ?? 'cashier', outlet_id: item.outlet_id ?? '', is_active: item.is_active });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (editItem) {
            await updateUser.mutateAsync({ id: editItem.id, payload: { name: form.name, email: form.email, role_slug: form.role_slug, outlet_id: form.outlet_id || undefined, is_active: form.is_active } });
        } else {
            await inviteUser.mutateAsync(form);
        }
        resetForm();
        setShowForm(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola akun staf dan akses peran</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium">
                    <Plus size={18} /> Undang Pengguna
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-16 text-slate-400">Memuat...</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="text-left px-6 py-3">Pengguna</th>
                                <th className="text-left px-6 py-3">Peran</th>
                                <th className="text-left px-6 py-3">Outlet</th>
                                <th className="text-center px-6 py-3">Status</th>
                                <th className="text-right px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{user.name}</p>
                                                <p className="text-xs text-slate-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {user.roles?.map(r => <span key={r.id}>{roleBadge(r.slug)}</span>)}
                                            {(!user.roles || user.roles.length === 0) && <span className="text-xs text-slate-400">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{user.outlet?.name ?? <span className="text-slate-300">—</span>}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                            <ShieldCheck size={11} /> {user.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(user)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={15} /></button>
                                            <button onClick={() => deleteUser.mutate(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-16 text-center">
                                    <Users size={40} className="mx-auto mb-3 text-slate-200" />
                                    <p className="text-slate-400">Belum ada pengguna.</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- User Form Modal --- */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">{editItem ? 'Edit Pengguna' : 'Undang Pengguna Baru'}</h2>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Nama Lengkap</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="john@email.com" />
                            </div>
                            {!editItem && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Password</label>
                                    <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="Min. 8 karakter" />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Peran</label>
                                    <select value={form.role_slug} onChange={e => setForm(f => ({ ...f, role_slug: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white">
                                        {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Outlet</label>
                                    <select value={form.outlet_id} onChange={e => setForm(f => ({ ...f, outlet_id: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white">
                                        <option value="">Semua Outlet</option>
                                        {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            {editItem && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded text-indigo-600" />
                                    <span className="text-sm text-slate-700">Pengguna aktif</span>
                                </label>
                            )}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                            <button onClick={handleSubmit} disabled={inviteUser.isPending || updateUser.isPending} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                                {inviteUser.isPending || updateUser.isPending ? 'Menyimpan...' : editItem ? 'Simpan' : 'Undang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
