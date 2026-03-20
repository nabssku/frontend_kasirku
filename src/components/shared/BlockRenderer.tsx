import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Mail, Phone, MapPin, MessageCircle, ChevronDown, Star, Quote, Check, ArrowRight, AlertCircle, Info, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

export interface Block {
    id: string;
    type: string;
    data: any;
}

interface BlockRendererProps {
    blocks: Block[];
    isEditing?: boolean;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks, isEditing = false }) => {
    if (!blocks || !Array.isArray(blocks)) return null;

    // Block types that should span full width
    const fullWidthTypes = ['hero', 'cta_banner', 'divider', 'stats'];

    return (
        <div className="flex flex-col">
            {blocks.map((block) => (
                <div
                    key={block.id}
                    className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                        fullWidthTypes.includes(block.type) ? 'w-full' : 'max-w-4xl mx-auto px-4 sm:px-6 w-full py-8'
                    }`}
                >
                    <RenderBlock block={block} isEditing={isEditing} />
                </div>
            ))}
        </div>
    );
};

const RenderBlock: React.FC<{ block: Block; isEditing: boolean }> = ({ block, isEditing }) => {
    switch (block.type) {
        // ─── HERO ──────────────────────────────────────────────────────────────
        case 'hero':
            return (
                <section className={`py-16 md:py-24 px-8 text-white ${block.data.bgColor || 'bg-indigo-600'} ${block.data.align === 'center' ? 'text-center' : 'text-left'}`}>
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">{block.data.title}</h1>
                        <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto font-medium">{block.data.subtitle}</p>
                        {block.data.buttonText && (
                            <a
                                href={isEditing ? '#' : (block.data.buttonUrl || '#')}
                                onClick={(e) => isEditing && e.preventDefault()}
                                className="inline-flex items-center gap-2 mt-8 bg-white text-slate-900 px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-slate-100 transition-colors shadow-xl"
                            >
                                {block.data.buttonText} <ArrowRight size={18} />
                            </a>
                        )}
                    </div>
                </section>
            );

        // ─── MARKDOWN ──────────────────────────────────────────────────────────
        case 'markdown':
            return (
                <article className="prose max-w-none break-words overflow-visible"
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {block.data.content}
                    </ReactMarkdown>
                </article>
            );

        // ─── ACCORDION ─────────────────────────────────────────────────────────
        case 'accordion':
            return (
                <div className="space-y-4">
                    {block.data.items?.map((item: any, idx: number) => (
                        <details key={idx} className="group bg-white border border-slate-100 rounded-2xl open:bg-indigo-50/50 open:border-indigo-100 transition-colors shadow-sm">
                            <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-slate-800 text-lg select-none list-none [&::-webkit-details-marker]:hidden">
                                {item.q}
                                <span className="bg-[#f5f5f5] group-open:bg-white text-indigo-600 p-2 rounded-full shrink-0 shadow-sm border border-slate-100 transition-transform duration-300 flex items-center justify-center">
                                    <ChevronDown size={20} className="group-open:rotate-180 transition-transform duration-300" />
                                </span>
                            </summary>
                            <div className="px-6 pb-6 text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-4">
                                {item.a}
                            </div>
                        </details>
                    ))}
                </div>
            );

        // ─── CONTACT INFO ──────────────────────────────────────────────────────
        case 'contact_info':
            return (
                <div className="grid md:grid-cols-2 gap-6">
                    {block.data.email && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Mail size={24} /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</p>
                                <p className="text-lg font-bold text-slate-800">{block.data.email}</p>
                            </div>
                        </div>
                    )}
                    {block.data.phone && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><Phone size={24} /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                                <p className="text-lg font-bold text-slate-800">{block.data.phone}</p>
                            </div>
                        </div>
                    )}
                    {block.data.address && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 md:col-span-2">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><MapPin size={24} /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alamat</p>
                                <p className="text-lg font-bold text-slate-800">{block.data.address}</p>
                            </div>
                        </div>
                    )}
                    {block.data.whatsapp && (
                        <a
                            href={`https://wa.me/${block.data.whatsapp}`}
                            target="_blank" rel="noopener noreferrer"
                            onClick={(e) => isEditing && e.preventDefault()}
                            className={`bg-green-500 p-6 rounded-2xl shadow-lg shadow-green-200 text-white flex items-center justify-center gap-3 hover:bg-green-600 transition-colors md:col-span-2 ${isEditing ? 'cursor-default' : ''}`}
                        >
                            <MessageCircle size={24} />
                            <span className="text-lg font-bold">Chat WhatsApp Support</span>
                        </a>
                    )}
                </div>
            );

        // ─── SPACER ────────────────────────────────────────────────────────────
        case 'spacer':
            return <div style={{ height: block.data.height || '2rem' }} />;

        // ─── CTA BANNER ────────────────────────────────────────────────────────
        case 'cta_banner':
            return (
                <section className={`py-16 px-8 text-center text-white ${block.data.bgColor || 'bg-slate-900'}`}>
                    <div className="max-w-3xl mx-auto">
                        {block.data.badge && (
                            <span className="inline-block bg-white/10 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest border border-white/20">
                                {block.data.badge}
                            </span>
                        )}
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{block.data.title || 'Siap untuk Memulai?'}</h2>
                        <p className="text-lg opacity-80 mb-10 leading-relaxed">{block.data.subtitle || 'Bergabunglah dengan ribuan pengguna yang telah mempercayai layanan kami.'}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            {block.data.primaryButtonText && (
                                <a
                                    href={isEditing ? '#' : (block.data.primaryButtonUrl || '/register')}
                                    onClick={(e) => isEditing && e.preventDefault()}
                                    className="bg-amber-400 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-500 transition-colors shadow-lg"
                                >
                                    {block.data.primaryButtonText}
                                </a>
                            )}
                            {block.data.secondaryButtonText && (
                                <a
                                    href={isEditing ? '#' : (block.data.secondaryButtonUrl || '#')}
                                    onClick={(e) => isEditing && e.preventDefault()}
                                    className="bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors border border-white/20"
                                >
                                    {block.data.secondaryButtonText}
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            );

        // ─── STATS ─────────────────────────────────────────────────────────────
        case 'stats':
            return (
                <section className={`py-12 px-8 ${block.data.bgColor || 'bg-indigo-700'} text-white`}>
                    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {block.data.items?.map((stat: any, idx: number) => (
                            <div key={idx}>
                                <div className="text-3xl md:text-4xl font-black mb-1">{stat.value}</div>
                                <div className="text-sm font-medium text-white/70">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>
            );

        // ─── FEATURES GRID ─────────────────────────────────────────────────────
        case 'features_grid':
            return (
                <div>
                    {block.data.title && (
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">{block.data.title}</h2>
                            {block.data.subtitle && <p className="text-lg text-slate-500">{block.data.subtitle}</p>}
                        </div>
                    )}
                    <div className={`grid gap-6 ${block.data.columns === 2 ? 'md:grid-cols-2' : block.data.columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                        {block.data.items?.map((feature: any, idx: number) => (
                            <div key={idx} className="group p-7 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 hover:-translate-y-1">
                                {feature.emoji && (
                                    <div className="text-3xl mb-5">{feature.emoji}</div>
                                )}
                                <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );

        // ─── IMAGE ─────────────────────────────────────────────────────────────
        case 'image':
            return (
                <div className={`${block.data.align === 'center' ? 'flex justify-center' : block.data.align === 'right' ? 'flex justify-end' : ''}`}>
                    {block.data.url ? (
                        <figure className={`${block.data.fullWidth ? 'w-full' : 'max-w-xl'}`}>
                            <img
                                src={block.data.url}
                                alt={block.data.alt || ''}
                                className={`w-full object-cover ${block.data.rounded ? 'rounded-2xl' : ''} ${block.data.shadow ? 'shadow-xl' : ''}`}
                            />
                            {block.data.caption && (
                                <figcaption className="mt-3 text-center text-sm text-slate-400 italic">{block.data.caption}</figcaption>
                            )}
                        </figure>
                    ) : (
                        <div className="w-full h-48 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                            <div className="text-center">
                                <div className="text-4xl mb-2">🖼️</div>
                                <p className="text-sm font-medium">Tambahkan URL gambar di panel kanan</p>
                            </div>
                        </div>
                    )}
                </div>
            );

        // ─── VIDEO EMBED ───────────────────────────────────────────────────────
        case 'video':
            const videoId = block.data.url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&]+)/)?.[1];
            return (
                <div className={`${block.data.align === 'center' ? 'flex justify-center' : ''}`}>
                    <div className={`${block.data.fullWidth ? 'w-full' : 'max-w-2xl w-full'}`}>
                        {block.data.title && (
                            <h3 className="text-xl font-bold text-slate-800 mb-4">{block.data.title}</h3>
                        )}
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            {videoId ? (
                                <iframe
                                    className="absolute inset-0 w-full h-full rounded-2xl shadow-lg"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={block.data.title || 'Video'}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="absolute inset-0 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">🎬</div>
                                        <p className="text-sm font-medium">Masukkan URL YouTube di panel kanan</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );

        // ─── BUTTON ────────────────────────────────────────────────────────────
        case 'button':
            const btnAlign = block.data.align === 'center' ? 'justify-center' : block.data.align === 'right' ? 'justify-end' : 'justify-start';
            const btnStyles: Record<string, string> = {
                solid: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200',
                outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50',
                amber: 'bg-amber-400 text-slate-900 hover:bg-amber-500 shadow-lg shadow-amber-200',
                ghost: 'text-indigo-600 hover:bg-indigo-50',
            };
            return (
                <div className={`flex ${btnAlign}`}>
                    <a
                        href={isEditing ? '#' : (block.data.url || '#')}
                        onClick={(e) => isEditing && e.preventDefault()}
                        target={block.data.newTab ? '_blank' : undefined}
                        rel={block.data.newTab ? 'noopener noreferrer' : undefined}
                        className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all active:scale-95 ${btnStyles[block.data.style || 'solid']}`}
                    >
                        {block.data.text || 'Klik Sini'}
                        {block.data.icon !== false && <ArrowRight size={18} />}
                        {block.data.newTab && <ExternalLink size={14} className="opacity-60" />}
                    </a>
                </div>
            );

        // ─── DIVIDER ───────────────────────────────────────────────────────────
        case 'divider':
            return (
                <div className="py-4 px-8">
                    {block.data.style === 'dots' ? (
                        <div className="flex items-center justify-center gap-3">
                            {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-200" />)}
                        </div>
                    ) : block.data.style === 'gradient' ? (
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                    ) : (
                        <hr className="border-slate-200" />
                    )}
                </div>
            );

        // ─── TESTIMONIAL ───────────────────────────────────────────────────────
        case 'testimonial':
            return (
                <div>
                    {block.data.title && (
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-slate-800 mb-3">{block.data.title}</h2>
                        </div>
                    )}
                    <div className={`grid gap-6 ${(block.data.items?.length || 0) >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                        {block.data.items?.map((t: any, idx: number) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg shadow-slate-100 relative">
                                <Quote size={32} className="absolute top-6 right-6 text-indigo-50" />
                                <div className="flex gap-1 mb-4 text-amber-400">
                                    {[...Array(t.rating || 5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-slate-600 italic mb-6 leading-relaxed">"{t.content}"</p>
                                <div className="flex items-center gap-3">
                                    {t.avatar ? (
                                        <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                            {t.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                                        {t.role && <p className="text-xs text-slate-400">{t.role}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );

        // ─── ALERT ─────────────────────────────────────────────────────────────
        case 'alert':
            const alertStyles: Record<string, {bg: string, border: string, text: string, icon: React.ReactNode}> = {
                info:    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: <Info size={20} className="text-blue-600 shrink-0" /> },
                success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: <CheckCircle2 size={20} className="text-green-600 shrink-0" /> },
                warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: <AlertTriangle size={20} className="text-amber-600 shrink-0" /> },
                danger:  { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <AlertCircle size={20} className="text-red-600 shrink-0" /> },
            };
            const style = alertStyles[block.data.type || 'info'];
            return (
                <div className={`flex gap-4 p-5 rounded-2xl border ${style.bg} ${style.border}`}>
                    {style.icon}
                    <div>
                        {block.data.title && <p className={`font-bold text-sm mb-1 ${style.text}`}>{block.data.title}</p>}
                        <p className={`text-sm leading-relaxed ${style.text}`}>{block.data.message || 'Tulis pesan notifikasi Anda di sini.'}</p>
                    </div>
                </div>
            );

        // ─── PRICING ───────────────────────────────────────────────────────────
        case 'pricing':
            return (
                <div>
                    {block.data.title && (
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-slate-800 mb-3">{block.data.title}</h2>
                            {block.data.subtitle && <p className="text-slate-500">{block.data.subtitle}</p>}
                        </div>
                    )}
                    <div className="grid md:grid-cols-3 gap-6 items-end">
                        {block.data.plans?.map((plan: any, idx: number) => (
                            <div key={idx} className={`relative p-8 rounded-2xl flex flex-col ${plan.featured ? 'bg-slate-800 text-white shadow-2xl' : 'bg-white border border-slate-200 shadow-md'}`}>
                                {plan.featured && (
                                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-amber-400 text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full">Popular</div>
                                )}
                                <h3 className={`font-bold text-lg mb-2 ${plan.featured ? 'text-amber-400' : 'text-indigo-600'}`}>{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-black">{plan.price}</span>
                                    <span className={`text-sm ${plan.featured ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period || '/bln'}</span>
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features?.map((f: string, fi: number) => (
                                        <li key={fi} className="flex items-center gap-3 text-sm">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.featured ? 'bg-amber-400/20 text-amber-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span className={plan.featured ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                {plan.buttonText && (
                                    <a
                                        href={isEditing ? '#' : (plan.buttonUrl || '/register')}
                                        onClick={(e) => isEditing && e.preventDefault()}
                                        className={`w-full py-3.5 rounded-xl font-bold text-center text-sm transition-all ${plan.featured ? 'bg-amber-400 text-slate-900 hover:bg-amber-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                    >
                                        {plan.buttonText}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );

        default:
            return <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 italic">Unknown block type: {block.type}</div>;
    }
};
