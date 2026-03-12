import { useState, useEffect, useRef } from 'react';
import {
    Layout,
    Type,
    AlignCenter,
    AlignLeft,
    Save,
    Loader2,
    FileText,
    Store,
    AlertCircle,
    ImageIcon,
    Upload,
    Trash2,
    Printer
} from 'lucide-react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useReceiptSettings } from '../../hooks/useReceiptSettings';
import { useBluetoothPrint } from '../../hooks/useBluetoothPrint';
import { toast } from 'sonner';
import type { ReceiptSettings } from '../../types';

export default function ReceiptSettingsPage() {
    const { user } = useAuthStore();
    const isOwnerOnly = user?.roles?.some(r => r.slug === 'owner') && !user?.roles?.some(r => r.slug === 'admin' || r.slug === 'super_admin');
    const outletId = user?.outlet_id;
    const { outlet, isLoading, isUpdating, updateSettings } = useReceiptSettings(outletId);
    const { printReceipt } = useBluetoothPrint();
    const [isTestPrinting, setIsTestPrinting] = useState(false);

    const [form, setForm] = useState<ReceiptSettings>({
        store_name: '',
        font_size: 'medium',
        alignment: 'center',
        header_text: '',
        footer_text: '',
        logo_url: '',
        logo_width: 80,
        paper_width: 32
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (outlet?.receipt_settings) {
            setForm(outlet.receipt_settings);
            if (outlet.receipt_settings.logo_url) {
                setLogoPreview(outlet.receipt_settings.logo_url);
            }
        } else if (outlet) {
            setForm(prev => ({ ...prev, store_name: outlet.name }));
        }
    }, [outlet]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setForm(prev => ({ ...prev, logo_url: '' }));
    };

    const handleSave = () => {
        updateSettings({ settings: form, logo: logoFile || undefined }, {
            onSuccess: () => {
                toast.success('Pengaturan struk berhasil disimpan');
                setLogoFile(null);
            },
            onError: () => {
                toast.error('Gagal menyimpan pengaturan struk');
            }
        });
    };

    const handleTestPrint = async () => {
        setIsTestPrinting(true);
        try {
            const sampleData = {
                store_name: form.store_name || outlet?.name || 'Nama Toko Anda',
                store_address: outlet?.address || 'Alamat Toko Anda',
                store_phone: outlet?.phone || '08123456789',
                invoice_number: 'TRX-TEST-PRINT',
                date: new Date().toLocaleString('id-ID'),
                cashier: user?.name || 'Kasir',
                customer: 'Pelanggan Umum',
                type: 'dine_in' as const,
                items: [
                    { name: 'Produk Contoh 1', quantity: 2, price: 50000, subtotal: 100000 },
                    { name: 'Produk Contoh 2', quantity: 1, price: 25000, subtotal: 25000 },
                ],
                subtotal: 125000,
                discount: 0,
                tax: 12500,
                tax_rate: 10,
                service_charge: 0,
                grand_total: 137500,
                paid_amount: 150000,
                change_amount: 12500,
                payment_method: 'cash',
                status: 'completed' as const,
                receipt_settings: form
            };

            await printReceipt(sampleData);
            toast.success('Test print berhasil dikirim ke printer');
        } catch (err: any) {
            toast.error(err.message || 'Gagal melakukan test print');
        } finally {
            setIsTestPrinting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!outletId) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center max-w-2xl mx-auto mt-12">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-amber-900">Outlet Belum Dipilih</h2>
                <p className="text-amber-700 mt-2">
                    Akun Anda belum terhubung ke outlet manapun. Pengaturan struk dilakukan per-outlet.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pengaturan Desain Struk</h1>
                    <p className="text-sm text-slate-500 mt-1">Sesuaikan tampilan struk belanja untuk pelanggan</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleTestPrint}
                        disabled={isTestPrinting || isUpdating}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isTestPrinting ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
                        Test Print
                    </button>
                    {!isOwnerOnly && (
                        <button
                            onClick={handleSave}
                            disabled={isUpdating || isTestPrinting}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Simpan Pengaturan
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon size={14} /> Logo Toko (Opsional)
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                    {logoPreview ? (
                                        <>
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                            <button
                                                onClick={removeLogo}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity"
                                            >
                                                <Trash2 size={18} className="text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <ImageIcon className="text-slate-300" size={24} />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        <Upload size={14} />
                                        {logoPreview ? 'Ganti Logo' : 'Unggah Logo'}
                                    </button>
                                    <p className="text-[10px] text-slate-400">Rekomendasi: Gambar persegi, maks 2MB.</p>
                                </div>
                            </div>

                            {logoPreview && (
                                <div className="space-y-1.5 pt-2">
                                    <label className="text-xs font-semibold text-slate-700 flex justify-between">
                                        <span>Lebar Logo</span>
                                        <span className="text-indigo-600">{form.logo_width || 80}px</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="40"
                                        max="200"
                                        step="10"
                                        value={form.logo_width || 80}
                                        onChange={e => setForm({ ...form, logo_width: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            )}
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-50">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Store size={14} /> Identitas Toko
                            </h3>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Nama Toko di Struk</label>
                                <input
                                    type="text"
                                    value={form.store_name}
                                    onChange={e => setForm({ ...form, store_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                                    placeholder={outlet?.name}
                                />
                                <p className="text-[10px] text-slate-400">Jika kosong, akan menggunakan nama outlet default.</p>
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-50">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Layout size={14} /> Tata Letak & Font
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 text-center block">Ukuran Font</label>
                                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                        {(['small', 'medium', 'large'] as const).map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setForm({ ...form, font_size: size })}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${form.font_size === size ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                {size === 'small' ? 'Kecil' : size === 'medium' ? 'Sedang' : 'Besar'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 text-center block">Posisi Teks</label>
                                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                        <button
                                            onClick={() => setForm({ ...form, alignment: 'left' })}
                                            className={`flex-1 py-2 flex justify-center rounded-lg transition-all ${form.alignment === 'left' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            <AlignLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => setForm({ ...form, alignment: 'center' })}
                                            className={`flex-1 py-2 flex justify-center rounded-lg transition-all ${form.alignment === 'center' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            <AlignCenter size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-4 border-t border-slate-50">
                                <label className="text-sm font-semibold text-slate-700">Jenis Kertas Printer</label>
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                    {[
                                        { label: '58mm (32 Karakter)', value: 32 },
                                        { label: '80mm (48 Karakter)', value: 48 }
                                    ].map((p) => (
                                        <button
                                            key={p.value}
                                            onClick={() => setForm({ ...form, paper_width: p.value })}
                                            className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${form.paper_width === p.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400">Pilih sesuai dengan lebar kertas printer Bluetooth Anda.</p>
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-50">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Type size={14} /> Teks Tambahan
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Header (Pesan Pembuka)</label>
                                    <textarea
                                        rows={2}
                                        value={form.header_text}
                                        onChange={e => setForm({ ...form, header_text: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="Contoh: Selamat Datang..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Footer (Pesan Penutup)</label>
                                    <textarea
                                        rows={2}
                                        value={form.footer_text}
                                        onChange={e => setForm({ ...form, footer_text: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="Contoh: Terima Kasih, Datang Kembali!"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2 px-2">
                        <FileText size={16} /> PREVIEW STRUK
                    </h3>
                    <div className="bg-slate-800 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden flex justify-center">
                        {/* Paper Texture Effect */}
                        <div className="bg-white w-[300px] shadow-lg min-h-[500px] p-6 text-slate-900 border-t-[12px] border-indigo-500 font-mono">
                            <div className={`${form.alignment === 'center' ? 'text-center' : 'text-left'} space-y-4`}>
                                {/* Header */}
                                <div>
                                    {logoPreview && (
                                        <div className={`mb-3 flex ${form.alignment === 'center' ? 'justify-center' : 'justify-start'}`}>
                                            <img
                                                src={logoPreview}
                                                alt="Logo"
                                                style={{ width: `${form.logo_width || 80}px` }}
                                                className="h-auto object-contain grayscale"
                                            />
                                        </div>
                                    )}
                                    <h4 className={`font-bold uppercase tracking-tight ${form.font_size === 'small' ? 'text-base' : form.font_size === 'medium' ? 'text-xl' : 'text-2xl'
                                        }`}>
                                        {form.store_name || outlet?.name || 'KASIRKU POS'}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 mt-1">{outlet?.address || 'Alamat Toko Belum Diatur'}</p>
                                    {form.header_text && (
                                        <p className="text-[10px] mt-2 italic text-slate-400 whitespace-pre-wrap">{form.header_text}</p>
                                    )}
                                </div>

                                <div className="border-b border-dashed border-slate-200 pb-2">
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>INV/20260226/001</span>
                                        <span>26/02/26 19:44</span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="space-y-2 text-[10px]">
                                    <div className="flex justify-between font-bold">
                                        <span className="flex-1 text-left">PRODUK CONTOH X1</span>
                                        <span className="w-20 text-right">Rp 25.000</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span className="flex-1 text-left">TOPPING EXTRA</span>
                                        <span className="w-20 text-right">Rp 5.000</span>
                                    </div>
                                </div>

                                <div className="border-t border-dashed border-slate-200 pt-2 space-y-1 text-[10px]">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal</span>
                                        <span>Rp 30.000</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-100">
                                        <span>TOTAL</span>
                                        <span>Rp 30.000</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="pt-8 text-[10px] text-slate-400">
                                    {form.footer_text ? (
                                        <p className="whitespace-pre-wrap">{form.footer_text}</p>
                                    ) : (
                                        <p>Terima Kasih Atas Kunjungan Anda</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
