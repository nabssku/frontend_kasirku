import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../../components/shared/AuthLayout';
import { DashboardLayout } from '../../components/shared/DashboardLayout';
import { SuperAdminLayout } from '../../components/shared/SuperAdminLayout';
import { PublicLayout } from '../../components/shared/PublicLayout';
import LoginPage from '../../pages/auth/LoginPage';
import RegisterPage from '../../pages/auth/RegisterPage';
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';
import DashboardPage from '../../pages/dashboard/DashboardPage';
import ProductsPage from '../../pages/products/ProductsPage';
import ProductFormPage from '../../pages/products/ProductFormPage';
import CategoriesPage from '../../pages/products/CategoriesPage';
import ModifiersPage from '../../pages/products/ModifiersPage';
import RecipePage from '../../pages/products/RecipePage';
import CustomersPage from '../../pages/customers/CustomersPage';
import TransactionHistoryPage from '../../pages/transactions/TransactionHistoryPage';
import DailyTransactionPage from '../../pages/transactions/DailyTransactionPage';
import POSPage from '../../pages/transactions/POSPage';
import TenantPage from '../../pages/tenants/TenantPage';
import IngredientsPage from '../../pages/inventory/IngredientsPage';
import TablesPage from '../../pages/tables/TablesPage';
import KitchenDisplayPage from '../../pages/kitchen/KitchenDisplayPage';
import ShiftPage from '../../pages/shifts/ShiftPage';
import OutletsPage from '../../pages/outlets/OutletsPage';
import UsersPage from '../../pages/users/UsersPage';
import ReportsPage from '../../pages/reports/ReportsPage';
import ExpensesPage from '../../pages/expenses/ExpensesPage';
import ExpenseCategoriesPage from '../../pages/expenses/ExpenseCategoriesPage';
import SuperAdminDashboard from '../../pages/super-admin/SuperAdminDashboard';
import SuperAdminTenants from '../../pages/super-admin/SuperAdminTenants';
import SuperAdminUsers from '../../pages/super-admin/SuperAdminUsers';
import SuperAdminSubscriptions from '../../pages/super-admin/SuperAdminSubscriptions';
import SuperAdminPlans from '../../pages/super-admin/SuperAdminPlans';
import SuperAdminOrders from '../../pages/super-admin/SuperAdminOrders';
import SuperAdminAppVersion from '../../pages/super-admin/SuperAdminAppVersion';
import SuperAdminPageBuilder from '../../pages/super-admin/SuperAdminPageBuilder';
import LandingPage from '../../pages/LandingPage';
import DynamicPublicPage from '../../pages/public/DynamicPublicPage';
import AuditLogPage from '../../pages/settings/AuditLogPage';
import AppInformationPage from '../../pages/settings/AppInformationPage';
import PaymentSettingsPage from '../../pages/settings/PaymentSettingsPage';
import PaymentMethodsPage from '../../pages/settings/PaymentMethodsPage';
import SupportPage from '../../pages/support/SupportPage';
import TicketDetailsPage from '../../pages/support/TicketDetailsPage';
import AdminTicketsPage from '../../pages/super-admin/AdminTicketsPage';
import SuperAdminDiscounts from '../../pages/super-admin/SuperAdminDiscounts';
import CheckoutPage from '../../pages/subscriptions/CheckoutPage';
import OnboardingPage from '../../pages/onboarding/OnboardingPage';
import SuperAdminTemplatesPage from '../../pages/super-admin/SuperAdminTemplatesPage';
import MasterPaymentMethodsPage from '../../pages/super-admin/MasterPaymentMethodsPage';

const IncomeReport = lazy(() => import('../../pages/reports/IncomeReport'));
const ExpenseReport = lazy(() => import('../../pages/reports/ExpenseReport'));
const ProfitLossReport = lazy(() => import('../../pages/reports/ProfitLossReport'));
import { ProtectedRoute } from './ProtectedRoute';
import type { UserRole } from '../../types';

const PrinterSettingsPage = lazy(() => import('../../pages/settings/PrinterSettingsPage'));
const ReceiptSettingsPage = lazy(() => import('../../pages/settings/ReceiptSettingsPage'));

// ─── Web Menu (public, no auth) ───────────────────────────────────────────────
const MenuPage = lazy(() => import('../../pages/menu/MenuPage'));
const PaymentPage = lazy(() => import('../../pages/menu/PaymentPage'));
const OrderStatusPage = lazy(() => import('../../pages/menu/OrderStatusPage'));

// ─── Role groups ──────────────────────────────────────────────────────────────
const ADMIN_ROLES: UserRole[] = ['super_admin', 'owner', 'admin'];
const ADMIN_ONLY_ROLES: UserRole[] = ['super_admin', 'admin'];
const OPERATIONAL_ROLES: UserRole[] = ['super_admin', 'admin', 'cashier'];
const KITCHEN_ROLES: UserRole[] = ['super_admin', 'admin', 'kitchen', 'cashier'];
const OWNER_ROLES: UserRole[] = ['super_admin', 'owner'];
const POS_ROLES: UserRole[] = ['super_admin', 'cashier'];
const CONFIG_ROLES: UserRole[] = ['super_admin', 'admin', 'cashier'];
const SUPER_ADMIN_ROLES: UserRole[] = ['super_admin'];

export const router = createBrowserRouter([
    // ─── Public Web Menu (QR Self Order, no auth needed) ──────────────────────
    { path: '/menu/table/:qrToken', element: <MenuPage /> },
    { path: '/menu/payment/:sessionToken', element: <PaymentPage /> },
    { path: '/menu/order/:sessionToken/status', element: <OrderStatusPage /> },

    // ─── Auth routes ──────────────────────────────────────────────────────────
    {
        element: <AuthLayout />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
            { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
    },
    // ─── Public Pages ─────────────────────────────────────────────────────────
    {
        element: <PublicLayout />,
        children: [
            { path: '/help-center', element: <DynamicPublicPage /> },
            { path: '/contact', element: <DynamicPublicPage /> },
            { path: '/privacy-policy', element: <DynamicPublicPage /> },
            { path: '/terms-conditions', element: <DynamicPublicPage /> },
        ],
    },
    // ─── Super Admin Panel ────────────────────────────────────────────────────
    {
        path: '/super-admin',
        element: (
            <ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}>
                <SuperAdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: '', element: <Navigate to="/super-admin/dashboard" replace /> },
            { path: 'dashboard', element: <SuperAdminDashboard /> },
            { path: 'tenants', element: <SuperAdminTenants /> },
            { path: 'users', element: <SuperAdminUsers /> },
            { path: 'subscriptions', element: <SuperAdminSubscriptions /> },
            { path: 'plans', element: <SuperAdminPlans /> },
            { path: 'orders', element: <SuperAdminOrders /> },
            { path: 'app-versions', element: <SuperAdminAppVersion /> },
            { path: 'page-builder', element: <SuperAdminPageBuilder /> },
            { path: 'tickets', element: <AdminTicketsPage /> },
            { path: 'tickets/:id', element: <TicketDetailsPage /> },
            { path: 'discounts', element: <SuperAdminDiscounts /> },
            { path: 'templates', element: <SuperAdminTemplatesPage /> },
            { path: 'payment-methods', element: <MasterPaymentMethodsPage /> },
            { path: 'settings/payment', element: <PaymentSettingsPage isSuperAdmin /> },
        ],
    },
    // ─── Onboarding ───────────────────────────────────────────────────────────
    {
        path: '/onboarding',
        element: (
            <ProtectedRoute>
                <OnboardingPage />
            </ProtectedRoute>
        ),
    },
    // ─── Landing Page ─────────────────────────────────────────────────────────
    { path: '/', element: <LandingPage /> },

    // ─── Protected dashboard routes ───────────────────────────────────────────
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: 'dashboard', element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><DashboardPage /></ProtectedRoute> },
            { path: 'pos', element: <ProtectedRoute allowedRoles={POS_ROLES}><POSPage /></ProtectedRoute> },

            { path: 'transactions', element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><TransactionHistoryPage /></ProtectedRoute> },
            { path: 'transactions/daily', element: <ProtectedRoute allowedRoles={OPERATIONAL_ROLES}><DailyTransactionPage /></ProtectedRoute> },
            { path: 'tables', element: <ProtectedRoute allowedRoles={OPERATIONAL_ROLES}><TablesPage /></ProtectedRoute> },
            {
                path: 'kitchen',
                element: (
                    <ProtectedRoute allowedRoles={KITCHEN_ROLES} requiredFeature="kitchen_display" featureName="Kitchen Display (KDS)">
                        <KitchenDisplayPage />
                    </ProtectedRoute>
                )
            },
            {
                path: 'shifts',
                element: (
                    <ProtectedRoute allowedRoles={OPERATIONAL_ROLES} requiredFeature="shift_management" featureName="Manajemen Shift">
                        <ShiftPage />
                    </ProtectedRoute>
                )
            },
            {
                path: 'products',
                children: [
                    { path: '', element: <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}><ProductsPage /></ProtectedRoute> },
                    { path: 'new', element: <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}><ProductFormPage /></ProtectedRoute> },
                    { path: ':id', element: <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}><ProductFormPage /></ProtectedRoute> },
                    { path: ':id/recipe', element: <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}><RecipePage /></ProtectedRoute> },
                ],
            },
            { path: 'categories', element: <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}><CategoriesPage /></ProtectedRoute> },
            {
                path: 'expenses',
                children: [
                    {
                        path: '',
                        element: (
                            <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES} requiredFeature="expenses" featureName="Manajemen Pengeluaran">
                                <ExpensesPage />
                            </ProtectedRoute>
                        )
                    },
                    {
                        path: 'categories',
                        element: (
                            <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES} requiredFeature="expenses" featureName="Manajemen Pengeluaran">
                                <ExpenseCategoriesPage />
                            </ProtectedRoute>
                        )
                    },
                ]
            },
            {
                path: 'modifiers',
                element: (
                    <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES} requiredFeature="modifiers" featureName="Modifiers / Ekstra">
                        <ModifiersPage />
                    </ProtectedRoute>
                )
            },
            {
                path: 'ingredients',
                element: (
                    <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES} requiredFeature="inventory_basic" featureName="Manajemen Stok & Bahan Baku">
                        <IngredientsPage />
                    </ProtectedRoute>
                )
            },
            {
                path: 'customers',
                element: (
                    <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES} requiredFeature="customers" featureName="Manajemen Pelanggan">
                        <CustomersPage />
                    </ProtectedRoute>
                )
            },

            { path: 'outlets', element: <ProtectedRoute allowedRoles={OWNER_ROLES}><OutletsPage /></ProtectedRoute> },
            { path: 'users', element: <ProtectedRoute allowedRoles={OWNER_ROLES}><UsersPage /></ProtectedRoute> },
            {
                path: 'reports',
                children: [
                    {
                        path: '',
                        element: (
                            <ProtectedRoute allowedRoles={ADMIN_ROLES} requiredFeature="advanced_reports" featureName="Laporan Canggih">
                                <ReportsPage />
                            </ProtectedRoute>
                        )
                    },
                    {
                        path: 'income',
                        element: (
                            <ProtectedRoute allowedRoles={ADMIN_ROLES} requiredFeature="advanced_reports" featureName="Laporan Pendapatan">
                                <IncomeReport />
                            </ProtectedRoute>
                        )
                    },
                    {
                        path: 'expense',
                        element: (
                            <ProtectedRoute allowedRoles={ADMIN_ROLES} requiredFeature="advanced_reports" featureName="Laporan Pengeluaran">
                                <ExpenseReport />
                            </ProtectedRoute>
                        )
                    },
                    {
                        path: 'profit-loss',
                        element: (
                            <ProtectedRoute allowedRoles={ADMIN_ROLES} requiredFeature="advanced_reports" featureName="Laporan Laba Rugi">
                                <ProfitLossReport />
                            </ProtectedRoute>
                        )
                    },
                ]
            },
            { path: 'subscription', element: <ProtectedRoute allowedRoles={OWNER_ROLES}><TenantPage /></ProtectedRoute> },
            { path: 'subscription/checkout', element: <ProtectedRoute allowedRoles={OWNER_ROLES}><CheckoutPage /></ProtectedRoute> },
            { path: 'settings/printer', element: <ProtectedRoute allowedRoles={CONFIG_ROLES}><PrinterSettingsPage /></ProtectedRoute> },
            { path: 'settings/receipt', element: <ProtectedRoute allowedRoles={CONFIG_ROLES}><ReceiptSettingsPage /></ProtectedRoute> },
            {
                path: 'settings/audit-log',
                element: (
                    <ProtectedRoute allowedRoles={OWNER_ROLES} requiredFeature="audit_log" featureName="Audit Log">
                        <AuditLogPage />
                    </ProtectedRoute>
                )
            },
            { path: 'settings/info', element: <ProtectedRoute><AppInformationPage /></ProtectedRoute> },
            { path: 'settings/payment', element: <ProtectedRoute allowedRoles={OWNER_ROLES}><PaymentSettingsPage /></ProtectedRoute> },
            { path: 'settings/payment-methods', element: <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}><PaymentMethodsPage /></ProtectedRoute> },
            { path: 'support', element: <ProtectedRoute><SupportPage /></ProtectedRoute> },
            { path: 'support/tickets/:id', element: <ProtectedRoute><TicketDetailsPage /></ProtectedRoute> },
        ],
    },
]);
