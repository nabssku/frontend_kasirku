import { Link } from 'react-router-dom';

export const PublicFooter = () => {
    return (
        <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <img src="/JagoKasir.png" alt="JagoKasir Logo" className="w-8 h-8 object-contain opacity-90" />
                            <span className="text-xl font-bold text-white tracking-tight">
                                JagoKasir
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-sm">
                            Solusi manajemen bisnis dan kasir cloud terlengkap di Indonesia. Memberdayakan UMKM dengan teknologi mutakhir untuk efisiensi operasional.
                        </p>
                    </div>
                    <div>
                        <h5 className="text-white font-bold mb-6">Produk</h5>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link to="/#features" className="hover:text-white transition-colors">POS Terminal</Link></li>
                            <li><Link to="/#features" className="hover:text-white transition-colors">Inventori</Link></li>
                            <li><Link to="/#features" className="hover:text-white transition-colors">Laporan</Link></li>
                            <li><Link to="/#pricing" className="hover:text-white transition-colors">Harga</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-white font-bold mb-6">Dukungan</h5>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link to="/help-center" className="hover:text-white transition-colors">Pusat Bantuan</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">Kontak</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Kebijakan Privasi</Link></li>
                            <li><Link to="/terms-conditions" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium">
                    <p>&copy; {new Date().getFullYear()} JagoKasir POS.</p>
                    <div className="flex gap-6">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">YouTube</a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
