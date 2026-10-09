import React from "react";
import { NavLink } from "react-router-dom";
import {
    X,
    Box,
    LayoutDashboard,
    Package,
    Layers,
    ArrowLeftRight,
    Sliders,
    Warehouse,
    ShoppingBag,
    ShoppingCart,
    Truck,
    BarChart3,
    Sparkles,
    TrendingUp,
    Users,
    ShieldCheck,
} from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";
import type { UserRole } from "@/types";

interface MobileNavItem {
    label: string;
    to: string;
    icon: React.ReactNode;
    roles?: UserRole[];
    badge?: string;
}

export const MobileNav: React.FC = () => {
    const { isMobileNavOpen, setMobileNavOpen } = useUIStore();
    const { currentUser } = useAuthStore();
    const userRole: UserRole = currentUser?.role || "WAREHOUSE_STAFF";

    if (!isMobileNavOpen) return null;

    const navItems: MobileNavItem[] = [
        {
            label: "Bảng điều khiển",
            to: "/dashboard",
            icon: <LayoutDashboard className="w-4 h-4" />,
        },
        { label: "Sản phẩm", to: "/products", icon: <Package className="w-4 h-4" /> },
        { label: "Tồn kho", to: "/inventory", icon: <Layers className="w-4 h-4" /> },
        {
            label: "Biến động",
            to: "/inventory/transactions",
            icon: <ArrowLeftRight className="w-4 h-4" />,
        },
        {
            label: "Điều chỉnh",
            to: "/inventory/adjustments",
            icon: <Sliders className="w-4 h-4" />,
            roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"],
        },
        {
            label: "Kho hàng",
            to: "/warehouses",
            icon: <Warehouse className="w-4 h-4" />,
            roles: ["ADMIN", "WAREHOUSE_MANAGER"],
        },
        {
            label: "Đơn nhập hàng",
            to: "/purchase-orders",
            icon: <ShoppingBag className="w-4 h-4" />,
            roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"],
        },
        {
            label: "Đơn xuất hàng",
            to: "/sales-orders",
            icon: <ShoppingCart className="w-4 h-4" />,
            roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"],
        },
        {
            label: "Nhà cung cấp",
            to: "/suppliers",
            icon: <Truck className="w-4 h-4" />,
            roles: ["ADMIN", "WAREHOUSE_MANAGER"],
        },
        {
            label: "Báo cáo",
            to: "/reports",
            icon: <BarChart3 className="w-4 h-4" />,
            roles: ["ADMIN", "WAREHOUSE_MANAGER", "VIEWER"],
        },
        {
            label: "Trợ lý AI",
            to: "/ai-assistant",
            icon: <Sparkles className="w-4 h-4 text-[#8a42d8]" />,
            badge: "AI",
            roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"],
        },
        {
            label: "Dự báo nhu cầu",
            to: "/ai-forecast",
            icon: <TrendingUp className="w-4 h-4 text-[#0075de]" />,
            roles: ["ADMIN", "WAREHOUSE_MANAGER"],
        },
        {
            label: "Người dùng",
            to: "/users",
            icon: <Users className="w-4 h-4" />,
            roles: ["ADMIN"],
        },
        {
            label: "Nhật ký",
            to: "/audit-logs",
            icon: <ShieldCheck className="w-4 h-4" />,
            roles: ["ADMIN", "VIEWER"],
        },
    ];

    const visibleItems = navItems.filter(
        (item) => !item.roles || item.roles.includes(userRole),
    );

    return (
        <div className="fixed inset-0 z-50 md:hidden flex">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={() => setMobileNavOpen(false)}
            />

            <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col z-10 border-r border-[#e6e6e6] shadow-notion-lg">
                <div className="p-4 border-b border-[#e6e6e6] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-[6px] bg-[#0075de] text-white flex items-center justify-center font-bold text-sm">
                            <Box className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-[#000000]">InventoHub</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMobileNavOpen(false)}
                        className="p-1 text-[#a39e98] hover:text-[#000000] rounded hover:bg-black/5"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {visibleItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileNavOpen(false)}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center justify-between px-3 py-2 rounded-[6px] text-[13.5px] font-medium transition-colors",
                                    isActive
                                        ? "bg-[#0075de]/10 text-[#0075de] font-semibold"
                                        : "text-[#31302e] hover:bg-[#f6f5f4]",
                                )
                            }
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                            {item.badge && (
                                <Badge variant="purple" size="xs">
                                    {item.badge}
                                </Badge>
                            )}
                        </NavLink>
                    ))}
                </div>

                <div className="p-3 border-t border-[#e6e6e6] bg-[#fbfbfa]">
                    <div className="flex items-center gap-2.5">
                        {currentUser?.avatar ? (
                            <img
                                src={currentUser.avatar}
                                alt={currentUser.name}
                                className="w-8 h-8 rounded-full object-cover border border-[#e6e6e6]"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#0075de] text-white flex items-center justify-center text-xs font-semibold">
                                {currentUser?.name.charAt(0) || "U"}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#000000] truncate">
                                {currentUser?.name}
                            </p>
                            <p className="text-[11px] text-[#615d59] truncate">
                                {currentUser?.role}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
