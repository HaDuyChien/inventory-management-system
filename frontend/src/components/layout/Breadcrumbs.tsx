import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
    dashboard: "Bảng điều khiển",
    products: "Sản phẩm",
    new: "Thêm mới",
    edit: "Chỉnh sửa",
    inventory: "Tồn kho",
    transactions: "Biến động kho",
    adjustments: "Điều chỉnh kho",
    warehouses: "Kho hàng",
    locations: "Sơ đồ ô kệ",
    "purchase-orders": "Đơn nhập hàng",
    "sales-orders": "Đơn xuất hàng",
    returns: "Trả hàng",
    suppliers: "Nhà cung cấp",
    categories: "Danh mục",
    reports: "Báo cáo",
    "ai-assistant": "Trợ lý AI",
    "ai-forecast": "Dự báo nhu cầu",
    users: "Người dùng",
    "audit-logs": "Nhật ký",
};

export const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter(Boolean);

    if (pathnames.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#615d59]">
            <Link
                to="/dashboard"
                className="hover:text-[#000000] flex items-center gap-1 transition-colors p-1 -m-1 rounded hover:bg-black/5"
            >
                <Home className="w-3.5 h-3.5" />
            </Link>

            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                const isLast = index === pathnames.length - 1;
                const label =
                    ROUTE_LABELS[value] ||
                    (value.startsWith("prod-") || value.startsWith("po-") || value.startsWith("wh-")
                        ? value.toUpperCase()
                        : value);

                return (
                    <React.Fragment key={to}>
                        <ChevronRight className="w-3 h-3 text-[#a39e98] shrink-0" />
                        {isLast ? (
                            <span className="font-medium text-[#000000] truncate max-w-[180px]">
                                {label}
                            </span>
                        ) : (
                            <Link
                                to={to}
                                className="hover:text-[#000000] transition-colors truncate max-w-[140px]"
                            >
                                {label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
