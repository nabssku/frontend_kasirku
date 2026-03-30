import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePlans, useSubscribe, useValidateDiscount, useCheckPayment } from '../../hooks/useSubscription';
import { formatRp } from '../../lib/format';
import {
    ArrowLeft, CheckCircle2, Ticket, ShieldCheck,
    CreditCard, ShoppingBag, Loader2, AlertTriangle, ExternalLink, RefreshCw
} from 'lucide-react';

export default function CheckoutPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const planId = Number(searchParams.get('planId'));
    const cycle = (searchParams.get('cycle') || 'monthly') as 'monthly' | 'yearly';

    const { data: plans, isLoading: plansLoading } = usePlans();
    const subscribe = useSubscribe();
    const validateDiscount = useValidateDiscount();

    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{
        code: string;
        discount_amount: number;
        final_price: number;
    } | null>(null);
    const [discountError, setDiscountError] = useState<string | null>(null);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [pendingInvoice, setPendingInvoice] = useState<string | null>(null);

    const paymentCheck = useCheckPayment(pendingInvoice, showPaymentModal);
    const paidSuccessfully = paymentCheck.data?.status === 'paid';
    const paymentExpired = paymentCheck.data?.status === 'expired' || paymentCheck.data?.status === 'failed';

    const selectedPlan = plans?.find(p => p.id === planId);

    useEffect(() => {
        if (!plansLoading && (!planId || !selectedPlan)) {
            navigate('/subscription');
        }
    }, [plansLoading, planId, selectedPlan, navigate]);

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        setDiscountError(null);

        try {
            const result = await validateDiscount.mutateAsync({
                code: discountCode,
                plan_id: planId,
            });
            if (result.success) {
                setAppliedDiscount({
                    code: result.data.code,
                    discount_amount: result.data.discount_amount,
                    final_price: result.data.final_price,
                });
            }
        } catch (err: any) {
            setDiscountError(err.response?.data?.message || 'Kode diskon tidak valid.');
            setAppliedDiscount(null);
        }
    };

    const handleSubscribe = async () => {
        try {
            const result = await subscribe.mutateAsync({
                plan_id: planId,
                billing_cycle: cycle,
                discount_code: appliedDiscount?.code || null,
            });

            if (result.payment_url && result.invoice_id) {
                setPaymentUrl(result.payment_url);
                setPendingInvoice(result.invoice_id);
                setShowPaymentModal(true);
                window.open(result.payment_url, '_blank');
            }
        } catch {
            alert('Gagal membuat transaksi. Silakan coba lagi.');
        }
    };

    const handleCloseModal = () => {
        setShowPaymentModal(false);
        if (paidSuccessfully) {
            navigate('/subscription');
        }
    };

    if (plansLoading || !selectedPlan) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const basePrice = selectedPlan.price;
    const finalPrice = appliedDiscount ? appliedDiscount.final_price : basePrice;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 text-center space-y-6">
                        {paidSuccessfully ? (
                            <>
                                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={40} className="text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Pembayaran Berhasil!</h2>
                                <p className="text-slate-500">Langganan Anda telah aktif.</p>
                                <button
                                    onClick={handleCloseModal}
                                    className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                                >
                                    Selesai
                                </button>
                            </>
                        ) : paymentExpired ? (
                            <>
                                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                                    <AlertTriangle size={40} className="text-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Pembayaran Gagal</h2>
                                <p className="text-slate-500">Transaksi telah berakhir atau dibatalkan.</p>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="w-full py-3 rounded-2xl bg-slate-200 text-slate-700 font-bold"
                                >
                                    Tutup
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
                                    <RefreshCw size={36} className="text-indigo-500 animate-spin" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Menunggu Pembayaran</h2>
                                <p className="text-slate-500">Selesaikan pembayaran di tab yang baru dibuka.</p>
                                <a
                                    href={paymentUrl ?? '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold"
                                >
                                    <ExternalLink size={18} /> Buka Halaman Pembayaran
                                </a>
                                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 text-sm">Kembali</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/subscription')}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium mb-8 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Kembali ke Pilihan Paket
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left side: Order Summary */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <ShoppingBag className="text-indigo-600" size={24} />
                                Ringkasan Pesanan
                            </h2>

                            <div className="flex items-start gap-4 p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{selectedPlan.name}</h3>
                                    <p className="text-sm text-indigo-600 font-semibold capitalize">{cycle === 'monthly' ? 'Tagihan Bulanan' : 'Tagihan Tahunan'}</p>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detail Termasuk:</p>
                                <ul className="space-y-3">
                                    {selectedPlan.features.filter(f => f.feature_value === 'true').slice(0, 5).map(f => (
                                        <li key={f.feature_key} className="flex items-center gap-3 text-sm text-slate-600">
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                <CheckCircle2 size={12} />
                                            </div>
                                            {f.feature_key.replace(/_/g, ' ')}
                                        </li>
                                    ))}
                                    {selectedPlan.features.length > 5 && (
                                        <li className="text-xs text-slate-400 italic ml-8">Dan fitur premium lainnya...</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 ring-4 ring-white">
                            <h3 className="text-lg font-bold mb-4 opacity-90">Keuntungan Berlangganan:</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={20} className="text-indigo-200 shrink-0" />
                                    <p className="text-sm leading-relaxed">Akses ke semua fitur premium tanpa batas sesuai kapasitas paket.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={20} className="text-indigo-200 shrink-0" />
                                    <p className="text-sm leading-relaxed">Dukungan teknis prioritas dari tim ahli JagoKasir.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={20} className="text-indigo-200 shrink-0" />
                                    <p className="text-sm leading-relaxed">Update fitur terbaru secara gratis selamanya.</p>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right side: Payment Details */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Detail Pembayaran</h2>

                            {/* Discount Code */}
                            <div className="space-y-3 mb-8">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Ticket size={16} className="text-indigo-500" />
                                    Punya kode diskon?
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Masukkan kode..."
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                        disabled={!!appliedDiscount || validateDiscount.isPending}
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                                    />
                                    {appliedDiscount ? (
                                        <button
                                            onClick={() => { setAppliedDiscount(null); setDiscountCode(''); }}
                                            className="px-4 py-3 text-red-600 font-bold text-sm hover:bg-red-50 rounded-2xl transition-colors"
                                        >
                                            Hapus
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleApplyDiscount}
                                            disabled={!discountCode.trim() || validateDiscount.isPending}
                                            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {validateDiscount.isPending && <Loader2 size={16} className="animate-spin" />}
                                            Gunakan
                                        </button>
                                    )}
                                </div>
                                {discountError && <p className="text-xs text-red-500 font-medium">{discountError}</p>}
                                {appliedDiscount && (
                                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                        <CheckCircle2 size={12} />
                                        Kode {appliedDiscount.code} berhasil dipasang!
                                    </p>
                                )}
                            </div>

                            {/* Bill Breakdown */}
                            <div className="space-y-4 border-t border-slate-100 pt-6">
                                <div className="flex justify-between items-center text-slate-600">
                                    <span className="text-sm font-medium">Harga {selectedPlan.name}</span>
                                    <span className="font-bold">{formatRp(basePrice)}</span>
                                </div>
                                {appliedDiscount && (
                                    <div className="flex justify-between items-center text-emerald-600">
                                        <span className="text-sm font-medium">Diskon Promo</span>
                                        <span className="font-bold">-{formatRp(appliedDiscount.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-slate-600">
                                    <span className="text-sm font-medium">Pajak (0%)</span>
                                    <span className="font-bold">{formatRp(0)}</span>
                                </div>
                                <div className="pt-4 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Pembayaran</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter mt-1">{formatRp(finalPrice)}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">One-time payment</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSubscribe}
                                disabled={subscribe.isPending}
                                className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                            >
                                {subscribe.isPending ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={24} />
                                        Bayar Sekarang
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-center text-slate-400 mt-6 leading-relaxed px-4">
                                Dengan menekan tombol di atas, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi JagoKasir. Pembayaran diproses dengan aman oleh Pakasir.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-8 py-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Powered by Pakasir</span>
                            <div className="w-px h-4 bg-slate-300" />
                            <ShieldCheck size={20} className="text-slate-600" />
                            <CreditCard size={20} className="text-slate-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
