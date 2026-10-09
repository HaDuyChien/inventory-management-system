import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Package, CheckCircle2, Clock, Truck, XCircle, AlertCircle } from "lucide-react";
import { mockApi } from "@/services/mockApi";
import type { SalesOrder } from "@/types";

export const OrderLookupPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialPhone = searchParams.get("phone") || "";
    const [phoneInput, setPhoneInput] = useState(initialPhone);
    const [searchedPhone, setSearchedPhone] = useState(initialPhone);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data: allOrders = [], isLoading } = useQuery({
        queryKey: ["sales-orders"],
        queryFn: mockApi.getSalesOrders,
    });

    const cancelMutation = useMutation({
        mutationFn: async (orderId: string) => {
            return mockApi.updateSOStatus(orderId, "Cancelled");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
            queryClient.invalidateQueries({ queryKey: ["stock"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            setCancellingId(null);
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = phoneInput.trim();
        setSearchedPhone(trimmed);
        setSearchParams(trimmed ? { phone: trimmed } : {});
    };

    const matchingOrders = allOrders.filter((order) => {
        if (!searchedPhone) return false;
        const phoneMatch = order.shippingAddress.includes(searchedPhone);
        const emailMatch = order.customerEmail.includes(searchedPhone);
        const nameMatch = order.customerName.toLowerCase().includes(searchedPhone.toLowerCase());
        const codeMatch = order.orderNumber.toLowerCase().includes(searchedPhone.toLowerCase());
        return phoneMatch || emailMatch || nameMatch || codeMatch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Delivered":
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1aae39]/10 text-[#1aae39]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đã giao thành công</span>
                    </span>
                );
            case "Shipped":
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#0075de]/10 text-[#0075de]">
                        <Truck className="w-3 h-3" />
                        <span>Đang vận chuyển</span>
                    </span>
                );
            case "Cancelled":
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eb5757]/10 text-[#eb5757]">
                        <XCircle className="w-3 h-3" />
                        <span>Đã hủy</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#dd5b00]/10 text-[#dd5b00]">
                        <Clock className="w-3 h-3" />
                        <span>Chờ xác nhận</span>
                    </span>
                );
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] p-6 sm:p-8 space-y-4 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold tracking-tight text-[#000000]">
                        Tra cứu đơn hàng trực tuyến
                    </h1>
                    <p className="text-xs text-[#615d59]">
                        Nhập số điện thoại đặt hàng để kiểm tra lộ trình giao hàng và quản lý đơn.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a39e98]" />
                        <input
                            type="text"
                            required
                            placeholder="Nhập số điện thoại hoặc mã đơn..."
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-[6px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold transition-colors shrink-0"
                    >
                        Tra cứu
                    </button>
                </form>
            </div>

            {searchedPhone && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-[#615d59]">
                        <span>Kết quả tra cứu cho: {searchedPhone}</span>
                        <span>{matchingOrders.length} đơn hàng</span>
                    </div>

                    {matchingOrders.length === 0 ? (
                        <div className="text-center py-16 rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] space-y-2 p-6">
                            <Package className="w-8 h-8 mx-auto text-[#a39e98]" />
                            <p className="text-xs text-[#615d59]">
                                Không tìm thấy đơn hàng nào liên kết với thông tin này.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {matchingOrders.map((order) => {
                                const canCancel =
                                    order.status === "Pending" || order.status === "Draft";

                                return (
                                    <div
                                        key={order.id}
                                        className="rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e6e6e6] pb-3">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs text-[#000000]">
                                                        {order.orderNumber}
                                                    </span>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                                <p className="text-[11px] text-[#615d59]">
                                                    Thời gian đặt:{" "}
                                                    {new Date(order.orderDate).toLocaleString(
                                                        "vi-VN",
                                                    )}
                                                </p>
                                            </div>

                                            <div className="text-left sm:text-right">
                                                <div className="text-sm font-bold text-[#0075de]">
                                                    {order.totalAmount.toLocaleString("vi-VN")} ₫
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
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
                                                        {item.totalPrice.toLocaleString("vi-VN")} ₫
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-3 border-t border-[#e6e6e6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#615d59]">
                                            <div className="truncate flex-1">
                                                <span>Địa chỉ nhận: {order.shippingAddress}</span>
                                            </div>

                                            {canCancel && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {cancellingId === order.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] text-[#eb5757]">
                                                                Xác nhận hủy đơn?
                                                            </span>
                                                            <button
                                                                type="button"
                                                                disabled={cancelMutation.isPending}
                                                                onClick={() =>
                                                                    cancelMutation.mutate(order.id)
                                                                }
                                                                className="px-2.5 py-1 rounded-[6px] bg-[#eb5757] text-white text-[11px] font-semibold hover:bg-[#c0392b]"
                                                            >
                                                                {cancelMutation.isPending
                                                                    ? "Đang hủy..."
                                                                    : "Đồng ý"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setCancellingId(null)
                                                                }
                                                                className="px-2.5 py-1 rounded-[6px] border border-[#e6e6e6] text-[11px] hover:bg-[#f6f5f4]"
                                                            >
                                                                Đóng
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setCancellingId(order.id)
                                                            }
                                                            className="px-3 py-1.5 rounded-[6px] border border-[#eb5757] text-[#eb5757] hover:bg-[#eb5757]/10 text-xs font-semibold transition-colors"
                                                        >
                                                            Hủy đặt hàng
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
