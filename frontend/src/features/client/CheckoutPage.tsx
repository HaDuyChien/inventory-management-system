import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CreditCard, Banknote, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { mockApi } from "@/services/mockApi";
import { useCartStore } from "@/stores/useCartStore";
import { useCustomerAuthStore } from "@/stores/useCustomerAuthStore";
import { toast } from "@/stores/useToastStore";
import type { OrderLineItem } from "@/types";

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { items, clearCart, getTotalPrice } = useCartStore();
    const { user } = useCustomerAuthStore();

    const [form, setForm] = useState({
        name: user?.name || "Nguyễn Văn An",
        phone: user?.phone || "0912345678",
        address: user?.address || "Số 15 Phố Huế, Hoàn Kiếm, Hà Nội",
        paymentMethod: "VNPAY" as "COD" | "VNPAY",
        notes: "",
    });

    const [submittedOrder, setSubmittedOrder] = useState<string | null>(null);
    const [isRedirectingVNPay, setIsRedirectingVNPay] = useState(false);

    const subtotal = getTotalPrice();
    const total = subtotal;

    const orderMutation = useMutation({
        mutationFn: async () => {
            const lineItems: OrderLineItem[] = items.map((i) => ({
                id: `line-${Date.now()}-${i.product.id}`,
                productId: i.product.id,
                productName: i.product.name,
                sku: i.product.sku,
                quantity: i.quantity,
                unitPrice: i.product.sellingPrice,
                totalPrice: i.product.sellingPrice * i.quantity,
            }));

            const newOrder = await mockApi.createSalesOrder({
                customerName: form.name.trim(),
                customerEmail: user?.email || `${form.phone}@client.inventohub.vn`,
                customerPhone: form.phone.trim(),
                warehouseId: "wh-hn-01",
                warehouseName: "Kho Hà Nội",
                status: "Pending",
                paymentStatus: "PENDING",
                paymentMethod: form.paymentMethod,
                orderDate: new Date().toISOString(),
                items: lineItems,
                subtotal,
                tax: 0,
                totalAmount: total,
                shippingAddress: `${form.address.trim()} - Điện thoại liên hệ: ${form.phone.trim()}`,
                notes: `Phương thức thanh toán: ${form.paymentMethod}. Ghi chú: ${form.notes || "Không"}`,
            });

            if (form.paymentMethod === "VNPAY") {
                setIsRedirectingVNPay(true);
                const paymentRes = await mockApi.createVNPayUrl({
                    orderId: newOrder.id,
                    orderNumber: newOrder.orderNumber,
                });
                return { newOrder, paymentUrl: paymentRes.paymentUrl };
            }

            return { newOrder, paymentUrl: null };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["stock"] });
            queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });

            if (data.paymentUrl) {
                window.location.href = data.paymentUrl;
                return;
            }

            clearCart();
            setSubmittedOrder(data.newOrder.orderNumber);
        },
        onError: (err: any) => {
            setIsRedirectingVNPay(false);
            toast.error(
                "Đặt hàng thất bại",
                err.response?.data?.thongDiep || err.message || "Có lỗi xảy ra khi tạo đơn hàng",
            );
        },
    });

    if (submittedOrder) {
        return (
            <div className="max-w-md mx-auto text-center py-16 space-y-4 rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] p-8 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#1aae39]/10 text-[#1aae39] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-bold tracking-tight text-[#000000]">
                        Đặt hàng thành công
                    </h2>
                    <p className="text-xs text-[#615d59] font-mono">Mã đơn: {submittedOrder}</p>
                </div>
                <p className="text-xs text-[#615d59]">
                    Đơn hàng của bạn đang ở trạng thái Chờ xác nhận. Bạn có thể tra cứu đơn hàng
                    bằng số điện thoại bất kỳ lúc nào.
                </p>
                <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(`/store/lookup?phone=${encodeURIComponent(form.phone)}`)
                        }
                        className="px-5 py-2.5 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold transition-colors"
                    >
                        Tra cứu đơn hàng
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/store")}
                        className="px-5 py-2.5 rounded-full border border-[#e6e6e6] hover:bg-[#f6f5f4] text-[#000000] text-xs font-semibold transition-colors"
                    >
                        Tiếp tục mua sắm
                    </button>
                </div>
            </div>
        );
    }

    if (items.length === 0 && !isRedirectingVNPay) {
        return (
            <div className="max-w-md mx-auto text-center py-16 space-y-3 rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] p-6">
                <p className="text-xs text-[#615d59]">Chưa có sản phẩm để đặt hàng</p>
                <Link
                    to="/store"
                    className="inline-flex items-center gap-1.5 text-xs text-[#0075de] font-semibold hover:underline"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại cửa hàng</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center gap-3">
                <Link
                    to="/store/cart"
                    className="p-1.5 rounded-[6px] hover:bg-[#ffffff] text-[#615d59] hover:text-[#000000] border border-transparent hover:border-[#e6e6e6]"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-lg font-bold tracking-tight text-[#000000]">
                    Thông tin thanh toán
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[#615d59]">
                            Địa chỉ nhận hàng
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-[#000000] block mb-1">
                                    Họ tên người nhận
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-[#000000] block mb-1">
                                    Số điện thoại nhận hàng
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Địa chỉ giao hàng chi tiết
                            </label>
                            <input
                                type="text"
                                required
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Ghi chú đơn hàng
                            </label>
                            <input
                                type="text"
                                placeholder="Giao giờ hành chính, gọi trước khi đến..."
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            />
                        </div>
                    </div>

                    <div className="rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] p-5 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-[#615d59]">
                                Phương thức thanh toán
                            </h2>
                            <span className="text-[11px] text-[#0075de] font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Bảo mật chuẩn SSL</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, paymentMethod: "VNPAY" })}
                                className={`p-4 rounded-[10px] border text-left flex items-start gap-3 transition-all ${
                                    form.paymentMethod === "VNPAY"
                                        ? "border-[#0075de] bg-[#0075de]/5 ring-2 ring-[#0075de]/20"
                                        : "border-[#e6e6e6] hover:bg-[#f6f5f4]"
                                }`}
                            >
                                <div className="w-9 h-9 rounded-full bg-[#0075de]/10 text-[#0075de] flex items-center justify-center shrink-0 mt-0.5">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-[#000000]">
                                            Cổng thanh toán VNPay
                                        </span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0075de] text-white">
                                            Khuyên dùng
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-[#615d59] leading-snug">
                                        Quét mã VNPAY-QR, Thẻ ATM nội địa hoặc Thẻ quốc tế
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setForm({ ...form, paymentMethod: "COD" })}
                                className={`p-4 rounded-[10px] border text-left flex items-start gap-3 transition-all ${
                                    form.paymentMethod === "COD"
                                        ? "border-[#0075de] bg-[#0075de]/5 ring-2 ring-[#0075de]/20"
                                        : "border-[#e6e6e6] hover:bg-[#f6f5f4]"
                                }`}
                            >
                                <div className="w-9 h-9 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center justify-center shrink-0 mt-0.5">
                                    <Banknote className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-[#000000] block">
                                        Tiền mặt COD
                                    </span>
                                    <div className="text-[11px] text-[#615d59] leading-snug">
                                        Thanh toán tiền mặt khi nhận hàng tận nơi
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#615d59]">
                        Đơn đặt mua
                    </h2>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {items.map(({ product, quantity }) => (
                            <div
                                key={product.id}
                                className="flex items-center justify-between text-xs gap-2"
                            >
                                <div className="truncate flex-1 min-w-0">
                                    <span className="font-semibold text-[#000000] truncate block">
                                        {product.name}
                                    </span>
                                    <span className="text-[#615d59] text-[11px]">
                                        Số lượng {quantity}
                                    </span>
                                </div>
                                <span className="font-bold text-[#000000] shrink-0">
                                    {(product.sellingPrice * quantity).toLocaleString("vi-VN")} ₫
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 border-t border-[#e6e6e6] space-y-2 text-xs">
                        <div className="flex justify-between text-[#615d59]">
                            <span>Tạm tính</span>
                            <span className="font-semibold text-[#000000]">
                                {subtotal.toLocaleString("vi-VN")} ₫
                            </span>
                        </div>
                        <div className="flex justify-between text-[#615d59]">
                            <span>Vận chuyển</span>
                            <span className="font-semibold text-[#1aae39]">Miễn phí</span>
                        </div>
                        <div className="pt-2 border-t border-[#e6e6e6] flex justify-between font-bold text-sm text-[#000000]">
                            <span>Tổng cộng</span>
                            <span className="text-[#0075de]">
                                {total.toLocaleString("vi-VN")} ₫
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={
                            orderMutation.isPending || isRedirectingVNPay || !form.name || !form.phone || !form.address
                        }
                        onClick={() => orderMutation.mutate()}
                        className="w-full py-3 px-4 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                        {orderMutation.isPending || isRedirectingVNPay ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>
                                    {form.paymentMethod === "VNPAY"
                                        ? "Đang kết nối cổng thanh toán VNPay..."
                                        : "Đang xác nhận đơn hàng..."}
                                </span>
                            </>
                        ) : form.paymentMethod === "VNPAY" ? (
                            <>
                                <CreditCard className="w-4 h-4" />
                                <span>Thanh toán ngay qua VNPay</span>
                                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>Xác nhận đặt hàng</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
