import { useState, useEffect } from 'react';
import { useTickets, useUpdateTicketStatus } from '../../hooks/useTickets';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
    MessageSquare, 
    Search, 
    Clock, 
    ChevronRight, 
    Building2, 
    User as UserIcon,
    AlertCircle,
    CheckCircle2,
    Plus,
    X as XIcon
} from 'lucide-react';
import { useSuperAdminTenants, useSuperAdminUsers } from '../../hooks/useSuperAdmin';
import { toast } from 'sonner';
import { useCreateTicket } from '../../hooks/useTickets';
import { useQueryClient } from '@tanstack/react-query';
import echo from '../../lib/echo';

export default function AdminTicketsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Real-time Listener for Super Admin
    useEffect(() => {
        const channel = echo.private('super-admin')
            .listen('.ticket.updated', (e: any) => {
                console.log('Ticket real-time update received:', e);
                // Invalidate tickets list to fetch fresh data
                queryClient.invalidateQueries({ queryKey: ['tickets'] });
                
                // If it's a new ticket, maybe show a toast
                if (e.type === 'created') {
                    toast.info(`Tiket Baru: ${e.ticket.subject}`, {
                        description: `Dari ${e.ticket.tenant?.name || 'User'}`
                    });
                }
            });

        return () => {
            channel.stopListening('.ticket.updated');
            echo.leave('super-admin');
        };
    }, [queryClient]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({
        tenant_id: '',
        user_id: '',
        subject: '',
        message: '',
        priority: 'medium'
    });

    const { data: ticketsResponse, isLoading } = useTickets({ 
        status: statusFilter === 'all' ? undefined : statusFilter 
    });
    const updateStatus = useUpdateTicketStatus();
    const createTicket = useCreateTicket();

    // Hooks for tenant/user selection
    const { data: tenantsResponse } = useSuperAdminTenants({ per_page: 100 });
    const { data: usersResponse } = useSuperAdminUsers({ 
        tenant_id: newTicket.tenant_id, 
        per_page: 100 
    });

    const tickets = ticketsResponse?.data || [];
    const filteredTickets = tickets.filter((t: any) => 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'open': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'closed': return 'bg-slate-800 text-slate-400 border-slate-700';
            case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    const handleUpdateStatus = async (id: number, status: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateStatus.mutateAsync({ id, status });
            toast.success(`Status tiket diubah menjadi ${status}`);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicket.tenant_id || !newTicket.user_id || !newTicket.subject || !newTicket.message) {
            toast.error('Mohon lengkapi semua data');
            return;
        }

        try {
            await createTicket.mutateAsync(newTicket);
            toast.success('Tiket berhasil dibuat');
            setIsCreateModalOpen(false);
            setNewTicket({
                tenant_id: '',
                user_id: '',
                subject: '',
                message: '',
                priority: 'medium'
            });
        } catch (error) {
            console.error(error);
            toast.error('Gagal membuat tiket');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage and respond to support requests from tenant owners</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/10 transition-all"
                    >
                        <Plus size={18} />
                        Buka Tiket Baru
                    </button>

                    <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
                        {['all', 'open', 'pending', 'closed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                                    statusFilter === status 
                                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {status === 'all' ? 'Semua' : status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all">
                        <Search className="text-slate-500" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by subject, user, or merchant..."
                            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-500/20">
                             Total: {tickets.length} Tiket
                         </div>
                    </div>
                </div>

                <div className="divide-y divide-slate-800">
                    {isLoading ? (
                        <div className="p-20 text-center text-slate-500 font-medium animate-pulse">Loading tickets...</div>
                    ) : filteredTickets.length > 0 ? (
                        filteredTickets.map((ticket: any) => (
                            <div 
                                key={ticket.id}
                                onClick={() => navigate(`/super-admin/tickets/${ticket.id}`)}
                                className="p-5 hover:bg-slate-800/50 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                                        ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                                    }`}>
                                        <MessageSquare size={24} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight">{ticket.subject}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusStyles(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                <Building2 size={14} className="text-slate-500" />
                                                <span className="text-amber-500">{ticket.tenant?.name || 'Platform'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                <UserIcon size={14} className="text-slate-500" />
                                                <span>{ticket.user?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Clock size={14} />
                                                <span>{format(new Date(ticket.last_message_at || ticket.created_at), 'dd/MM/yy HH:mm')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center">
                                    {ticket.status !== 'closed' && (
                                        <button 
                                            onClick={(e) => handleUpdateStatus(ticket.id, 'closed', e)}
                                            className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                                            title="Tutup Tiket"
                                        >
                                            <CheckCircle2 size={20} />
                                        </button>
                                    )}
                                    {ticket.status === 'open' && (
                                        <button 
                                            onClick={(e) => handleUpdateStatus(ticket.id, 'pending', e)}
                                            className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all"
                                            title="Set Pending"
                                        >
                                            <AlertCircle size={20} />
                                        </button>
                                    )}
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all ml-2">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                <MessageSquare size={40} className="text-slate-700" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-400 font-bold">No tickets found</p>
                                <p className="text-slate-600 text-sm">Try adjusting your filters or search keywords</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Ticket Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Buka Tiket Baru</h3>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
                            >
                                <XIcon size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Pilih Merchant (Tenant)</label>
                                    <select 
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-amber-500/50 outline-none appearance-none cursor-pointer"
                                        value={newTicket.tenant_id}
                                        onChange={(e) => {
                                            setNewTicket(prev => ({ ...prev, tenant_id: e.target.value, user_id: '' }));
                                        }}
                                    >
                                        <option value="">Pilih Tenant...</option>
                                        {tenantsResponse?.data?.map((tenant: any) => (
                                            <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {newTicket.tenant_id && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Pilih Pengguna</label>
                                        <select 
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-amber-500/50 outline-none appearance-none cursor-pointer"
                                            value={newTicket.user_id}
                                            onChange={(e) => setNewTicket(prev => ({ ...prev, user_id: e.target.value }))}
                                        >
                                            <option value="">Pilih User...</option>
                                            {usersResponse?.data?.map((user: any) => (
                                                <option key={user.id} value={user.id}>{user.name} ({user.roles?.[0]?.name})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Subjek Tiket</label>
                                    <input 
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700"
                                        placeholder="Contoh: Maintenance Terjadwal"
                                        value={newTicket.subject}
                                        onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Pesan / Pengumuman</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all resize-none placeholder:text-slate-700"
                                        placeholder="Tulis pesan Anda untuk merchant..."
                                        value={newTicket.message}
                                        onChange={(e) => setNewTicket(prev => ({ ...prev, message: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-sm font-bold transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={createTicket.isPending}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/10"
                                >
                                    {createTicket.isPending ? 'Mengirim...' : 'Kirim Tiket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
