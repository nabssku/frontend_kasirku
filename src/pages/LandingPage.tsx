import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    ChevronRight,
    Check,
    BarChart3,
    Smartphone,
    Play,
    Store,
    ChevronDown,
    Star,
    Quote
} from 'lucide-react';
import { usePlans } from '../hooks/useSubscription';
import { useAuthStore } from '../app/store/useAuthStore';
import type { Plan } from '../types';
import { SEO } from '../components/SEO';
import { formatRp } from '../lib/format';

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

const sponsors = [
    "GojoPay", "GrabFood", "ShopeePay", "Ovo", "Dana", "LinkAja", "GrabMart", "BCA", "Mandiri", "BRI", "BNI", "Qris", "Telkomsel"
];

const testimonials = [
    {
        name: "Budi Santoso",
        role: "Pemilik Kedai Kopi Suka",
        content: "Semenjak pakai JagoKasir, catat pesanan jadi gampang banget. Dulu sering salah hitung, sekarang semua serba otomatis. Laporan keuangannya juara!",
        rating: 5,
        avatar: "https://i.pravatar.cc/150?img=11"
    },
    {
        name: "Siti Rahma",
        role: "Owner Warung Makan Sedap",
        content: "Fitur multi-outlet-nya luar biasa. Saya bisa pantau stok dan penjualan 3 cabang sekaligus dari rumah lewat HP. Sangat membantu operasional restoran saya.",
        rating: 5,
        avatar: "https://i.pravatar.cc/150?img=5"
    },
    {
        name: "Andi Wijaya",
        role: "Manager Resto Bintang",
        content: "UI/UX nya sangat intuitif. Kasir baru kami tidak butuh waktu lama untuk belajar menggunakannya. Layanan pelanggan juga sangat responsif.",
        rating: 5,
        avatar: "https://i.pravatar.cc/150?img=12"
    }
];

const faqs = [
    {
        question: "Apakah JagoKasir bisa digunakan saat offline?",
        answer: "JagoKasir membutuhkan koneksi internet (Cloud-based) agar sinkronisasi data antar perangkat dapat terjadi secara real-time. Namun, sistem kami didesain sangat ringan."
    },
    {
        question: "Berapa lama proses setup awal aplikasi?",
        answer: "Kurang dari 5 menit! Anda cukup mendaftar, memasukkan menu/produk Anda, dan JagoKasir sudah langsung siap digunakan untuk berjualan dan melayani pembeli."
    },
    {
        question: "Apakah ada batasan jumlah transaksi per hari?",
        answer: "Tidak ada batasan sama sekali. Semua paket JagoKasir mendukung transaksi bulanan secara penuh agar operasional bisnis Anda bisa berkembang pesat dan mulus tanpa keraguan limit transaksional."
    },
    {
        question: "Bisakah saya mengupgrade paket di kemudian hari?",
        answer: "Tentu saja. Anda dapat memulai terlebih dahulu dari Paket Gratis maupun Trial 14-hari. Setelah itu Anda bisa upgrade ke Paket Premium dengan fleksibel kapan saja lewat dashboard."
    }
];

import { useEffect } from 'react';
import { PublicNavbar } from '../components/shared/PublicNavbar';
import { PublicFooter } from '../components/shared/PublicFooter';

export default function LandingPage() {
    const { data: plans, isLoading } = usePlans();
    const { isAuthenticated } = useAuthStore();

    // Support for scrolling to section from other pages (e.g., /contact -> /#features)
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const id = hash.replace('#', '');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    window.scrollTo({
                        top: element.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }, []);

    return (
        <div className="w-full min-w-full h-full overflow-y-auto overflow-x-hidden bg-[#fdfdfd] selection:bg-amber-100 selection:text-amber-900 font-sans safe-padding" style={{ scrollBehavior: 'smooth' }}>
            <SEO
                title="Solusi Kasir Pintar #1 di Indonesia"
                description="JagoKasir adalah aplikasi POS cloud terbaik untuk UMKM. Kelola transaksi, stok, dan outlet dengan mudah."
            />
            
            <PublicNavbar />

            {/* ─── Hero Section ───────────────────────────────────────────────── */}
            <section id="home" className="relative pt-32 lg:pt-40 pb-0 overflow-hidden bg-white">
                {/* Floating Elements */}
                <div className="hidden lg:block absolute inset-0 pointer-events-none z-10">
                    <div className="relative w-full h-full max-w-7xl mx-auto">
                        {/* Top Left */}
                        <div className="absolute top-[5%] left-[10%] w-14 h-14 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center text-2xl animate-[bounce_3s_ease-in-out_infinite]">🍦</div>
                        {/* Mid Left */}
                        <div className="absolute top-[35%] left-[5%] w-16 h-16 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center text-3xl animate-[bounce_4s_ease-in-out_infinite] delay-100">🍜</div>
                        {/* Bottom Left */}
                        <div className="absolute bottom-[20%] left-[18%] w-12 h-12 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center text-xl animate-[bounce_3.5s_ease-in-out_infinite] delay-300">🍩</div>

                        {/* Top Right */}
                        <div className="absolute top-[10%] right-[15%] w-12 h-12 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center text-xl animate-[bounce_3.2s_ease-in-out_infinite] delay-200">🍞</div>
                        {/* Mid Right */}
                        <div className="absolute top-[40%] right-[8%] w-16 h-16 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center text-3xl animate-[bounce_4.5s_ease-in-out_infinite] delay-500">🍲</div>
                        {/* Bottom Right */}
                        <div className="absolute bottom-[25%] right-[20%] w-14 h-14 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center text-2xl animate-[bounce_3.8s_ease-in-out_infinite] delay-150">☕</div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
                    <h1 className="text-5xl md:text-[4.5rem] font-bold text-slate-800 leading-[1.15] mb-6 tracking-tight">
                        JagoKasir Untuk Semua <br />Kebutuhan <span className="relative inline-block">Bisnis Anda
                            {/* "Sparkles" accent like in the image */}
                            <svg className="absolute -top-6 -right-10 w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v4M17 7l-3 3M22 12h-4" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                        Ucapkan selamat tinggal pada pencatatan pesanan manual dan proses kasir yang rumit dengan sistem POS kami yang mudah digunakan.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/register" className="bg-amber-400 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-500 transition-colors shadow-lg shadow-amber-200/50 active:scale-95">
                            Mulai Sekarang
                        </Link>
                        <button className="flex items-center gap-3 bg-white text-slate-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors shadow-sm border border-slate-200 active:scale-95">
                            <div className="bg-slate-900 rounded-full p-1">
                                <Play size={16} className="fill-white text-white ml-0.5" />
                            </div>
                            Tonton Video
                        </button>
                    </div>
                </div>

                {/* Dashboard Mockup */}
                <div className="max-w-6xl mx-auto px-4 relative z-0 mt-16 mb-[-100px] lg:mb-[-140px]">
                    <div className="rounded-[2.5rem] overflow-hidden border-[12px] md:border-[16px] border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-slate-800 relative aspect-[16/9] md:aspect-[16/10] xl:aspect-[16/9]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-900 z-30 mt-[-6px] hidden md:block"></div> {/* Camera dot */}
                        <img
                            src="./JagoKasir_moockup.png"
                            alt="JagoKasir Dashboard Preview"
                            className="w-full h-full object-cover rounded-2xl"
                        />
                        <div className="absolute inset-0 bg-slate-900/10 rounded-2xl pointer-events-none"></div>
                    </div>
                </div>
            </section>

            {/* ─── Stats / Bottom Hero Bar ────────────────────────────────────── */}
            <section className="bg-indigo-700 text-white pt-[60px] pb-10 relative z-10 lg:mt-[-80px] mt-[-60px]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-8">
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl lg:text-[1.75rem] font-semibold leading-tight mb-0">
                                20K+ Restoran <br />
                                <span className="text-indigo-100/90 font-normal">telah menggunakan JagoKasir</span>
                            </h2>
                        </div>
                        <div className="flex justify-center md:justify-end gap-12 lg:gap-20 text-center md:text-left">
                            <div>
                                <div className="text-3xl lg:text-[2rem] font-bold mb-1">12</div>
                                <div className="text-indigo-200/90 text-sm lg:text-base">Penghargaan</div>
                            </div>
                            <div>
                                <div className="text-3xl lg:text-[2rem] font-bold mb-1">32K+</div>
                                <div className="text-indigo-200/90 text-sm lg:text-base">Pengguna Aktif</div>
                            </div>
                            <div>
                                <div className="text-3xl lg:text-[2rem] font-bold mb-1">4.8</div>
                                <div className="text-indigo-200/90 text-sm lg:text-base">Ulasan</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Features Section ── */}
            <section id="features" className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h3 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">Segala yang Anda Butuhkan untuk <span className="text-indigo-600">Terus Tumbuh</span></h3>
                        <p className="text-lg text-slate-500">Dirancang khusus untuk memajukan bisnis restoran, retail, dan jasa di era digital.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div
                                key={feature.name}
                                className="group p-8 rounded-[2rem] border border-slate-100 bg-[#fbfbfb] hover:border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 cursor-default"
                            >
                                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon size={28} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">{feature.name}</h4>
                                <p className="text-slate-500 leading-relaxed mb-6">{feature.description}</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    Pelajari lebih lanjut <ChevronRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Pricing Section ─── */}
            <section id="pricing" className="py-24 bg-[#fdfdfd] border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h3 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">Pilih Paket yang Sesuai dengan <span className="text-amber-500">Skala Bisnis Anda</span></h3>
                        <p className="text-lg text-slate-500">Mulai dari trial gratis hingga fitur lengkap untuk jaringan outlet besar.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-end">
                        {!isLoading && plans?.map((plan: Plan) => (
                            <div
                                key={plan.id}
                                className={`
                                    relative p-8 lg:p-10 rounded-[2rem] flex flex-col transition-all duration-500 hover:-translate-y-2
                                    ${plan.price > 0
                                        ? 'bg-slate-800 text-white shadow-2xl shadow-slate-200'
                                        : 'bg-white text-slate-800 border border-slate-200/60 shadow-lg shadow-slate-100'}
                                `}
                            >
                                {plan.price > 0 && (
                                    <div className="absolute top-0 right-10 -translate-y-1/2 bg-amber-400 text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full">
                                        Paling Populer
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h4 className={`text-xl font-bold mb-3 ${plan.price > 0 ? 'text-amber-400' : 'text-indigo-600'}`}>
                                        {plan.name}
                                    </h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl lg:text-5xl font-extrabold tracking-tight">
                                            {formatRp(plan.price)}
                                        </span>
                                        <span className={`text-sm font-bold ${plan.price > 0 ? 'text-slate-400' : 'text-slate-500'}`}>/{plan.billing_cycle === 'monthly' ? 'bln' : 'thn'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10 flex-1">
                                    <div className="flex items-center gap-3 text-base font-medium">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.price > 0 ? 'bg-amber-400/20 text-amber-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {plan.max_outlets === 999 ? 'Unlimited' : plan.max_outlets} Outlet
                                    </div>
                                    <div className="flex items-center gap-3 text-base font-medium">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.price > 0 ? 'bg-amber-400/20 text-amber-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {plan.max_products === 999 ? 'Unlimited' : plan.max_products} Produk
                                    </div>
                                    <div className="flex items-center gap-3 text-base font-medium">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.price > 0 ? 'bg-amber-400/20 text-amber-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {plan.max_users === 999 ? 'Unlimited' : plan.max_users} Pengguna
                                    </div>
                                    {plan.trial_days > 0 && (
                                        <div className="flex items-center gap-3 text-base font-medium">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.price > 0 ? 'bg-amber-400/20 text-amber-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                            {plan.trial_days} Hari Trial Gratis
                                        </div>
                                    )}
                                </div>

                                <Link
                                    to={isAuthenticated ? '/subscription' : '/register'}
                                    className={`
                                        w-full py-4 rounded-xl font-bold text-lg text-center transition-all active:scale-95
                                        ${plan.price > 0
                                            ? 'bg-amber-400 text-slate-900 hover:bg-amber-500'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'}
                                    `}
                                >
                                    Pilih Paket
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Sponsors Section (Marquee) ─────────────────────────────────── */}
            <section className="py-12 bg-[#fbfbfb] border-t border-slate-100 overflow-hidden relative">
                <style>{`
                    @keyframes marqueeAnim {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee-scroll {
                        animation: marqueeAnim 45s linear infinite;
                        display: flex;
                        width: max-content;
                    }
                    .animate-marquee-scroll:hover {
                        animation-play-state: paused;
                    }
                `}</style>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 relative z-20">
                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Telah Dipercaya Oleh Ribuan Outlet & Terintegrasi Dengan</p>
                </div>

                <div className="w-full relative shadow-inner-x group">
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#fbfbfb] to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#fbfbfb] to-transparent z-10 pointer-events-none"></div>

                    <div className="animate-marquee-scroll flex items-center h-20">
                        {/* Duplicate lists twice to create seamless infinite scroll loop */}
                        {[...sponsors, ...sponsors, ...sponsors, ...sponsors].map((sponsor, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-8 text-2xl font-black text-slate-300 hover:text-indigo-500 transition-colors cursor-default whitespace-nowrap">
                                <Store size={26} className="opacity-50" />
                                {sponsor}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Testimonial Section ────────────────────────────────────────── */}
            <section id="testimonials" className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h3 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">Cerita Sukses <span className="text-indigo-600">Pelanggan Kami</span></h3>
                        <p className="text-lg text-slate-500">Lihatlah apa kata para pemilik usaha yang telah menggunakan layanan JagoKasir lebih dari setahun ini.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testi, idx) => (
                            <div key={idx} className="bg-[#fdfdfd] p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100 hover:shadow-2xl hover:shadow-indigo-50 hover:-translate-y-2 transition-all duration-300 relative">
                                <Quote size={40} className="absolute top-6 right-6 text-indigo-50 opacity-50" />
                                <div className="text-amber-400 mb-6 flex gap-1.5">
                                    {[...Array(testi.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-current" />
                                    ))}
                                </div>
                                <p className="text-slate-600 italic mb-8 leading-relaxed font-medium">"{testi.content}"</p>
                                <div className="flex items-center gap-4">
                                    <img src={testi.avatar} alt={testi.name} className="w-14 h-14 rounded-full shadow-sm ring-4 ring-white" />
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{testi.name}</h4>
                                        <p className="text-sm font-medium text-slate-500">{testi.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FAQ Section ────────────────────────────────────────────────── */}
            <section id="faq" className="py-24 bg-[#fbfbfb] border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h3 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">Pertanyaan yang <span className="text-amber-500">Sering Diajukan</span></h3>
                        <p className="text-lg text-slate-500">Temukan jawaban untuk pertanyaan umum seputar fitur dan layanan pendukung JagoKasir.</p>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <details key={idx} className="group bg-white border border-slate-100 rounded-2xl open:bg-indigo-50/50 open:border-indigo-100 transition-colors shadow-sm">
                                <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-slate-800 text-lg select-none list-none [&::-webkit-details-marker]:hidden">
                                    {faq.question}
                                    <span className="bg-[#f5f5f5] group-open:bg-white text-indigo-600 p-2 rounded-full shrink-0 shadow-sm border border-slate-100 transition-transform duration-300 flex items-center justify-center">
                                        <ChevronDown size={20} className="group-open:rotate-180 transition-transform duration-300" />
                                    </span>
                                </summary>
                                <div className="px-6 pb-6 text-slate-600 font-medium leading-relaxed">
                                    <div className="w-full h-px bg-slate-100 mb-4 rounded-full"></div>
                                    {faq.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA Section ────────────────────────────────────────────────── */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">Siap Memodernisasi Bisnis Anda?</h2>
                    <p className="text-xl text-slate-500 mb-10">Daftar sekarang dan nikmati full akses selama 14 hari tanpa biaya komitmen.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/50 active:scale-95"
                        >
                            Daftar Gratis Sekarang
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto bg-white text-slate-800 px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all border border-slate-200 active:scale-95 shadow-sm"
                        >
                            Masuk ke Akun
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─────────────────────────────────────────────────────── */}
            <PublicFooter />
        </div>
    );
}
