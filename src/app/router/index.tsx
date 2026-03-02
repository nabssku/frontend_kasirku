import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../../components/shared/AuthLayout';
import { DashboardLayout } from '../../components/shared/DashboardLayout';
import { SuperAdminLayout } from '../../components/shared/SuperAdminLayout';
import LoginPage from '../../pages/auth/LoginPage';
import RegisterPage from '../../pages/auth/RegisterPage';
import DashboardPage from '../../pages/dashboard/DashboardPage';
import ProductsPage from '../../pages/products/ProductsPage';
import ProductFormPage from '../../pages/products/ProductFormPage';
import CategoriesPage from '../../pages/products/CategoriesPage';
import ModifiersPage from '../../pages/products/ModifiersPage';
import RecipePage from '../../pages/products/RecipePage';
import CustomersPage from '../../pages/customers/CustomersPage';
import TransactionHistoryPage from '../../pages/transactions/TransactionHistoryPage';
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
import LandingPage from '../../pages/LandingPage';
import AuditLogPage from '../../pages/settings/AuditLogPage';
import { lazy } from 'react';
const PrinterSettingsPage = lazy(() => import('../../pages/settings/PrinterSettingsPage'));
const ReceiptSettingsPage = lazy(() => import('../../pages/settings/ReceiptSettingsPage'));
import { ProtectedRoute } from './ProtectedRoute';
import type { UserRole } from '../../types';

// ─── Role groups ──────────────────────────────────────────────────────────────
const ADMIN_ROLES: UserRole[] = ['super_admin', 'owner', 'admin'];
const ADMIN_ONLY_ROLES: UserRole[] = ['super_admin', 'admin']; // Explicitly excludes owner
const OPERATIONAL_ROLES: UserRole[] = ['super_admin', 'admin', 'cashier']; // Non-owner operational staff
const KITCHEN_ROLES: UserRole[] = ['super_admin', 'admin', 'kitchen', 'cashier'];
const OWNER_ROLES: UserRole[] = ['super_admin', 'owner'];
const POS_ROLES: UserRole[] = ['super_admin', 'cashier']; // Terminal POS focus on cashiers
const CONFIG_ROLES: UserRole[] = ['super_admin', 'admin']; // Operational config
const SUPER_ADMIN_ROLES: UserRole[] = ['super_admin'];

export const router = createBrowserRouter([
    // ─── Auth routes (with AuthLayout wrapper) ─────────────────────────────────
    {
        element: <AuthLayout />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
        ],
    },
    // ─── Super Admin Panel ─────────────────────────────────────────────────────
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
        ],
    },
    // ─── Landing Page ─────────────────────────────────────────────────────────
    { path: '/', element: <LandingPage /> },

    // ─── Protected dashboard routes ────────────────────────────────────────────
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            // Accessible to all authenticated users
            { path: 'dashboard', element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><DashboardPage /></ProtectedRoute> },
            { path: 'pos', element: <ProtectedRoute allowedRoles={POS_ROLES}><POSPage /></ProtectedRoute> },

            // Operational
            { path: 'transactions', element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><TransactionHistoryPage /></ProtectedRoute> },
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

            // Catalog (admin+)
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

            // Management (admin+)
            { path: 'outlets', element: <ProtectedRoute allowedRoles={OWNER_ROLES}><OutletsPage /></ProtectedRoute> },
            { path: 'users', element: <ProtectedRoute allowedRoles={OWNER_ROLES}><UsersPage /></ProtectedRoute> },
            {
                path: 'reports',
                element: (
                    <ProtectedRoute allowedRoles={ADMIN_ROLES} requiredFeature="advanced_reports" featureName="Laporan Canggih">
                        <ReportsPage />
                    </ProtectedRoute>
                )
            },
            { path: 'subscription', element: <ProtectedRoute allowedRoles={OWNER_ROLES}><TenantPage /></ProtectedRoute> },
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
        ],
    },
]);
