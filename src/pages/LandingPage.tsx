import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    ChevronRight,
    Star,
    Check,
    Zap,
    BarChart3,
    Smartphone,
    ArrowRight,
    Play,
    Download,
} from 'lucide-react';
import { usePlans } from '../hooks/useSubscription';
import { useAuthStore } from '../app/store/useAuthStore';
import { getDefaultPage } from '../lib/auth';
import type { Plan } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

const features = [
    {
        name: 'Terminal POS Modern',
        description: 'Antarmuka kasir yang cepat, intuitif, dan mudah digunakan bahkan oleh pemula.',
        icon: ShoppingCart,
        color: 'text-indigo-600',
        bg: 'bg-indigo-100',
    },
    {
        name: 'Manajemen Inventori',
        description: 'Pantau stok bahan baku dan produk secara real-time untuk menghindari kehabisan stok.',
        icon: Package,
        color: 'text-amber-600',
        bg: 'bg-amber-100',
    },
    {
        name: 'Laporan Komprehensif',
        description: 'Dapatkan wawasan mendalam tentang penjualan, laba rugi, dan performa outlet.',
        icon: BarChart3,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100',
    },
    {
        name: 'Multi-Outlet',
        description: 'Kelola banyak cabang toko dalam satu akun dengan sinkronisasi data terpusat.',
        icon: LayoutDashboard,
        color: 'text-violet-600',
        bg: 'bg-violet-100',
    },
    {
        name: 'Manajemen Pelanggan',
        description: 'Bangun loyalitas dengan database pelanggan dan program diskon yang personal.',
        icon: Users,
        color: 'text-pink-600',
        bg: 'bg-pink-100',
    },
    {
        name: 'Akses Mobile',
        description: 'Pantau bisnis Anda kapan saja dan di mana saja melalui perangkat seluler.',
        icon: Smartphone,
        color: 'text-cyan-600',
        bg: 'bg-cyan-100',
    },
];

const stats = [
    { label: 'Merchant Aktif', value: '1,000+' },
    { label: 'Transaksi Bulanan', value: '500rb+' },
    { label: 'Waktu Aktif', value: '99.9%' },
    { label: 'Rating Pengguna', value: '4.9/5' },
];

export default function LandingPage() {
    const { data: plans, isLoading } = usePlans();
    const { isAuthenticated, user } = useAuthStore();
    const dashboardLink = getDefaultPage(user?.roles);
    const navigate = useNavigate();
    const { isInstallable, triggerInstall } = usePWAInstall();

    const handleInstall = async () => {
        if (isInstallable) {
            await triggerInstall();
        }
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
            {/* ─── Navigation ─────────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200/60 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Zap className="text-white fill-white" size={24} />
                            </div>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                KasirKu <span className="text-indigo-600 italic">POS</span>
                            </span>
                        </div>

                        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                            <a href="#features" className="hover:text-indigo-600 transition-colors">Fitur</a>
                            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Harga</a>
                            <a href="#about" className="hover:text-indigo-600 transition-colors">Tentang Kami</a>
                        </div>

                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <Link
                                    to={dashboardLink}
                                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
                                >
                                    Ke Dashboard <ArrowRight size={18} />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-slate-600 font-bold hover:text-indigo-600 transition-colors px-4 py-2"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                                    >
                                        Daftar Gratis
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ─── Hero Section ───────────────────────────────────────────────── */}
            <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-amber-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
                            <Star size={14} className="fill-indigo-600" />
                            Solusi Kasir Pintar #1 di Indonesia
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
                            Kelola Bisnis Lebih <br />
                            <span className="text-gradient">Cepat & Profesional</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 leading-relaxed mb-12 max-w-2xl mx-auto">
                            Sistem POS cloud paling komprehensif untuk UMKM. Kelola transaksi, stok, hingga banyak cabang toko dalam satu genggaman.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/register"
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-95"
                            >
                                Mulai Coba Gratis <ArrowRight size={22} />
                            </Link>
                            {isInstallable && (
                                <button
                                    onClick={handleInstall}
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-50 text-indigo-700 px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-100 transition-all shadow-lg shadow-indigo-100/50 border border-indigo-200/60 active:scale-95"
                                >
                                    <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                                        <Download size={16} />
                                    </span>
                                    Install Aplikasi
                                </button>
                            )}
                            <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-slate-800 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-lg shadow-slate-200/50 border border-slate-200/60 active:scale-95">
                                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                    <Play size={16} className="ml-0.5 fill-indigo-600" />
                                </span>
                                Lihat Demo
                            </button>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-16 pt-16 border-t border-slate-200/60">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {stats.map((stat) => (
                                    <div key={stat.label}>
                                        <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Mockup (Simulated) */}
                <div className="max-w-6xl mx-auto px-4 mt-20 relative animate-float">
                    <div className="relative rounded-3xl overflow-hidden border-[8px] border-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.1)] aspect-[16/9] md:aspect-[21/9]">
                        <img
                            src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop"
                            alt="POS Dashboard Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-white max-w-xs">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-1">Status Realtime</p>
                                <p className="text-lg font-bold">Monitor Penjualan Semua Outlet Secara Instan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Features Section ───────────────────────────────────────────── */}
            <section id="features" className="py-24 lg:py-32 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Fitur Unggulan</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Segala yang Anda Butuhkan untuk <span className="text-indigo-600">Terus Tumbuh</span></h3>
                        <p className="text-lg text-slate-500">Dirancang khusus untuk memajukan bisnis restoran, retail, dan jasa di era digital.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div
                                key={feature.name}
                                className="group p-8 rounded-3xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-300 cursor-default"
                            >
                                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon size={28} />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{feature.name}</h4>
                                <p className="text-slate-500 leading-relaxed mb-6">{feature.description}</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    Pelajari lebih lanjut <ChevronRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Pricing Section ────────────────────────────────────────────── */}
            <section id="pricing" className="py-24 lg:py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-xs font-black text-amber-600 uppercase tracking-[0.3em] mb-4">Harga Terjangkau</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Pilih Paket yang Sesuai dengan <span className="text-gradient-amber">Skala Bisnis Anda</span></h3>
                        <p className="text-lg text-slate-500">Mulai dari trial gratis hingga fitur lengkap untuk jaringan outlet besar.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-end">
                        {!isLoading && plans?.map((plan: Plan) => (
                            <div
                                key={plan.id}
                                className={`
                                    relative p-8 rounded-[2rem] flex flex-col transition-all duration-500 hover:-translate-y-2
                                    ${plan.price > 0
                                        ? 'bg-slate-900 text-white shadow-2xl shadow-indigo-200'
                                        : 'bg-white text-slate-800 border border-slate-200/60 shadow-lg shadow-slate-200/50'}
                                `}
                            >
                                {plan.price > 0 && (
                                    <div className="absolute top-0 right-12 -translate-y-1/2 bg-amber-500 text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                                        Paling Populer
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h4 className={`text-xl font-black mb-2 ${plan.price > 0 ? 'text-amber-500' : 'text-indigo-600'}`}>
                                        {plan.name}
                                    </h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold opacity-60">Rp</span>
                                        <span className="text-4xl font-black tracking-tight">
                                            {plan.price.toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-sm font-bold opacity-60">/{plan.billing_cycle === 'monthly' ? 'bln' : 'thn'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10 flex-1">
                                    <div className="flex items-center gap-3 text-sm font-bold">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.price > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-100 text-indigo-600'}`}>
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {plan.max_outlets === 999 ? 'Unlimited' : plan.max_outlets} Outlet
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.price > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-100 text-indigo-600'}`}>
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {plan.max_products === 999 ? 'Unlimited' : plan.max_products} Produk
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.price > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-100 text-indigo-600'}`}>
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {plan.max_users === 999 ? 'Unlimited' : plan.max_users} Pengguna
                                    </div>
                                    {plan.trial_days > 0 && (
                                        <div className="flex items-center gap-3 text-sm font-bold">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.price > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-100 text-indigo-600'}`}>
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                            {plan.trial_days} Hari Trial Gratis
                                        </div>
                                    )}
                                </div>

                                <Link
                                    to={isAuthenticated ? '/subscription' : '/register'}
                                    className={`
                                        w-full py-4 rounded-2xl font-black text-center transition-all active:scale-95
                                        ${plan.price > 0
                                            ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'}
                                    `}
                                >
                                    Pilih Paket
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA Section ────────────────────────────────────────────────── */}
            <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-[3rem] bg-indigo-600 p-12 lg:p-20 overflow-hidden shadow-2xl shadow-indigo-200">
                    {/* Decor */}
                    <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                        <Zap size={400} className="text-white fill-white" />
                    </div>

                    <div className="relative z-10 text-center max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Siap Memodernisasi Bisnis Anda?</h2>
                        <p className="text-xl text-indigo-100 mb-12">Daftar sekarang dan nikmati full akses selama 14 hari tanpa biaya komitmen.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/register"
                                className="w-full sm:w-auto bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-xl active:scale-95"
                            >
                                Daftar Gratis Sekarang
                            </Link>
                            <Link
                                to="/login"
                                className="w-full sm:w-auto bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-800 transition-all border border-indigo-500/30 active:scale-95"
                            >
                                Masuk ke Akun
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─────────────────────────────────────────────────────── */}
            <footer className="bg-slate-900 text-slate-400 py-20 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/40">
                                    <Zap className="text-white fill-white" size={18} />
                                </div>
                                <span className="text-xl font-black text-white tracking-tight">
                                    KasirKu <span className="text-indigo-500 italic">POS</span>
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed max-w-sm">
                                Solusi manajemen bisnis dan kasir cloud terlengkap di Indonesia. Memberdayakan UMKM dengan teknologi mutakhir untuk efisiensi operasional.
                            </p>
                        </div>
                        <div>
                            <h5 className="text-white font-black uppercase text-xs tracking-widest mb-6">Produk</h5>
                            <ul className="space-y-4 text-sm font-bold">
                                <li><a href="#" className="hover:text-white transition-colors">POS Terminal</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Inventori</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Laporan</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Harga</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-white font-black uppercase text-xs tracking-widest mb-6">Dukungan</h5>
                            <ul className="space-y-4 text-sm font-bold">
                                <li><a href="#" className="hover:text-white transition-colors">Pusat Bantuan</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-widest">
                        <p>&copy; 2026 KasirKu POS. Dibuat dengan &hearts; oleh Nabil.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Instagram</a>
                            <a href="#" className="hover:text-white transition-colors">YouTube</a>
                            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
