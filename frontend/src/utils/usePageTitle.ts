import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_TITLES: Record<string, string> = {
    "/": "Tổng quan kho | InventoHub",
    "/dashboard": "Bảng điều khiển tổng quan | InventoHub",
    "/products": "Danh sách sản phẩm | InventoHub",
    "/products/new": "Thêm sản phẩm mới | InventoHub",
    "/inventory": "Tồn kho khả dụng | InventoHub",
    "/inventory/transactions": "Lịch sử biến động kho | InventoHub",
    "/inventory/adjustments": "Phiếu kiểm kê điều chỉnh | InventoHub",
    "/warehouses": "Danh sách kho bãi | InventoHub",
    "/purchase-orders": "Đơn mua hàng nhập kho | InventoHub",
    "/sales-orders": "Đơn hàng xuất bán | InventoHub",
    "/returns": "Quản lý đơn trả hàng | InventoHub",
    "/suppliers": "Danh sách nhà cung cấp | InventoHub",
    "/categories": "Danh mục sản phẩm | InventoHub",
    "/reports": "Báo cáo và Thống kê | InventoHub",
    "/revenue": "Báo cáo doanh thu | InventoHub",
    "/ai-assistant": "Trợ lý kho AI | InventoHub",
    "/ai-demand": "Dự báo nhu cầu AI | InventoHub",
    "/users": "Quản lý người dùng | InventoHub",
    "/customers": "Quản lý khách hàng | InventoHub",
    "/audit-logs": "Nhật ký hoạt động hệ thống | InventoHub",
    "/login": "Đăng nhập hệ thống | InventoHub",
    "/store": "Cửa hàng TechStore | InventoHub",
    "/store/cart": "Giỏ hàng của bạn | Cửa hàng TechStore",
    "/store/checkout": "Thanh toán đơn hàng | Cửa hàng TechStore",
    "/store/orders": "Quản lý đơn hàng | Cửa hàng TechStore",
    "/store/lookup": "Tra cứu đơn hàng | Cửa hàng TechStore",
    "/store/auth": "Đăng nhập và Đăng ký | Cửa hàng TechStore",
    "/store/payment/vnpay-return": "Kết quả thanh toán VNPay | Cửa hàng TechStore",
};

export function usePageTitle(): void {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        if (ROUTE_TITLES[path]) {
            document.title = ROUTE_TITLES[path];
            return;
        }

        if (path.startsWith("/products/") && path.endsWith("/edit")) {
            document.title = "Chỉnh sửa sản phẩm | InventoHub";
            return;
        }
        if (path.startsWith("/products/")) {
            document.title = "Chi tiết sản phẩm | InventoHub";
            return;
        }
        if (path.startsWith("/warehouses/")) {
            document.title = "Sơ đồ kho bãi chi tiết | InventoHub";
            return;
        }
        if (path.startsWith("/purchase-orders/")) {
            document.title = "Chi tiết đơn mua hàng | InventoHub";
            return;
        }
        if (path.startsWith("/sales-orders/")) {
            document.title = "Chi tiết đơn xuất bán | InventoHub";
            return;
        }
        if (path.startsWith("/store/product/")) {
            document.title = "Chi tiết sản phẩm | Cửa hàng TechStore";
            return;
        }

        document.title = "InventoHub | Quản trị Kho và Bán hàng";
    }, [location.pathname]);
}
