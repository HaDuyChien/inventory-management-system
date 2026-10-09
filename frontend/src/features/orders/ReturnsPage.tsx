import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    RotateCcw,
    Plus,
    Search,
    Eye,
    CheckCircle2,
    Clock,
    Layers,
    Trash2,
    DollarSign,
} from "lucide-react";
import { mockApi } from "@/services/mockApi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/data-table/Pagination";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { toast } from "@/stores/useToastStore";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { ReturnOrder } from "@/types";

export const ReturnsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [selectedOrderNumber, setSelectedOrderNumber] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [warehouseName, setWarehouseName] = useState("Kho Tổng Hà Nội");
    const [returnReason, setReturnReason] = useState("Hàng lỗi kỹ thuật");
    const [inspectionNotes, setInspectionNotes] = useState("");

    const [returnItems, setReturnItems] = useState<
        {
            productId: string;
            sku: string;
            name: string;
            quantity: number;
            unitPrice: number;
            refundAmount: number;
            reason: string;
        }[]
    >([]);

    const { data: returns = [], isLoading } = useQuery({
        queryKey: ["returns"],
        queryFn: () => mockApi.getReturns(),
    });

    const { data: salesOrders = [] } = useQuery({
        queryKey: ["sales-orders"],
        queryFn: mockApi.getSalesOrders,
    });

    const handleSelectOrder = (orderNum: string) => {
        setSelectedOrderNumber(orderNum);
        const found = salesOrders.find((so) => so.orderNumber === orderNum);
        if (found) {
            setCustomerName(found.customerName || "");
            setCustomerPhone(found.customerPhone || "");
            setWarehouseName(found.warehouseName || "Kho Tổng Hà Nội");
            if (found.items && found.items.length > 0) {
                setReturnItems(
                    found.items.map((it) => ({
                        productId: it.productId,
                        sku: it.sku,
                        name: it.productName,
                        quantity: 1,
                        unitPrice: it.unitPrice,
                        refundAmount: it.unitPrice,
                        reason: "Khách yêu cầu đổi trả",
                    })),
                );
            }
        }
    };

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!selectedOrderNumber || returnItems.length === 0) {
                throw new Error("Vui lòng chọn đơn hàng và ít nhất 1 sản phẩm hoàn trả");
            }
            return mockApi.createReturn({
                orderNumber: selectedOrderNumber,
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                warehouseName,
                items: returnItems,
                returnReason,
                notes: inspectionNotes.trim(),
            });
        },
        onSuccess: (newRet) => {
            toast.success("Thành công", `Đã tạo phiếu trả hàng ${newRet.rmaNumber}`);
            queryClient.invalidateQueries({ queryKey: ["returns"] });
            setIsCreateModalOpen(false);
            setSelectedOrderNumber("");
            setCustomerName("");
            setCustomerPhone("");
            setReturnItems([]);
            setInspectionNotes("");
        },
        onError: (err: any) => {
            toast.error(
                "Lỗi tạo phiếu trả",
                err.response?.data?.thongDiep || err.message || "Không thể tạo phiếu trả hàng",
            );
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({
            id,
            status,
            refundStatus,
        }: {
            id: string;
            status?: any;
            refundStatus?: any;
        }) => {
            return mockApi.updateReturnStatus(id, {
                status,
                refundStatus,
            });
        },
        onSuccess: () => {
            toast.success("Thành công", "Đã cập nhật trạng thái phiếu trả hàng");
            queryClient.invalidateQueries({ queryKey: ["returns"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["stock"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            setSelectedReturn(null);
        },
        onError: (err: any) => {
            toast.error(
                "Lỗi cập nhật",
                err.response?.data?.thongDiep || err.message || "Không thể cập nhật phiếu trả",
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return mockApi.deleteReturn(id);
        },
        onSuccess: () => {
            toast.success("Thành công", "Đã xóa phiếu trả hàng");
            queryClient.invalidateQueries({ queryKey: ["returns"] });
        },
        onError: (err: any) => {
            toast.error(
                "Lỗi xóa",
                err.response?.data?.thongDiep || err.message || "Không thể xóa phiếu trả này",
            );
        },
    });

    const filteredReturns = useMemo(() => {
        return returns.filter((r) => {
            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "PENDING" && r.status === "Pending") ||
                (statusFilter === "INSPECTED" && r.status === "Inspected") ||
                (statusFilter === "RESTOCKED" && r.status === "Restocked") ||
                (statusFilter === "REJECTED" && r.status === "Rejected");

            const matchesSearch =
                search === "" ||
                r.rmaNumber.toLowerCase().includes(search.toLowerCase()) ||
                r.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
                r.customerName.toLowerCase().includes(search.toLowerCase()) ||
                (r.customerPhone && r.customerPhone.includes(search)) ||
                r.returnReason.toLowerCase().includes(search.toLowerCase());

            return matchesStatus && matchesSearch;
        });
    }, [returns, statusFilter, search]);

    const totalPages = Math.ceil(filteredReturns.length / pageSize);
    const paginatedReturns = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredReturns.slice(start, start + pageSize);
    }, [filteredReturns, currentPage, pageSize]);

    const stats = useMemo(() => {
        const total = returns.length;
        const pending = returns.filter((r) => r.status === "Pending").length;
        const restocked = returns.filter((r) => r.status === "Restocked").length;
        const totalRefund = returns
            .filter((r) => r.status !== "Rejected")
            .reduce((sum, r) => sum + r.totalRefundAmount, 0);
        return { total, pending, restocked, totalRefund };
    }, [returns]);

    const getStatusBadge = (status: ReturnOrder["status"]) => {
        switch (status) {
            case "Pending":
                return (
                    <Badge variant="warning" size="xs">
                        Chờ kiểm tra
                    </Badge>
                );
            case "Inspected":
                return (
                    <Badge variant="primary" size="xs">
                        Đã kiểm định
                    </Badge>
                );
            case "Restocked":
                return (
                    <Badge variant="success" size="xs">
                        Đã nhập lại kho
                    </Badge>
                );
            case "Rejected":
                return (
                    <Badge variant="danger" size="xs">
                        Từ chối nhận
                    </Badge>
                );
        }
    };

    const getRefundBadge = (refundStatus: ReturnOrder["refundStatus"]) => {
        switch (refundStatus) {
            case "Refunded":
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đã hoàn tiền</span>
                    </span>
                );
            case "NoRefund":
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#f6f5f4] text-[#615d59] border border-[#e6e6e6]">
                        <span>Không hoàn tiền</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                        <Clock className="w-3 h-3" />
                        <span>Chờ hoàn tiền</span>
                    </span>
                );
        }
    };

    const exportColumns = [
        { header: "Mã RMA", key: "rmaNumber" },
        { header: "Mã đơn hàng", key: "orderNumber" },
        { header: "Khách hàng", key: "customerName" },
        { header: "Số điện thoại", key: "customerPhone" },
        { header: "Lý do đổi trả", key: "returnReason" },
        {
            header: "Tổng tiền hoàn",
            key: "totalRefundAmount",
            format: (v: number) => formatCurrency(v),
        },
        {
            header: "Trạng thái kho",
            key: "status",
            format: (v: string) => {
                switch (v) {
                    case "Pending":
                        return "Chờ kiểm tra";
                    case "Inspected":
                        return "Đã kiểm định";
                    case "Restocked":
                        return "Đã nhập lại kho";
                    case "Rejected":
                        return "Từ chối nhận";
                    default:
                        return v;
                }
            },
        },
        {
            header: "Trạng thái hoàn tiền",
            key: "refundStatus",
            format: (v: string) => {
                switch (v) {
                    case "Refunded":
                        return "Đã hoàn tiền";
                    case "NoRefund":
                        return "Không hoàn tiền";
                    default:
                        return "Chờ hoàn tiền";
                }
            },
        },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#000000]">
                        Quản lý trả hàng và hoàn tiền
                    </h1>
                    <p className="text-xs text-[#615d59]">
                        Tiếp nhận, kiểm định chất lượng và tự động nhập lại tồn kho sản phẩm
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportButtons
                        filename="danh-sach-tra-hang"
                        title="Danh sách phiếu trả hàng"
                        columns={exportColumns}
                        data={filteredReturns}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tạo phiếu trả hàng</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 text-[#615d59] text-xs font-semibold">
                        <RotateCcw className="w-4 h-4 text-[#0075de]" />
                        <span>Tổng phiếu trả</span>
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">{stats.total}</div>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 text-[#615d59] text-xs font-semibold">
                        <Clock className="w-4 h-4 text-[#dd5b00]" />
                        <span>Chờ kiểm tra</span>
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">{stats.pending}</div>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 text-[#615d59] text-xs font-semibold">
                        <Layers className="w-4 h-4 text-[#1aae39]" />
                        <span>Đã nhập lại kho</span>
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">{stats.restocked}</div>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 text-[#615d59] text-xs font-semibold">
                        <DollarSign className="w-4 h-4 text-[#7c3aed]" />
                        <span>Tổng tiền hoàn trả</span>
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">
                        {formatCurrency(stats.totalRefund)}
                    </div>
                </div>
            </div>

            <div className="rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-3 border-b border-[#e6e6e6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#ffffff]">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a39e98]" />
                        <input
                            type="text"
                            placeholder="Tìm theo mã RMA, mã đơn, khách hàng, lý do..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#f6f5f4] text-[#000000] focus:outline-none focus:border-[#0075de]"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {[
                            { id: "ALL", label: "Tất cả" },
                            { id: "PENDING", label: "Chờ kiểm tra" },
                            { id: "INSPECTED", label: "Đã kiểm định" },
                            { id: "RESTOCKED", label: "Đã nhập kho" },
                            { id: "REJECTED", label: "Từ chối" },
                        ].map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(s.id);
                                    setCurrentPage(1);
                                }}
                                className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors ${
                                    statusFilter === s.id
                                        ? "bg-[#000000] text-white"
                                        : "text-[#615d59] hover:bg-[#f6f5f4]"
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-[#e6e6e6] bg-[#f6f5f4] text-[#615d59] font-semibold">
                                <th className="py-2.5 px-4">Mã RMA</th>
                                <th className="py-2.5 px-4">Đơn hàng gốc</th>
                                <th className="py-2.5 px-4">Khách hàng</th>
                                <th className="py-2.5 px-4">Lý do hoàn trả</th>
                                <th className="py-2.5 px-4 text-center">Số lượng</th>
                                <th className="py-2.5 px-4 text-right">Tiền hoàn trả</th>
                                <th className="py-2.5 px-4 text-center">Trạng thái kho</th>
                                <th className="py-2.5 px-4 text-center">Hoàn tiền</th>
                                <th className="py-2.5 px-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6e6e6]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-[#615d59]">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : paginatedReturns.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-[#615d59]">
                                        Không tìm thấy phiếu trả hàng phù hợp
                                    </td>
                                </tr>
                            ) : (
                                paginatedReturns.map((r) => {
                                    const totalQty = r.items.reduce((s, it) => s + it.quantity, 0);
                                    return (
                                        <tr
                                            key={r.id}
                                            className="hover:bg-[#f6f5f4]/60 transition-colors"
                                        >
                                            <td className="py-3 px-4 font-mono font-bold text-[#000000]">
                                                {r.rmaNumber}
                                            </td>
                                            <td className="py-3 px-4 font-mono text-[#0075de] font-semibold">
                                                {r.orderNumber}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-[#000000]">
                                                    {r.customerName}
                                                </div>
                                                {r.customerPhone && (
                                                    <div className="text-[11px] text-[#615d59]">
                                                        {r.customerPhone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 max-w-xs truncate text-[#615d59]">
                                                {r.returnReason}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-[#000000]">
                                                {totalQty}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-[#7c3aed]">
                                                {formatCurrency(r.totalRefundAmount)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {getStatusBadge(r.status)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {getRefundBadge(r.refundStatus)}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedReturn(r)}
                                                        className="p-1.5 rounded-[4px] hover:bg-black/5 text-[#0075de]"
                                                        title="Xem chi tiết và duyệt phiếu"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {r.status !== "Restocked" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (window.confirm("Bạn có chắc chắn muốn xóa phiếu trả hàng này?")) {
                                                                    deleteMutation.mutate(r.id);
                                                                }
                                                            }}
                                                            className="p-1.5 rounded-[4px] hover:bg-black/5 text-[#eb5757]"
                                                            title="Xóa phiếu trả hàng"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredReturns.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {selectedReturn && (
                <Modal
                    isOpen={Boolean(selectedReturn)}
                    onClose={() => setSelectedReturn(null)}
                    title={`Chi tiết phiếu trả: ${selectedReturn.rmaNumber}`}
                    size="lg"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3.5 rounded-[8px] bg-[#f6f5f4] border border-[#e6e6e6]">
                            <div>
                                <span className="text-[#615d59] block text-[11px]">Đơn hàng gốc</span>
                                <span className="font-bold font-mono text-[#000000]">
                                    {selectedReturn.orderNumber}
                                </span>
                            </div>
                            <div>
                                <span className="text-[#615d59] block text-[11px]">Khách hàng</span>
                                <span className="font-semibold text-[#000000]">
                                    {selectedReturn.customerName}
                                </span>
                            </div>
                            <div>
                                <span className="text-[#615d59] block text-[11px]">Kho tiếp nhận</span>
                                <span className="font-semibold text-[#000000]">
                                    {selectedReturn.warehouseName}
                                </span>
                            </div>
                            <div>
                                <span className="text-[#615d59] block text-[11px]">Tổng tiền hoàn</span>
                                <span className="font-bold text-[#7c3aed]">
                                    {formatCurrency(selectedReturn.totalRefundAmount)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#615d59] mb-2">
                                Danh sách sản phẩm trả về
                            </h4>
                            <div className="border border-[#e6e6e6] rounded-[6px] overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#f6f5f4] text-[#615d59]">
                                        <tr className="border-b border-[#e6e6e6]">
                                            <th className="py-2 px-3">Sản phẩm và SKU</th>
                                            <th className="py-2 px-3 text-center">Số lượng</th>
                                            <th className="py-2 px-3 text-right">Đơn giá</th>
                                            <th className="py-2 px-3 text-right">Tiền hoàn</th>
                                            <th className="py-2 px-3">Lý do</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e6e6e6]">
                                        {selectedReturn.items.map((it, idx) => (
                                            <tr key={idx} className="hover:bg-[#f6f5f4]/50">
                                                <td className="py-2.5 px-3">
                                                    <div className="font-semibold text-[#000000]">
                                                        {it.productName}
                                                    </div>
                                                    <div className="font-mono text-[11px] text-[#615d59]">
                                                        {it.sku}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-bold text-[#000000]">
                                                    {it.quantity}
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-[#615d59]">
                                                    {formatCurrency(it.unitPrice)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-bold text-[#7c3aed]">
                                                    {formatCurrency(it.refundAmount)}
                                                </td>
                                                <td className="py-2.5 px-3 text-[#615d59]">
                                                    {it.reason || selectedReturn.returnReason}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {selectedReturn.inspectionNotes && (
                            <div className="p-3 rounded-[6px] bg-[#fffbeb] border border-[#fde68a] text-xs text-[#92400e]">
                                <span className="font-bold">Ghi chú kiểm định: </span>
                                <span>{selectedReturn.inspectionNotes}</span>
                            </div>
                        )}

                        <div className="pt-3 border-t border-[#e6e6e6] flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[#615d59]">Thao tác duyệt:</span>
                                {selectedReturn.status !== "Restocked" && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() =>
                                            updateStatusMutation.mutate({
                                                id: selectedReturn.id,
                                                status: "RESTOCKED",
                                                refundStatus: "Refunded",
                                            })
                                        }
                                        isLoading={updateStatusMutation.isPending}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                        Duyệt và nhập lại kho
                                    </Button>
                                )}

                                {selectedReturn.status === "Pending" && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            updateStatusMutation.mutate({
                                                id: selectedReturn.id,
                                                status: "INSPECTED",
                                            })
                                        }
                                        isLoading={updateStatusMutation.isPending}
                                    >
                                        Xác nhận đã kiểm định
                                    </Button>
                                )}

                                {selectedReturn.status !== "Rejected" && selectedReturn.status !== "Restocked" && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() =>
                                            updateStatusMutation.mutate({
                                                id: selectedReturn.id,
                                                status: "REJECTED",
                                                refundStatus: "NoRefund",
                                            })
                                        }
                                        isLoading={updateStatusMutation.isPending}
                                    >
                                        Từ chối nhận lại
                                    </Button>
                                )}
                            </div>

                            <Button
                                variant="utility"
                                size="sm"
                                onClick={() => setSelectedReturn(null)}
                            >
                                Đóng
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Lập phiếu trả hàng"
                size="lg"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        createMutation.mutate();
                    }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Chọn đơn hàng bán cần đổi trả
                            </label>
                            <select
                                value={selectedOrderNumber}
                                onChange={(e) => handleSelectOrder(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                                required
                            >
                                <option value="">Vui lòng chọn mã đơn hàng...</option>
                                {salesOrders.map((so) => (
                                    <option key={so.id} value={so.orderNumber}>
                                        {so.orderNumber} - {so.customerName} - {formatCurrency(so.totalAmount)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Lý do đổi trả chính
                            </label>
                            <select
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            >
                                <option value="Hàng lỗi kỹ thuật">Hàng lỗi kỹ thuật</option>
                                <option value="Giao sai mẫu mã hoặc màu sắc">Giao sai mẫu mã hoặc màu sắc</option>
                                <option value="Khách hàng đổi ý">Khách hàng đổi ý</option>
                                <option value="Hư hỏng trong quá trình vận chuyển">Hư hỏng trong quá trình vận chuyển</option>
                                <option value="Lý do khác">Lý do khác</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Tên khách hàng"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                        />
                        <Input
                            label="Số điện thoại"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-[#000000] block mb-1.5">
                            Danh sách sản phẩm hoàn trả
                        </label>
                        {returnItems.length === 0 ? (
                            <p className="text-xs text-[#615d59] py-4 text-center border border-dashed border-[#e6e6e6] rounded-[6px]">
                                Chọn đơn hàng ở trên để tải danh sách các sản phẩm có thể hoàn trả.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto border border-[#e6e6e6] p-2.5 rounded-[6px] bg-[#f6f5f4]">
                                {returnItems.map((it, idx) => (
                                    <div
                                        key={it.sku}
                                        className="bg-white p-3 rounded-[4px] border border-[#e6e6e6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="space-y-0.5">
                                            <div className="font-semibold text-[#000000]">{it.name}</div>
                                            <div className="text-[11px] font-mono text-[#615d59]">{it.sku}</div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] text-[#615d59]">Số lượng:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={it.quantity}
                                                    onChange={(e) => {
                                                        const q = Math.max(1, Number(e.target.value));
                                                        const next = [...returnItems];
                                                        next[idx].quantity = q;
                                                        next[idx].refundAmount = q * it.unitPrice;
                                                        setReturnItems(next);
                                                    }}
                                                    className="w-14 px-2 py-1 text-xs text-center border border-[#e6e6e6] rounded-[4px]"
                                                />
                                            </div>

                                            <div className="text-right">
                                                <span className="font-bold text-[#7c3aed]">
                                                    {formatCurrency(it.refundAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Input
                        label="Ghi chú thẩm định ban đầu"
                        value={inspectionNotes}
                        onChange={(e) => setInspectionNotes(e.target.value)}
                        placeholder="Ngoại quan sản phẩm còn nguyên tem mác hay trầy xước..."
                    />

                    <div className="pt-3 border-t border-[#e6e6e6] flex justify-end gap-2">
                        <Button
                            variant="utility"
                            size="sm"
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            isLoading={createMutation.isPending}
                        >
                            Tạo phiếu trả
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
