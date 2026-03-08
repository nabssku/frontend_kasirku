import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../app/store/useAuthStore';
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Package,
    LogOut,
    Menu,
    X,
    Shield,
    ExternalLink,
    Receipt,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

interface NavItem {
    name: string;
    path: string;
    icon: React.ElementType;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: 'Main',
        items: [
            { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Management',
        items: [
            { name: 'Tenants', path: '/super-admin/tenants', icon: Building2 },
            { name: 'Users', path: '/super-admin/users', icon: Users },
        ],
    },
    {
        label: 'Platform',
        items: [
            { name: 'Subscriptions', path: '/super-admin/subscriptions', icon: CreditCard },
            { name: 'Plans', path: '/super-admin/plans', icon: Package },
            { name: 'Orders', path: '/super-admin/orders', icon: Receipt },
            { name: 'App Versions', path: '/super-admin/app-versions', icon: ExternalLink },
        ],
    },
];

export const SuperAdminLayout = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + '/');

    // Get current page name for header
    const currentPageName = useMemo(() => {
        for (const group of navGroups) {
            const item = group.items.find(i => isActive(i.path));
            if (item) return item.name;
        }
        return 'Overview';
    }, [location.pathname]);

    const SidebarContent = () => (
        <>
            {/* Sidebar Header */}
            <div className="p-4 flex items-center justify-between h-16 border-b border-slate-800 shrink-0">
                <span className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Shield size={24} className="text-amber-500 fill-amber-500/10" />
                    {isSidebarOpen ? (
                        <span>Super <span className="text-amber-500">Admin</span></span>
                    ) : (
                        <span className="text-amber-500">S.A</span>
                    )}
                </span>

                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                >
                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Navigation Body */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-hide">
                {navGroups.map((group) => (
                    <div key={group.label} className="space-y-2">
                        {isSidebarOpen && (
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3">
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    title={!isSidebarOpen ? item.name : undefined}
                                    className={`
                                        group flex items-center p-2.5 rounded-xl transition-all duration-200
                                        ${isActive(item.path)
                                            ? 'bg-amber-500/10 text-amber-500 shadow-sm shadow-amber-500/5'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                                        ${!isSidebarOpen ? 'justify-center mx-1' : ''}
                                    `}
                                >
                                    <item.icon
                                        size={20}
                                        className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive(item.path) ? 'text-amber-500' : 'text-slate-500'}`}
                                    />
                                    {isSidebarOpen && (
                                        <span className="ml-3 font-medium text-sm">{item.name}</span>
                                    )}
                                    {isSidebarOpen && isActive(item.path) && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Return to Site Shortcut */}
                <div className="pt-4 mt-4 border-t border-slate-800/50">
                    <Link
                        to="/"
                        className={`
                            flex items-center p-2.5 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all duration-200
                            ${!isSidebarOpen ? 'justify-center mx-1' : ''}
                        `}
                    >
                        <ExternalLink size={20} className="text-slate-500 shrink-0" />
                        {isSidebarOpen && (
                            <span className="ml-3 font-medium text-sm">Return to Site</span>
                        )}
                    </Link>
                </div>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                {isSidebarOpen && (
                    <div className="mb-4 group cursor-default">
                        <div className="flex items-center p-2 rounded-xl bg-slate-800/30 border border-slate-700/30">
                            <div className="w-9 h-9 rounded-full bg-amber-500/20 ring-1 ring-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="ml-3 truncate">
                                <p className="text-sm font-semibold text-slate-100 truncate">{user?.name}</p>
                                <p className="text-[10px] text-amber-500/70 font-bold uppercase tracking-wider">Super Administrator</p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className={`
                        w-full flex items-center p-2.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 text-sm font-medium
                        ${!isSidebarOpen ? 'justify-center' : ''}
                    `}
                >
                    <LogOut size={20} className="shrink-0" />
                    {isSidebarOpen && <span className="ml-3">Logout Session</span>}
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-full h-full bg-slate-950 flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className={`
                hidden lg:flex flex-col flex-shrink-0 bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'w-64' : 'w-20'}
            `}>
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar (Drawer) */}
            <aside className={`
                fixed inset-y-0 left-0 z-[60] w-72 bg-slate-900 border-r border-slate-800 transform lg:hidden transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                flex flex-col
                pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]
            `}>
                <SidebarContent />
            </aside>

            {/* Content Container */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Global Header */}
                <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 flex items-center px-4 lg:px-8 shrink-0 backdrop-blur-md sticky top-0 z-40">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mr-4"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2">
                        <span className="text-xs font-bold text-amber-500/70 uppercase tracking-widest lg:hidden">
                            Super Admin
                        </span>
                        <h2 className="text-lg font-bold text-white tracking-tight">
                            {currentPageName}
                        </h2>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs text-slate-500 font-medium">JagoKasir Platform</span>
                            <span className="text-[10px] text-emerald-500 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20 mt-0.5">
                                Systems Active
                            </span>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
