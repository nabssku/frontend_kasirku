import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    Bot,
    Loader2,
    TrendingUp,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import api from '../../../lib/axios';
import { useAuthStore } from '../../../app/store/useAuthStore';
import { toast } from 'sonner';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const MODEL = "adamo1139/Hermes-3-Llama-3.1-8B-FP8-Dynamic";

export const AiChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingContext, setIsFetchingContext] = useState(true);
    const [context, setContext] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<OpenAI | null>(null);

    const { user } = useAuthStore();

    const SYSTEM_PROMPT = `
        You are JagoKasir AI, a professional business assistant for POS (Point of Sale) owners.
        
        Rules:
        - Only use the data provided in the context.
        - Do NOT invent numbers or statistics.
        - If data is missing or out of scope, explicitly say that the data is not available.
        - Keep explanations short, practical, and action-oriented.
        - Focus on insights that help in business decision-making.
        - Use simple, professional Indonesian language (Bahasa Indonesia).
        - User is the owner of the business.

        Visual Formatting Rules:
        - For report data (lists of products, tables of sales, etc.), ALWAYS use Markdown Tables.
        - ALWAYS bold currency values (e.g., **Rp 50.000**).
        - Use bullet points for lists and steps.
        - Use "###" for small headings within your response.
        - Keep it clean, professional, and visually structured.

        Multi-Outlet Rules:
        - You have access to "outlets_overview" which lists ALL outlets and their performance.
        - If the owner asks about all outlets, use a table to compare their revenue/transactions.
        - "selected_outlet" refers to the current specific outlet being viewed.
    `;

    useEffect(() => {
        fetchContext();
        initializeOpenAI();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const initializeOpenAI = () => {
        try {
            clientRef.current = new OpenAI({
                baseURL: "https://hermes.ai.unturf.com/v1",
                apiKey: "nabilss24",
                dangerouslyAllowBrowser: true
            });
        } catch (error) {
            console.error('Failed to initialize OpenAI Client:', error);
            toast.error('Gagal memuat AI Client.');
        }
    };

    const fetchContext = async () => {
        setIsFetchingContext(true);
        try {
            const response = await api.get('/ai/context');
            setContext(response.data.data);

            // Initial greeting
            setMessages([
                {
                    role: 'assistant',
                    content: `Halo ${user?.name}! Saya JagoKasir AI. Ada yang bisa saya bantu analisis dari data bisnis Anda hari ini?`
                }
            ]);
        } catch (error: any) {
            console.error('Failed to fetch AI context:', error);
            if (error.response?.status === 401) {
                toast.error('Sesi berakhir atau tidak memiliki izin (Backend 401).');
            } else {
                toast.error('Gagal mengambil data bisnis terbaru.');
            }
        } finally {
            setIsFetchingContext(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading || !clientRef.current) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const contextString = JSON.stringify(context, null, 2);
            const history = messages.slice(-5).map(msg => ({
                role: msg.role as any,
                content: msg.content
            }));

            const response = await clientRef.current.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT + "\n\nDATA CONTEXT:\n" + contextString },
                    ...history,
                    { role: 'user', content: userMessage.content }
                ],
                temperature: 0.3, // Lower temperature for more factual report data
                max_tokens: 800,
            });

            const aiResponse = response.choices[0].message.content || 'Maaf, saya tidak mendapatkan respon.';
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        } catch (error: any) {
            console.error('AI Chat Error:', error);
            const status = error.status || (error.response ? error.response.status : null);
            if (status === 401) {
                toast.error('API Key tidak valid atau kedaluwarsa (401).');
            } else {
                toast.error('Gagal mendapatkan respon dari AI. Silakan coba lagi.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-20 right-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-[60] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">JagoKasir AI</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-[10px] text-indigo-100 font-medium uppercase tracking-wider">Online Assistant</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Quick Context Stats */}
            {context && !isFetchingContext && (
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <TrendingUp size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-600">Rp {context.selected_outlet?.today?.revenue?.toLocaleString() ?? 0}</span>
                    </div>
                    {(context.inventory?.low_stock_alerts?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0 text-amber-600">
                            <AlertTriangle size={12} />
                            <span className="text-[10px] font-bold">{context.inventory.low_stock_alerts.length} Stok Rendah</span>
                        </div>
                    )}
                </div>
            )}

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar"
            >
                {isFetchingContext ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                        <p className="text-xs font-medium">Menghubungkan data bisnis...</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`
                                max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed
                                ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'}
                            `}>
                                {msg.role === 'assistant' ? (
                                    <div className="markdown-content">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                table: ({ node, ...props }) => (
                                                    <div className="overflow-x-auto my-3 border rounded-lg border-slate-100">
                                                        <table className="w-full text-xs text-left" {...props} />
                                                    </div>
                                                ),
                                                thead: ({ node, ...props }) => <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]" {...props} />,
                                                th: ({ node, ...props }) => <th className="px-3 py-2 font-bold" {...props} />,
                                                td: ({ node, ...props }) => <td className="px-3 py-2 border-t border-slate-50" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="font-bold text-indigo-600 mt-4 mb-2 first:mt-0" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1 my-2" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-1 my-2" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-indigo-700 bg-indigo-50 px-1 rounded" {...props} />
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Tanya JagoKasir AI..."
                        disabled={isLoading || isFetchingContext}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 transition-all font-medium"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading || isFetchingContext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
                <div className="mt-2 flex items-center justify-between px-1">
                    <p className="text-[10px] text-slate-400 font-medium">Laporan visual aktif</p>
                    <button
                        onClick={fetchContext}
                        className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                    >
                        <RefreshCw size={10} /> Segarkan Data
                    </button>
                </div>
            </div>
        </div>
    );
};
