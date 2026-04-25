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
    MessageSquare,
    Tag,
    AlertTriangle,
    ArrowRight,
    Crown,
    UserSquare2,
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
import { NetworkStatusIndicator } from '../../features/shared/components/NetworkStatusIndicator';
import { useProductSync } from '../../hooks/useProductSync';
import { PinPad } from '../common/PinPad';
import api from '../../lib/axios';
import { getDefaultPage } from '../../lib/auth';
import type { AuthResponse } from '../../types';

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
            { name: 'Payment Gateway', path: '/settings/payment', icon: CreditCard, roles: OWNER_ROLES },
            { name: 'Metode Pembayaran', path: '/settings/payment-methods', icon: CreditCard, roles: ADMIN_ONLY_ROLES, feature: 'max_payment_methods' },
            { name: 'Audit Log', path: '/settings/audit-log', icon: ShieldAlert, roles: OWNER_ROLES, feature: 'audit_log' },
        ],
    },
    {
        label: 'Bantuan',
        items: [
            { name: 'Support / Tiket', path: '/support', icon: MessageSquare, roles: [...ADMIN_ROLES, 'cashier'] },
            { name: 'Manajemen Diskon', path: '/super-admin/discounts', icon: Tag, roles: ['super_admin'] },
            { name: 'Manajemen Tiket', path: '/super-admin/tickets', icon: MessageSquare, roles: ['super_admin'] },
        ],
    },
];

export const DashboardLayout = () => {
    const { user, isOnline, logout } = useAuthStore();
    const { syncImages, isSyncing } = useProductSync();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [networkStatus, setNetworkStatus] = useState<ConnectionStatus | null>(null);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [showSwitchUser, setShowSwitchUser] = useState(false);
    const [switchEmail, setSwitchEmail] = useState('');
    const [showSwitchPinPad, setShowSwitchPinPad] = useState(false);
    const [switchError, setSwitchError] = useState('');
    const [switchStaffList, setSwitchStaffList] = useState<any[]>([]);
    const [selectedSwitchUser, setSelectedSwitchUser] = useState<any>(null);
    const [isLoadingSwitchStaff, setIsLoadingSwitchStaff] = useState(false);
    const { isRetail } = useBusinessType();
    const { setAuth } = useAuthStore();

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
        return features.some((f: PlanFeature) => f.feature_key === featureKey && (f.feature_value === 'true' || !isNaN(Number(f.feature_value))));
    };

    // Subscription status check
    const subStatus = useMemo(() => {
        return subscriptionData?.subscription?.status || (user as any)?.tenant?.status_subscription || (user as any)?.tenant?.status;
    }, [subscriptionData, user]);

    const isSubscriptionBlocked = useMemo(() => {
        return subStatus === 'expired' || subStatus === 'cancelled' || subStatus === 'canceled';
    }, [subStatus]);

    const isTrial = useMemo(() => subStatus === 'trial', [subStatus]);
    const daysRemaining = useMemo(() => subscriptionData?.subscription?.days_remaining ?? 0, [subscriptionData]);

    // Network status listener
    useEffect(() => {
        const initNetwork = async () => {
            const status = await Network.getStatus();
            setNetworkStatus(status);
        };

        initNetwork();

        const listener = Network.addListener('networkStatusChange', (status) => {
            setNetworkStatus(status);

            // Trigger image sync when coming back online
            if (status.connected) {
                syncImages({ silent: true });
            }
        });

        return () => {
            listener.then(l => l.remove());
        };
    }, [syncImages]);

    // Initial sync on mount if online
    useEffect(() => {
        if (isOnline) {
            syncImages({ silent: true });
        }
    }, []); // Only once on mount

    const handleNavigate = (path: string) => {
        setIsMobileMenuOpen(false);
        setIsSidebarOpen(false);

        // Use requestAnimationFrame to ensure the sidebar closes before navigating
        // which helps preventing the "stuck blur" issue on Android
        requestAnimationFrame(() => {
            navigate(path);
        });
    };

    const fetchSwitchStaff = async () => {
        if (!user?.tenant_id) return;
        setIsLoadingSwitchStaff(true);
        try {
            const { data } = await api.get(`/public/tenants/${user.tenant_id}/staff`);
            setSwitchStaffList(data.data);
        } catch (err) {
            console.error('Failed to fetch staff list', err);
        } finally {
            setIsLoadingSwitchStaff(false);
        }
    };

    const handleLogout = async () => {
        setIsMobileMenuOpen(false);
        setIsSidebarOpen(false);
        await logout();
        navigate('/login');
    };

    const onSwitchPinComplete = async (pin: string) => {
        setSwitchError('');
        try {
            const { data } = await api.post<{ data: AuthResponse }>('/auth/login-pin', {
                email: selectedSwitchUser?.email || switchEmail,
                pin: pin
            });
            setAuth(data.data);
            setShowSwitchUser(false);
            setShowSwitchPinPad(false);
            setSwitchEmail('');
            toast.success(`Berhasil beralih ke akun ${data.data.user.name}`);

            // Redirect to their default page
            const redirect = getDefaultPage(data.data.user.roles);
            navigate(redirect, { replace: true });
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'PIN salah atau akun tidak ditemukan.';
            setSwitchError(msg);
        }
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

    const isChatPage = useMemo(() => {
        return location.pathname.startsWith('/support') || location.pathname.startsWith('/super-admin/tickets');
    }, [location.pathname]);

    const showAiButton = useMemo(() => {
        if (isChatPage) return false;
        return userRoleSlugs.some(role => ADMIN_ROLES.includes(role));
    }, [userRoleSlugs, isChatPage]);

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
        <div className="flex-1 bg-slate-50 flex overflow-hidden">
            <NetworkStatusIndicator isSyncing={isSyncing} />
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
                pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]
                lg:pt-0 lg:pb-0 lg:pl-0
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
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleNavigate(item.path);
                                                }}
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
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleNavigate(child.path);
                                                            }}
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
                        onClick={() => {
                            setSwitchEmail('');
                            setSwitchError('');
                            setSelectedSwitchUser(null);
                            setShowSwitchPinPad(false);
                            setShowSwitchUser(true);
                            fetchSwitchStaff();
                        }}
                        className={`
                            w-full flex items-center p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors text-sm font-medium mb-1
                            ${!isSidebarOpen ? 'justify-center' : ''}
                        `}
                    >
                        <UserSquare2 size={20} />
                        {isSidebarOpen && <span className="ml-3">Pindah Akun</span>}
                    </button>
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
            <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 shrink-0 safe-padding-x">
                    <button
                        onClick={() => {
                            if (window.innerWidth < 1024) {
                                setIsMobileMenuOpen(true);
                                setIsSidebarOpen(true);
                            } else {
                                setIsSidebarOpen(!isSidebarOpen);
                            }
                        }}
                        className="p-2 -ml-2 mr-4 rounded-lg hover:bg-slate-100 text-slate-500"
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
                <div className={`flex-1 overflow-y-auto safe-padding-x pb-[var(--safe-bottom)] ${location.pathname === '/pos' ? '' : 'p-4 md:p-8'}`}>
                    {isOwner && isSubscriptionBlocked && !location.pathname.startsWith('/subscription') && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h4 className="text-red-900 font-bold text-sm">Paket Berlangganan Berakhir</h4>
                                    <p className="text-red-700 text-xs font-medium">Layanan Jagokasir Anda saat ini terbatas. Silakan perbarui paket Anda untuk memulihkan akses penuh.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/subscription')}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-red-200 active:scale-95 shrink-0"
                            >
                                Perbarui Sekarang
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    )}

                    {isOwner && isTrial && !location.pathname.startsWith('/subscription') && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                                    <Crown size={24} />
                                </div>
                                <div>
                                    <h4 className="text-amber-900 font-bold text-sm">Masa Uji Coba (Trial)</h4>
                                    <p className="text-amber-700 text-xs font-medium">
                                        Anda memiliki <span className="font-bold">{daysRemaining} hari</span> lagi untuk menikmati fitur premium Jagokasir secara gratis.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/subscription')}
                                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-200 active:scale-95 shrink-0"
                            >
                                Langganan Sekarang
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                    <Outlet />
                </div>

                {/* JagoKasir AI Floating Button */}
                {showAiButton && (
                    <>
                        <button
                            onClick={() => setIsAiOpen(!isAiOpen)}
                            className={`
                                fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ring-4 ring-white z-50
                                mb-[var(--safe-bottom)] mr-[var(--safe-right)]
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

                {/* --- Switch User Modal --- */}
                {showSwitchUser && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center z-[100] px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] overflow-y-auto">
                        {!showSwitchPinPad ? (
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in-95 duration-200 my-auto">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <UserSquare2 size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">Pindah Akun</h2>
                                    <p className="text-slate-500 text-sm mt-1">Pilih staf untuk melanjutkan</p>
                                </div>

                                <div className="space-y-4">
                                    {isLoadingSwitchStaff ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        </div>
                                    ) : switchStaffList.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {switchStaffList
                                                .filter(staf => staf.id !== user?.id)
                                                .map((staf) => (
                                                    <button
                                                        key={staf.id}
                                                        onClick={() => {
                                                            setSelectedSwitchUser(staf);
                                                            setShowSwitchPinPad(true);
                                                        }}
                                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                            {staf.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[10px] font-bold text-slate-900 truncate w-full max-w-[60px]">{staf.name}</p>
                                                            <p className="text-[8px] text-slate-400 uppercase font-black">{staf.role}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Staf</label>
                                                <input
                                                    type="email"
                                                    value={switchEmail}
                                                    onChange={e => setSwitchEmail(e.target.value)}
                                                    className="w-full mt-1.5 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-4 focus:ring-indigo-100 border-indigo-100 outline-none transition-all"
                                                    placeholder="staf@toko.com"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowSwitchUser(false)}
                                            className="flex-1 px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                            Batal
                                        </button>
                                        {!switchStaffList.length && (
                                            <button
                                                onClick={() => switchEmail && setShowSwitchPinPad(true)}
                                                disabled={!switchEmail}
                                                className="flex-[1.5] px-4 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                Lanjut ke PIN
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in zoom-in-95 duration-200 relative my-auto">
                                <PinPad
                                    onComplete={onSwitchPinComplete}
                                    onCancel={() => {
                                        setShowSwitchUser(false);
                                        setShowSwitchPinPad(false);
                                    }}
                                        title={selectedSwitchUser ? selectedSwitchUser.name : "Pindah Akun"}
                                        description={selectedSwitchUser ? `Masukkan PIN untuk ${selectedSwitchUser.role}` : `Masukkan PIN untuk ${switchEmail}`}
                                        error={switchError}
                                    />
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div >
    );
};
