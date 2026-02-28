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
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Network } from '@capacitor/network';
import type { ConnectionStatus } from '@capacitor/network';

interface NavItem {
    name: string;
    path: string;
    icon: React.ElementType;
    roles?: UserRole[];
    children?: Omit<NavItem, 'icon'>[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

// ─── Role groups ──────────────────────────────────────────────────────────────
const ADMIN_ROLES: UserRole[] = ['super_admin', 'owner', 'admin'];
const OPERATIONAL_ROLES: UserRole[] = ['super_admin', 'admin', 'cashier']; // Owner focus on reports
const KITCHEN_ROLES: UserRole[] = ['super_admin', 'admin', 'kitchen', 'cashier'];
const OWNER_ROLES: UserRole[] = ['super_admin', 'owner'];
const POS_ROLES: UserRole[] = ['super_admin', 'cashier']; // Terminal POS focus on cashiers
const CONFIG_ROLES: UserRole[] = ['super_admin', 'admin']; // Operational config

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
            {
                name: 'Pengeluaran',
                path: '/expenses',
                icon: Receipt,
                roles: OWNER_ROLES,
                children: [
                    { name: 'Daftar Pengeluaran', path: '/expenses' },
                    { name: 'Kategori Pengeluaran', path: '/expenses/categories' },
                ]
            },
            { name: 'Meja', path: '/tables', icon: Table2, roles: OPERATIONAL_ROLES },
            { name: 'Dapur (KDS)', path: '/kitchen', icon: ChefHat, roles: KITCHEN_ROLES },
            { name: 'Shift', path: '/shifts', icon: Clock, roles: OPERATIONAL_ROLES },
        ],
    },
    {
        label: 'Produk & Katalog',
        items: [
            {
                name: 'Katalog',
                path: '/products',
                icon: Package,
                roles: ADMIN_ROLES,
                children: [
                    { name: 'Data Produk', path: '/products' },
                    { name: 'Kategori Produk', path: '/categories' },
                    { name: 'Modifiers / Ekstra', path: '/modifiers' },
                    { name: 'Bahan Baku', path: '/ingredients' },
                ]
            },
            { name: 'Pelanggan', path: '/customers', icon: Users, roles: ADMIN_ROLES },
        ],
    },
    {
        label: 'Manajemen & Laporan',
        items: [
            { name: 'Outlet', path: '/outlets', icon: Store, roles: OWNER_ROLES },
            { name: 'Pengguna', path: '/users', icon: UserCog, roles: OWNER_ROLES },
            { name: 'Laporan', path: '/reports', icon: BarChart2, roles: ADMIN_ROLES },
        ],
    },
    {
        label: 'Pengaturan',
        items: [
            { name: 'Langganan', path: '/subscription', icon: CreditCard, roles: OWNER_ROLES },
            { name: 'Printer', path: '/settings/printer', icon: Printer, roles: CONFIG_ROLES },
            { name: 'Pengaturan Struk', path: '/settings/receipt', icon: FileText, roles: CONFIG_ROLES },
            { name: 'Audit Log', path: '/settings/audit-log', icon: ShieldAlert, roles: OWNER_ROLES },
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

    // Filter nav groups based on user roles
    const filteredNavGroups = useMemo(() => {
        return allNavGroups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => {
                    // If no role restriction, show to all
                    if (!item.roles) return true;
                    // Show if user has at least one matching role
                    return item.roles.some((r) => userRoleSlugs.includes(r));
                }),
            }))
            .filter((group) => group.items.length > 0); // Hide empty groups
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
                <div className="p-4 flex items-center justify-between h-16 border-b border-slate-100">
                    {isSidebarOpen && (
                        <span className="text-xl font-bold text-slate-900 tracking-tight">
                            JagoKasir <span className="text-indigo-600">POS</span>
                        </span>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 ml-auto"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
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

                                return (
                                    <div key={item.name} className="space-y-1">
                                        {hasChildren ? (
                                            <button
                                                onClick={() => toggleExpand(item.name)}
                                                className={`
                                                    w-full flex items-center p-2.5 rounded-xl transition-all duration-200 group
                                                    ${active ? 'bg-indigo-50/50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                                    ${!isSidebarOpen ? 'justify-center' : ''}
                                                `}
                                            >
                                                <item.icon
                                                    size={20}
                                                    className={active ? 'text-indigo-600 shrink-0' : 'text-slate-400 shrink-0 group-hover:text-slate-600'}
                                                />
                                                {isSidebarOpen && (
                                                    <>
                                                        <span className="ml-3 font-semibold text-sm flex-1 text-left">{item.name}</span>
                                                        {isExpanded ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <Link
                                                to={item.path}
                                                title={!isSidebarOpen ? item.name : undefined}
                                                className={`
                                                    flex items-center p-2.5 rounded-xl transition-all duration-200 group
                                                    ${isActive(item.path)
                                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                                    ${!isSidebarOpen ? 'justify-center' : ''}
                                                `}
                                            >
                                                <item.icon
                                                    size={20}
                                                    className={isActive(item.path) ? 'text-indigo-600 shrink-0' : 'text-slate-400 shrink-0 group-hover:text-slate-600'}
                                                />
                                                {isSidebarOpen && (
                                                    <div className="ml-3 flex-1 flex items-center justify-between">
                                                        <span className="font-semibold text-sm">{item.name}</span>
                                                        {item.name === 'Audit Log' && (
                                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase">PREMIUM</span>
                                                        )}
                                                    </div>
                                                )}
                                            </Link>
                                        )}

                                        {/* Sub-items */}
                                        {hasChildren && isExpanded && isSidebarOpen && (
                                            <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200">
                                                {item.children?.map((child) => (
                                                    <Link
                                                        key={child.path}
                                                        to={child.path}
                                                        className={`
                                                            flex items-center p-2 rounded-lg text-xs font-medium transition-all duration-200
                                                            ${isActive(child.path)
                                                                ? 'text-indigo-700 bg-indigo-50/50'
                                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                                                        `}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                ))}
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
                        onClick={() => setIsMobileMenuOpen(true)}
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
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
