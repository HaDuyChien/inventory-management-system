import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Package,
    Clock,
    CheckCircle2,
    Truck,
    XCircle,
    ChevronDown,
    ChevronRight,
    CreditCard,
    Search,
    Banknote,
    ExternalLink,
    Loader2,
    Lock,
} from "lucide-react";
import { mockApi } from "@/services/mockApi";
import { useCustomerAuthStore } from "@/stores/useCustomerAuthStore";
import { toast } from "@/stores/useToastStore";
import { formatCurrency } from "@/utils/formatters";
import type { SalesOrder } from "@/types";

export const CustomerOrdersPage: React.FC = () => {
    const { user, isAuthenticated } = useCustomerAuthStore();
    const queryClient = useQueryClient();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

    const { data: allOrders = [], isLoading } = useQuery({
        queryKey: ["sales-orders"],
        queryFn: mockApi.getSalesOrders,
        enabled: isAuthenticated && Boolean(user),
    });

    const cancelMutation = useMutation({
        mutationFn: async (orderId: string) => {
            return mockApi.cancelOrder(orderId, "Khách hàng tự hủy đơn");
        },
        onSuccess: () => {
            toast.success("Thành công", "Đã hủy đơn hàng theo yêu cầu");
            queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
            queryClient.invalidateQueries({ queryKey: ["stock"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            setCancellingId(null);
        },
        onError: (err: any) => {
            toast.error(
                "Lỗi",
                err.response?.data?.thongDiep || err.message || "Không thể hủy đơn hàng này",
            );
        },
    });

    const handlePayVNPay = async (order: SalesOrder) => {
        setPayingOrderId(order.id);
        try {
            const res = await mockApi.createVNPayUrl({
                orderId: order.id,
                orderNumber: order.orderNumber,
            });
            if (res && res.paymentUrl) {
                window.location.href = res.paymentUrl;
            }
        } catch (err: any) {
            toast.error(
                "Lỗi kết nối",
                err.response?.data?.thongDiep ||
                err.message ||
                "Không thể kết nối cổng thanh toán VNPay",
            );
            setPayingOrderId(null);
        }
    };

    if (!isAuthenticated || !user) {
        return (
            <div className="max-w-md mx-auto my-12 text-center py-16 space-y-4 rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] p-8 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#0075de]/10 text-[#0075de] flex items-center justify-center mx-auto">
                    <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                    <h2 className="text-lg font-bold tracking-tight text-[#000000]">
                        Vui lòng đăng nhập
                    </h2>
                    <p className="text-xs text-[#615d59] leading-relaxed">
                        Bạn cần đăng nhập tài khoản khách hàng để theo dõi lịch sử và trạng thái các đơn hàng đã đặt.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                    <Link
                        to="/store/auth"
                        className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                        Đăng nhập ngay
                    </Link>
                    <Link
                        to="/store/lookup"
                        className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#e6e6e6] hover:bg-[#f6f5f4] text-[#000000] text-xs font-semibold transition-colors"
                    >
                        Tra cứu đơn hàng
                    </Link>
                </div>
            </div>
        );
    }

    const userOrders = allOrders.filter(
        (o) =>
            (user.email && o.customerEmail === user.email) ||
            (user.name && o.customerName === user.name) ||
            (user.phone && o.customerPhone === user.phone) ||
            (user.phone && o.shippingAddress && o.shippingAddress.includes(user.phone)),
    );

    const filteredOrders = userOrders.filter((order) => {
        const matchesTab =
            activeTab === "ALL" ||
            (activeTab === "PENDING" && (order.status === "Pending" || order.status === "Draft")) ||
            (activeTab === "PROCESSING" && order.status === "Processing") ||
            (activeTab === "SHIPPED" && order.status === "Shipped") ||
            (activeTab === "DELIVERED" && order.status === "Delivered") ||
            (activeTab === "CANCELLED" && order.status === "Cancelled");

        const matchesSearch =
            searchTerm === "" ||
            order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.items.some((it) => it.productName.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesTab && matchesSearch;
    });

    const toggleExpand = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Delivered":
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#1aae39]/10 text-[#1aae39]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đã giao</span>
                    </span>
                );
            case "Shipped":
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0075de]/10 text-[#0075de]">
                        <Truck className="w-3 h-3" />
                        <span>Đang giao</span>
                    </span>
                );
            case "Processing":
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6]">
                        <Package className="w-3 h-3" />
                        <span>Đang đóng gói</span>
                    </span>
                );
            case "Cancelled":
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#eb5757]/10 text-[#eb5757]">
                        <XCircle className="w-3 h-3" />
                        <span>Đã hủy</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#dd5b00]/10 text-[#dd5b00]">
                        <Clock className="w-3 h-3" />
                        <span>Chờ xác nhận</span>
                    </span>
                );
        }
    };

    const getPaymentBadge = (order: SalesOrder) => {
        if (order.paymentMethod === "VNPAY") {
            if (order.paymentStatus === "PAID") {
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]">
                        <CreditCard className="w-3 h-3" />
                        <span>VNPay: Đã thanh toán</span>
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                    <CreditCard className="w-3 h-3" />
                    <span>VNPay: Chờ thanh toán</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#f6f5f4] text-[#615d59] border border-[#e6e6e6]">
                <Banknote className="w-3 h-3" />
                <span>Tiền mặt COD</span>
            </span>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#000000]">
                        Đơn hàng của tôi
                    </h1>
                    <p className="text-xs text-[#615d59]">
                        Quản lý và theo dõi tiến độ các đơn hàng bạn đã đặt
                    </p>
                </div>

                <Link
                    to="/store"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0075de] hover:underline"
                >
                    <span>Đặt mua thêm</span>
                </Link>
            </div>

            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e6e6e6] pb-2">
                    {[
                        { id: "ALL", label: "Tất cả" },
                        { id: "PENDING", label: "Chờ xác nhận" },
                        { id: "PROCESSING", label: "Đang đóng gói" },
                        { id: "SHIPPED", label: "Đang giao" },
                        { id: "DELIVERED", label: "Đã giao" },
                        { id: "CANCELLED", label: "Đã hủy" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
                                activeTab === tab.id
                                    ? "bg-[#000000] text-white"
                                    : "bg-white text-[#615d59] hover:bg-[#f6f5f4] hover:text-[#000000] border border-[#e6e6e6]"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a39e98]" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã đơn hoặc tên sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-[6px] border border-[#e6e6e6] bg-white text-[#000000] focus:outline-none focus:border-[#0075de]"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-28 rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] animate-pulse"
                        />
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 space-y-3 rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] p-6 shadow-sm">
                    <Package className="w-10 h-10 mx-auto text-[#a39e98]" />
                    <p className="text-sm font-semibold text-[#000000]">
                        {userOrders.length === 0
                            ? "Bạn chưa có đơn đặt hàng nào"
                            : "Không tìm thấy đơn hàng phù hợp"}
                    </p>
                    <p className="text-xs text-[#615d59]">
                        Khám phá ngay các thiết bị công nghệ hiện đại tại cửa hàng
                    </p>
                    <Link
                        to="/store"
                        className="inline-block px-5 py-2.5 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                        Mua sắm ngay
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map((order) => {
                        const isExpanded = expandedId === order.id;
                        const canCancel = order.status === "Pending" || order.status === "Draft";
                        const canPayVNPay =
                            order.paymentMethod === "VNPAY" &&
                            order.paymentStatus !== "PAID" &&
                            order.status !== "Cancelled";

                        return (
                            <div
                                key={order.id}
                                className="rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] overflow-hidden shadow-sm transition-colors"
                            >
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(order.id)}
                                        className="flex-1 flex items-start sm:items-center justify-between text-left pr-2 cursor-pointer"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-bold font-mono text-[#000000]">
                                                    {order.orderNumber}
                                                </span>
                                                {getStatusBadge(order.status)}
                                                {getPaymentBadge(order)}
                                            </div>
                                            <div className="text-[11px] text-[#615d59]">
                                                Ngày đặt:{" "}
                                                {new Date(order.orderDate).toLocaleDateString(
                                                    "vi-VN",
                                                )}{" "}
                                                • {order.items.length} mặt hàng
                                            </div>
                                        </div>

                                        <div className="text-right pl-3">
                                            <div className="text-sm font-bold text-[#0075de]">
                                                {formatCurrency(order.totalAmount)}
                                            </div>
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e6e6e6]">
                                        {canPayVNPay && (
                                            <button
                                                type="button"
                                                disabled={payingOrderId === order.id}
                                                onClick={() => handlePayVNPay(order)}
                                                className="px-3 py-1.5 rounded-[6px] bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                                            >
                                                {payingOrderId === order.id ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        <span>Đang kết nối...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="w-3.5 h-3.5" />
                                                        <span>Thanh toán ngay</span>
                                                        <ExternalLink className="w-3 h-3 opacity-70" />
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {canCancel && (
                                            <>
                                                {cancellingId === order.id ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            disabled={cancelMutation.isPending}
                                                            onClick={() =>
                                                                cancelMutation.mutate(order.id)
                                                            }
                                                            className="px-2.5 py-1.5 rounded-[6px] bg-[#eb5757] text-white text-xs font-semibold hover:bg-[#c0392b] transition-colors cursor-pointer"
                                                        >
                                                            {cancelMutation.isPending
                                                                ? "Đang hủy..."
                                                                : "Xác nhận hủy"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCancellingId(null)}
                                                            className="px-2.5 py-1.5 rounded-[6px] border border-[#e6e6e6] text-xs hover:bg-[#f6f5f4] transition-colors cursor-pointer"
                                                        >
                                                            Đóng
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCancellingId(order.id)}
                                                        className="px-3 py-1.5 rounded-[6px] border border-[#eb5757] text-[#eb5757] hover:bg-[#eb5757]/10 text-xs font-semibold transition-colors cursor-pointer"
                                                    >
                                                        Hủy đơn
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(order.id)}
                                            className="p-1.5 rounded-[6px] text-[#615d59] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-4 pt-3 border-t border-[#e6e6e6] bg-[#fafafa] space-y-3">
                                        <div className="space-y-1.5">
                                            {order.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between text-xs py-1"
                                                >
                                                    <div className="truncate flex-1 min-w-0 pr-2">
                                                        <span className="font-semibold text-[#000000]">
                                                            {item.productName}
                                                        </span>
                                                        <span className="text-[#615d59] ml-1.5 font-mono text-[11px]">
                                                            x{item.quantity}
                                                        </span>
                                                    </div>
                                                    <span className="font-semibold text-[#000000] shrink-0">
                                                        {formatCurrency(item.totalPrice)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-2.5 border-t border-[#e6e6e6] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#615d59]">
                                            <div>
                                                <span className="font-medium text-[#31302e] block">
                                                    Địa chỉ giao hàng:
                                                </span>
                                                <span>{order.shippingAddress}</span>
                                            </div>

                                            <div className="sm:text-right space-y-1">
                                                {order.vnpTransactionNo && (
                                                    <div>
                                                        <span>Mã giao dịch VNPay: </span>
                                                        <span className="font-mono font-bold text-[#000000]">
                                                            {order.vnpTransactionNo}
                                                        </span>
                                                    </div>
                                                )}
                                                {order.vnpBankCode && (
                                                    <div>
                                                        <span>Ngân hàng: </span>
                                                        <span className="font-semibold text-[#000000]">
                                                            {order.vnpBankCode}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="font-bold text-[#000000] text-sm pt-1">
                                                    Tổng thanh toán: {formatCurrency(order.totalAmount)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
