import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sliders } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AdjustStockModal } from "@/features/products/AdjustStockModal";
import { mockApi } from "@/services/mockApi";
import type { StockItem, Product } from "@/types";
import { formatNumber } from "@/utils/formatters";
import { ExportButtons } from "@/components/ui/ExportButtons";

export const StockPage: React.FC = () => {
    const [search, setSearch] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

    const { data: stockItems = [], isLoading } = useQuery({
        queryKey: ["stock-levels"],
        queryFn: mockApi.getStockLevels,
    });

    const { data: products = [] } = useQuery({
        queryKey: ["products"],
        queryFn: mockApi.getProducts,
    });

    const filtered = useMemo(() => {
        return stockItems.filter((item) => {
            const matchSearch =
                item.productName.toLowerCase().includes(search.toLowerCase()) ||
                item.sku.toLowerCase().includes(search.toLowerCase());
            const matchWh = !selectedWarehouse || item.warehouseName === selectedWarehouse;
            const matchCat = !selectedCategory || item.category === selectedCategory;
            const matchStatus = !selectedStatus || item.status === selectedStatus;

            return matchSearch && matchWh && matchCat && matchStatus;
        });
    }, [stockItems, search, selectedWarehouse, selectedCategory, selectedStatus]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const exportColumns = [
        { header: "Mã SKU", key: "sku" },
        { header: "Tên sản phẩm", key: "productName" },
        { header: "Kho hàng", key: "warehouseName" },
        { header: "Vị trí", key: "location" },
        { header: "Tồn thực tế", key: "onHand", format: (v: number) => formatNumber(v) },
        { header: "Đã tạm giữ", key: "reserved", format: (v: number) => formatNumber(v) },
        { header: "Có thể bán", key: "available", format: (v: number) => formatNumber(v) },
        { header: "Định mức tối thiểu", key: "minStock", format: (v: number) => formatNumber(v) },
        {
            header: "Tình trạng",
            key: "status",
            format: (v: string) =>
                v === "IN_STOCK" ? "An toàn" : v === "LOW_STOCK" ? "Sắp hết" : "Hết hàng",
        },
    ];

    const columns: Column<StockItem>[] = [
        {
            key: "productName",
            header: "Sản phẩm / SKU",
            sortable: true,
            render: (item) => (
                <div className="flex flex-col py-1">
                    <span className="font-semibold text-[#000000]">{item.productName}</span>
                    <span className="text-xs text-[#615d59] font-mono">{item.sku}</span>
                </div>
            ),
        },
        {
            key: "warehouseName",
            header: "Kho & Vị trí",
            render: (item) => (
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-[#000000]">{item.warehouseName}</span>
                    <span className="text-[11px] text-[#615d59] font-mono">{item.location}</span>
                </div>
            ),
        },
        {
            key: "onHand",
            header: "Tồn thực tế",
            sortable: true,
            render: (item) => (
                <span className="font-bold text-[#000000]">{formatNumber(item.onHand)}</span>
            ),
        },
        {
            key: "reserved",
            header: "Đã tạm giữ",
            sortable: true,
            render: (item) => (
                <span className="text-[#dd5b00] font-medium">{formatNumber(item.reserved)}</span>
            ),
        },
        {
            key: "available",
            header: "Có thể bán",
            sortable: true,
            render: (item) => (
                <span className="font-bold text-[#1aae39]">{formatNumber(item.available)}</span>
            ),
        },
        {
            key: "minStock",
            header: "Định mức tối thiểu",
            sortable: true,
            render: (item) => (
                <span className="text-xs text-[#615d59] font-mono">{item.minStock}</span>
            ),
        },
        {
            key: "status",
            header: "Tình trạng",
            render: (item) => {
                const isOut = item.status === "OUT_OF_STOCK";
                const isLow = item.status === "LOW_STOCK";
                return (
                    <Badge variant={isOut ? "danger" : isLow ? "warning" : "success"} size="xs" dot>
                        {isOut ? "Hết hàng" : isLow ? "Sắp hết" : "An toàn"}
                    </Badge>
                );
            },
        },
        {
            key: "actions",
            header: "",
            render: (item) => {
                const prod = products.find((p) => p.id === item.productId);
                return (
                    <Button
                        variant="utility"
                        size="xs"
                        onClick={() => prod && setAdjustingProduct(prod)}
                        leftIcon={<Sliders className="w-3 h-3" />}
                    >
                        Điều chỉnh
                    </Button>
                );
            },
        },
    ];

    const warehouses = Array.from(new Set(stockItems.map((s) => s.warehouseName)));
    const categories = Array.from(new Set(stockItems.map((s) => s.category)));

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                        Quản lý tồn kho
                    </h1>
                    <p className="text-xs text-[#615d59]">
                        Theo dõi lượng tồn khả dụng, hàng giữ chỗ và ngưỡng an toàn từng vị trí
                    </p>
                </div>

                <ExportButtons
                    filename="danh-sach-ton-kho"
                    title="Danh sách tồn kho chi tiết"
                    columns={exportColumns}
                    data={filtered}
                />
            </div>

            <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <SearchInput
                    placeholder="Tìm theo sản phẩm hoặc SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch("")}
                    className="max-w-xs"
                />

                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="bg-white text-xs border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-[#0075de]"
                    >
                        <option value="">Tất cả kho</option>
                        {warehouses.map((w) => (
                            <option key={w} value={w}>
                                {w}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-white text-xs border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-[#0075de]"
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="bg-white text-xs border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-[#0075de]"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="IN_STOCK">An toàn</option>
                        <option value="LOW_STOCK">Sắp hết</option>
                        <option value="OUT_OF_STOCK">Hết hàng</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={paginatedData}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
                pagination={{
                    currentPage,
                    totalPages,
                    totalItems: filtered.length,
                    pageSize,
                    onPageChange: setCurrentPage,
                    onPageSizeChange: setPageSize,
                }}
            />

            <AdjustStockModal
                product={adjustingProduct}
                isOpen={!!adjustingProduct}
                onClose={() => setAdjustingProduct(null)}
            />
        </div>
    );
};
