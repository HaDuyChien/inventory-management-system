import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, Trash2, CheckCircle2, ShoppingCart, ArrowRight, AlertCircle, Warehouse as WarehouseIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable, type Column } from "@/components/data-table/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { mockApi } from "@/services/mockApi";
import type { PurchaseOrder, POStatus } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";
import { ExportButtons } from "@/components/ui/ExportButtons";

export const PurchaseOrdersPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["purchase-orders"],
        queryFn: mockApi.getPurchaseOrders,
    });

    const { data: suppliers = [] } = useQuery({
        queryKey: ["suppliers"],
        queryFn: mockApi.getSuppliers,
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ["warehouses"],
        queryFn: mockApi.getWarehouses,
    });

    const { data: products = [] } = useQuery({
        queryKey: ["products"],
        queryFn: mockApi.getProducts,
    });

    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
    const [items, setItems] = useState<
        { productId: string; quantity: number; unitPrice: number }[]
    >([]);
    const [notes, setNotes] = useState("");

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: POStatus }) =>
            mockApi.updatePOStatus(id, status),
        onSuccess: (updated) => {
            toast.success(
                "Cập nhật thành công",
                `Đơn hàng ${updated.orderNumber} đã chuyển trạng thái sang ${updated.status}`,
            );
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            if (viewingPO) setViewingPO(updated);
        },
        onError: (err: any) => {
            toast.error("Lỗi cập nhật", err?.message || "Không thể cập nhật trạng thái đơn hàng");
        },
    });

    const deleteOrderMutation = useMutation({
        mutationFn: (id: string) => mockApi.deletePurchaseOrder(id),
        onSuccess: () => {
            toast.success("Đã xóa", "Đã xóa đơn đặt hàng khỏi hệ thống");
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            setViewingPO(null);
        },
        onError: (err: any) => {
            toast.error("Lỗi xóa đơn", err?.message || "Không thể xóa đơn hàng");
        },
    });

    const createPOMutation = useMutation({
        mutationFn: async () => {
            const sup = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
            const wh = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];

            if (!sup) throw new Error("Chưa chọn nhà cung cấp hợp lệ");
            if (!wh) throw new Error("Chưa chọn kho tiếp nhận");
            if (items.length === 0) throw new Error("Vui lòng thêm ít nhất một mặt hàng nhập kho");

            const orderItems = items.map((it) => {
                const prod = products.find((p) => p.id === it.productId);
                return {
                    id: `poi-${Date.now()}-${Math.random()}`,
                    productId: prod?.id || it.productId,
                    productName: prod?.name || "Sản phẩm nhập kho",
                    sku: prod?.sku || "SKU-PO",
                    quantity: Number(it.quantity),
                    unitPrice: Number(it.unitPrice),
                    totalPrice: Number(it.quantity) * Number(it.unitPrice),
                };
            });

            const subtotal = orderItems.reduce((acc, it) => acc + it.totalPrice, 0);
            const tax = Math.round(subtotal * 0.1);
            const totalAmount = subtotal + tax;

            return mockApi.createPurchaseOrder({
                supplierId: sup.id,
                supplierName: sup.name,
                warehouseId: wh.id,
                warehouseName: wh.name,
                status: "Pending",
                orderDate: new Date().toISOString(),
                expectedDelivery: expectedDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString(),
                items: orderItems,
                subtotal,
                tax,
                totalAmount,
                notes,
                createdByUser: "Quản trị viên",
            });
        },
        onSuccess: (newPO) => {
            toast.success("Tạo đơn thành công", `Đã tạo đơn nhập hàng ${newPO.orderNumber}`);
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            setIsCreateModalOpen(false);
            setItems([]);
            setNotes("");
            setSelectedSupplierId("");
            setSelectedWarehouseId("");
        },
        onError: (err: any) => {
            toast.error("Lỗi tạo đơn", err?.message || "Vui lòng kiểm tra lại thông tin");
        },
    });

    const openCreateModal = () => {
        if (suppliers.length > 0) {
            setSelectedSupplierId(suppliers[0].id);
        }
        if (warehouses.length > 0) {
            setSelectedWarehouseId(warehouses[0].id);
        }
        if (products.length > 0) {
            setItems([
                {
                    productId: products[0].id,
                    quantity: 10,
                    unitPrice: products[0].costPrice || products[0].sellingPrice,
                },
            ]);
        } else {
            setItems([]);
        }
        setIsCreateModalOpen(true);
    };

    const filtered = orders.filter((po) => {
        const matchSearch =
            po.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            po.supplierName.toLowerCase().includes(search.toLowerCase()) ||
            po.warehouseName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !selectedStatus || po.status === selectedStatus;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedOrders = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const exportColumns = [
        { header: "Mã đơn nhập", key: "orderNumber" },
        { header: "Nhà cung cấp", key: "supplierName" },
        { header: "Kho tiếp nhận", key: "warehouseName" },
        { header: "Ngày tạo", key: "orderDate", format: (v: string) => formatDate(v) },
        {
            header: "Ngày dự kiến",
            key: "expectedDeliveryDate",
            format: (v: string) => (v ? formatDate(v) : "Chưa có"),
        },
        { header: "Tổng tiền", key: "totalAmount", format: (v: number) => formatCurrency(v) },
        {
            header: "Trạng thái",
            key: "status",
            format: (v: string) => {
                switch (v) {
                    case "Draft":
                        return "Bản nháp";
                    case "Pending":
                        return "Chờ duyệt";
                    case "Approved":
                        return "Đã duyệt";
                    case "Receiving":
                        return "Đang nhập kho";
                    case "Completed":
                        return "Hoàn thành nhập";
                    case "Cancelled":
                        return "Đã hủy";
                    default:
                        return v;
                }
            },
        },
    ];

    const getStatusBadge = (status: POStatus) => {
        switch (status) {
            case "Draft":
                return (
                    <Badge variant="gray" size="xs">
                        Bản nháp
                    </Badge>
                );
            case "Pending":
                return (
                    <Badge variant="warning" size="xs">
                        Chờ duyệt
                    </Badge>
                );
            case "Approved":
                return (
                    <Badge variant="primary" size="xs">
                        Đã duyệt đơn
                    </Badge>
                );
            case "Receiving":
                return (
                    <Badge variant="teal" size="xs">
                        Đang tiếp nhận
                    </Badge>
                );
            case "Completed":
                return (
                    <Badge variant="success" size="xs">
                        Đã nhập kho
                    </Badge>
                );
            case "Cancelled":
                return (
                    <Badge variant="danger" size="xs">
                        Đã hủy
                    </Badge>
                );
        }
    };

    const columns: Column<PurchaseOrder>[] = [
        {
            key: "orderNumber",
            header: "Mã đơn hàng",
            sortable: true,
            render: (po) => (
                <span className="font-mono font-semibold text-xs text-[#000000]">
                    {po.orderNumber}
                </span>
            ),
        },
        {
            key: "supplierName",
            header: "Nhà cung cấp",
            render: (po) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-[#000000]">{po.supplierName}</span>
                    <span className="text-[11px] text-[#615d59]">{po.warehouseName}</span>
                </div>
            ),
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (po) => getStatusBadge(po.status),
        },
        {
            key: "orderDate",
            header: "Ngày lập đơn",
            render: (po) => (
                <span className="text-xs text-[#615d59]">{formatDate(po.orderDate)}</span>
            ),
        },
        {
            key: "totalAmount",
            header: "Tổng giá trị",
            sortable: true,
            render: (po) => (
                <span className="font-bold text-[#000000]">{formatCurrency(po.totalAmount)}</span>
            ),
        },
        {
            key: "actions",
            header: "",
            render: (po) => (
                <Button
                    variant="utility"
                    size="xs"
                    onClick={() => setViewingPO(po)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    const currentSubtotal = items.reduce(
        (acc, it) => acc + Number(it.quantity || 0) * Number(it.unitPrice || 0),
        0,
    );
    const currentTax = Math.round(currentSubtotal * 0.1);
    const currentTotal = currentSubtotal + currentTax;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                        Đơn đặt hàng nhập kho
                    </h1>
                    <p className="text-xs text-[#615d59] mt-0.5">
                        Quản lý kế hoạch mua sắm và quy trình nhập kho từ các nhà cung ứng
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportButtons
                        filename="don-nhap-hang"
                        title="Danh sách đơn đặt hàng nhập kho"
                        columns={exportColumns}
                        data={filtered}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={openCreateModal}
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Tạo đơn nhập hàng
                    </Button>
                </div>
            </div>

            <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] flex flex-col sm:flex-row items-center justify-between gap-3">
                <SearchInput
                    placeholder="Tìm theo mã đơn, nhà cung cấp hoặc kho nhận..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    onClear={() => {
                        setSearch("");
                        setCurrentPage(1);
                    }}
                    className="max-w-md"
                />

                <div className="flex items-center gap-2">
                    <select
                        value={selectedStatus}
                        onChange={(e) => {
                            setSelectedStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="bg-white text-xs border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-[#0075de]"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="Draft">Bản nháp</option>
                        <option value="Pending">Chờ duyệt</option>
                        <option value="Approved">Đã duyệt</option>
                        <option value="Receiving">Đang nhập kho</option>
                        <option value="Completed">Hoàn thành nhập</option>
                        <option value="Cancelled">Đã hủy</option>
                    </select>
                </div>
            </div>

            {orders.length === 0 && !isLoading ? (
                <div className="p-12 text-center bg-white border border-[#e6e6e6] rounded-[8px] space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#f6f5f4] text-[#615d59] flex items-center justify-center mx-auto">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-[#000000] text-sm">Chưa có đơn nhập hàng nào</h3>
                    <p className="text-xs text-[#615d59] max-w-sm mx-auto">
                        Hãy tạo đơn nhập hàng đầu tiên để lên kế hoạch tiếp nhận hàng từ nhà cung cấp vào kho bãi.
                    </p>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={openCreateModal}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                        Tạo đơn nhập đầu tiên
                    </Button>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={paginatedOrders}
                    keyExtractor={(item) => item.id}
                    isLoading={isLoading}
                    pagination={{
                        currentPage,
                        totalPages,
                        totalItems: filtered.length,
                        pageSize,
                        onPageChange: setCurrentPage,
                        onPageSizeChange: (size) => {
                            setPageSize(size);
                            setCurrentPage(1);
                        },
                    }}
                />
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tạo đơn nhập hàng mới"
                description="Lập phiếu mua hàng và xác định kho bãi tiếp nhận"
                size="lg"
                footer={
                    <>
                        <Button
                            variant="utility"
                            size="sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => createPOMutation.mutate()}
                            isLoading={createPOMutation.isPending}
                        >
                            Phát hành đơn hàng
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <Select
                                label="Chọn đối tác nhà cung cấp"
                                required
                                value={selectedSupplierId}
                                onChange={(e) => setSelectedSupplierId(e.target.value)}
                                options={suppliers.map((s) => ({
                                    label: `${s.name} - Mã ${s.code}`,
                                    value: s.id,
                                }))}
                            />
                        </div>

                        <div>
                            <Select
                                label="Kho tiếp nhận hàng"
                                required
                                value={selectedWarehouseId}
                                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                options={warehouses.map((w) => ({
                                    label: `${w.name} - Mã ${w.code}`,
                                    value: w.id,
                                }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[#615d59] font-medium mb-1">
                                Ngày giao dự kiến
                            </label>
                            <Input
                                type="date"
                                value={expectedDeliveryDate}
                                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[#615d59] font-medium mb-1">
                                Ghi chú đơn nhập
                            </label>
                            <Input
                                placeholder="Ví dụ: Giao vào giờ hành chính, kèm biên bản kiểm tra"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#e6e6e6]">
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-[#000000] text-xs">
                                Danh sách mặt hàng đặt mua
                            </label>
                            <Button
                                type="button"
                                variant="utility"
                                size="xs"
                                onClick={() => {
                                    if (products.length === 0) {
                                        toast.error("Thông báo", "Vui lòng tạo sản phẩm trước khi thêm vào đơn");
                                        return;
                                    }
                                    setItems([
                                        ...items,
                                        {
                                            productId: products[0].id,
                                            quantity: 5,
                                            unitPrice: products[0].costPrice || products[0].sellingPrice,
                                        },
                                    ]);
                                }}
                            >
                                + Thêm sản phẩm
                            </Button>
                        </div>

                        {items.length === 0 ? (
                            <div className="p-4 text-center bg-[#f6f5f4] rounded-[6px] border border-[#e6e6e6] text-[#615d59]">
                                Chưa chọn mặt hàng nào. Bấm nút Thêm sản phẩm ở trên.
                            </div>
                        ) : (
                            items.map((it, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-[#f6f5f4] rounded-[6px] border border-[#e6e6e6] items-center"
                                >
                                    <div className="sm:col-span-6">
                                        <select
                                            value={it.productId}
                                            onChange={(e) => {
                                                const selProd = products.find(
                                                    (p) => p.id === e.target.value,
                                                );
                                                const updated = [...items];
                                                updated[idx].productId = e.target.value;
                                                if (selProd) {
                                                    updated[idx].unitPrice =
                                                        selProd.costPrice || selProd.sellingPrice;
                                                }
                                                setItems(updated);
                                            }}
                                            className="w-full text-xs bg-white border border-[#e6e6e6] rounded px-2.5 py-1.5 focus:outline-none"
                                        >
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} - SKU {p.sku}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={it.quantity}
                                            onChange={(e) => {
                                                const updated = [...items];
                                                updated[idx].quantity = Math.max(1, Number(e.target.value));
                                                setItems(updated);
                                            }}
                                            placeholder="Số lượng"
                                        />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <Input
                                            type="number"
                                            min={0}
                                            value={it.unitPrice}
                                            onChange={(e) => {
                                                const updated = [...items];
                                                updated[idx].unitPrice = Number(e.target.value);
                                                setItems(updated);
                                            }}
                                            placeholder="Đơn giá nhập"
                                        />
                                    </div>
                                    <div className="sm:col-span-1 text-right">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setItems(items.filter((_, i) => i !== idx))
                                            }
                                            className="p-1 text-[#eb5757] hover:bg-[#eb5757]/10 rounded cursor-pointer"
                                            title="Xóa mặt hàng này"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 bg-white border border-[#e6e6e6] rounded-[6px] flex items-center justify-between text-xs">
                        <div>
                            <span className="text-[#615d59]">Tiền hàng: </span>
                            <strong>{formatCurrency(currentSubtotal)}</strong>
                        </div>
                        <div>
                            <span className="text-[#615d59]">Thuế GTGT 10%: </span>
                            <strong>{formatCurrency(currentTax)}</strong>
                        </div>
                        <div>
                            <span className="text-[#615d59]">Tổng thanh toán: </span>
                            <strong className="text-sm text-[#0075de]">
                                {formatCurrency(currentTotal)}
                            </strong>
                        </div>
                    </div>
                </div>
            </Modal>

            {viewingPO && (
                <Modal
                    isOpen={!!viewingPO}
                    onClose={() => setViewingPO(null)}
                    title={`Đơn đặt hàng nhập: ${viewingPO.orderNumber}`}
                    description={`Nhà cung cấp: ${viewingPO.supplierName} • Kho nhập: ${viewingPO.warehouseName}`}
                    size="lg"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 flex-wrap">
                                {viewingPO.status === "Pending" && (
                                    <>
                                        <Button
                                            variant="primary"
                                            size="xs"
                                            onClick={() =>
                                                updateStatusMutation.mutate({
                                                    id: viewingPO.id,
                                                    status: "Approved",
                                                })
                                            }
                                            isLoading={updateStatusMutation.isPending}
                                        >
                                            Duyệt đơn hàng
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="xs"
                                            onClick={() =>
                                                updateStatusMutation.mutate({
                                                    id: viewingPO.id,
                                                    status: "Cancelled",
                                                })
                                            }
                                            isLoading={updateStatusMutation.isPending}
                                        >
                                            Hủy đơn
                                        </Button>
                                    </>
                                )}

                                {viewingPO.status === "Approved" && (
                                    <Button
                                        variant="primary"
                                        size="xs"
                                        onClick={() =>
                                            updateStatusMutation.mutate({
                                                id: viewingPO.id,
                                                status: "Receiving",
                                            })
                                        }
                                        isLoading={updateStatusMutation.isPending}
                                    >
                                        Bắt đầu tiếp nhận hàng
                                    </Button>
                                )}

                                {viewingPO.status === "Receiving" && (
                                    <Button
                                        variant="primary"
                                        size="xs"
                                        onClick={() =>
                                            updateStatusMutation.mutate({
                                                id: viewingPO.id,
                                                status: "Completed",
                                            })
                                        }
                                        isLoading={updateStatusMutation.isPending}
                                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                    >
                                        Xác nhận nhập kho hoàn tất
                                    </Button>
                                )}

                                {(viewingPO.status === "Cancelled" || viewingPO.status === "Draft") && (
                                    <Button
                                        variant="danger"
                                        size="xs"
                                        onClick={() => deleteOrderMutation.mutate(viewingPO.id)}
                                        isLoading={deleteOrderMutation.isPending}
                                        leftIcon={<Trash2 className="w-3 h-3" />}
                                    >
                                        Xóa đơn này
                                    </Button>
                                )}
                            </div>

                            <Button variant="utility" size="xs" onClick={() => setViewingPO(null)}>
                                Đóng
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-xs">
                        <div className="flex items-center justify-between p-3 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[8px]">
                            <div>
                                <span className="text-[#615d59]">Trạng thái đơn</span>
                                <div className="mt-1">{getStatusBadge(viewingPO.status)}</div>
                            </div>
                            <div>
                                <span className="text-[#615d59]">Ngày lập đơn</span>
                                <p className="font-semibold text-[#000000] mt-1">
                                    {formatDate(viewingPO.orderDate)}
                                </p>
                            </div>
                            <div>
                                <span className="text-[#615d59]">Tổng giá trị đơn</span>
                                <p className="font-bold text-sm text-[#0075de] mt-1">
                                    {formatCurrency(viewingPO.totalAmount)}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h5 className="font-semibold text-xs text-[#000000] mb-2 uppercase tracking-wider">
                                Sản phẩm đặt mua: {viewingPO.items.length} mặt hàng
                            </h5>
                            <div className="border border-[#e6e6e6] rounded-[6px] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f6f5f4] border-b border-[#e6e6e6]">
                                        <tr>
                                            <th className="p-2.5">Sản phẩm</th>
                                            <th className="p-2.5">Số lượng</th>
                                            <th className="p-2.5">Đơn giá nhập</th>
                                            <th className="p-2.5 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e6e6e6]">
                                        {viewingPO.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="p-2.5">
                                                    <p className="font-semibold text-[#000000]">
                                                        {item.productName}
                                                    </p>
                                                    <span className="font-mono text-[#615d59]">
                                                        {item.sku}
                                                    </span>
                                                </td>
                                                <td className="p-2.5 font-bold">{item.quantity}</td>
                                                <td className="p-2.5">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="p-2.5 text-right font-semibold">
                                                    {formatCurrency(item.totalPrice)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {viewingPO.status === "Completed" && (
                            <div className="p-3 bg-[#1aae39]/10 border border-[#1aae39]/30 rounded-[6px] text-[#1aae39] flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>
                                    Đơn hàng đã hoàn tất nhập kho. Số lượng sản phẩm đã được tự động cộng vào kho bãi và ghi nhận chứng từ nhập kho.
                                </span>
                            </div>
                        )}

                        {viewingPO.notes && (
                            <div className="p-2.5 bg-[#fbfbfa] border border-[#e6e6e6] rounded text-[#615d59]">
                                <strong>Ghi chú đơn hàng:</strong> {viewingPO.notes}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};
