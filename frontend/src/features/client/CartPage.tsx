import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";

export const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();

    const subtotal = getTotalPrice();
    const total = subtotal;

    if (items.length === 0) {
        return (
            <div className="max-w-md mx-auto text-center py-20 space-y-4 rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] p-8 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#f6f5f4] flex items-center justify-center mx-auto text-[#615d59]">
                    <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-base font-bold text-[#000000]">
                        Giỏ hàng chưa có sản phẩm
                    </h2>
                    <p className="text-xs text-[#615d59]">
                        Vui lòng lựa chọn các mặt hàng cần đặt để tiếp tục.
                    </p>
                </div>
                <Link
                    to="/store"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold transition-colors"
                >
                    <span>Khám phá sản phẩm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        to="/store"
                        className="p-1.5 rounded-[6px] hover:bg-[#ffffff] text-[#615d59] hover:text-[#000000] border border-transparent hover:border-[#e6e6e6]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight text-[#000000]">
                        Giỏ hàng của bạn
                    </h1>
                    <span className="text-xs text-[#615d59]">{items.length} mặt hàng đã chọn</span>
                </div>

                <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-[#eb5757] hover:underline"
                >
                    Xóa tất cả
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-3">
                    {items.map(({ product, quantity }) => {
                        const itemTotal = product.sellingPrice * quantity;
                        return (
                            <div
                                key={product.id}
                                className="rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] p-4 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                            >
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-16 h-16 rounded-[8px] object-contain bg-[#f6f5f4] shrink-0 border border-[#e6e6e6]"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                    }}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-mono text-[#615d59]">
                                        {product.sku}
                                    </div>
                                    <h3 className="text-xs sm:text-sm font-semibold text-[#000000] truncate">
                                        {product.name}
                                    </h3>
                                    <div className="text-xs font-bold text-[#0075de] mt-1">
                                        {product.sellingPrice.toLocaleString("vi-VN")} ₫
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center border border-[#e6e6e6] rounded-[6px] overflow-hidden bg-[#ffffff]">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(product.id, quantity - 1)}
                                            className="p-1.5 hover:bg-[#f6f5f4] text-[#615d59] transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-8 text-center text-xs font-semibold text-[#000000]">
                                            {quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(product.id, quantity + 1)}
                                            disabled={quantity >= product.stock}
                                            className="p-1.5 hover:bg-[#f6f5f4] text-[#615d59] disabled:opacity-30 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className="text-right w-24 hidden sm:block">
                                        <div className="text-xs font-bold text-[#000000]">
                                            {itemTotal.toLocaleString("vi-VN")} ₫
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeItem(product.id)}
                                        className="p-1.5 rounded-[6px] text-[#615d59] hover:text-[#eb5757] hover:bg-[#f6f5f4] transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#615d59]">
                        Tóm tắt đơn hàng
                    </h2>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between text-[#615d59]">
                            <span>Tiền hàng</span>
                            <span className="font-semibold text-[#000000]">
                                {subtotal.toLocaleString("vi-VN")} ₫
                            </span>
                        </div>
                        <div className="flex justify-between text-[#615d59]">
                            <span>Phí vận chuyển</span>
                            <span className="font-semibold text-[#1aae39]">Miễn phí</span>
                        </div>
                        <div className="pt-3 border-t border-[#e6e6e6] flex justify-between text-sm font-bold text-[#000000]">
                            <span>Tổng thanh toán</span>
                            <span className="text-[#0075de]">
                                {total.toLocaleString("vi-VN")} ₫
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/store/checkout")}
                        className="w-full py-2.5 px-4 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <span>Tiến hành đặt hàng</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <p className="text-[11px] text-center text-[#615d59]">
                        Kiểm tra hàng trước khi thanh toán
                    </p>
                </div>
            </div>
        </div>
    );
};
