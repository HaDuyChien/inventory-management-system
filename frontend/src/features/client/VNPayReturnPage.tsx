import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowRight,
    ShoppingBag,
    Package,
    ShieldCheck,
    CreditCard,
    RotateCcw,
} from "lucide-react";
import { mockApi } from "@/services/mockApi";
import { useCartStore } from "@/stores/useCartStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { formatCurrency } from "@/utils/formatters";

export const VNPayReturnPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { clearCart } = useCartStore();

    const [verifying, setVerifying] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const paramsObj: Record<string, string> = {};
        queryParams.forEach((value, key) => {
            paramsObj[key] = value;
        });

        if (Object.keys(paramsObj).length === 0) {
            setErrorMsg("Không tìm thấy thông tin giao dịch thanh toán");
            setVerifying(false);
            return;
        }

        const verify = async () => {
            try {
                const res = await mockApi.verifyVNPay(paramsObj);
                setResult(res);
                if (res && res.isSuccess) {
                    clearCart();
                    queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                    queryClient.invalidateQueries({ queryKey: ["stock"] });
                    useNotificationStore.getState().addNotification({
                        id: `vnpay-${res.orderNumber || Date.now()}`,
                        title: "Đơn hàng mới thanh toán VNPay",
                        desc: `Đơn hàng ${res.orderNumber || "mới"} thanh toán ${formatCurrency(res.amount || 0)} thành công.`,
                        type: "order",
                        link: "/orders/sales",
                        badge: "Đã thanh toán",
                        badgeVariant: "success",
                    });
                }
            } catch (err: any) {
                setErrorMsg(
                    err.response?.data?.thongDiep ||
                    err.message ||
                    "Không thể xác thực giao dịch với máy chủ",
                );
            } finally {
                setVerifying(false);
            }
        };

        verify();
    }, [location.search, clearCart, queryClient]);

    if (verifying) {
        return (
            <div className="max-w-md mx-auto my-12 text-center py-16 space-y-4 rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] p-8 shadow-sm">
                <Loader2 className="w-10 h-10 animate-spin text-[#0075de] mx-auto" />
                <h2 className="text-base font-bold text-[#000000]">
                    Đang xác thực kết quả thanh toán VNPay...
                </h2>
                <p className="text-xs text-[#615d59]">
                    Hệ thống đang kiểm tra chữ ký số và đối soát trạng thái đơn hàng. Vui lòng không đóng trình duyệt.
                </p>
            </div>
        );
    }

    const isSuccess = result?.isSuccess;
    const orderNumber = result?.orderNumber || "";
    const amount = result?.amount || 0;
    const transactionNo = result?.transactionNo || "";
    const bankCode = result?.bankCode || "";
    const message = result?.message || errorMsg || "Giao dịch không thành công";

    return (
        <div className="max-w-lg mx-auto my-6 space-y-6">
            <div className="rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] p-6 sm:p-8 shadow-sm text-center space-y-6">
                <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                        isSuccess
                            ? "bg-[#10b981]/10 text-[#10b981]"
                            : "bg-[#eb5757]/10 text-[#eb5757]"
                    }`}
                >
                    {isSuccess ? (
                        <CheckCircle2 className="w-10 h-10" />
                    ) : (
                        <XCircle className="w-10 h-10" />
                    )}
                </div>

                <div className="space-y-1.5">
                    <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isSuccess
                                ? "bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]"
                                : "bg-[#fef2f2] text-[#eb5757] border border-[#fecaca]"
                        }`}
                    >
                        {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
                    </span>

                    <h1 className="text-xl font-bold tracking-tight text-[#000000]">
                        {isSuccess
                            ? "Thanh toán đơn hàng thành công"
                            : "Giao dịch thanh toán chưa hoàn tất"}
                    </h1>

                    <p className="text-xs text-[#615d59] max-w-sm mx-auto">
                        {isSuccess
                            ? "Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được thanh toán và chuyển sang trạng thái Đã xác nhận."
                            : message}
                    </p>
                </div>

                <div className="rounded-[12px] border border-[#e6e6e6] bg-[#fafafa] p-4 text-left space-y-2.5 text-xs">
                    {orderNumber && (
                        <div className="flex justify-between items-center py-1 border-b border-[#e6e6e6]/60">
                            <span className="text-[#615d59]">Mã đơn hàng</span>
                            <span className="font-mono font-bold text-[#000000]">{orderNumber}</span>
                        </div>
                    )}

                    {amount > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-[#e6e6e6]/60">
                            <span className="text-[#615d59]">Số tiền thanh toán</span>
                            <span className="font-bold text-[#0075de] text-sm">
                                {formatCurrency(amount)}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center py-1 border-b border-[#e6e6e6]/60">
                        <span className="text-[#615d59]">Cổng thanh toán</span>
                        <span className="font-semibold text-[#000000] flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-[#0075de]" />
                            <span>VNPay Sandbox</span>
                        </span>
                    </div>

                    {transactionNo && (
                        <div className="flex justify-between items-center py-1 border-b border-[#e6e6e6]/60">
                            <span className="text-[#615d59]">Mã giao dịch VNPay</span>
                            <span className="font-mono font-semibold text-[#000000]">{transactionNo}</span>
                        </div>
                    )}

                    {bankCode && (
                        <div className="flex justify-between items-center py-1 border-b border-[#e6e6e6]/60">
                            <span className="text-[#615d59]">Ngân hàng</span>
                            <span className="font-semibold text-[#000000]">{bankCode}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center py-1">
                        <span className="text-[#615d59]">Trạng thái giao dịch</span>
                        <span
                            className={`font-semibold ${
                                isSuccess ? "text-[#10b981]" : "text-[#eb5757]"
                            }`}
                        >
                            {isSuccess ? "Đã đối soát thành công" : message}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    {isSuccess ? (
                        <>
                            <Link
                                to="/store/orders"
                                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                <Package className="w-4 h-4" />
                                <span>Xem đơn hàng của tôi</span>
                            </Link>
                            <Link
                                to="/store"
                                className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#e6e6e6] hover:bg-[#f6f5f4] text-[#000000] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>Tiếp tục mua sắm</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/store/cart"
                                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Thử thanh toán lại</span>
                            </Link>
                            <Link
                                to="/store/orders"
                                className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#e6e6e6] hover:bg-[#f6f5f4] text-[#000000] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <span>Tra cứu đơn hàng</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
