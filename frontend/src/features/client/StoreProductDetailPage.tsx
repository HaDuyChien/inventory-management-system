import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    ShoppingBag,
    Plus,
    Minus,
    Check,
    ShieldCheck,
    Truck,
    RotateCcw,
} from "lucide-react";
import { mockApi } from "@/services/mockApi";
import { useCartStore } from "@/stores/useCartStore";

export const StoreProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    const { data: product, isLoading } = useQuery({
        queryKey: ["product", id],
        queryFn: () => mockApi.getProductById(id || ""),
        enabled: Boolean(id),
    });

    const { addItem } = useCartStore();

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
                <div className="h-6 bg-[#ffffff] rounded w-24" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="aspect-square bg-[#ffffff] rounded-[12px]" />
                    <div className="space-y-4">
                        <div className="h-8 bg-[#ffffff] rounded w-3/4" />
                        <div className="h-6 bg-[#ffffff] rounded w-1/3" />
                        <div className="h-24 bg-[#ffffff] rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-20 space-y-3 bg-[#ffffff] rounded-[12px] border border-[#e6e6e6]">
                <p className="text-[#615d59] text-sm">Không tìm thấy sản phẩm</p>
                <Link
                    to="/store"
                    className="inline-flex items-center gap-1.5 text-xs text-[#0075de] font-semibold hover:underline"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại danh mục</span>
                </Link>
            </div>
        );
    }

    const inStock = product.stock > 0;
    const maxQty = Math.max(1, product.stock);

    const handleAddToCart = () => {
        if (!inStock) return;
        addItem(product, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    const handleBuyNow = () => {
        if (!inStock) return;
        addItem(product, quantity);
        navigate("/store/checkout");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs text-[#615d59] hover:text-[#000000] transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại danh sách</span>
            </button>

            <div className="rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="rounded-[12px] border border-[#e6e6e6] bg-[#f6f5f4] p-4 flex items-center justify-center aspect-square overflow-hidden">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                        }}
                    />
                </div>

                <div className="space-y-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#0075de]">
                                {product.brand}
                            </span>
                            <span className="text-[#a39e98]">•</span>
                            <span className="text-xs text-[#615d59]">{product.category}</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#000000]">
                            {product.name}
                        </h1>
                        <p className="text-xs text-[#615d59] mt-1 font-mono">Mã: {product.sku}</p>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold tracking-tight text-[#000000]">
                            {product.sellingPrice.toLocaleString("vi-VN")} ₫
                        </span>
                        <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                inStock
                                    ? "bg-[#1aae39]/10 text-[#1aae39]"
                                    : "bg-[#eb5757]/10 text-[#eb5757]"
                            }`}
                        >
                            {inStock ? `Sẵn sàng giao ${product.stock}` : "Tạm hết hàng"}
                        </span>
                    </div>

                    <div className="border-t border-[#e6e6e6] pt-4 space-y-3">
                        <h3 className="text-xs font-bold text-[#000000] uppercase tracking-wider">
                            Thông số sản phẩm
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-[6px] bg-[#f6f5f4]">
                                <span className="text-[#615d59] block text-[11px]">Bảo hành</span>
                                <span className="font-semibold text-[#000000]">
                                    {product.warranty || "12 tháng"}
                                </span>
                            </div>
                            <div className="p-2 rounded-[6px] bg-[#f6f5f4]">
                                <span className="text-[#615d59] block text-[11px]">
                                    Xuất xứ kho
                                </span>
                                <span className="font-semibold text-[#000000]">
                                    {product.warehouseName || "Kho chính hãng"}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-[#615d59] leading-relaxed pt-1">
                            {product.description}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-[#e6e6e6] space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-medium text-[#615d59]">Số lượng:</span>
                            <div className="flex items-center border border-[#e6e6e6] rounded-[6px] overflow-hidden bg-[#ffffff]">
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                    className="p-2 hover:bg-[#f6f5f4] disabled:opacity-30 transition-colors"
                                >
                                    <Minus className="w-3.5 h-3.5 text-[#615d59]" />
                                </button>
                                <span className="w-10 text-center text-xs font-semibold text-[#000000]">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                                    disabled={quantity >= maxQty}
                                    className="p-2 hover:bg-[#f6f5f4] disabled:opacity-30 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5 text-[#615d59]" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                disabled={!inStock}
                                onClick={handleAddToCart}
                                className={`flex-1 py-2.5 px-4 rounded-[8px] text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                                    added
                                        ? "bg-[#1aae39] text-white"
                                        : "border border-[#e6e6e6] bg-[#ffffff] hover:bg-[#f6f5f4] text-[#000000]"
                                } disabled:opacity-40`}
                            >
                                {added ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Đã thêm vào giỏ</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-4 h-4" />
                                        <span>Thêm vào giỏ hàng</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                disabled={!inStock}
                                onClick={handleBuyNow}
                                className="flex-1 py-2.5 px-4 rounded-full text-xs font-semibold bg-[#0075de] hover:bg-[#005bab] text-white transition-colors disabled:opacity-40"
                            >
                                Đặt mua ngay
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#e6e6e6] text-[11px] text-[#615d59]">
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#0075de]" />
                            <span>Giao hàng tiêu chuẩn 24h</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-[#0075de]" />
                            <span>Đổi trả 7 ngày nếu lỗi</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
