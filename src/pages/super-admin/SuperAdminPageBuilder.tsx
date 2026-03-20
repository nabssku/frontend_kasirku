import { useState, useEffect } from 'react';
import { useAdminSystemSettings, useUpdateSystemSettings } from '../../hooks/useSystemSettings';
import { BlockRenderer } from '../../components/shared/BlockRenderer';
import type { Block } from '../../components/shared/BlockRenderer';
import { 
    Save, 
    Eye, 
    Edit2, 
    Plus, 
    Trash2, 
    GripVertical, 
    Type, 
    Layout, 
    Contact, 
    ChevronDown, 
    ChevronRight,
    Info,
    Phone,
    Shield,
    FileText,
    X,
    Copy,
    Monitor,
    Smartphone,
    AlignCenter,
    Minus,
    Image as ImageIcon,
    PlayCircle,
    MousePointer2,
    BarChart2,
    Grid2x2 as Grid,
    Quote,
    Tag,
    Bell,
} from 'lucide-react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';

const PAGE_TYPES = [
    { key: 'page_help_center', name: 'Pusat Bantuan', icon: Info },
    { key: 'page_contact', name: 'Kontak', icon: Phone },
    { key: 'page_privacy_policy', name: 'Kebijakan Privasi', icon: Shield },
    { key: 'page_terms_conditions', name: 'Syarat & Ketentuan', icon: FileText },
];

interface BlockType {
    type: string;
    name: string;
    icon: any;
    defaultData: any;
}

interface BlockCategory {
    label: string;
    blocks: BlockType[];
}

const BLOCK_CATEGORIES: BlockCategory[] = [
    {
        label: 'Layout',
        blocks: [
            { type: 'hero',          name: 'Hero Header',   icon: Layout,      defaultData: { title: 'Judul Baru', subtitle: 'Sub-judul menarik di sini', align: 'center', bgColor: 'bg-indigo-600', buttonText: '', buttonUrl: '' } },
            { type: 'cta_banner',    name: 'CTA Banner',    icon: ChevronRight, defaultData: { title: 'Siap untuk Memulai?', subtitle: 'Bergabunglah dengan kami sekarang.', badge: 'Promo', primaryButtonText: 'Daftar Gratis', primaryButtonUrl: '/register', secondaryButtonText: 'Pelajari Lebih', secondaryButtonUrl: '#', bgColor: 'bg-slate-900' } },
            { type: 'spacer',        name: 'Spacer',        icon: AlignCenter,  defaultData: { height: '3rem' } },
            { type: 'divider',       name: 'Divider',       icon: Minus,        defaultData: { style: 'line' } },
        ]
    },
    {
        label: 'Content',
        blocks: [
            { type: 'markdown',      name: 'Teks / Rich',   icon: Type,        defaultData: { content: '## Judul Baru\n\nTulis isi konten Anda di sini menggunakan Markdown. Anda bisa **bold**, *italic*, [link](#), dan lainnya.' } },
            { type: 'image',         name: 'Gambar',        icon: ImageIcon,    defaultData: { url: '', alt: '', caption: '', align: 'left', rounded: true, shadow: true, fullWidth: false } },
            { type: 'video',         name: 'Video YouTube', icon: PlayCircle,   defaultData: { url: '', title: '', fullWidth: true } },
            { type: 'button',        name: 'Tombol',        icon: MousePointer2, defaultData: { text: 'Klik Sini', url: '#', style: 'solid', align: 'left', newTab: false } },
        ]
    },
    {
        label: 'Showcase',
        blocks: [
            { type: 'stats',         name: 'Statistik',     icon: BarChart2,    defaultData: { bgColor: 'bg-indigo-700', items: [{ value: '10K+', label: 'Pengguna' }, { value: '99%', label: 'Uptime' }, { value: '24/7', label: 'Support' }, { value: '4.9⭐', label: 'Rating' }] } },
            { type: 'features_grid', name: 'Fitur Grid',    icon: Grid,         defaultData: { title: 'Fitur Unggulan', subtitle: 'Semua yang Anda butuhkan', columns: 3, items: [{ emoji: '⚡', title: 'Cepat', description: 'Performa tinggi dan responsif' }, { emoji: '🔒', title: 'Aman', description: 'Data Anda terlindungi penuh' }, { emoji: '💡', title: 'Mudah', description: 'Antarmuka yang intuitif' }] } },
            { type: 'testimonial',   name: 'Testimoni',     icon: Quote,        defaultData: { title: 'Kata Pelanggan Kami', items: [{ name: 'Budi Santoso', role: 'Pemilik Kedai Kopi', content: 'Sangat membantu bisnis saya!', rating: 5 }] } },
            { type: 'pricing',       name: 'Harga / Paket', icon: Tag,          defaultData: { title: 'Pilih Paket Anda', subtitle: 'Mulai gratis, upgrade kapan saja', plans: [{ name: 'Gratis', price: 'Rp 0', period: '/bln', features: ['1 Outlet', '50 Produk', '2 Pengguna'], buttonText: 'Mulai Gratis', buttonUrl: '/register', featured: false }, { name: 'Pro', price: 'Rp 99K', period: '/bln', features: ['5 Outlet', '500 Produk', '10 Pengguna', 'Laporan Lengkap'], buttonText: 'Pilih Pro', buttonUrl: '/register', featured: true }] } },
        ]
    },
    {
        label: 'Interactive',
        blocks: [
            { type: 'accordion',     name: 'FAQ / Akordion', icon: ChevronDown, defaultData: { items: [{ q: 'Pertanyaan baru?', a: 'Jawaban Anda di sini.' }] } },
            { type: 'contact_info',  name: 'Info Kontak',    icon: Contact,     defaultData: { email: '', phone: '', address: '', whatsapp: '' } },
            { type: 'alert',         name: 'Notifikasi',     icon: Bell,        defaultData: { type: 'info', title: 'Informasi', message: 'Tulis pesan penting Anda di sini.' } },
        ]
    },
];

const BLOCK_TYPES = (BLOCK_CATEGORIES.flatMap(cat => cat.blocks)) as any[];

export default function SuperAdminPageBuilder() {
    const { data: settings, isLoading } = useAdminSystemSettings();
    const updateSettings = useUpdateSystemSettings();

    const [selectedPage, setSelectedPage] = useState(PAGE_TYPES[0].key);
    const [pageTitle, setPageTitle] = useState('');
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

    useEffect(() => {
        if (settings && settings[selectedPage]) {
            setPageTitle(settings[selectedPage].title || '');
            setBlocks(settings[selectedPage].blocks || []);
            setActiveBlockId(null);
        }
    }, [selectedPage, settings]);

    const handleSave = () => {
        updateSettings.mutate({
            [selectedPage]: { title: pageTitle, blocks }
        });
    };

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const addBlock = (type: string) => {
        const blockType = BLOCK_TYPES.find(b => b.type === type);
        if (!blockType) return;

        const newBlock: Block = {
            id: generateId(),
            type,
            data: JSON.parse(JSON.stringify(blockType.defaultData))
        };

        setBlocks([...blocks, newBlock]);
        setActiveBlockId(newBlock.id);
    };

    const deleteBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
        if (activeBlockId === id) setActiveBlockId(null);
    };

    const duplicateBlock = (id: string) => {
        const block = blocks.find(b => b.id === id);
        if (!block) return;
        const newBlock = { ...JSON.parse(JSON.stringify(block)), id: generateId() };
        const index = blocks.findIndex(b => b.id === id);
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        setBlocks(newBlocks);
        setActiveBlockId(newBlock.id);
    };

    const updateBlockData = (id: string, newData: any) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, ...newData } } : b));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden border-x border-slate-800 shadow-none">
            {/* 1. TOP NAVBAR (Title & Main Controls) */}
            <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 z-30">
                <div className="flex items-center gap-4">
                    <div className="pl-2">
                        <input
                            type="text"
                            value={pageTitle}
                            onChange={(e) => setPageTitle(e.target.value)}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-indigo-500 transition-colors py-1 w-64"
                            placeholder="Judul Halaman..."
                        />
                    </div>
                </div>

                {/* Device Sync Toggle */}
                <div className="flex items-center bg-slate-800/50 rounded-full p-1 border border-slate-700">
                    <button
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1.5 rounded-full transition-all ${previewDevice === 'desktop' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Monitor size={16} />
                    </button>
                    <button
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1.5 rounded-full transition-all ${previewDevice === 'mobile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Smartphone size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            viewMode === 'preview' 
                                ? 'bg-amber-500 text-slate-950 border-amber-500' 
                                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                        }`}
                    >
                        {viewMode === 'edit' ? <Eye size={14} /> : <Edit2 size={14} />}
                        {viewMode === 'edit' ? 'Preview' : 'Editor'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={updateSettings.isPending}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                    >
                        <Save size={14} />
                        {updateSettings.isPending ? 'Saving...' : 'Publish'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* 2. LEFT SIDEBAR (Widgets) */}
                <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col h-full z-20">
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                        {/* Page Selector Area */}
                        <div className="mb-8">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-1">Active Page</label>
                            <div className="space-y-1">
                                {PAGE_TYPES.map((page) => (
                                    <button
                                        key={page.key}
                                        onClick={() => setSelectedPage(page.key)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border text-left ${
                                            selectedPage === page.key
                                                ? 'bg-slate-800 border-indigo-500/50 text-white'
                                                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                        }`}
                                    >
                                        <page.icon size={14} className={selectedPage === page.key ? 'text-indigo-400' : 'text-slate-500'} />
                                        <span className="font-bold text-xs">{page.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Widgets Area */}
                        <div className="space-y-6">
                            {BLOCK_CATEGORIES.map((cat) => (
                                <div key={cat.label}>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-1">{cat.label}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {cat.blocks.map((bt) => (
                                            <button
                                                key={bt.type}
                                                onClick={() => addBlock(bt.type)}
                                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5 text-slate-400 hover:text-indigo-400 transition-all group active:scale-95"
                                            >
                                                <bt.icon size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-bold text-center">{bt.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. CENTER CANVAS (Main Editing Area) */}
                <div className="flex-1 bg-slate-950 p-8 overflow-y-auto custom-scrollbar z-10 pattern-dots">
                    <div 
                        className={`mx-auto mb-40 ${previewDevice === 'mobile' ? 'w-[375px]' : 'w-full max-w-5xl'}`}
                        style={{ border: previewDevice === 'mobile' ? '12px solid #1e293b' : 'none' }}
                    >
                        {previewDevice === 'mobile' && <div className="h-6 bg-[#1e293b] flex items-center justify-center"><div className="w-12 h-1 bg-slate-700 rounded-full" /></div>}
                        
                        <div className="p-0">
                            {viewMode === 'edit' ? (
                                <Reorder.Group 
                                    axis="y" 
                                    values={blocks} 
                                    onReorder={setBlocks} 
                                    className="space-y-0 pt-10 pb-40 bg-white shadow-2xl min-h-[800px] relative"
                                >
                                    <AnimatePresence initial={false}>
                                        {blocks.length === 0 && (
                                            <div className="py-24 text-center text-slate-300">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                                                    <Plus className="text-indigo-400" />
                                                </div>
                                                <p className="font-bold">Empty Canvas</p>
                                                <p className="text-sm opacity-60">Add some widgets to get started</p>
                                            </div>
                                        )}
                                        {blocks.map((block) => (
                                            <Reorder.Item
                                                key={block.id}
                                                value={block}
                                                className={`group relative ${activeBlockId === block.id ? 'ring-2 ring-indigo-500 ring-inset z-10 bg-indigo-50/5' : ''}`}
                                                onClick={() => setActiveBlockId(block.id)}
                                            >
                                                {/* Canvas Block Overlay */}
                                                <div className="absolute inset-x-0 -top-6 flex justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20">
                                                    <div className="bg-indigo-600 rounded-lg shadow-lg flex items-center p-1 pointer-events-auto overflow-hidden border border-indigo-400/30">
                                                        <div className="cursor-grab active:cursor-grabbing p-1.5 text-white/70 hover:text-white transition-colors">
                                                            <GripVertical size={14} />
                                                        </div>
                                                        <div className="w-px h-3 bg-white/20 mx-1" />
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                                                            className="p-1.5 text-white/70 hover:text-white transition-colors"
                                                            title="Duplicate"
                                                        >
                                                            <Copy size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                                                            className="p-1.5 text-white/70 hover:text-red-300 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Block Content Representation */}
                                                <div className="pointer-events-auto">
                                                    <BlockRenderer blocks={[block]} isEditing={true} />
                                                </div>

                                                {/* Overlay to catch clicks and prevent interaction with renderer items */}
                                                <div className="absolute inset-0 z-0 bg-transparent hover:bg-black/[0.02] cursor-pointer" />
                                            </Reorder.Item>
                                        ))}
                                    </AnimatePresence>
                                </Reorder.Group>
                            ) : (
                                <div className="bg-white shadow-2xl min-h-[800px] mb-20 pb-20">
                                    <BlockRenderer blocks={blocks} />
                                </div>
                            )}
                        </div>
                        
                        {previewDevice === 'mobile' && <div className="h-6 bg-[#1e293b]" />}
                    </div>
                </div>

                {/* 4. RIGHT SIDEBAR (Settings) */}
                <div className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col h-full z-20">
                    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                        {activeBlockId ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
                                            {(() => {
                                                const activeBlock = blocks.find(b => b.id === activeBlockId);
                                                const btnType = BLOCK_TYPES.find(b => b.type === activeBlock?.type);
                                                const Icon = btnType?.icon || Layout;
                                                return <Icon size={18} />;
                                            })()}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white leading-tight">Block Settings</h3>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                {blocks.find(b => b.id === activeBlockId)?.type}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveBlockId(null)} className="p-1.5 bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-all">
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="h-px bg-slate-800" />

                                <BlockEditor 
                                    block={blocks.find(b => b.id === activeBlockId)!} 
                                    updateData={(data) => updateBlockData(activeBlockId!, data)} 
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-900/30 rounded-[2rem] border border-slate-800 border-dashed">
                                <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center mb-6 opacity-40">
                                    <Edit2 size={24} className="text-indigo-400" />
                                </div>
                                <h3 className="text-white font-bold mb-2">Configure Block</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">Select a block on the canvas to edit its properties or style here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
                .pattern-dots {
                    background-image: radial-gradient(#1e293b 1px, transparent 1px);
                    background-size: 24px 24px;
                }
            `}</style>
        </div>
    );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────────

function BlockEditor({ block, updateData }: { block: Block; updateData: (data: any) => void }) {
    switch (block.type) {
        case 'hero':
            return (
                <div className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Hero Title</label>
                        <input
                            type="text"
                            value={block.data.title}
                            onChange={(e) => updateData({ title: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Subtitle</label>
                        <textarea
                            value={block.data.subtitle}
                            onChange={(e) => updateData({ subtitle: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none h-24 resize-none transition-all leading-relaxed"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Button Text</label>
                            <input
                                type="text"
                                value={block.data.buttonText || ''}
                                onChange={(e) => updateData({ buttonText: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Button URL</label>
                            <input
                                type="text"
                                value={block.data.buttonUrl || ''}
                                onChange={(e) => updateData({ buttonUrl: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Align</label>
                            <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                                {['left', 'center'].map((pos) => (
                                    <button
                                        key={pos}
                                        onClick={() => updateData({ align: pos })}
                                        className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${block.data.align === pos ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Theme</label>
                            <select
                                value={block.data.bgColor}
                                onChange={(e) => updateData({ bgColor: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-white focus:border-indigo-500 outline-none"
                            >
                                <option value="bg-indigo-600">Indigo</option>
                                <option value="bg-amber-500">Amber</option>
                                <option value="bg-slate-900">Slate</option>
                                <option value="bg-rose-500">Rose</option>
                                <option value="bg-emerald-600">Emerald</option>
                            </select>
                        </div>
                    </div>
                </div>
            );

        case 'cta_banner':
            return (
                <div className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Badge Text</label>
                        <input
                            type="text"
                            value={block.data.badge || ''}
                            onChange={(e) => updateData({ badge: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                        <input
                            type="text"
                            value={block.data.title}
                            onChange={(e) => updateData({ title: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Subtitle</label>
                        <textarea
                            value={block.data.subtitle}
                            onChange={(e) => updateData({ subtitle: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white h-20"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Theme</label>
                            <select
                                value={block.data.bgColor}
                                onChange={(e) => updateData({ bgColor: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-white"
                            >
                                <option value="bg-slate-900">Dark</option>
                                <option value="bg-indigo-600">Indigo</option>
                                <option value="bg-rose-500">Rose</option>
                                <option value="bg-gradient-to-r from-indigo-600 to-purple-600">Gradient</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Primary Button</label>
                            <input
                                type="text"
                                value={block.data.primaryButtonText}
                                onChange={(e) => updateData({ primaryButtonText: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                        </div>
                    </div>
                </div>
            );

        case 'spacer':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Height</label>
                        <input
                            type="text"
                            value={block.data.height}
                            onChange={(e) => updateData({ height: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                            placeholder="e.g., 3rem or 50px"
                        />
                    </div>
                </div>
            );

        case 'divider':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Style</label>
                        <select
                            value={block.data.style}
                            onChange={(e) => updateData({ style: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                            <option value="line">Line</option>
                            <option value="dots">Dots</option>
                            <option value="dashed">Dashed</option>
                        </select>
                    </div>
                </div>
            );

        case 'markdown':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Markdown Content</label>
                        <textarea
                            value={block.data.content}
                            onChange={(e) => updateData({ content: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:border-indigo-500 outline-none h-[400px] resize-none leading-relaxed transition-all"
                        />
                    </div>
                </div>
            );

        case 'image':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Image URL</label>
                        <input
                            type="text"
                            value={block.data.url}
                            onChange={(e) => updateData({ url: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Align</label>
                            <select
                                value={block.data.align}
                                onChange={(e) => updateData({ align: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-white"
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                checked={block.data.rounded}
                                onChange={(e) => updateData({ rounded: e.target.checked })}
                                className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                            />
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Rounded</label>
                        </div>
                    </div>
                </div>
            );

        case 'video':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">YouTube URL</label>
                        <input
                            type="text"
                            value={block.data.url}
                            onChange={(e) => updateData({ url: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Video Title</label>
                        <input
                            type="text"
                            value={block.data.title}
                            onChange={(e) => updateData({ title: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                        />
                    </div>
                </div>
            );

        case 'button':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Button Text</label>
                        <input
                            type="text"
                            value={block.data.text}
                            onChange={(e) => updateData({ text: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">URL</label>
                        <input
                            type="text"
                            value={block.data.url}
                            onChange={(e) => updateData({ url: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Style</label>
                            <select
                                value={block.data.style}
                                onChange={(e) => updateData({ style: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-white"
                            >
                                <option value="solid">Solid Indigo</option>
                                <option value="amber">Solid Amber</option>
                                <option value="outline">Outline</option>
                                <option value="ghost">Ghost</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Align</label>
                            <select
                                value={block.data.align}
                                onChange={(e) => updateData({ align: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-white"
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>
                    </div>
                </div>
            );

        case 'stats':
            return (
                <div className="space-y-5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Stats Items</label>
                    <div className="space-y-3">
                        {(block.data.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-2 gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                                <input
                                    type="text"
                                    value={item.value}
                                    onChange={(e) => {
                                        const newItems = [...block.data.items];
                                        newItems[idx].value = e.target.value;
                                        updateData({ items: newItems });
                                    }}
                                    className="bg-transparent text-white font-bold text-xs p-1 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={item.label}
                                    onChange={(e) => {
                                        const newItems = [...block.data.items];
                                        newItems[idx].label = e.target.value;
                                        updateData({ items: newItems });
                                    }}
                                    className="bg-transparent text-slate-400 text-[10px] p-1 focus:outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'features_grid':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Grid Title</label>
                        <input
                            type="text"
                            value={block.data.title || ''}
                            onChange={(e) => updateData({ title: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Features</label>
                        {(block.data.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item.emoji}
                                        onChange={(e) => {
                                            const newItems = [...block.data.items];
                                            newItems[idx].emoji = e.target.value;
                                            updateData({ items: newItems });
                                        }}
                                        className="w-10 bg-slate-700 rounded p-1 text-center"
                                        placeholder="🚀"
                                    />
                                    <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => {
                                            const newItems = [...block.data.items];
                                            newItems[idx].title = e.target.value;
                                            updateData({ items: newItems });
                                        }}
                                        className="flex-1 bg-transparent border-b border-slate-700 text-xs text-white font-bold"
                                    />
                                </div>
                                <textarea
                                    value={item.description}
                                    onChange={(e) => {
                                        const newItems = [...block.data.items];
                                        newItems[idx].description = e.target.value;
                                        updateData({ items: newItems });
                                    }}
                                    className="w-full bg-transparent text-[10px] text-slate-400 h-12"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'testimonial':
            return (
                <div className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                        <input
                            type="text"
                            value={block.data.title || ''}
                            onChange={(e) => updateData({ title: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Testimonials</label>
                        {(block.data.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => {
                                        const newItems = [...block.data.items];
                                        newItems[idx].name = e.target.value;
                                        updateData({ items: newItems });
                                    }}
                                    className="w-full bg-transparent border-b border-slate-700 text-xs text-white font-bold"
                                    placeholder="Name"
                                />
                                <textarea
                                    value={item.content}
                                    onChange={(e) => {
                                        const newItems = [...block.data.items];
                                        newItems[idx].content = e.target.value;
                                        updateData({ items: newItems });
                                    }}
                                    className="w-full bg-transparent text-[10px] text-slate-400 h-16"
                                    placeholder="Content"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'accordion':
            return (
                <div className="space-y-5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Items List</label>
                    <div className="space-y-3">
                        {block.data.items?.map((item: any, idx: number) => (
                             <motion.div 
                                initial={{ opacity: 0, y: 5 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                key={idx} 
                                className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-2 relative group/item"
                             >
                                <input
                                    type="text"
                                    value={item.q}
                                    onChange={(e) => {
                                        const newItems = [...block.data.items];
                                        newItems[idx].q = e.target.value;
                                        updateData({ items: newItems });
                                    }}
                                    className="w-full bg-transparent border-b border-slate-700 text-xs text-white font-bold p-1 focus:border-indigo-500 outline-none"
                                    placeholder="Question..."
                                />
                                <textarea
                                    value={item.a}
                                    onChange={(e) => {
                                        const newItems = [...block.data.items];
                                        newItems[idx].a = e.target.value;
                                        updateData({ items: newItems });
                                    }}
                                    className="w-full bg-transparent text-slate-400 text-[11px] p-1 focus:outline-none h-16 resize-none leading-relaxed"
                                    placeholder="Answer..."
                                />
                                <button
                                    onClick={() => {
                                        const newItems = block.data.items.filter((_: any, i: number) => i !== idx);
                                        updateData({ items: newItems });
                                    }}
                                    className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                    <button
                        onClick={() => updateData({ items: [...(block.data.items || []), { q: 'Question?', a: 'Answer...' }] })}
                        className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-indigo-400 hover:border-indigo-500 transition-all text-[10px] font-bold flex items-center justify-center gap-2 bg-slate-800/20"
                    >
                        <Plus size={14} /> Add New Item
                    </button>
                </div>
            );

        case 'contact_info':
            return (
                <div className="space-y-4">
                    {['email', 'phone', 'address', 'whatsapp'].map((field) => (
                        <div key={field}>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{field}</label>
                            <input
                                type="text"
                                value={block.data[field] || ''}
                                onChange={(e) => updateData({ [field]: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none transition-all"
                                placeholder={`Enter ${field}...`}
                            />
                        </div>
                    ))}
                </div>
            );

        case 'alert':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                        <select
                            value={block.data.type}
                            onChange={(e) => updateData({ type: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                            <option value="info">Information (Blue)</option>
                            <option value="success">Success (Green)</option>
                            <option value="warning">Warning (Amber)</option>
                            <option value="danger">Danger (Red)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                        <input
                            type="text"
                            value={block.data.title}
                            onChange={(e) => updateData({ title: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Message</label>
                        <textarea
                            value={block.data.message}
                            onChange={(e) => updateData({ message: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white h-24"
                        />
                    </div>
                </div>
            );

        case 'pricing':
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                        <input
                            type="text"
                            value={block.data.title}
                            onChange={(e) => updateData({ title: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Plans</label>
                        {(block.data.plans || []).map((plan: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={plan.name}
                                        onChange={(e) => {
                                            const newPlans = [...block.data.plans];
                                            newPlans[idx].name = e.target.value;
                                            updateData({ plans: newPlans });
                                        }}
                                        className="flex-1 bg-transparent text-xs text-white font-bold"
                                        placeholder="Plan Name"
                                    />
                                    <input
                                        type="text"
                                        value={plan.price}
                                        onChange={(e) => {
                                            const newPlans = [...block.data.plans];
                                            newPlans[idx].price = e.target.value;
                                            updateData({ plans: newPlans });
                                        }}
                                        className="w-20 bg-slate-700 rounded p-1 text-xs text-center"
                                        placeholder="Price"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        checked={plan.featured} 
                                        onChange={(e) => {
                                            const newPlans = [...block.data.plans];
                                            newPlans[idx].featured = e.target.checked;
                                            updateData({ plans: newPlans });
                                        }}
                                        className="w-4 h-4 rounded bg-slate-900 border-slate-700"
                                    />
                                    <label className="text-[10px] text-slate-400 uppercase">Featured Plan</label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );

        default:
            return <div className="text-slate-500 italic text-xs">No settings available for this block.</div>;
    }
}
