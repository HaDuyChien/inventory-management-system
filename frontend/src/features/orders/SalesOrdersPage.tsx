import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Eye,
    CreditCard,
    Banknote,
    Truck,
    Package,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    ShieldCheck,
    Save,
    Printer,
    UserCheck,
    Trash2,
} from "lucide-react";
import { DataTable, type Column } from "@/components/data-table/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { mockApi } from "@/services/mockApi";
import type { SalesOrder, SOStatus, Customer } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";

export const SalesOrdersPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingSO, setViewingSO] = useState<SalesOrder | null>(null);
    const [printingSO, setPrintingSO] = useState<SalesOrder | null>(null);

    const [editStatus, setEditStatus] = useState<SOStatus>("Pending");
    const [editPaymentStatus, setEditPaymentStatus] = useState<"PENDING" | "PAID" | "REFUNDED">("PENDING");
    const [isUpdating, setIsUpdating] = useState(false);

    const { data: salesOrders = [], isLoading } = useQuery({
        queryKey: ["sales-orders"],
        queryFn: mockApi.getSalesOrders,
    });

    const { data: products = [] } = useQuery({
        queryKey: ["products"],
        queryFn: mockApi.getProducts,
    });

    const { data: customers = [] } = useQuery({
        queryKey: ["customers"],
        queryFn: () => mockApi.getCustomers(),
    });

    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [shippingAddress, setShippingAddress] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY" | "TRANSFER">("COD");

    const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([
        { productId: products[0]?.id || "prod-1", quantity: 1 },
    ]);

    const handleSelectCustomer = (custId: string) => {
        setSelectedCustomerId(custId);
        const found = customers.find((c) => c.id === custId);
        if (found) {
            setCustomerName(found.name);
            setCustomerEmail(found.email);
            setCustomerPhone(found.phone);
            setShippingAddress(found.address);
        }
    };

    const handleAddOrderItem = () => {
        setOrderItems((prev) => [...prev, { productId: products[0]?.id || "prod-1", quantity: 1 }]);
    };

    const handleRemoveOrderItem = (idx: number) => {
        setOrderItems((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleOpenDetail = (so: SalesOrder) => {
        setViewingSO(so);
        setEditStatus(so.status);
        setEditPaymentStatus(so.paymentStatus || "PENDING");
    };

    const handleUpdateOrder = async () => {
        if (!viewingSO) return;
        setIsUpdating(true);
        try {
            if (editStatus !== viewingSO.status) {
                await mockApi.updateSOStatus(viewingSO.id, editStatus);
            }
            if (editPaymentStatus !== viewingSO.paymentStatus) {
                await mockApi.updateSOPaymentStatus(viewingSO.id, editPaymentStatus);
            }
            toast.success("Thành công", "Đã cập nhật trạng thái đơn hàng");
            queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["stock"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            setViewingSO(null);
        } catch (err: any) {
            toast.error(
                "Lỗi",
                err.response?.data?.thongDiep || err.message || "Cập nhật đơn hàng thất bại",
            );
        } finally {
            setIsUpdating(false);
        }
    };

    const calculateOrderTotal = () => {
        return orderItems.reduce((sum, item) => {
            const p = products.find((prod) => prod.id === item.productId);
            return sum + (p ? p.sellingPrice * item.quantity : 0);
        }, 0);
    };

    const createSOMutation = useMutation({
        mutationFn: async () => {
            const lineItems = orderItems.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId) || products[0];
                return {
                    id: `soi-${Date.now()}-${idx}`,
                    productId: prod.id,
                    productName: prod.name,
                    sku: prod.sku,
                    quantity: Number(item.quantity),
                    unitPrice: prod.sellingPrice,
                    totalPrice: Number(item.quantity) * prod.sellingPrice,
                };
            });

            const totalAmount = lineItems.reduce((acc, it) => acc + it.totalPrice, 0);

            return mockApi.createSalesOrder({
                customerName: customerName.trim() || "Khách mua tại quầy",
                customerEmail: customerEmail.trim() || "khachhang@gmail.com",
                customerPhone: customerPhone.trim() || "0912345678",
                warehouseId: "wh-1",
                warehouseName: "Kho Tổng Hà Nội",
                status: "Processing",
                paymentStatus: "PAID",
                paymentMethod,
                orderDate: new Date().toISOString(),
                shippingAddress: shippingAddress.trim() || "Nhận tại cửa hàng",
                items: lineItems,
                subtotal: totalAmount,
                tax: 0,
                totalAmount,
            });
        },
        onSuccess: (newSO) => {
            toast.success(
                "Tạo đơn thành công",
                `Đã lập đơn bán ${newSO.orderNumber} cho ${newSO.customerName}`,
            );
            queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
            queryClient.invalidateQueries({ queryKey: ["stock"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            setIsCreateModalOpen(false);
            setCustomerName("");
            setCustomerEmail("");
            setCustomerPhone("");
            setShippingAddress("");
            setSelectedCustomerId("");
            setOrderItems([{ productId: products[0]?.id || "prod-1", quantity: 1 }]);
        },
        onError: (err: any) => {
            toast.error(
                "Lỗi tạo đơn",
                err.response?.data?.thongDiep || err.message || "Không thể tạo đơn bán hàng",
            );
        },
    });

    const filtered = salesOrders.filter((so) => {
        const matchesSearch =
            search === "" ||
            so.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            so.customerName.toLowerCase().includes(search.toLowerCase()) ||
            (so.customerPhone && so.customerPhone.includes(search)) ||
            so.shippingAddress.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "PENDING" && (so.status === "Pending" || so.status === "Draft")) ||
            (statusFilter === "PROCESSING" && so.status === "Processing") ||
            (statusFilter === "SHIPPED" && so.status === "Shipped") ||
            (statusFilter === "DELIVERED" && so.status === "Delivered") ||
            (statusFilter === "CANCELLED" && so.status === "Cancelled");

        const matchesPayment =
            paymentFilter === "ALL" ||
            (paymentFilter === "PAID" && so.paymentStatus === "PAID") ||
            (paymentFilter === "PENDING" && so.paymentStatus !== "PAID") ||
            (paymentFilter === "VNPAY" && so.paymentMethod === "VNPAY") ||
            (paymentFilter === "COD" && so.paymentMethod !== "VNPAY");

        return matchesSearch && matchesStatus && matchesPayment;
    });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedOrders = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const exportColumns = [
        { header: "Mã đơn hàng", key: "orderNumber" },
        { header: "Khách hàng", key: "customerName" },
        { header: "Số điện thoại", key: "customerPhone" },
        { header: "Email", key: "customerEmail" },
        { header: "Địa chỉ giao", key: "shippingAddress" },
        { header: "Ngày đặt", key: "orderDate", format: (v: string) => formatDate(v) },
        { header: "Tổng tiền", key: "totalAmount", format: (v: number) => formatCurrency(v) },
        {
            header: "Thanh toán",
            key: "paymentStatus",
            format: (v: string) => (v === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"),
        },
        { header: "Phương thức", key: "paymentMethod" },
        {
            header: "Trạng thái giao",
            key: "status",
            format: (v: string) => {
                switch (v) {
                    case "Draft":
                        return "Bản nháp";
                    case "Pending":
                        return "Chờ xử lý";
                    case "Processing":
                        return "Đang đóng gói";
                    case "Shipped":
                        return "Đang giao";
                    case "Delivered":
                        return "Đã giao hàng";
                    case "Cancelled":
                        return "Đã hủy";
                    default:
                        return v;
                }
            },
        },
    ];

    const getStatusBadge = (status: SOStatus) => {
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
                        Chờ xử lý
                    </Badge>
                );
            case "Processing":
                return (
                    <Badge variant="primary" size="xs">
                        Đang đóng gói
                    </Badge>
                );
            case "Shipped":
                return (
                    <Badge variant="teal" size="xs">
                        Đang giao
                    </Badge>
                );
            case "Delivered":
                return (
                    <Badge variant="success" size="xs">
                        Đã giao hàng
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

    const getPaymentBadge = (so: SalesOrder) => {
        if (so.paymentMethod === "VNPAY") {
            if (so.paymentStatus === "PAID") {
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]">
                        <CreditCard className="w-3 h-3" />
                        <span>VNPay: Đã thanh toán</span>
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                    <CreditCard className="w-3 h-3" />
                    <span>VNPay: Chờ thanh toán</span>
                </span>
            );
        }

        if (so.paymentStatus === "PAID") {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]">
                    <Banknote className="w-3 h-3" />
                    <span>COD: Đã thu tiền</span>
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#f6f5f4] text-[#615d59] border border-[#e6e6e6]">
                <Banknote className="w-3 h-3" />
                <span>COD: Chưa thanh toán</span>
            </span>
        );
    };

    const columns: Column<SalesOrder>[] = [
        {
            key: "orderNumber",
            header: "Mã đơn hàng",
            sortable: true,
            render: (so) => (
                <span className="font-mono font-bold text-xs text-[#000000]">
                    {so.orderNumber}
                </span>
            ),
        },
        {
            key: "customerName",
            header: "Khách hàng",
            sortable: true,
            render: (so) => (
                <div>
                    <p className="font-semibold text-xs text-[#000000]">{so.customerName}</p>
                    <p className="text-[11px] text-[#615d59]">{so.customerPhone || so.customerEmail}</p>
                </div>
            ),
        },
        {
            key: "orderDate",
            header: "Ngày đặt",
            sortable: true,
            render: (so) => (
                <span className="text-xs text-[#615d59]">{formatDate(so.orderDate)}</span>
            ),
        },
        {
            key: "items",
            header: "Số lượng mặt hàng",
            render: (so) => (
                <span className="text-xs font-semibold text-[#000000]">
                    {so.items.length} món
                </span>
            ),
        },
        {
            key: "totalAmount",
            header: "Tổng tiền",
            sortable: true,
            render: (so) => (
                <span className="font-bold text-xs text-[#0075de]">
                    {formatCurrency(so.totalAmount)}
                </span>
            ),
        },
        {
            key: "paymentStatus",
            header: "Thanh toán",
            render: (so) => getPaymentBadge(so),
        },
        {
            key: "status",
            header: "Trạng thái giao",
            render: (so) => getStatusBadge(so.status),
        },
        {
            key: "id",
            header: "Thao tác",
            render: (so) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => handleOpenDetail(so)}
                        className="p-1 rounded-[4px] hover:bg-black/5 text-[#0075de]"
                        title="Xem chi tiết đơn"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setPrintingSO(so)}
                        className="p-1 rounded-[4px] hover:bg-black/5 text-[#615d59]"
                        title="In phiếu giao hàng"
                    >
                        <Printer className="w-3.5 h-3.5" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#000000]">
                        Đơn bán hàng
                    </h1>
                    <p className="text-xs text-[#615d59]">
                        Quản lý các đơn xuất kho, xử lý đơn trực tuyến và theo dõi thanh toán
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportButtons
                        filename="danh-sach-don-ban-hang"
                        title="Danh sách đơn bán hàng"
                        columns={exportColumns}
                        data={filtered}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5"
                    >
                        <span>Tạo đơn bán</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[11px] font-semibold text-[#615d59] block">
                        Tổng số đơn
                    </span>
                    <span className="text-lg font-bold text-[#000000]">{salesOrders.length}</span>
                </div>
                <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[11px] font-semibold text-[#615d59] block">
                        Chờ xử lý
                    </span>
                    <span className="text-lg font-bold text-[#dd5b00]">
                        {salesOrders.filter((s) => s.status === "Pending" || s.status === "Draft").length}
                    </span>
                </div>
                <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[11px] font-semibold text-[#615d59] block">
                        Đang giao hàng
                    </span>
                    <span className="text-lg font-bold text-[#0075de]">
                        {salesOrders.filter((s) => s.status === "Shipped" || s.status === "Processing").length}
                    </span>
                </div>
                <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[11px] font-semibold text-[#615d59] block">
                        Đã thanh toán
                    </span>
                    <span className="text-lg font-bold text-[#10b981]">
                        {salesOrders.filter((s) => s.paymentStatus === "PAID").length}
                    </span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 border border-[#e6e6e6] rounded-[8px]">
                <div className="w-full sm:w-80">
                    <SearchInput
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setSearch("");
                            setCurrentPage(1);
                        }}
                        placeholder="Tìm mã đơn, tên khách, số điện thoại..."
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="text-xs bg-white border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                        <option value="ALL">Tất cả trạng thái đơn</option>
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="PROCESSING">Đang đóng gói</option>
                        <option value="SHIPPED">Đang giao hàng</option>
                        <option value="DELIVERED">Đã giao hoàn tất</option>
                        <option value="CANCELLED">Đã hủy</option>
                    </select>

                    <select
                        value={paymentFilter}
                        onChange={(e) => {
                            setPaymentFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="text-xs bg-white border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                        <option value="ALL">Tất cả thanh toán</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="PENDING">Chờ thanh toán</option>
                        <option value="VNPAY">Cổng VNPay</option>
                        <option value="COD">Thu hộ COD</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={paginatedOrders}
                isLoading={isLoading}
                keyExtractor={(so) => so.id}
                emptyMessage="Không tìm thấy đơn bán hàng nào phù hợp với bộ lọc"
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

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tạo đơn bán hàng mới"
                size="lg"
            >
                <div className="space-y-4 text-xs text-left">
                    <div className="p-3 bg-[#f6f5f4] rounded-[8px] border border-[#e6e6e6] space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-[#000000]">Thông tin khách mua</span>
                            {customers.length > 0 && (
                                <select
                                    value={selectedCustomerId}
                                    onChange={(e) => handleSelectCustomer(e.target.value)}
                                    className="text-xs bg-white border border-[#e6e6e6] rounded-[4px] px-2 py-1 focus:outline-none"
                                >
                                    <option value="">Chọn khách hàng có sẵn...</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} - {c.phone}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <Input
                                label="Họ tên khách hàng"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Khách hàng A"
                                required
                            />
                            <Input
                                label="Số điện thoại"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="0912345678"
                            />
                            <Input
                                label="Email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="khach@gmail.com"
                            />
                        </div>

                        <Input
                            label="Địa chỉ giao hàng"
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="Số nhà, ngõ, phố, quận/huyện, tỉnh thành"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-[#000000]">Danh sách sản phẩm mua</span>
                            <Button
                                variant="secondary"
                                size="xs"
                                onClick={handleAddOrderItem}
                                className="flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                <span>Thêm mặt hàng</span>
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-52 overflow-y-auto border border-[#e6e6e6] p-2 rounded-[6px]">
                            {orderItems.map((item, idx) => {
                                const selectedProd = products.find((p) => p.id === item.productId);
                                const lineTotal = selectedProd ? selectedProd.sellingPrice * item.quantity : 0;
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 bg-white p-2 rounded-[4px] border border-[#e6e6e6]"
                                    >
                                        <div className="flex-1">
                                            <select
                                                value={item.productId}
                                                onChange={(e) => {
                                                    const next = [...orderItems];
                                                    next[idx].productId = e.target.value;
                                                    setOrderItems(next);
                                                }}
                                                className="w-full text-xs bg-white border border-[#e6e6e6] rounded-[4px] px-2 py-1.5 focus:outline-none"
                                            >
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} - {formatCurrency(p.sellingPrice)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="w-20">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const next = [...orderItems];
                                                    next[idx].quantity = Math.max(1, Number(e.target.value));
                                                    setOrderItems(next);
                                                }}
                                                className="w-full text-xs text-center border border-[#e6e6e6] rounded-[4px] px-2 py-1.5"
                                            />
                                        </div>

                                        <div className="w-28 text-right font-bold text-[#0075de]">
                                            {formatCurrency(lineTotal)}
                                        </div>

                                        {orderItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOrderItem(idx)}
                                                className="p-1 text-[#eb5757] hover:bg-black/5 rounded-[4px]"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                            <label className="font-semibold text-[#000000] block mb-1">
                                Phương thức thanh toán:
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                className="w-full text-xs bg-white border border-[#e6e6e6] rounded-[4px] px-2.5 py-1.5 focus:outline-none"
                            >
                                <option value="COD">Thu hộ COD khi giao hàng</option>
                                <option value="TRANSFER">Chuyển khoản trực tiếp</option>
                                <option value="VNPAY">Cổng VNPay</option>
                            </select>
                        </div>

                        <div className="flex flex-col items-end justify-center p-2 rounded-[6px] bg-[#f6f5f4] border border-[#e6e6e6]">
                            <span className="text-[11px] text-[#615d59]">Tổng tiền thanh toán</span>
                            <span className="text-base font-bold text-[#0075de]">
                                {formatCurrency(calculateOrderTotal())}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e6e6e6]">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => createSOMutation.mutate()}
                            isLoading={createSOMutation.isPending}
                        >
                            Hoàn tất tạo đơn
                        </Button>
                    </div>
                </div>
            </Modal>

            {viewingSO && (
                <Modal
                    isOpen={Boolean(viewingSO)}
                    onClose={() => setViewingSO(null)}
                    title={`Chi tiết đơn bán hàng: ${viewingSO.orderNumber}`}
                    size="lg"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setPrintingSO(viewingSO);
                                    setViewingSO(null);
                                }}
                                className="flex items-center gap-1.5"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>In hóa đơn giao hàng</span>
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setViewingSO(null)}
                                >
                                    Đóng
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleUpdateOrder}
                                    isLoading={isUpdating}
                                    className="flex items-center gap-1.5"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Lưu thay đổi</span>
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-4 text-xs text-left">
                        <div className="p-3 bg-[#f8f9fa] rounded-[8px] border border-[#e6e6e6] grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="font-semibold text-[#615d59] block">
                                    Thông tin người nhận:
                                </span>
                                <p className="font-bold text-[#000000]">{viewingSO.customerName}</p>
                                <p className="text-[#615d59]">
                                    Điện thoại: {viewingSO.customerPhone || "Chưa cập nhật"}
                                </p>
                                <p className="text-[#615d59]">Email: {viewingSO.customerEmail}</p>
                                <p className="text-[#615d59]">Địa chỉ: {viewingSO.shippingAddress}</p>
                            </div>

                            <div className="space-y-1 sm:border-l sm:border-[#e6e6e6] sm:pl-3">
                                <span className="font-semibold text-[#615d59] block">
                                    Chi tiết thanh toán:
                                </span>
                                <div className="flex items-center gap-2 pt-0.5">
                                    {getPaymentBadge(viewingSO)}
                                </div>
                                {viewingSO.vnpTransactionNo && (
                                    <p className="text-[#615d59]">
                                        Mã VNPay:{" "}
                                        <span className="font-mono font-bold text-[#000000]">
                                            {viewingSO.vnpTransactionNo}
                                        </span>
                                    </p>
                                )}
                                {viewingSO.vnpBankCode && (
                                    <p className="text-[#615d59]">
                                        Ngân hàng:{" "}
                                        <span className="font-semibold text-[#000000]">
                                            {viewingSO.vnpBankCode}
                                        </span>
                                    </p>
                                )}
                                {viewingSO.notes && (
                                    <p className="text-[#615d59]">Ghi chú: {viewingSO.notes}</p>
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-[#ffffff] rounded-[8px] border border-[#e6e6e6] grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="font-semibold text-[#000000] block">
                                    Cập nhật trạng thái đơn hàng:
                                </label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as SOStatus)}
                                    className="w-full text-xs bg-white border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 focus:outline-none cursor-pointer"
                                >
                                    <option value="Pending">Chờ xử lý</option>
                                    <option value="Processing">Đang đóng gói</option>
                                    <option value="Shipped">Đang giao hàng</option>
                                    <option value="Delivered">Đã giao hàng hoàn tất</option>
                                    <option value="Cancelled">Đã hủy đơn hàng</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-[#000000] block">
                                    Cập nhật trạng thái thanh toán:
                                </label>
                                <select
                                    value={editPaymentStatus}
                                    onChange={(e) =>
                                        setEditPaymentStatus(
                                            e.target.value as "PENDING" | "PAID" | "REFUNDED",
                                        )
                                    }
                                    className="w-full text-xs bg-white border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 focus:outline-none cursor-pointer"
                                >
                                    <option value="PENDING">Chờ thanh toán</option>
                                    <option value="PAID">Đã thanh toán</option>
                                    <option value="REFUNDED">Đã hoàn tiền</option>
                                </select>
                            </div>
                        </div>

                        <div className="border border-[#e6e6e6] rounded-[8px] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-[#f6f5f4] border-b border-[#e6e6e6]">
                                    <tr>
                                        <th className="p-2.5 font-semibold text-[#000000]">Sản phẩm</th>
                                        <th className="p-2.5 font-semibold text-[#000000]">Mã SKU</th>
                                        <th className="p-2.5 font-semibold text-[#000000]">Số lượng</th>
                                        <th className="p-2.5 font-semibold text-[#000000]">Đơn giá</th>
                                        <th className="p-2.5 text-right font-semibold text-[#000000]">
                                            Thành tiền
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e6e6e6]">
                                    {viewingSO.items.map((it) => (
                                        <tr key={it.id}>
                                            <td className="p-2.5 font-medium text-[#000000]">
                                                {it.productName}
                                            </td>
                                            <td className="p-2.5 font-mono text-[#615d59]">
                                                {it.sku}
                                            </td>
                                            <td className="p-2.5 font-bold text-[#000000]">
                                                {it.quantity}
                                            </td>
                                            <td className="p-2.5 text-[#615d59]">
                                                {formatCurrency(it.unitPrice)}
                                            </td>
                                            <td className="p-2.5 text-right font-bold text-[#000000]">
                                                {formatCurrency(it.totalPrice)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-2">
                            <div className="w-64 space-y-1 text-right">
                                <div className="flex justify-between text-[#615d59]">
                                    <span>Tạm tính:</span>
                                    <span className="font-semibold text-[#000000]">
                                        {formatCurrency(viewingSO.subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[#615d59]">
                                    <span>Phí giao hàng:</span>
                                    <span className="font-semibold text-[#10b981]">Miễn phí</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm text-[#000000] pt-1 border-t border-[#e6e6e6]">
                                    <span>Tổng thanh toán:</span>
                                    <span className="text-[#0075de]">
                                        {formatCurrency(viewingSO.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {printingSO && (
                <Modal
                    isOpen={Boolean(printingSO)}
                    onClose={() => setPrintingSO(null)}
                    title="In phiếu giao hàng kiêm hóa đơn bán lẻ"
                    size="lg"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <span className="text-[11px] text-[#615d59]">
                                Sẵn sàng để in trực tiếp hoặc xuất ra tệp PDF
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setPrintingSO(null)}
                                >
                                    Đóng
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => window.print()}
                                    className="flex items-center gap-1.5"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>In phiếu này</span>
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <div className="p-6 bg-white border border-[#e6e6e6] rounded-[8px] space-y-6 text-xs text-[#000000]">
                        <div className="flex justify-between items-start border-b border-[#e6e6e6] pb-4">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">HỆ THỐNG QUẢN LÝ KHO INVENTOHUB</h2>
                                <p className="text-[11px] text-[#615d59]">Địa chỉ: Số 12 Chùa Bộc, Đống Đa, Hà Nội</p>
                                <p className="text-[11px] text-[#615d59]">Hotline hỗ trợ: 1900 8888</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-sm font-bold uppercase text-[#0075de]">HÓA ĐƠN BÁN HÀNG</h3>
                                <p className="font-mono font-bold mt-1">{printingSO.orderNumber}</p>
                                <p className="text-[11px] text-[#615d59]">{formatDate(printingSO.orderDate)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-[#f6f5f4] rounded-[6px] space-y-1">
                                <span className="font-bold block text-[11px] uppercase text-[#615d59]">Khách hàng nhận:</span>
                                <p className="font-semibold">{printingSO.customerName}</p>
                                <p className="text-[#615d59]">Số điện thoại: {printingSO.customerPhone || "Chưa có"}</p>
                                <p className="text-[#615d59]">Địa chỉ giao: {printingSO.shippingAddress}</p>
                            </div>

                            <div className="p-3 bg-[#f6f5f4] rounded-[6px] space-y-1">
                                <span className="font-bold block text-[11px] uppercase text-[#615d59]">Thanh toán & Kho xuất:</span>
                                <p>Kho xuất hàng: <span className="font-semibold">{printingSO.warehouseName}</span></p>
                                <p>Hình thức: <span className="font-semibold">{printingSO.paymentMethod === "VNPAY" ? "Cổng VNPay" : "Thu hộ COD"}</span></p>
                                <p>Tình trạng: <span className="font-semibold text-[#10b981]">{printingSO.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}</span></p>
                            </div>
                        </div>

                        <div className="border border-[#e6e6e6] rounded-[6px] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-[#f6f5f4] border-b border-[#e6e6e6]">
                                    <tr>
                                        <th className="p-2.5 font-semibold">Tên sản phẩm</th>
                                        <th className="p-2.5 font-semibold">Mã SKU</th>
                                        <th className="p-2.5 text-center font-semibold">SL</th>
                                        <th className="p-2.5 text-right font-semibold">Đơn giá</th>
                                        <th className="p-2.5 text-right font-semibold">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e6e6e6]">
                                    {printingSO.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="p-2.5 font-medium">{item.productName}</td>
                                            <td className="p-2.5 font-mono text-[#615d59]">{item.sku}</td>
                                            <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                                            <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="p-2.5 text-right font-bold">{formatCurrency(item.totalPrice)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-end pt-2">
                            <div className="text-[11px] text-[#615d59] max-w-xs">
                                Cảm ơn quý khách đã tin tưởng mua sắm tại hệ thống. Quý khách vui lòng kiểm tra hàng trước khi ký nhận.
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-sm font-bold text-[#000000]">
                                    Tổng cộng: <span className="text-[#0075de] text-base">{formatCurrency(printingSO.totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 pt-8 text-center text-xs">
                            <div>
                                <span className="font-bold block">Người nhận hàng</span>
                                <span className="text-[10px] text-[#a39e98] block mt-0.5">Ký và ghi rõ họ tên</span>
                            </div>
                            <div>
                                <span className="font-bold block">Nhân viên xuất kho</span>
                                <span className="text-[10px] text-[#a39e98] block mt-0.5">Ký và xác nhận</span>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
