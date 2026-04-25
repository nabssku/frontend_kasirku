import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Send, ArrowLeft, Clock, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useTicket, useSendMessage, useUpdateTicketStatus } from '../../hooks/useTickets';
import { useAuthStore } from '../../app/store/useAuthStore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import echo from '../../lib/echo';
import { useQueryClient } from '@tanstack/react-query';

export default function TicketDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuthStore();
    const [message, setMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const isDarkMode = location.pathname.startsWith('/super-admin');

    const { data: ticket, isLoading } = useTicket(id);
    const sendMessage = useSendMessage();
    const updateStatus = useUpdateTicketStatus();

    const isSuperAdmin = currentUser?.roles?.some((r: any) => r.slug === 'super_admin');

    // Realtime Listener
    useEffect(() => {
        if (!id) return;

        const channel = echo.private(`ticket.${id}`)
            .listen('.message.sent', (e: { message: any }) => {
                // Update React Query cache
                queryClient.setQueryData(['ticket', id.toString()], (oldData: any) => {
                    if (!oldData) return oldData;
                    
                    // Check if message already exists to avoid duplicates
                    const messageExists = oldData.messages?.some((m: any) => m.id === e.message.id);
                    if (messageExists) return oldData;

                    return {
                        ...oldData,
                        messages: [...(oldData.messages || []), e.message]
                    };
                });
                
                // Invalidate tickets list to update last message etc
                queryClient.invalidateQueries({ queryKey: ['tickets'] });
            });

        return () => {
            channel.stopListening('.message.sent');
            echo.leave(`ticket.${id}`);
        };
    }, [id, queryClient]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [ticket?.messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !ticket) return;

        try {
            await sendMessage.mutateAsync({
                ticket_id: ticket.id,
                message: message.trim()
            });
            setMessage('');
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseTicket = async () => {
        if (!ticket) return;
        try {
            await updateStatus.mutateAsync({ id: ticket.id, status: 'closed' });
            toast.success('Tiket telah ditutup');
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) return <div className={`text-center py-20 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Memuat detail tiket...</div>;
    if (!ticket) return <div className={`text-center py-20 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Tiket tidak ditemukan.</div>;

    return (
        <div className={`w-full flex flex-col h-[calc(100vh-140px)] ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className={`border rounded-t-3xl p-4 flex items-center gap-4 shadow-sm z-10 shrink-0 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
                <button 
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isDarkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-50 text-slate-400'
                    }`}
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className={`text-lg font-bold leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{ticket.subject}</h1>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                            ticket.status === 'open' ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : 
                            ticket.status === 'closed' ? (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-600') : 
                            (isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700')
                        }`}>
                            {ticket.status}
                        </span>
                        <span className={`text-[10px] flex items-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Clock size={10} /> {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                    </div>
                </div>
                {isSuperAdmin && ticket.status !== 'closed' && (
                    <button 
                        onClick={handleCloseTicket}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            isDarkMode 
                                ? 'bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 border-transparent hover:border-red-500/20' 
                                : 'bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 border-transparent hover:border-red-100'
                        }`}
                    >
                        Tutup Tiket
                    </button>
                )}
            </div>

            {/* Chat Messages */}
            <div 
                ref={scrollRef}
                className={`flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar ${
                    isDarkMode ? 'bg-slate-950/50' : 'bg-slate-50/50'
                }`}
            >
                {ticket.messages?.map((msg: any) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    const isSuperAdminSender = msg.sender?.roles?.some((r: any) => r.slug === 'super_admin');

                    return (
                        <div 
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border-2 overflow-hidden ${
                                    isMe 
                                        ? (isDarkMode ? 'bg-amber-500 text-slate-950 border-amber-500/20' : 'bg-indigo-600 text-white border-indigo-200') 
                                        : (msg.sender?.name === 'System' 
                                            ? (isDarkMode ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200')
                                            : (isDarkMode ? 'bg-slate-900 text-amber-500 border-slate-800' : 'bg-white text-indigo-600 border-indigo-100'))
                                }`}>
                                    {msg.sender?.image ? (
                                        <img src={msg.sender.image} alt={msg.sender.name} className="w-full h-full object-cover" />
                                    ) : (
                                        isSuperAdminSender ? (
                                            <ShieldCheck size={16} />
                                        ) : (
                                            isMe ? <UserIcon size={14} /> : msg.sender?.name?.charAt(0)?.toUpperCase()
                                        )
                                    )}
                                </div>
                                <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && (
                                        <p className={`text-[10px] font-bold ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {msg.sender?.name} {isSuperAdminSender && <span className="text-amber-500 uppercase ml-1">Support</span>}
                                        </p>
                                    )}
                                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                        isMe 
                                            ? (isDarkMode ? 'bg-amber-500 text-slate-950 rounded-br-none' : 'bg-indigo-600 text-white rounded-br-none') 
                                            : (isDarkMode 
                                                ? 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none' 
                                                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none')
                                    }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                    </div>
                                    <p className={`text-[9px] mt-1 ${isMe ? 'text-right' : 'text-left'} ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {format(new Date(msg.created_at), 'HH:mm')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Wrapper */}
            <div className={`border-t p-4 rounded-b-3xl shadow-lg shrink-0 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
                {ticket.status === 'closed' ? (
                    <div className={`rounded-2xl p-4 text-center border ${
                        isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Tiket ini sudah ditutup.</p>
                        <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Silakan buka tiket baru jika masih memiliki kendala.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <textarea 
                            rows={1}
                            className={`flex-1 rounded-2xl px-4 py-3 text-sm outline-none transition-all resize-none max-h-32 border ${
                                isDarkMode 
                                    ? 'bg-slate-950 border-slate-800 text-white focus:ring-2 focus:ring-amber-500/50 placeholder:text-slate-700' 
                                    : 'bg-slate-50 border-slate-100 text-slate-700 focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400'
                            }`}
                            placeholder="Tulis pesan balasan..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                        <button 
                            type="submit"
                            disabled={!message.trim() || sendMessage.isPending}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:grayscale shadow-lg ${
                                isDarkMode 
                                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/10' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                            }`}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
