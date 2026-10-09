import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Trash2, Edit, Eye, Sliders, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { DataTable } from "@/components/data-table/DataTable";
import type { Column } from "@/components/data-table/DataTable";
import { AdjustStockModal } from "./AdjustStockModal";
import { mockApi } from "@/services/mockApi";
import type { Product } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ExportButtons } from "@/components/ui/ExportButtons";

export const ProductListPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser } = useAuthStore();
    const canManage = currentUser?.role === "ADMIN" || currentUser?.role === "WAREHOUSE_MANAGER";
    const canAdjust = currentUser?.role !== "VIEWER";

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
    const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: mockApi.getProducts,
    });

    const deleteMutation = useMutation({
        mutationFn: mockApi.deleteProduct,
        onSuccess: () => {
            toast.success("Thành công", "Đã xóa sản phẩm khỏi hệ thống.");
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setDeletingProductId(null);
            setSelectedKeys((prev) => prev.filter((k) => k !== deletingProductId));
        },
        onError: (err: any) => {
            toast.error("Lỗi", err.message);
        },
    });

    const handleBulkDelete = async () => {
        if (!window.confirm(`Xác nhận xóa ${selectedKeys.length} sản phẩm đã chọn?`)) return;
        for (const key of selectedKeys) {
            await mockApi.deleteProduct(key);
        }
        queryClient.invalidateQueries({ queryKey: ["products"] });
        setSelectedKeys([]);
        toast.success("Thành công", `Đã xóa ${selectedKeys.length} sản phẩm.`);
    };

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchSearch =
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase()) ||
                p.brand.toLowerCase().includes(search.toLowerCase());

            const matchCat = !selectedCategory || p.category === selectedCategory;
            const matchWh = !selectedWarehouse || p.warehouseName === selectedWarehouse;

            let matchStat = true;
            if (selectedStatus === "IN_STOCK") matchStat = p.stock > p.minStock;
            else if (selectedStatus === "LOW_STOCK")
                matchStat = p.stock > 0 && p.stock <= p.minStock;
            else if (selectedStatus === "OUT_OF_STOCK") matchStat = p.stock === 0;

            return matchSearch && matchCat && matchWh && matchStat;
        });
    }, [products, search, selectedCategory, selectedStatus, selectedWarehouse]);

    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, currentPage, pageSize]);

    const exportColumns = [
        { header: "Mã SKU", key: "sku" },
        { header: "Tên sản phẩm", key: "name" },
        { header: "Danh mục", key: "category" },
        { header: "Thương hiệu", key: "brand" },
        { header: "Giá vốn", key: "costPrice", format: (v: number) => formatCurrency(v) },
        { header: "Giá bán", key: "sellingPrice", format: (v: number) => formatCurrency(v) },
        { header: "Tồn kho", key: "stock", format: (v: number) => formatNumber(v) },
        { header: "Định mức", key: "minStock", format: (v: number) => formatNumber(v) },
        { header: "Vị trí", key: "location" },
        { header: "Kho hàng", key: "warehouseName" },
        {
            header: "Trạng thái",
            key: "stock",
            format: (_: any, p: Product) =>
                p.stock > p.minStock ? "An toàn" : p.stock > 0 ? "Sắp hết" : "Hết hàng",
        },
    ];

    const columns: Column<Product>[] = [
        {
            key: "name",
            header: "Sản phẩm",
            sortable: true,
            render: (product) => (
                <div className="flex items-center gap-3 py-1">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-9 h-9 rounded-[6px] object-cover border border-[#e6e6e6] shrink-0 bg-white"
                    />
                    <div className="flex flex-col min-w-0">
                        <button
                            type="button"
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="font-semibold text-[#000000] hover:text-[#0075de] text-left truncate max-w-xs transition-colors"
                        >
                            {product.name}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-[#615d59]">
                            <span className="font-mono">{product.sku}</span>
                            <span>•</span>
                            <span>{product.brand}</span>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "category",
            header: "Danh mục",
            sortable: true,
            render: (p) => <span className="text-xs text-[#615d59]">{p.category}</span>,
        },
        {
            key: "sellingPrice",
            header: "Giá bán",
            sortable: true,
            render: (p) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-[#000000]">
                        {formatCurrency(p.sellingPrice)}
                    </span>
                    <span className="text-[11px] text-[#a39e98]">
                        Vốn: {formatCurrency(p.costPrice)}
                    </span>
                </div>
            ),
        },
        {
            key: "stock",
            header: "Tồn kho",
            sortable: true,
            render: (p) => {
                const isOutOfStock = p.stock === 0;
                const isLowStock = p.stock > 0 && p.stock <= p.minStock;

                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span
                                className={`font-bold ${
                                    isOutOfStock
                                        ? "text-[#eb5757]"
                                        : isLowStock
                                          ? "text-[#dd5b00]"
                                          : "text-[#000000]"
                                }`}
                            >
                                {formatNumber(p.stock)} chiếc
                            </span>
                            <Badge
                                variant={
                                    isOutOfStock ? "danger" : isLowStock ? "warning" : "success"
                                }
                                size="xs"
                            >
                                {isOutOfStock ? "Hết hàng" : isLowStock ? "Sắp hết" : "Đủ"}
                            </Badge>
                        </div>
                        <span className="text-[11px] text-[#a39e98]">
                            Khả dụng: {p.availableStock} | Tối thiểu: {p.minStock}
                        </span>
                    </div>
                );
            },
        },
        {
            key: "warehouseName",
            header: "Vị trí kho",
            render: (p) => (
                <div className="flex flex-col">
                    <span className="font-medium text-xs text-[#000000]">{p.warehouseName}</span>
                    <span className="text-[11px] text-[#615d59] font-mono">{p.location}</span>
                </div>
            ),
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (p) => (
                <Badge variant={p.status === "ACTIVE" ? "primary" : "gray"} size="xs" dot>
                    {p.status === "ACTIVE" ? "Đang bán" : "Nháp"}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "",
            width: "40px",
            render: (product) => (
                <Dropdown
                    trigger={
                        <button
                            type="button"
                            className="p-1.5 rounded-[5px] text-[#615d59] hover:text-[#000000] hover:bg-black/5"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    }
                    items={[
                        {
                            id: "view",
                            label: "Xem chi tiết",
                            icon: <Eye className="w-3.5 h-3.5" />,
                            onClick: () => navigate(`/products/${product.id}`),
                        },
                        ...(canAdjust
                            ? [
                                  {
                                      id: "adjust",
                                      label: "Điều chỉnh kho",
                                      icon: <Sliders className="w-3.5 h-3.5" />,
                                      onClick: () => setAdjustingProduct(product),
                                  },
                              ]
                            : []),
                        ...(canManage
                            ? [
                                  {
                                      id: "edit",
                                      label: "Chỉnh sửa",
                                      icon: <Edit className="w-3.5 h-3.5" />,
                                      onClick: () => navigate(`/products/${product.id}/edit`),
                                  },
                                  "divider" as const,
                                  {
                                      id: "delete",
                                      label: "Xóa sản phẩm",
                                      icon: <Trash2 className="w-3.5 h-3.5" />,
                                      danger: true,
                                      onClick: () => setDeletingProductId(product.id),
                                  },
                              ]
                            : []),
                    ]}
                />
            ),
        },
    ];

    const categories = Array.from(new Set(products.map((p) => p.category)));
    const warehouses = Array.from(new Set(products.map((p) => p.warehouseName)));

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-[22px] font-bold text-[#000000] tracking-tight">
                    Danh Sách Sản Phẩm
                </h1>

                <div className="flex items-center gap-2">
                    <ExportButtons
                        filename="danh-sach-san-pham"
                        title="Danh sách sản phẩm tồn kho"
                        columns={exportColumns}
                        data={filteredProducts}
                    />
                    {canManage && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate("/products/new")}
                            leftIcon={<Plus className="w-4 h-4" />}
                        >
                            Thêm Sản Phẩm
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] shadow-notion-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                <SearchInput
                    placeholder="Tìm theo tên, SKU, thương hiệu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch("")}
                    className="max-w-xs"
                />

                <div className="flex items-center gap-2 flex-wrap">
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
                        <option value="">Tất cả trạng thái tồn</option>
                        <option value="IN_STOCK">Còn hàng</option>
                        <option value="LOW_STOCK">Sắp hết hàng</option>
                        <option value="OUT_OF_STOCK">Hết hàng</option>
                    </select>

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

                    {(search || selectedCategory || selectedStatus || selectedWarehouse) && (
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                                setSearch("");
                                setSelectedCategory("");
                                setSelectedStatus("");
                                setSelectedWarehouse("");
                            }}
                        >
                            Đặt lại
                        </Button>
                    )}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={paginatedData}
                keyExtractor={(p) => p.id}
                isLoading={isLoading}
                selectable
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                bulkActions={
                    <Button
                        variant="danger"
                        size="xs"
                        onClick={handleBulkDelete}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                        Xóa mục đã chọn
                    </Button>
                }
                pagination={{
                    currentPage,
                    totalPages,
                    totalItems: filteredProducts.length,
                    pageSize,
                    onPageChange: setCurrentPage,
                    onPageSizeChange: (size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    },
                }}
            />

            <AdjustStockModal
                product={adjustingProduct}
                isOpen={!!adjustingProduct}
                onClose={() => setAdjustingProduct(null)}
            />

            <ConfirmationDialog
                isOpen={!!deletingProductId}
                onClose={() => setDeletingProductId(null)}
                onConfirm={() => deletingProductId && deleteMutation.mutate(deletingProductId)}
                isLoading={deleteMutation.isPending}
                title="Xóa Sản Phẩm"
                message="Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống không?"
                confirmText="Xác Nhận Xóa"
            />
        </div>
    );
};
