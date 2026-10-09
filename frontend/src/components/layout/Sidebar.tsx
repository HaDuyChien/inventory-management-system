import React from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    Layers,
    ArrowLeftRight,
    Sliders,
    Warehouse,
    Grid3X3,
    ShoppingBag,
    ShoppingCart,
    RotateCcw,
    Truck,
    Tags,
    BarChart3,
    Sparkles,
    TrendingUp,
    Users,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Box,
    DollarSign,
} from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";
import type { UserRole } from "@/types";

interface NavItem {
    label: string;
    to: string;
    icon: React.ReactNode;
    roles?: UserRole[];
    badge?: string;
    badgeVariant?: "primary" | "purple" | "warning" | "teal";
}

interface NavSection {
    title: string;
    items: NavItem[];
}

export const Sidebar: React.FC = () => {
    const { isSidebarCollapsed, toggleSidebar } = useUIStore();
    const { currentUser } = useAuthStore();
    const userRole: UserRole = currentUser?.role || "WAREHOUSE_STAFF";

    const navSections: NavSection[] = [
        {
            title: "TỔNG QUAN",
            items: [
                {
                    label: "Bảng điều khiển",
                    to: "/dashboard",
                    icon: <LayoutDashboard className="w-4 h-4" />,
                },
            ],
        },
        {
            title: "KHO HÀNG",
            items: [
                { label: "Sản phẩm", to: "/products", icon: <Package className="w-4 h-4" /> },
                {
                    label: "Danh mục",
                    to: "/categories",
                    icon: <Tags className="w-4 h-4" />,
                    roles: ["ADMIN", "WAREHOUSE_MANAGER"],
                },
                { label: "Tồn kho", to: "/inventory", icon: <Layers className="w-4 h-4" /> },
                {
                    label: "Biến động kho",
                    to: "/inventory/transactions",
                    icon: <ArrowLeftRight className="w-4 h-4" />,
                },
                {
                    label: "Điều chỉnh",
                    to: "/inventory/adjustments",
                    icon: <Sliders className="w-4 h-4" />,
                    roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"],
                },
            ],
        },
        {
            title: "ĐỊA ĐIỂM",
            items: [
                {
                    label: "Kho hàng",
                    to: "/warehouses",
                    icon: <Warehouse className="w-4 h-4" />,
                    roles: ["ADMIN", "WAREHOUSE_MANAGER"],
                },
            ],
        },
        {
            title: "BÁN HÀNG",
            items: [
                {
                    label: "Đơn bán hàng",
                    to: "/sales-orders",
                    icon: <ShoppingCart className="w-4 h-4" />,
                    roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"],
                },
                {
                    label: "Khách hàng",
                    to: "/customers",
                    icon: <Users className="w-4 h-4" />,
                    roles: ["ADMIN"],
                },
                {
                    label: "Doanh thu",
                    to: "/revenue",
                    icon: <DollarSign className="w-4 h-4" />,
                    roles: ["ADMIN"],
                },
                {
                    label: "Trả hàng",
                    to: "/orders/returns",
                    icon: <RotateCcw className="w-4 h-4" />,
                    roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"],
                },
            ],
        },
        {
            title: "NHẬP HÀNG",
            items: [
                {
                    label: "Đơn nhập hàng",
                    to: "/purchase-orders",
                    icon: <ShoppingBag className="w-4 h-4" />,
                    roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"],
                },
                {
                    label: "Nhà cung cấp",
                    to: "/suppliers",
                    icon: <Truck className="w-4 h-4" />,
                    roles: ["ADMIN", "WAREHOUSE_MANAGER"],
                },
            ],
        },
        {
            title: "PHÂN TÍCH",
            items: [
                {
                    label: "Báo cáo",
                    to: "/reports",
                    icon: <BarChart3 className="w-4 h-4" />,
                    roles: ["ADMIN", "WAREHOUSE_MANAGER", "VIEWER"],
                },
            ],
        },
        {
            title: "TRỢ LÝ AI",
            items: [
                {
                    label: "Trợ lý AI",
                    to: "/ai-assistant",
                    icon: <Sparkles className="w-4 h-4 text-[#8a42d8]" />,
                    badge: "Mới",
                    badgeVariant: "purple",
                    roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"],
                },
                {
                    label: "Dự báo nhu cầu",
                    to: "/ai-forecast",
                    icon: <TrendingUp className="w-4 h-4 text-[#0075de]" />,
                    roles: ["ADMIN", "WAREHOUSE_MANAGER"],
                },
            ],
        },
        {
            title: "HỆ THỐNG",
            items: [
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
            ],
        },
    ];

    const visibleSections = navSections
        .map((section) => ({
            ...section,
            items: section.items.filter(
                (item) => !item.roles || item.roles.includes(userRole),
            ),
        }))
        .filter((section) => section.items.length > 0);

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col bg-white border-r border-[#e6e6e6] transition-all duration-200 select-none z-20 shrink-0 sticky top-0 h-screen",
                isSidebarCollapsed ? "w-16" : "w-60",
            )}
        >
            <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#e6e6e6]">
                {!isSidebarCollapsed ? (
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="flex flex-col">
                            <span className="font-bold text-[18px] text-[#000000] tracking-tight leading-none">
                                InventoHub
                            </span>
                            <span className="text-[12.5px] text-[#615d59] leading-none mt-2">
                                Quản lý kho
                            </span>
                        </div>
                    </div>
                ) : (
                    <div></div>
                )}

                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="p-1 rounded-[5px] text-[#a39e98] hover:text-[#000000] hover:bg-black/5 transition-colors"
                    title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
                >
                    {isSidebarCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
                {visibleSections.map((section) => (
                    <div key={section.title} className="space-y-0.5">
                        {!isSidebarCollapsed && (
                            <h4 className="px-2.5 py-1 text-[10px] font-semibold text-[#a39e98] tracking-wider uppercase">
                                {section.title}
                            </h4>
                        )}
                        {section.items.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                title={isSidebarCollapsed ? item.label : undefined}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors group relative",
                                        isActive
                                            ? "bg-[#0075de]/10 text-[#0075de] font-semibold"
                                            : "text-[#31302e] hover:bg-[#f6f5f4] hover:text-[#000000]",
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span
                                            className={cn(
                                                "shrink-0 transition-colors",
                                                isActive
                                                    ? "text-[#0075de]"
                                                    : "text-[#615d59] group-hover:text-[#000000]",
                                            )}
                                        >
                                            {item.icon}
                                        </span>

                                        {!isSidebarCollapsed && (
                                            <span className="flex-1 truncate">{item.label}</span>
                                        )}

                                        {!isSidebarCollapsed && item.badge && (
                                            <Badge
                                                variant={item.badgeVariant || "primary"}
                                                size="xs"
                                            >
                                                {item.badge}
                                            </Badge>
                                        )}

                                        {isActive && (
                                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#0075de] rounded-r-full" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </div>

            <div className="p-2 border-t border-[#e6e6e6] bg-[#fbfbfa]">
                <div
                    className={cn(
                        "flex items-center gap-2 p-1.5 rounded-[6px] hover:bg-black/5 transition-colors cursor-pointer",
                        isSidebarCollapsed ? "justify-center" : "",
                    )}
                >
                    {currentUser?.avatar ? (
                        <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-7 h-7 rounded-full object-cover border border-[#e6e6e6]"
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-[#213183] text-white flex items-center justify-center text-xs font-semibold">
                            {currentUser?.name.charAt(0) || "U"}
                        </div>
                    )}

                    {!isSidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-semibold text-[#000000] truncate">
                                {currentUser?.name}
                            </p>
                            <p className="text-[11px] text-[#615d59] truncate">
                                {currentUser?.role === "ADMIN"
                                    ? "Quản trị viên"
                                    : currentUser?.role === "WAREHOUSE_MANAGER"
                                      ? "Quản lý kho"
                                      : currentUser?.role === "WAREHOUSE_STAFF"
                                        ? "Nhân viên kho"
                                        : "Kiểm toán viên"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};
