import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../app/store/useAuthStore';
import { getDefaultPage } from '../../lib/auth';

export const PublicNavbar = () => {
    const location = useLocation();
    const { isAuthenticated, user } = useAuthStore();
    const dashboardLink = getDefaultPage(user?.roles);
    const isHome = location.pathname === '/';

    const scrollToSection = (id: string) => {
        if (id === 'home') {
            const container = document.querySelector('.overflow-y-auto');
            if (container) {
                container.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }

        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth'
            });
        }
    };

    const navLinks = [
        { name: 'Home', href: '/', id: 'home' },
        { name: 'Features', href: '/#features', id: 'features' },
        { name: 'Pricing', href: '/#pricing', id: 'pricing' },
        { name: 'Testimonials', href: '/#testimonials', id: 'testimonials' },
        { name: 'FAQ', href: '/#faq', id: 'faq' },
    ];

    const subLinks = [
        { name: 'Help', href: '/help-center' },
        { name: 'Contact', href: '/contact' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/JagoKasir.png" alt="JagoKasir Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                            JagoKasir
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-slate-500">
                        {navLinks.map((link) => (
                            <div key={link.name} className="relative">
                                {isHome ? (
                                    <button
                                        onClick={() => scrollToSection(link.id)}
                                        className={`cursor-pointer hover:text-slate-900 transition-colors ${link.id === 'home' ? 'text-slate-900 font-bold' : ''}`}
                                    >
                                        {link.name}
                                    </button>
                                ) : (
                                    <Link to={link.href} className="hover:text-slate-900 transition-colors">
                                        {link.name}
                                    </Link>
                                )}
                                {isHome && link.id === 'home' && (
                                    <div className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-indigo-600 rounded-full"></div>
                                )}
                            </div>
                        ))}
                        
                        {/* Sublinks */}
                        <div className="h-4 w-px bg-slate-200 mx-2" />
                        {subLinks.map((link) => (
                            <Link 
                                key={link.name}
                                to={link.href} 
                                className={`${location.pathname === link.href ? 'text-slate-900 font-bold' : 'hover:text-slate-900 transition-colors'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <Link
                                to={dashboardLink}
                                className="bg-amber-400 text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-amber-500 transition-colors shadow-sm"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                to="/register"
                                className="bg-amber-400 text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-amber-500 transition-colors shadow-sm"
                            >
                                Coba Gratis
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
