import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockApi } from "@/services/mockApi";
import type { InventoryTransaction, TransactionType } from "@/types";
import { formatDateTime } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";
import { ExportButtons } from "@/components/ui/ExportButtons";

export const TransactionsPage: React.FC = () => {
    const [search, setSearch] = useState("");
    const [selectedType, setSelectedType] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ["transactions"],
        queryFn: mockApi.getTransactions,
    });

    const filtered = useMemo(() => {
        return transactions.filter((tx) => {
            const matchSearch =
                tx.productName.toLowerCase().includes(search.toLowerCase()) ||
                tx.sku.toLowerCase().includes(search.toLowerCase()) ||
                tx.reference.toLowerCase().includes(search.toLowerCase()) ||
                tx.user.toLowerCase().includes(search.toLowerCase());
            const matchType = !selectedType || tx.type === selectedType;

            return matchSearch && matchType;
        });
    }, [transactions, search, selectedType]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const exportColumns = [
        { header: "Thời gian", key: "date", format: (v: string) => formatDateTime(v) },
        {
            header: "Loại giao dịch",
            key: "type",
            format: (v: string) => {
                switch (v) {
                    case "INBOUND":
                        return "Nhập kho";
                    case "OUTBOUND":
                        return "Xuất kho";
                    case "RETURN":
                        return "Trả hàng";
                    case "DAMAGE":
                        return "Hư hại";
                    case "ADJUSTMENT":
                        return "Điều chỉnh";
                    case "TRANSFER":
                        return "Chuyển kho";
                    default:
                        return v;
                }
            },
        },
        { header: "Sản phẩm", key: "productName" },
        { header: "Mã SKU", key: "sku" },
        { header: "Số lượng", key: "quantity" },
        { header: "Tồn trước", key: "before" },
        { header: "Tồn sau", key: "after" },
        { header: "Mã chứng từ", key: "reference" },
        { header: "Người thực hiện", key: "user" },
        { header: "Ghi chú", key: "notes" },
    ];

    const columns: Column<InventoryTransaction>[] = [
        {
            key: "date",
            header: "Thời gian",
            sortable: true,
            render: (tx) => (
                <span className="text-xs text-[#615d59] font-mono">{formatDateTime(tx.date)}</span>
            ),
        },
        {
            key: "type",
            header: "Loại giao dịch",
            render: (tx) => {
                const badgeMap: Record<
                    TransactionType,
                    {
                        variant: "success" | "primary" | "teal" | "danger" | "warning" | "purple";
                        label: string;
                    }
                > = {
                    INBOUND: { variant: "success", label: "Nhập kho" },
                    OUTBOUND: { variant: "primary", label: "Xuất kho" },
                    RETURN: { variant: "teal", label: "Trả hàng" },
                    DAMAGE: { variant: "danger", label: "Hư hại" },
                    ADJUSTMENT: { variant: "warning", label: "Điều chỉnh" },
                    TRANSFER: { variant: "purple", label: "Chuyển kho" },
                };
                const config = badgeMap[tx.type] || { variant: "primary", label: tx.type };
                return (
                    <Badge variant={config.variant} size="xs" dot>
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            key: "productName",
            header: "Sản phẩm / SKU",
            render: (tx) => (
                <div className="flex flex-col py-1">
                    <span className="font-semibold text-[#000000]">{tx.productName}</span>
                    <span className="text-[11px] text-[#615d59] font-mono">{tx.sku}</span>
                </div>
            ),
        },
        {
            key: "quantity",
            header: "Số lượng",
            sortable: true,
            render: (tx) => (
                <span
                    className={`font-bold ${tx.quantity > 0 ? "text-[#1aae39]" : "text-[#eb5757]"}`}
                >
                    {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                </span>
            ),
        },
        {
            key: "before",
            header: "Trước → Sau",
            render: (tx) => (
                <div className="flex items-center gap-1.5 text-xs text-[#615d59] font-mono">
                    <span>{tx.before}</span>
                    <span>→</span>
                    <strong className="text-[#000000]">{tx.after}</strong>
                </div>
            ),
        },
        {
            key: "reference",
            header: "Mã chứng từ",
            render: (tx) => (
                <span className="px-2 py-0.5 rounded bg-[#f6f5f4] border border-[#e6e6e6] text-xs font-mono text-[#31302e]">
                    {tx.reference}
                </span>
            ),
        },
        {
            key: "user",
            header: "Người thực hiện",
            render: (tx) => <span className="text-xs text-[#31302e] font-medium">{tx.user}</span>,
        },
        {
            key: "notes",
            header: "Ghi chú",
            render: (tx) => (
                <span
                    className="text-xs text-[#615d59] max-w-[200px] truncate block"
                    title={tx.notes}
                >
                    {tx.notes || "—"}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                    Lịch sử biến động kho
                </h1>

                <ExportButtons
                    filename="lich-su-bien-dong-kho"
                    title="Lịch sử biến động kho"
                    columns={exportColumns}
                    data={filtered}
                />
            </div>

            <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] flex flex-col sm:flex-row items-center justify-between gap-3">
                <SearchInput
                    placeholder="Tìm theo sản phẩm, SKU, chứng từ, người tạo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch("")}
                    className="max-w-md"
                />

                <div className="flex items-center gap-2">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="bg-white text-xs border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-[#0075de]"
                    >
                        <option value="">Tất cả biến động</option>
                        <option value="INBOUND">Nhập kho</option>
                        <option value="OUTBOUND">Xuất kho</option>
                        <option value="RETURN">Trả hàng</option>
                        <option value="DAMAGE">Hư hại</option>
                        <option value="ADJUSTMENT">Điều chỉnh</option>
                        <option value="TRANSFER">Chuyển kho</option>
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
        </div>
    );
};
