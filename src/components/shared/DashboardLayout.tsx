import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../app/store/useAuthStore';
import type { UserRole } from '../../types';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    LogOut,
    Menu,
    X,
    CreditCard,
    History,
    Table2,
    ChefHat,
    Clock,
    Store,
    BarChart2,
    UserCog,
    Printer,
    Receipt,
    FileText,
    ChevronDown,
    ChevronRight,
    Wifi,
    WifiOff,
    ShieldAlert,
    Info,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Network } from '@capacitor/network';
import type { ConnectionStatus } from '@capacitor/network';
import { AiChat } from '../../features/ai/components/AiChat';
import { Sparkles } from 'lucide-react';
import { useBusinessType } from '../../hooks/useBusinessType';
import { useCurrentSubscription } from '../../hooks/useSubscription';
import type { PlanFeature } from '../../types';
import { useBluetoothPrint } from '../../hooks/useBluetoothPrint';
import { usePrinters } from '../../hooks/usePrinters';
import { toast } from 'sonner';

interface NavItem {
    name: string;
    path: string;
    icon: React.ElementType;
    roles?: UserRole[];
    feature?: string;
    children?: Omit<NavItem, 'icon'>[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

// ─── Role groups ──────────────────────────────────────────────────────────────
const ADMIN_ROLES: UserRole[] = ['super_admin', 'owner', 'admin'];
const ADMIN_ONLY_ROLES: UserRole[] = ['super_admin', 'admin']; // Explicitly excludes owner
const OPERATIONAL_ROLES: UserRole[] = ['super_admin', 'admin', 'cashier']; // Non-owner operational staff
const KITCHEN_ROLES: UserRole[] = ['super_admin', 'admin', 'kitchen', 'cashier'];
const OWNER_ROLES: UserRole[] = ['super_admin', 'owner'];
const POS_ROLES: UserRole[] = ['super_admin', 'cashier']; // Terminal POS focus on cashiers
const CONFIG_ROLES: UserRole[] = ['super_admin', 'admin', 'cashier']; // Operational config

const allNavGroups: NavGroup[] = [
    {
        label: 'Utama',
        items: [
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ADMIN_ROLES },
            { name: 'Terminal POS', path: '/pos', icon: ShoppingCart, roles: POS_ROLES },
        ],
    },
    {
        label: 'Operasional',
        items: [
            { name: 'Transaksi', path: '/transactions', icon: History, roles: ADMIN_ROLES },
            { name: 'Riwayat Hari Ini', path: '/transactions/daily', icon: History, roles: OPERATIONAL_ROLES },
            {
                name: 'Pengeluaran',
                path: '/expenses',
                icon: Receipt,
                roles: ADMIN_ONLY_ROLES,
                feature: 'expenses',
                children: [
                    { name: 'Daftar Pengeluaran', path: '/expenses' },
                    { name: 'Kategori Pengeluaran', path: '/expenses/categories' },
                ]
            },
            { name: 'Meja', path: '/tables', icon: Table2, roles: OPERATIONAL_ROLES },
            { name: 'Dapur (KDS)', path: '/kitchen', icon: ChefHat, roles: KITCHEN_ROLES, feature: 'kitchen_display' },
            { name: 'Shift', path: '/shifts', icon: Clock, roles: OPERATIONAL_ROLES, feature: 'shift_management' },
        ],
    },
    {
        label: 'Produk & Katalog',
        items: [
            {
                name: 'Katalog',
                path: '/products',
                icon: Package,
                roles: ADMIN_ONLY_ROLES,
                children: [
                    { name: 'Data Produk', path: '/products' },
                    { name: 'Kategori Produk', path: '/categories' },
                    { name: 'Modifiers / Ekstra', path: '/modifiers', feature: 'modifiers' },
                    { name: 'Bahan Baku', path: '/ingredients', feature: 'inventory_basic' },
                ]
            },
            { name: 'Pelanggan', path: '/customers', icon: Users, roles: ADMIN_ONLY_ROLES, feature: 'customers' },
        ],
    },
    {
        label: 'Manajemen & Laporan',
        items: [
            { name: 'Outlet', path: '/outlets', icon: Store, roles: OWNER_ROLES },
            { name: 'Pengguna', path: '/users', icon: UserCog, roles: OWNER_ROLES },
            {
                name: 'Laporan',
                path: '/reports',
                icon: BarChart2,
                roles: ADMIN_ROLES,
                feature: 'advanced_reports',
                children: [
                    { name: 'Ringkasan Laporan', path: '/reports' },
                    { name: 'Laporan Pendapatan', path: '/reports/income' },
                    { name: 'Laporan Pengeluaran', path: '/reports/expense' },
                    { name: 'Laporan Laba Rugi', path: '/reports/profit-loss' },
                ]
            },
        ],
    },
    {
        label: 'Pengaturan',
        items: [
            { name: 'Langganan', path: '/subscription', icon: CreditCard, roles: OWNER_ROLES },
            { name: 'Printer', path: '/settings/printer', icon: Printer, roles: CONFIG_ROLES },
            { name: 'Pengaturan Struk', path: '/settings/receipt', icon: FileText, roles: CONFIG_ROLES },
            { name: 'Informasi Aplikasi', path: '/settings/info', icon: Info, roles: [...ADMIN_ROLES, 'cashier'] },
            { name: 'Audit Log', path: '/settings/audit-log', icon: ShieldAlert, roles: OWNER_ROLES, feature: 'audit_log' },
        ],
    },
];

export const DashboardLayout = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [networkStatus, setNetworkStatus] = useState<ConnectionStatus | null>(null);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const { isRetail } = useBusinessType();

    const { isConnected: isPrinterConnected, isConnecting: isPrinterConnecting, autoConnect: autoConnectPrinter } = useBluetoothPrint();
    const { data: printers = [] } = usePrinters();

    const handleReconnectPrinters = async () => {
        if (isPrinterConnecting) return;
        try {
            toast.info('Menghubungkan ulang printer...');
            await autoConnectPrinter(printers);
        } catch (err) {
            toast.error('Gagal menghubungkan printer.');
        }
    };

    // Plan features
    const { data: subscriptionData } = useCurrentSubscription();

    const hasFeature = (featureKey: string | undefined): boolean => {
        if (!featureKey) return true;
        if (isSuperAdmin) return true;

        const features = subscriptionData?.subscription?.plan?.features || [];
        return features.some((f: PlanFeature) => f.feature_key === featureKey && f.feature_value === 'true');
    };

    // Network status listener
    useEffect(() => {
        const initNetwork = async () => {
            const status = await Network.getStatus();
            setNetworkStatus(status);
        };

        initNetwork();

        const listener = Network.addListener('networkStatusChange', (status) => {
            setNetworkStatus(status);
        });

        return () => {
            listener.then(l => l.remove());
        };
    }, []);

    const handleLogout = async () => {
        setIsMobileMenuOpen(false);
        await logout();
        navigate('/login');
    };

    // Auto-expand parent if child is active
    useEffect(() => {
        allNavGroups.forEach(group => {
            group.items.forEach(item => {
                if (item.children) {
                    const hasActiveChild = item.children.some(child => location.pathname === child.path);
                    if (hasActiveChild && !expandedItems.includes(item.name)) {
                        setExpandedItems(prev => [...prev, item.name]);
                    }
                }
            });
        });
    }, [location.pathname]);

    // Get current user's role slugs
    const userRoleSlugs = useMemo(
        () => user?.roles?.map((r) => r.slug as UserRole) || [],
        [user?.roles]
    );

    // Identify if user is owner or super admin
    const isOwner = useMemo(
        () => userRoleSlugs.includes('owner') || userRoleSlugs.includes('super_admin'),
        [userRoleSlugs]
    );

    const isSuperAdmin = useMemo(
        () => userRoleSlugs.includes('super_admin'),
        [userRoleSlugs]
    );

    // Filter nav groups based on user roles and business type
    const filteredNavGroups = useMemo(() => {
        return allNavGroups
            .map((group) => ({
                ...group,
                items: group.items
                    .filter((item) => {
                        // Apply business type filtering: Hide FNB-only items in Retail stores
                        if (isRetail && !isSuperAdmin) {
                            if (item.path === '/tables' || item.path === '/kitchen') {
                                return false;
                            }
                        }

                        // If no role restriction, show to all
                        if (!item.roles) return true;
                        // Show if user has at least one matching role
                        return item.roles.some((r) => userRoleSlugs.includes(r));
                    })
                    .map(item => ({
                        ...item,
                        // Filter children if any
                        children: item.children ? item.children.filter(child => {
                            if (isRetail && !isSuperAdmin) {
                                // Hide FNB-only sub-items
                                if (child.path === '/modifiers' || child.path === '/ingredients') {
                                    return false;
                                }
                            }
                            return true;
                        }) : undefined
                    }))
                    .filter(() => {
                        return true;
                    })
            }))
            .filter((group) => group.items.length > 0);
    }, [userRoleSlugs, isRetail, isOwner, isSuperAdmin]);

    const showAiButton = useMemo(() => {
        return userRoleSlugs.some(role => ADMIN_ROLES.includes(role));
    }, [userRoleSlugs]);

    const isActive = (path: string) =>
        location.pathname === path;

    const isParentActive = (item: NavItem) => {
        if (isActive(item.path)) return true;
        return item.children?.some(child => isActive(child.path)) ?? false;
    };

    const toggleExpand = (name: string) => {
        if (!isSidebarOpen) {
            setIsSidebarOpen(true);
            setExpandedItems([name]);
            return;
        }
        setExpandedItems(prev =>
            prev.includes(name)
                ? prev.filter(i => i !== name)
                : [...prev, name]
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden">
            {/* Sidebar Backdrop (Mobile/Tablet) */}
            {(isMobileMenuOpen || (isSidebarOpen && window.innerWidth < 1024)) && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => {
                        setIsSidebarOpen(false);
                        setIsMobileMenuOpen(false);
                    }}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                bg-white border-r border-slate-200 transition-all duration-300
                ${isSidebarOpen ? 'w-64' : 'w-20'}
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                fixed lg:relative inset-y-0 left-0 flex flex-col flex-shrink-0 z-50
            `}>
                {/* Logo */}
                <div className={`p-4 flex items-center h-16 border-b border-slate-100 ${!isSidebarOpen ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center gap-3">
                        <img src="/JagoKasir.png" alt="Logo" className="w-10 h-10 object-contain" />
                        {isSidebarOpen && (
                            <span className="text-xl font-bold text-slate-900 tracking-tight">
                                JagoKasir <span className="text-indigo-600">POS</span>
                            </span>
                        )}
                    </div>
                    {isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 ml-auto"
                        >
                            <X size={20} />
                        </button>
                    )}
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="hidden" // Just for structure, usually handled by clicking the bar or button
                        >
                            <Menu size={20} />
                        </button>
                    )}
                </div>

                {/* Nav Groups */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                    {filteredNavGroups.map((group) => (
                        <div key={group.label} className="mb-2">
                            {isSidebarOpen && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 mb-1">
                                    {group.label}
                                </p>
                            )}
                            {group.items.map((item) => {
                                const hasChildren = item.children && item.children.length > 0;
                                const isExpanded = expandedItems.includes(item.name);
                                const active = isParentActive(item);
                                const locked = !hasFeature(item.feature);

                                return (
                                    <div key={item.name} className="space-y-1">
                                        {hasChildren ? (
                                            <button
                                                onClick={() => toggleExpand(item.name)}
                                                className={`
                                                    w-full flex items-center p-2.5 rounded-xl transition-all duration-200 group
                                                    ${active ? 'bg-indigo-50/50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                                    ${!isSidebarOpen ? 'justify-center' : ''}
                                                    ${locked ? 'opacity-70' : ''}
                                                `}
                                            >
                                                <item.icon
                                                    size={20}
                                                    className={active ? 'text-indigo-600 shrink-0' : 'text-slate-400 shrink-0 group-hover:text-slate-600'}
                                                />
                                                {isSidebarOpen && (
                                                    <>
                                                        <span className="ml-3 font-semibold text-sm flex-1 text-left">{item.name}</span>
                                                        {locked ? (
                                                            <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase ml-2">PREMIUM</span>
                                                        ) : (
                                                            isExpanded ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />
                                                        )}
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <Link
                                                to={item.path}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                title={!isSidebarOpen ? `${item.name}${locked ? ' (Premium)' : ''}` : undefined}
                                                className={`
                                                    flex items-center p-2.5 rounded-xl transition-all duration-200 group
                                                    ${isActive(item.path)
                                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                                    ${!isSidebarOpen ? 'justify-center' : ''}
                                                    ${locked ? 'opacity-70' : ''}
                                                `}
                                            >
                                                <item.icon
                                                    size={20}
                                                    className={isActive(item.path) ? 'text-indigo-600 shrink-0' : 'text-slate-400 shrink-0 group-hover:text-slate-600'}
                                                />
                                                {isSidebarOpen && (
                                                    <div className="ml-3 flex-1 flex items-center justify-between">
                                                        <span className="font-semibold text-sm">{item.name}</span>
                                                        {locked && (
                                                            <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase">PREMIUM</span>
                                                        )}
                                                    </div>
                                                )}
                                            </Link>
                                        )}

                                        {/* Sub-items */}
                                        {hasChildren && isExpanded && isSidebarOpen && !locked && (
                                            <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200">
                                                {item.children?.map((child) => {
                                                    const subLocked = !hasFeature(child.feature);
                                                    return (
                                                        <Link
                                                            key={child.path}
                                                            to={child.path}
                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                            className={`
                                                                flex items-center p-2 rounded-lg text-xs font-medium transition-all duration-200 justify-between
                                                                ${isActive(child.path)
                                                                    ? 'text-indigo-700 bg-indigo-50/50'
                                                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                                                                ${subLocked ? 'opacity-70' : ''}
                                                            `}
                                                        >
                                                            <span>{child.name}</span>
                                                            {subLocked && (
                                                                <span className="text-[7px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded font-bold uppercase ml-2">PREMIUM</span>
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-100">
                    {isSidebarOpen && (
                        <div className="mb-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                Masuk sebagai
                            </p>
                            <div className="flex items-center px-1 mt-1.5">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="ml-2.5 truncate">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{user?.roles?.[0]?.name ?? user?.email}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`
              w-full flex items-center p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium
              ${!isSidebarOpen ? 'justify-center' : ''}
            `}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="ml-3">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 shrink-0">
                    <button
                        onClick={() => {
                            setIsMobileMenuOpen(true);
                            setIsSidebarOpen(true);
                        }}
                        className="p-2 -ml-2 mr-4 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden"
                    >
                        <Menu size={24} />
                    </button>
                    <h2 className="text-sm md:text-base font-semibold text-slate-900 capitalize truncate">
                        {location.pathname.split('/').filter(Boolean).join(' / ') || 'Dashboard'}
                    </h2>

                    <div className="ml-auto flex items-center gap-4">
                        {networkStatus && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${networkStatus.connected
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-red-50 text-red-600 border-red-100 animate-pulse'
                                }`}>
                                {networkStatus.connected ? <Wifi size={14} /> : <WifiOff size={14} />}
                                <span className="hidden sm:inline">
                                    {networkStatus.connected ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        )}

                        <button
                            onClick={handleReconnectPrinters}
                            disabled={isPrinterConnecting}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isPrinterConnected
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 active:scale-95'
                                }`}
                        >
                            <Printer size={14} className={isPrinterConnecting ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">
                                {isPrinterConnecting ? 'Connecting...' : isPrinterConnected ? 'Printer Ready' : 'Printer Off'}
                            </span>
                        </button>

                        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-100">
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">{user?.roles?.[0]?.name}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>
                <div className={`flex-1 overflow-y-auto ${location.pathname === '/pos' ? '' : 'p-4 md:p-8'}`}>
                    <Outlet />
                </div>

                {/* JagoKasir AI Floating Button */}
                {showAiButton && (
                    <>
                        <button
                            onClick={() => setIsAiOpen(!isAiOpen)}
                            className={`
                                fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ring-4 ring-white z-50
                                ${isAiOpen
                                    ? 'bg-red-500 hover:bg-red-600 rotate-90'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-110 active:scale-95'}
                            `}
                        >
                            {isAiOpen ? (
                                <X className="text-white" size={24} />
                            ) : (
                                <Sparkles className="text-white animate-pulse" size={24} />
                            )}

                            {!isAiOpen && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white"></span>
                                </span>
                            )}
                        </button>

                        {isAiOpen && <AiChat onClose={() => setIsAiOpen(false)} />}
                    </>
                )}
            </main>
        </div >
    );
};
