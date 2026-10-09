import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ProductListPage } from "@/features/products/ProductListPage";
import { ProductDetailPage } from "@/features/products/ProductDetailPage";
import { ProductFormPage } from "@/features/products/ProductFormPage";
import { StockPage } from "@/features/inventory/StockPage";
import { TransactionsPage } from "@/features/inventory/TransactionsPage";
import { AdjustmentsPage } from "@/features/inventory/AdjustmentsPage";
import { WarehouseListPage } from "@/features/warehouses/WarehouseListPage";
import { WarehouseDetailPage } from "@/features/warehouses/WarehouseDetailPage";
import { PurchaseOrdersPage } from "@/features/orders/PurchaseOrdersPage";
import { SalesOrdersPage } from "@/features/orders/SalesOrdersPage";
import { ReturnsPage } from "@/features/orders/ReturnsPage";
import { SuppliersPage } from "@/features/suppliers/SuppliersPage";
import { CategoriesPage } from "@/features/categories/CategoriesPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { AIAssistantPage } from "@/features/ai/AIAssistantPage";
import { AIDemandForecastPage } from "@/features/ai/AIDemandForecastPage";
import { UsersPage } from "@/features/users/UsersPage";
import { AuditLogsPage } from "@/features/audit-logs/AuditLogsPage";
import { CustomersPage } from "@/features/customers/CustomersPage";
import { RevenuePage } from "@/features/revenue/RevenuePage";
import { ClientLayout } from "@/features/client/ClientLayout";
import { StorePage } from "@/features/client/StorePage";
import { StoreProductDetailPage } from "@/features/client/StoreProductDetailPage";
import { CartPage } from "@/features/client/CartPage";
import { CheckoutPage } from "@/features/client/CheckoutPage";
import { CustomerOrdersPage } from "@/features/client/CustomerOrdersPage";
import { OrderLookupPage } from "@/features/client/OrderLookupPage";
import { CustomerAuthPage } from "@/features/client/CustomerAuthPage";
import { VNPayReturnPage } from "@/features/client/VNPayReturnPage";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/useAuthStore";
import type { UserRole } from "@/types";

const RoleProtectedRoute: React.FC<{
    allowedRoles: UserRole[];
    children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
    const { currentUser, isAuthenticated } = useAuthStore();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    const role: UserRole = currentUser?.role || "WAREHOUSE_STAFF";
    if (!allowedRoles.includes(role)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white border border-[#e6e6e6] rounded-[12px] shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#fef2f2] flex items-center justify-center text-[#dc2626] mb-4">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-[#000000]">
                    Không có quyền truy cập
                </h2>
                <p className="text-sm text-[#615d59] max-w-md mt-2">
                    Tài khoản của bạn với vai trò hiện tại không được cấp phép xem hoặc thao tác trên trang này. Vui lòng liên hệ Quản trị viên để được cấp quyền.
                </p>
                <div className="mt-6">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            window.location.href = "/dashboard";
                        }}
                    >
                        Quay lại Bảng điều khiển
                    </Button>
                </div>
            </div>
        );
    }
    return <>{children}</>;
};

const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, isAuthenticated } = useAuthStore();
    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/store",
        element: <ClientLayout />,
        children: [
            {
                index: true,
                element: <StorePage />,
            },
            {
                path: "product/:id",
                element: <StoreProductDetailPage />,
            },
            {
                path: "cart",
                element: <CartPage />,
            },
            {
                path: "checkout",
                element: <CheckoutPage />,
            },
            {
                path: "orders",
                element: <CustomerOrdersPage />,
            },
            {
                path: "lookup",
                element: <OrderLookupPage />,
            },
            {
                path: "auth",
                element: <CustomerAuthPage />,
            },
            {
                path: "payment/vnpay-return",
                element: <VNPayReturnPage />,
            },
            {
                path: "*",
                element: <Navigate to="/store" replace />,
            },
        ],
    },
    {
        path: "/",
        element: (
            <AdminAuthGuard>
                <MainLayout />
            </AdminAuthGuard>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />,
            },
            {
                path: "dashboard",
                element: <DashboardPage />,
            },
            {
                path: "products",
                element: <ProductListPage />,
            },
            {
                path: "products/new",
                element: (
                    <RoleProtectedRoute allowedRoles={["ADMIN", "WAREHOUSE_MANAGER"]}>
                        <ProductFormPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "products/:id",
                element: <ProductDetailPage />,
            },
            {
                path: "products/:id/edit",
                element: (
                    <RoleProtectedRoute allowedRoles={["ADMIN", "WAREHOUSE_MANAGER"]}>
                        <ProductFormPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "inventory",
                element: <StockPage />,
            },
            {
                path: "inventory/transactions",
                element: <TransactionsPage />,
            },
            {
                path: "inventory/adjustments",
                element: (
                    <RoleProtectedRoute
                        allowedRoles={["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"]}
                    >
                        <AdjustmentsPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "warehouses",
                element: (
                    <RoleProtectedRoute allowedRoles={["ADMIN", "WAREHOUSE_MANAGER"]}>
                        <WarehouseListPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "warehouses/:id",
                element: (
                    <RoleProtectedRoute
                        allowedRoles={["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"]}
                    >
                        <WarehouseDetailPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "purchase-orders",
                element: (
                    <RoleProtectedRoute
                        allowedRoles={["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"]}
                    >
                        <PurchaseOrdersPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "purchase-orders/:id",
                element: (
                    <RoleProtectedRoute
                        allowedRoles={["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"]}
                    >
                        <PurchaseOrdersPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "sales-orders",
                element: (
                    <RoleProtectedRoute
                        allowedRoles={["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"]}
                    >
                        <SalesOrdersPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "sales-orders/:id",
                element: (
                    <RoleProtectedRoute
                        allowedRoles={["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"]}
                    >
                        <SalesOrdersPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "customers",
                element: (
                    <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                        <CustomersPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "revenue",
                element: (
                    <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                        <RevenuePage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "orders/returns",
                element: (
                    <RoleProtectedRoute
                        allowedRoles={["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"]}
                    >
                        <ReturnsPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "suppliers",
                element: (
                    <RoleProtectedRoute allowedRoles={["ADMIN", "WAREHOUSE_MANAGER"]}>
                        <SuppliersPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "categories",
                element: (
                    <RoleProtectedRoute allowedRoles={["ADMIN", "WAREHOUSE_MANAGER"]}>
                        <CategoriesPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "reports",
                element: (
                    <RoleProtectedRoute
                        allowedRoles={["ADMIN", "WAREHOUSE_MANAGER", "VIEWER"]}
                    >
                        <ReportsPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "ai-assistant",
                element: (
                    <RoleProtectedRoute
                        allowedRoles={["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"]}
                    >
                        <AIAssistantPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "ai-forecast",
                element: (
                    <RoleProtectedRoute allowedRoles={["ADMIN", "WAREHOUSE_MANAGER"]}>
                        <AIDemandForecastPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "users",
                element: (
                    <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                        <UsersPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "audit-logs",
                element: (
                    <RoleProtectedRoute allowedRoles={["ADMIN", "VIEWER"]}>
                        <AuditLogsPage />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: "*",
                element: <Navigate to="/dashboard" replace />,
            },
        ],
    },
]);
