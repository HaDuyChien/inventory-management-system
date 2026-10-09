import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Edit, Sliders, Warehouse, ShieldCheck, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { AdjustStockModal } from "./AdjustStockModal";
import { mockApi } from "@/services/mockApi";
import { formatCurrency, formatNumber, formatDate } from "@/utils/formatters";

export const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

    const {
        data: product,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["product", id],
        queryFn: () => mockApi.getProductById(id || ""),
        enabled: !!id,
    });

    const { data: allTransactions = [] } = useQuery({
        queryKey: ["transactions"],
        queryFn: mockApi.getTransactions,
    });

    if (isLoading) return <LoadingState message="Đang tải thông tin sản phẩm..." />;
    if (error || !product)
        return <ErrorState title="Không tìm thấy sản phẩm" onRetry={() => navigate("/products")} />;

    const productTransactions = allTransactions.filter((tx) => tx.productId === product.id);

    const tabs = [
        { id: "overview", label: "Tổng quan" },
        { id: "inventory", label: "Tồn kho chi tiết", count: `${product.stock}` },
        { id: "serials", label: "Mã Serial", count: product.serialNumbers?.length || 0 },
        { id: "transactions", label: "Lịch sử biến động", count: productTransactions.length },
        { id: "warranty", label: "Bảo hành" },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <Button
                        variant="utility"
                        size="sm"
                        onClick={() => navigate("/products")}
                        leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    >
                        Quay lại
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                                {product.name}
                            </h1>
                            <Badge
                                variant={product.status === "ACTIVE" ? "primary" : "gray"}
                                size="xs"
                                dot
                            >
                                {product.status === "ACTIVE" ? "Đang bán" : "Nháp"}
                            </Badge>
                        </div>
                        <p className="text-xs text-[#615d59]">
                            Mã: <span className="font-mono text-[#000000]">{product.sku}</span> |
                            Hãng:{" "}
                            <span className="font-medium text-[#000000]">{product.brand}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="utility"
                        size="sm"
                        onClick={() => setIsAdjustModalOpen(true)}
                        leftIcon={<Sliders className="w-3.5 h-3.5" />}
                    >
                        Cân Đối Kho
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                    >
                        Chỉnh Sửa
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] shadow-notion-sm">
                    <span className="text-xs text-[#615d59]">Tồn Thực Tế</span>
                    <p className="text-[18px] font-bold text-[#000000] mt-0.5">
                        {formatNumber(product.stock)} chiếc
                    </p>
                </div>
                <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] shadow-notion-sm">
                    <span className="text-xs text-[#615d59]">Giá Bán</span>
                    <p className="text-[18px] font-bold text-[#000000] mt-0.5">
                        {formatCurrency(product.sellingPrice)}
                    </p>
                </div>
                <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] shadow-notion-sm">
                    <span className="text-xs text-[#615d59]">Giá Trị Tồn</span>
                    <p className="text-[18px] font-bold text-[#000000] mt-0.5">
                        {formatCurrency(product.stock * product.costPrice)}
                    </p>
                </div>
                <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] shadow-notion-sm">
                    <span className="text-xs text-[#615d59]">Kho Chứa</span>
                    <p className="text-[14px] font-semibold text-[#000000] mt-1 truncate">
                        {product.warehouseName}
                    </p>
                </div>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card variant="flat" padding="md" className="md:col-span-2 space-y-3">
                        <CardHeader>
                            <CardTitle>Mô Tả & Thông Số</CardTitle>
                        </CardHeader>
                        <p className="text-[13.5px] text-[#31302e] leading-relaxed">
                            {product.description}
                        </p>

                        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-2 border-t border-[#e6e6e6] text-xs">
                            <div>
                                <span className="text-[#615d59]">Model</span>
                                <p className="font-medium text-[#000000] mt-0.5">
                                    {product.model || "Tiêu chuẩn"}
                                </p>
                            </div>
                            <div>
                                <span className="text-[#615d59]">Danh mục</span>
                                <p className="font-medium text-[#000000] mt-0.5">
                                    {product.category}
                                </p>
                            </div>
                            <div>
                                <span className="text-[#615d59]">Mã vạch</span>
                                <p className="font-mono font-medium text-[#000000] mt-0.5">
                                    {product.barcode || "—"}
                                </p>
                            </div>
                            <div>
                                <span className="text-[#615d59]">Ngưỡng cảnh báo</span>
                                <p className="font-semibold text-[#dd5b00] mt-0.5">
                                    {product.minStock} chiếc
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card variant="flat" padding="md" className="space-y-3">
                        <CardHeader>
                            <CardTitle>Hình Ảnh</CardTitle>
                        </CardHeader>
                        <div className="aspect-square bg-[#f6f5f4] rounded-[8px] border border-[#e6e6e6] overflow-hidden flex items-center justify-center p-2">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-[6px]"
                            />
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "inventory" && (
                <Card variant="flat" padding="md" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 bg-[#f6f5f4] rounded-[8px] border border-[#e6e6e6]">
                            <span className="text-xs text-[#615d59]">Thực Tế Trong Kho</span>
                            <p className="text-[20px] font-bold text-[#000000] mt-1">
                                {product.stock} chiếc
                            </p>
                        </div>
                        <div className="p-3.5 bg-[#f6f5f4] rounded-[8px] border border-[#e6e6e6]">
                            <span className="text-xs text-[#615d59]">Đã Giữ Cho Đơn Hàng</span>
                            <p className="text-[20px] font-bold text-[#dd5b00] mt-1">
                                {product.reservedStock} chiếc
                            </p>
                        </div>
                        <div className="p-3.5 bg-[#f6f5f4] rounded-[8px] border border-[#e6e6e6]">
                            <span className="text-xs text-[#615d59]">Khả Dụng Bán</span>
                            <p className="text-[20px] font-bold text-[#1aae39] mt-1">
                                {product.availableStock} chiếc
                            </p>
                        </div>
                    </div>

                    <div className="p-3 border border-[#e6e6e6] rounded-[8px] bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Warehouse className="w-5 h-5 text-[#0075de]" />
                            <div>
                                <h5 className="text-sm font-semibold text-[#000000]">
                                    {product.warehouseName}
                                </h5>
                                <p className="text-xs text-[#615d59]">Vị trí: {product.location}</p>
                            </div>
                        </div>
                        <Badge variant="success" size="sm">
                            Đã gán ô kệ
                        </Badge>
                    </div>
                </Card>
            )}

            {activeTab === "serials" && (
                <Card variant="flat" padding="md">
                    <CardHeader>
                        <CardTitle>Danh Sách Mã Serial</CardTitle>
                    </CardHeader>

                    {!product.serialNumbers || product.serialNumbers.length === 0 ? (
                        <p className="text-xs text-[#615d59] py-6 text-center">
                            Chưa có số serial nào được đăng ký.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#e6e6e6] text-[#615d59] uppercase text-[11px]">
                                        <th className="py-2">Mã Serial</th>
                                        <th className="py-2">Trạng Thái</th>
                                        <th className="py-2">Vị Trí</th>
                                        <th className="py-2">Ngày Nhập</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e6e6e6]">
                                    {product.serialNumbers.map((sn) => (
                                        <tr key={sn.id} className="hover:bg-[#f6f5f4]">
                                            <td className="py-2.5 font-mono font-semibold text-[#000000]">
                                                {sn.serial}
                                            </td>
                                            <td className="py-2.5">
                                                <Badge
                                                    variant={
                                                        sn.status === "IN_STOCK"
                                                            ? "success"
                                                            : sn.status === "ALLOCATED"
                                                              ? "warning"
                                                              : sn.status === "SOLD"
                                                                ? "gray"
                                                                : "danger"
                                                    }
                                                    size="xs"
                                                >
                                                    {sn.status === "IN_STOCK"
                                                        ? "Trong kho"
                                                        : sn.status === "ALLOCATED"
                                                          ? "Đã giữ"
                                                          : sn.status === "SOLD"
                                                            ? "Đã xuất"
                                                            : "Lỗi"}
                                                </Badge>
                                            </td>
                                            <td className="py-2.5 text-[#615d59] font-mono">
                                                {sn.location}
                                            </td>
                                            <td className="py-2.5 text-[#a39e98]">
                                                {sn.receivedAt}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {activeTab === "transactions" && (
                <Card variant="flat" padding="md">
                    <CardHeader>
                        <CardTitle>Nhật Ký Xuất Nhập</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-[#e6e6e6] text-[#615d59] uppercase text-[11px]">
                                    <th className="py-2">Loại</th>
                                    <th className="py-2">Số Lượng</th>
                                    <th className="py-2">Tồn Trước → Sau</th>
                                    <th className="py-2">Người Thực Hiện</th>
                                    <th className="py-2">Mã Tham Chiếu</th>
                                    <th className="py-2">Ngày</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e6e6e6]">
                                {productTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-[#f6f5f4]">
                                        <td className="py-2.5">
                                            <Badge variant="primary" size="xs">
                                                {tx.type}
                                            </Badge>
                                        </td>
                                        <td className="py-2.5 font-bold">
                                            <span
                                                className={
                                                    tx.quantity > 0
                                                        ? "text-[#1aae39]"
                                                        : "text-[#eb5757]"
                                                }
                                            >
                                                {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-[#615d59]">
                                            {tx.before} → {tx.after}
                                        </td>
                                        <td className="py-2.5 text-[#000000]">{tx.user}</td>
                                        <td className="py-2.5 font-mono text-[#615d59]">
                                            {tx.reference}
                                        </td>
                                        <td className="py-2.5 text-[#a39e98]">
                                            {formatDate(tx.date)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === "warranty" && (
                <Card variant="flat" padding="md" className="space-y-3">
                    <CardHeader>
                        <CardTitle>Chính Sách Bảo Hành</CardTitle>
                    </CardHeader>
                    <div className="flex items-center gap-3 p-3 bg-[#1aae39]/10 border border-[#1aae39]/20 rounded-[8px]">
                        <ShieldCheck className="w-5 h-5 text-[#1aae39]" />
                        <div>
                            <h5 className="text-sm font-semibold text-[#000000]">
                                Thời Hạn: {product.warranty}
                            </h5>
                            <p className="text-xs text-[#615d59]">
                                Bảo hành chính hãng cho lỗi kỹ thuật từ nhà sản xuất.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            <AdjustStockModal
                product={product}
                isOpen={isAdjustModalOpen}
                onClose={() => setIsAdjustModalOpen(false)}
            />
        </div>
    );
};
