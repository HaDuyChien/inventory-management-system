import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sliders } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/data-table/Pagination";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { AdjustStockModal } from "@/features/products/AdjustStockModal";
import { mockApi } from "@/services/mockApi";
import type { Product } from "@/types";
import { formatNumber } from "@/utils/formatters";

export const AdjustmentsPage: React.FC = () => {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

    const { data: products = [] } = useQuery({
        queryKey: ["products"],
        queryFn: mockApi.getProducts,
    });

    const filtered = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()),
    );

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedProducts = filtered.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const exportColumns = [
        { header: "Mã SKU", key: "sku" },
        { header: "Tên sản phẩm", key: "name" },
        { header: "Vị trí kho", key: "location" },
        { header: "Tồn hệ thống", key: "stock", format: (v: number) => formatNumber(v) },
        { header: "Định mức", key: "minStock", format: (v: number) => formatNumber(v) },
        {
            header: "Tình trạng",
            key: "stock",
            format: (_: any, p: Product) => (p.stock > p.minStock ? "An toàn" : "Sắp hết"),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                        Kiểm kê và Điều chỉnh tồn kho
                    </h1>
                    <p className="text-xs text-[#615d59]">
                        Đối soát số lượng tồn thực tế so với số liệu ghi nhận trên phần mềm
                    </p>
                </div>

                <ExportButtons
                    filename="kiem-ke-dieu-chinh-ton-kho"
                    title="Danh sách kiểm kê và điều chỉnh kho"
                    columns={exportColumns}
                    data={filtered}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-[#e6e6e6] rounded-[8px]">
                    <span className="text-xs text-[#615d59]">Mặt hàng kiểm kê</span>
                    <p className="text-[20px] font-bold text-[#000000] mt-1">
                        {products.length} mã SKU
                    </p>
                </div>
                <div className="p-4 bg-white border border-[#e6e6e6] rounded-[8px]">
                    <span className="text-xs text-[#615d59]">Ngưỡng sai lệch cho phép</span>
                    <p className="text-[20px] font-bold text-[#dd5b00] mt-1">± 2.5%</p>
                </div>
                <div className="p-4 bg-white border border-[#e6e6e6] rounded-[8px]">
                    <span className="text-xs text-[#615d59]">Kỳ kiểm kê gần nhất</span>
                    <p className="text-[18px] font-bold text-[#000000] mt-1">10/09/2026</p>
                </div>
            </div>

            <Card variant="flat" padding="md">
                <CardHeader>
                    <CardTitle>Danh sách sản phẩm kiểm kê</CardTitle>
                    <SearchInput
                        placeholder="Tìm SKU hoặc tên sản phẩm..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setSearch("");
                            setCurrentPage(1);
                        }}
                        className="max-w-xs"
                    />
                </CardHeader>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#e6e6e6] text-[#615d59] uppercase tracking-wider text-[11px]">
                                <th className="py-2.5">Sản phẩm và SKU</th>
                                <th className="py-2.5">Vị trí</th>
                                <th className="py-2.5">Tồn hệ thống</th>
                                <th className="py-2.5">Định mức</th>
                                <th className="py-2.5">Tình trạng</th>
                                <th className="py-2.5 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6e6e6]">
                            {paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-[#615d59]">
                                        Không tìm thấy sản phẩm nào
                                    </td>
                                </tr>
                            ) : (
                                paginatedProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-[#f6f5f4] transition-colors"
                                    >
                                        <td className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-[#000000]">
                                                    {product.name}
                                                </span>
                                                <span className="text-[#615d59] font-mono">
                                                    {product.sku}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 font-mono text-[#31302e]">
                                            {product.location}
                                        </td>
                                        <td className="py-3 font-bold text-sm text-[#000000]">
                                            {formatNumber(product.stock)}
                                        </td>
                                        <td className="py-3 text-[#615d59]">{product.minStock}</td>
                                        <td className="py-3">
                                            <Badge
                                                variant={
                                                    product.stock > product.minStock
                                                        ? "success"
                                                        : "warning"
                                                }
                                                size="xs"
                                            >
                                                {product.stock > product.minStock
                                                    ? "An toàn"
                                                    : "Sắp hết"}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-right">
                                            <Button
                                                variant="utility"
                                                size="xs"
                                                onClick={() => setAdjustingProduct(product)}
                                                leftIcon={<Sliders className="w-3 h-3" />}
                                            >
                                                Khớp kho và Điều chỉnh
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                />
            </Card>

            <AdjustStockModal
                product={adjustingProduct}
                isOpen={!!adjustingProduct}
                onClose={() => setAdjustingProduct(null)}
            />
        </div>
    );
};
