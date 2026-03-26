import { useState } from 'react';
import { Plus, MessageSquare, Clock, AlertCircle, ChevronRight, Search } from 'lucide-react';
import { useTickets, useCreateTicket } from '../../hooks/useTickets';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SupportPage() {
    const navigate = useNavigate();
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });

    const { data: ticketsResponse, isLoading } = useTickets();
    const createTicket = useCreateTicket();

    const tickets = ticketsResponse?.data || [];

    const filteredTickets = tickets.filter((t: any) => 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTicket.mutateAsync(newTicket);
            toast.success('Ticket berhasil dikirim. Tim kami akan segera merespon.');
            setShowNewTicket(false);
            setNewTicket({ subject: '', message: '', priority: 'medium' });
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-emerald-100 text-emerald-700';
            case 'closed': return 'bg-slate-100 text-slate-600';
            case 'pending': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-600';
            case 'medium': return 'bg-blue-100 text-blue-600';
            case 'low': return 'bg-slate-100 text-slate-500';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pusat Bantuan & Support</h1>
                    <p className="text-sm text-slate-500 mt-1">Sampaikan kendala atau pertanyaan Anda kepada tim Superadmin</p>
                </div>
                <button 
                    onClick={() => setShowNewTicket(true)}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-sm"
                >
                    <Plus size={20} /> Buka Tiket Baru
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Summary */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 text-lg">Informasi Tiket</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                                <span className="text-sm text-emerald-700 font-medium">Aktif</span>
                                <span className="text-lg font-bold text-emerald-800">{tickets.filter((t: any) => t.status === 'open').length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                                <span className="text-sm text-amber-700 font-medium">Menunggu</span>
                                <span className="text-lg font-bold text-amber-800">{tickets.filter((t: any) => t.status === 'pending').length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm text-slate-600 font-medium">Selesai</span>
                                <span className="text-lg font-bold text-slate-800">{tickets.filter((t: any) => t.status === 'closed').length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl text-white shadow-lg">
                        <AlertCircle className="mb-3 opacity-80" />
                        <h3 className="font-bold text-lg mb-2">Butuh bantuan cepat?</h3>
                        <p className="text-indigo-100 text-xs leading-relaxed">
                            Pastikan Anda sudah membaca panduan penggunaan di halaman dokumentasi sebelum membuka tiket baru untuk respon yang lebih efektif.
                        </p>
                    </div>
                </div>

                {/* Ticket List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                            <Search className="text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Cari tiket berdasarkan subjek..."
                                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="divide-y divide-slate-50">
                            {isLoading ? (
                                <div className="p-12 text-center text-slate-400">Memuat data tiket...</div>
                            ) : filteredTickets.length > 0 ? (
                                filteredTickets.map((ticket: any) => (
                                    <div 
                                        key={ticket.id} 
                                        onClick={() => navigate(`/support/tickets/${ticket.id}`)}
                                        className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                <MessageSquare size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{ticket.subject}</h4>
                                                <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest">
                                                    <span className={`px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                                                        {ticket.status}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
                                                        {ticket.priority}
                                                    </span>
                                                    <span className="text-slate-400 flex items-center gap-1">
                                                        <Clock size={10} /> {format(new Date(ticket.last_message_at || ticket.created_at), 'dd MMM yyyy, HH:mm')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 transition-all translate-x-0 group-hover:translate-x-1" />
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center space-y-3">
                                    <MessageSquare size={48} className="mx-auto text-slate-100" />
                                    <div className="text-slate-400">
                                        {searchQuery ? 'Tidak ada tiket yang cocok dengan pencarian' : 'Anda belum memiliki tiket dukungan'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* New Ticket Modal */}
            {showNewTicket && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Buka Tiket Dukungan</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Berikan detail kendala Anda dengan jelas</p>
                            </div>
                            <button 
                                onClick={() => setShowNewTicket(false)} 
                                className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Subjek Masalah</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="Contoh: Gagal cetak struk via bluetooth"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket((prev: any) => ({ ...prev, subject: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Prioritas</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 outline-none appearance-none cursor-pointer"
                                        value={newTicket.priority}
                                        onChange={(e) => setNewTicket((prev: any) => ({ ...prev, priority: e.target.value }))}
                                    >
                                        <option value="low">Rendah</option>
                                        <option value="medium">Sedang</option>
                                        <option value="high">Tinggi</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Pesan / Detail Masalah</label>
                                <textarea 
                                    required
                                    rows={5}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 outline-none transition-all resize-none placeholder:text-slate-400"
                                    placeholder="Jelaskan langkah-langkah yang Anda lakukan sebelum kendala terjadi..."
                                    value={newTicket.message}
                                    onChange={(e) => setNewTicket((prev: any) => ({ ...prev, message: e.target.value }))}
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowNewTicket(false)}
                                    className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={createTicket.isPending}
                                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                                >
                                    {createTicket.isPending ? 'Mengirim...' : 'Kirim Tiket Sekarang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
