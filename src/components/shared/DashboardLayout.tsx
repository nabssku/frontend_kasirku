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
    Tag,
    Beef,
    Table2,
    ChefHat,
    Clock,
    Store,
    BarChart2,
    UserCog,
    ListTree,
    Printer,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface NavItem {
    name: string;
    path: string;
    icon: React.ElementType;
    roles?: UserRole[]; // If undefined, visible to all authenticated users
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

// ─── Role groups ──────────────────────────────────────────────────────────────
const ADMIN_ROLES: UserRole[] = ['super_admin', 'owner', 'admin'];
const OPERATIONAL_ROLES: UserRole[] = ['super_admin', 'owner', 'admin', 'cashier'];
const KITCHEN_ROLES: UserRole[] = ['super_admin', 'owner', 'admin', 'kitchen', 'cashier'];
const OWNER_ROLES: UserRole[] = ['super_admin', 'owner'];

const allNavGroups: NavGroup[] = [
    {
        label: 'Utama',
        items: [
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ADMIN_ROLES },
            { name: 'Terminal POS', path: '/pos', icon: ShoppingCart, roles: OPERATIONAL_ROLES },
        ],
    },
    {
        label: 'Operasional',
        items: [
            { name: 'Transaksi', path: '/transactions', icon: History, roles: OPERATIONAL_ROLES },
            { name: 'Meja', path: '/tables', icon: Table2, roles: OPERATIONAL_ROLES },
            { name: 'Dapur (KDS)', path: '/kitchen', icon: ChefHat, roles: KITCHEN_ROLES },
            { name: 'Shift', path: '/shifts', icon: Clock, roles: OPERATIONAL_ROLES },
        ],
    },
    {
        label: 'Katalog',
        items: [
            { name: 'Produk', path: '/products', icon: Package, roles: ADMIN_ROLES },
            { name: 'Kategori', path: '/categories', icon: Tag, roles: ADMIN_ROLES },
            { name: 'Modifiers', path: '/modifiers', icon: ListTree, roles: ADMIN_ROLES },
            { name: 'Bahan Baku', path: '/ingredients', icon: Beef, roles: ADMIN_ROLES },
            { name: 'Pelanggan', path: '/customers', icon: Users, roles: ADMIN_ROLES },
        ],
    },
    {
        label: 'Manajemen',
        items: [
            { name: 'Outlet', path: '/outlets', icon: Store, roles: OWNER_ROLES },
            { name: 'Pengguna', path: '/users', icon: UserCog, roles: ADMIN_ROLES },
            { name: 'Laporan', path: '/reports', icon: BarChart2, roles: ADMIN_ROLES },
        ],
    },
    {
        label: 'Pengaturan',
        items: [
            { name: 'Langganan', path: '/subscription', icon: CreditCard, roles: OWNER_ROLES },
            { name: 'Printer', path: '/settings/printer', icon: Printer, roles: ADMIN_ROLES },
        ],
    },
];

export const DashboardLayout = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

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
        location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className={`
        bg-white border-r border-slate-200 transition-all duration-300
        ${isSidebarOpen ? 'w-64' : 'w-20'}
        flex flex-col flex-shrink-0
      `}>
                {/* Logo */}
                <div className="p-4 flex items-center justify-between h-16 border-b border-slate-100">
                    {isSidebarOpen && (
                        <span className="text-xl font-bold text-slate-900 tracking-tight">
                            KasirKu <span className="text-indigo-600">POS</span>
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
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {filteredNavGroups.map((group) => (
                        <div key={group.label} className="mb-2">
                            {isSidebarOpen && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                                    {group.label}
                                </p>
                            )}
                            {group.items.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    title={!isSidebarOpen ? item.name : undefined}
                                    className={`
                    flex items-center p-2.5 rounded-xl transition-colors
                    ${isActive(item.path)
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                    ${!isSidebarOpen ? 'justify-center' : ''}
                  `}
                                >
                                    <item.icon
                                        size={20}
                                        className={isActive(item.path) ? 'text-indigo-600 shrink-0' : 'text-slate-400 shrink-0'}
                                    />
                                    {isSidebarOpen && (
                                        <span className="ml-3 font-medium text-sm">{item.name}</span>
                                    )}
                                </Link>
                            ))}
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
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
                    <h2 className="text-base font-semibold text-slate-900 capitalize">
                        {location.pathname.split('/').filter(Boolean).join(' / ') || 'Dashboard'}
                    </h2>
                </header>
                <div className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
