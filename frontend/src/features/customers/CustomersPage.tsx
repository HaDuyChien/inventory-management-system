import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Search,
    UserPlus,
    Users,
    Crown,
    ShoppingBag,
    DollarSign,
    Phone,
    Mail,
    Eye,
    Edit3,
    Trash2,
    Lock,
    Unlock,
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
import type { Customer } from "@/types";

export const CustomersPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [segmentFilter, setSegmentFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        segment: "NEW" as "VIP" | "REGULAR" | "NEW",
        password: "",
    });

    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        address: "",
        segment: "NEW" as "VIP" | "REGULAR" | "NEW",
        status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    });

    const { data: customers = [], isLoading } = useQuery({
        queryKey: ["customers"],
        queryFn: () => mockApi.getCustomers(),
    });

    const { data: orders = [] } = useQuery({
        queryKey: ["sales-orders"],
        queryFn: mockApi.getSalesOrders,
    });

    const addMutation = useMutation({
        mutationFn: async () => {
            return mockApi.createCustomer({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                segment: form.segment,
                password: form.password || "Customer@123",
            });
        },
        onSuccess: (newCust) => {
            toast.success("Thành công", `Đã thêm khách hàng ${newCust.name}`);
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            setIsAddModalOpen(false);
            setForm({
                name: "",
                email: "",
                phone: "",
                address: "",
                segment: "NEW",
                password: "",
            });
        },
        onError: (err: any) => {
            toast.error(
                "Lỗi thêm khách hàng",
                err.response?.data?.thongDiep || err.message || "Không thể thêm khách hàng",
            );
        },
    });

    const editMutation = useMutation({
        mutationFn: async () => {
            if (!editingCustomer) return;
            return mockApi.updateCustomer(editingCustomer.id, {
                name: editForm.name.trim(),
                phone: editForm.phone.trim(),
                address: editForm.address.trim(),
                segment: editForm.segment,
                status: editForm.status,
            });
        },
        onSuccess: () => {
            toast.success("Thành công", "Đã cập nhật thông tin khách hàng");
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            setEditingCustomer(null);
            if (selectedCustomer && editingCustomer && selectedCustomer.id === editingCustomer.id) {
                setSelectedCustomer(null);
            }
        },
        onError: (err: any) => {
            toast.error(
                "Lỗi cập nhật",
                err.response?.data?.thongDiep || err.message || "Không thể cập nhật thông tin",
            );
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (c: Customer) => {
            const nextStatus = c.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
            return mockApi.updateCustomer(c.id, {
                status: nextStatus as any,
            });
        },
        onSuccess: () => {
            toast.success("Thành công", "Đã cập nhật trạng thái hoạt động");
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
        onError: (err: any) => {
            toast.error(
                "Lỗi",
                err.response?.data?.thongDiep || err.message || "Không thể đổi trạng thái",
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return mockApi.deleteCustomer(id);
        },
        onSuccess: () => {
            toast.success("Thành công", "Đã xóa khách hàng khỏi hệ thống");
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
        onError: (err: any) => {
            toast.error(
                "Lỗi xóa",
                err.response?.data?.thongDiep || err.message || "Không thể xóa khách hàng này",
            );
        },
    });

    const handleOpenEdit = (c: Customer) => {
        setEditingCustomer(c);
        setEditForm({
            name: c.name,
            phone: c.phone,
            address: c.address,
            segment: c.segment,
            status: c.status,
        });
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter((c) => {
            const matchesSegment = segmentFilter === "ALL" || c.segment === segmentFilter;
            const matchesSearch =
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.phone.includes(search) ||
                c.email.toLowerCase().includes(search.toLowerCase()) ||
                c.address.toLowerCase().includes(search.toLowerCase());
            return matchesSegment && matchesSearch;
        });
    }, [customers, segmentFilter, search]);

    const totalPages = Math.ceil(filteredCustomers.length / pageSize);
    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCustomers.slice(start, start + pageSize);
    }, [filteredCustomers, currentPage, pageSize]);

    const stats = useMemo(() => {
        const total = customers.length;
        const vip = customers.filter((c) => c.segment === "VIP").length;
        const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
        const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);
        return { total, vip, totalSpent, totalOrders };
    }, [customers]);

    const customerOrders = useMemo(() => {
        if (!selectedCustomer) return [];
        return orders.filter(
            (o) =>
                (selectedCustomer.email && o.customerEmail === selectedCustomer.email) ||
                (selectedCustomer.name && o.customerName === selectedCustomer.name) ||
                (selectedCustomer.phone && o.customerPhone === selectedCustomer.phone) ||
                (selectedCustomer.phone && o.shippingAddress && o.shippingAddress.includes(selectedCustomer.phone)),
        );
    }, [orders, selectedCustomer]);

    const getSegmentBadge = (segment: string) => {
        switch (segment) {
            case "VIP":
                return (
                    <Badge variant="purple" size="xs">
                        VIP
                    </Badge>
                );
            case "REGULAR":
                return (
                    <Badge variant="teal" size="xs">
                        Thân thiết
                    </Badge>
                );
            default:
                return (
                    <Badge variant="gray" size="xs">
                        Mới
                    </Badge>
                );
        }
    };

    const exportColumns = [
        { header: "Mã khách hàng", key: "id" },
        { header: "Họ và tên", key: "name" },
        { header: "Số điện thoại", key: "phone" },
        { header: "Email", key: "email" },
        { header: "Địa chỉ", key: "address" },
        { header: "Số đơn mua", key: "totalOrders" },
        { header: "Tổng chi tiêu", key: "totalSpent", format: (v: number) => formatCurrency(v) },
        { header: "Phân khúc", key: "segment" },
        {
            header: "Trạng thái",
            key: "status",
            format: (v: string) => (v === "ACTIVE" ? "Hoạt động" : "Đã khóa"),
        },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#000000]">
                        Quản lý khách hàng
                    </h1>
                    <p className="text-xs text-[#615d59]">
                        Hồ sơ và lịch sử mua sắm trực tuyến của khách hàng
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportButtons
                        filename="danh-sach-khach-hang"
                        title="Danh sách khách hàng"
                        columns={exportColumns}
                        data={filteredCustomers}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Thêm khách hàng</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 text-[#615d59] text-xs font-semibold">
                        <Users className="w-4 h-4 text-[#0075de]" />
                        <span>Tổng khách hàng</span>
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">{stats.total}</div>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 text-[#615d59] text-xs font-semibold">
                        <Crown className="w-4 h-4 text-[#7c3aed]" />
                        <span>Khách hàng VIP</span>
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">{stats.vip}</div>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 text-[#615d59] text-xs font-semibold">
                        <ShoppingBag className="w-4 h-4 text-[#dd5b00]" />
                        <span>Tổng đơn đã mua</span>
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">{stats.totalOrders}</div>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 text-[#615d59] text-xs font-semibold">
                        <DollarSign className="w-4 h-4 text-[#1aae39]" />
                        <span>Tổng doanh thu</span>
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">
                        {formatCurrency(stats.totalSpent)}
                    </div>
                </div>
            </div>

            <div className="rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-3 border-b border-[#e6e6e6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#ffffff]">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a39e98]" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, điện thoại, email, địa chỉ..."
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
                            { id: "VIP", label: "VIP" },
                            { id: "REGULAR", label: "Thân thiết" },
                            { id: "NEW", label: "Mới" },
                        ].map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                    setSegmentFilter(s.id);
                                    setCurrentPage(1);
                                }}
                                className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors ${
                                    segmentFilter === s.id
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
                                <th className="py-2.5 px-4">Khách hàng</th>
                                <th className="py-2.5 px-4">Liên hệ</th>
                                <th className="py-2.5 px-4">Địa chỉ</th>
                                <th className="py-2.5 px-4 text-center">Đơn mua</th>
                                <th className="py-2.5 px-4 text-right">Tổng chi tiêu</th>
                                <th className="py-2.5 px-4 text-center">Phân khúc</th>
                                <th className="py-2.5 px-4 text-center">Trạng thái</th>
                                <th className="py-2.5 px-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6e6e6]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-[#615d59]">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : paginatedCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-[#615d59]">
                                        Không tìm thấy khách hàng phù hợp
                                    </td>
                                </tr>
                            ) : (
                                paginatedCustomers.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="hover:bg-[#f6f5f4]/60 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-[#000000]">
                                                {c.name}
                                            </div>
                                            <div className="text-[11px] text-[#a39e98] font-mono">
                                                {c.id.slice(-6)}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 space-y-0.5">
                                            <div className="flex items-center gap-1.5 text-[#000000]">
                                                <Phone className="w-3 h-3 text-[#615d59]" />
                                                <span>{c.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[#615d59] text-[11px]">
                                                <Mail className="w-3 h-3 text-[#a39e98]" />
                                                <span>{c.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 max-w-xs truncate text-[#615d59]">
                                            {c.address || "Chưa cập nhật"}
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold text-[#000000]">
                                            {c.totalOrders}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-[#0075de]">
                                            {formatCurrency(c.totalSpent)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {getSegmentBadge(c.segment)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    c.status === "ACTIVE"
                                                        ? "bg-[#1aae39]/10 text-[#1aae39]"
                                                        : "bg-[#eb5757]/10 text-[#eb5757]"
                                                }`}
                                            >
                                                {c.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCustomer(c)}
                                                    className="p-1.5 rounded-[4px] hover:bg-black/5 text-[#0075de]"
                                                    title="Xem chi tiết và đơn hàng"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(c)}
                                                    className="p-1.5 rounded-[4px] hover:bg-black/5 text-[#615d59]"
                                                    title="Chỉnh sửa thông tin"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleStatusMutation.mutate(c)}
                                                    className={`p-1.5 rounded-[4px] hover:bg-black/5 ${
                                                        c.status === "ACTIVE"
                                                            ? "text-[#eb5757]"
                                                            : "text-[#1aae39]"
                                                    }`}
                                                    title={c.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                                >
                                                    {c.status === "ACTIVE" ? (
                                                        <Lock className="w-4 h-4" />
                                                    ) : (
                                                        <Unlock className="w-4 h-4" />
                                                    )}
                                                </button>
                                                {c.totalOrders === 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
                                                                deleteMutation.mutate(c.id);
                                                            }
                                                        }}
                                                        className="p-1.5 rounded-[4px] hover:bg-black/5 text-[#eb5757]"
                                                        title="Xóa khách hàng"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
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
                    totalItems={filteredCustomers.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {selectedCustomer && (
                <Modal
                    isOpen={Boolean(selectedCustomer)}
                    onClose={() => setSelectedCustomer(null)}
                    title={`Hồ sơ khách hàng: ${selectedCustomer.name}`}
                    size="lg"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3.5 rounded-[8px] bg-[#f6f5f4] border border-[#e6e6e6]">
                            <div>
                                <span className="text-[#615d59] block text-[11px]">Điện thoại</span>
                                <span className="font-semibold text-[#000000]">
                                    {selectedCustomer.phone}
                                </span>
                            </div>
                            <div>
                                <span className="text-[#615d59] block text-[11px]">Email</span>
                                <span className="font-semibold text-[#000000] truncate block">
                                    {selectedCustomer.email}
                                </span>
                            </div>
                            <div>
                                <span className="text-[#615d59] block text-[11px]">Tổng chi tiêu</span>
                                <span className="font-bold text-[#0075de]">
                                    {formatCurrency(selectedCustomer.totalSpent)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[#615d59] block text-[11px]">Phân khúc</span>
                                <span className="mt-0.5 inline-block">
                                    {getSegmentBadge(selectedCustomer.segment)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#615d59]">
                                    Lịch sử đơn hàng đã đặt
                                </h4>
                                <span className="text-xs text-[#615d59]">
                                    {customerOrders.length} đơn hàng
                                </span>
                            </div>

                            {customerOrders.length === 0 ? (
                                <p className="text-xs text-[#615d59] py-6 text-center border border-dashed border-[#e6e6e6] rounded-[6px]">
                                    Chưa ghi nhận đơn hàng nào cho khách hàng này.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {customerOrders.map((ord) => (
                                        <div
                                            key={ord.id}
                                            className="p-3 rounded-[6px] border border-[#e6e6e6] bg-[#ffffff] flex items-center justify-between text-xs hover:border-[#0075de] transition-colors"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold font-mono text-[#000000]">
                                                        {ord.orderNumber}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f6f5f4] text-[#615d59] font-medium">
                                                        {ord.paymentMethod === "VNPAY" ? "VNPay" : "COD"}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-[#615d59]">
                                                    {formatDate(ord.orderDate)} • {ord.items.length} món hàng
                                                </div>
                                            </div>

                                            <div className="text-right space-y-0.5">
                                                <div className="font-bold text-[#000000]">
                                                    {formatCurrency(ord.totalAmount)}
                                                </div>
                                                <span className="text-[11px] text-[#0075de] font-semibold block">
                                                    {ord.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-[#e6e6e6] flex justify-end gap-2">
                            <Button
                                variant="utility"
                                size="sm"
                                onClick={() => handleOpenEdit(selectedCustomer)}
                            >
                                Sửa thông tin
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedCustomer(null)}
                            >
                                Đóng
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            <Modal
                isOpen={Boolean(editingCustomer)}
                onClose={() => setEditingCustomer(null)}
                title="Chỉnh sửa thông tin khách hàng"
                size="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!editForm.name || !editForm.phone) return;
                        editMutation.mutate();
                    }}
                    className="space-y-3"
                >
                    <Input
                        label="Họ và tên"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />

                    <Input
                        label="Số điện thoại"
                        required
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />

                    <Input
                        label="Địa chỉ giao hàng"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Phân khúc khách hàng
                            </label>
                            <select
                                value={editForm.segment}
                                onChange={(e) => setEditForm({ ...editForm, segment: e.target.value as any })}
                                className="w-full px-3 py-1.5 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            >
                                <option value="NEW">Mới</option>
                                <option value="REGULAR">Thân thiết</option>
                                <option value="VIP">VIP</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Trạng thái tài khoản
                            </label>
                            <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                className="w-full px-3 py-1.5 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            >
                                <option value="ACTIVE">Hoạt động bình thường</option>
                                <option value="INACTIVE">Khóa tài khoản</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-[#e6e6e6] flex justify-end gap-2">
                        <Button
                            variant="utility"
                            size="sm"
                            type="button"
                            onClick={() => setEditingCustomer(null)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            isLoading={editMutation.isPending}
                        >
                            Lưu thay đổi
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Thêm khách hàng mới"
                size="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!form.name || !form.email || !form.phone) return;
                        addMutation.mutate();
                    }}
                    className="space-y-3"
                >
                    <Input
                        label="Họ và tên"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Nguyễn Văn An"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Email"
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="an@gmail.com"
                        />
                        <Input
                            label="Số điện thoại"
                            required
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="0912345678"
                        />
                    </div>

                    <Input
                        label="Địa chỉ giao hàng"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Số 12 Chùa Bộc, Đống Đa, Hà Nội"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Phân khúc khách hàng
                            </label>
                            <select
                                value={form.segment}
                                onChange={(e) => setForm({ ...form, segment: e.target.value as any })}
                                className="w-full px-3 py-1.5 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            >
                                <option value="NEW">Mới</option>
                                <option value="REGULAR">Thân thiết</option>
                                <option value="VIP">VIP</option>
                            </select>
                        </div>
                        <Input
                            label="Mật khẩu khởi tạo"
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Mặc định: Customer@123"
                        />
                    </div>

                    <div className="pt-3 border-t border-[#e6e6e6] flex justify-end gap-2">
                        <Button
                            variant="utility"
                            size="sm"
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            isLoading={addMutation.isPending}
                        >
                            Lưu khách hàng
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
