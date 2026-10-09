import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Star,
    Mail,
    Phone,
    MapPin,
    Eye,
    User,
    Trash2,
    Building2,
    Edit3,
    DollarSign,
    ShoppingBag,
    AlertCircle,
    CheckCircle2,
    CreditCard,
    RefreshCw,
    Truck,
    Receipt,
} from "lucide-react";
import { DataTable, type Column } from "@/components/data-table/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { mockApi } from "@/services/mockApi";
import type { Supplier, PurchaseOrder } from "@/types";
import { formatCurrency, formatCompactCurrency, formatDate } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";
import { ExportButtons } from "@/components/ui/ExportButtons";

type TabFilter = "ALL" | "HAS_DEBT" | "ACTIVE" | "INACTIVE" | "TOP_RATED";

interface SupplierFormData {
    name: string;
    code: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
    category: string;
    leadTimeDays: number;
    rating: number;
    status: "ACTIVE" | "INACTIVE";
}

const initialFormData: SupplierFormData = {
    name: "",
    code: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    category: "Thiết bị điện tử",
    leadTimeDays: 7,
    rating: 5,
    status: "ACTIVE",
};

export const SuppliersPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [currentTab, setCurrentTab] = useState<TabFilter>("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [viewingSup, setViewingSup] = useState<Supplier | null>(null);
    const [deletingSup, setDeletingSup] = useState<Supplier | null>(null);

    const [form, setForm] = useState<SupplierFormData>(initialFormData);

    const { data: suppliers = [], isLoading } = useQuery({
        queryKey: ["suppliers"],
        queryFn: mockApi.getSuppliers,
    });

    const { data: supplierOrders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ["supplierOrders", viewingSup?.id],
        queryFn: () => (viewingSup ? mockApi.getSupplierOrders(viewingSup.id) : Promise.resolve([])),
        enabled: Boolean(viewingSup),
    });

    const createMutation = useMutation({
        mutationFn: (data: SupplierFormData) =>
            mockApi.createSupplier({
                ...data,
                activeOrders: 0,
                totalSpend: 0,
                unpaidDebt: 0,
            }),
        onSuccess: (sup) => {
            toast.success("Tạo thành công", `Đã thêm nhà cung cấp ${sup.name}`);
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            setIsFormOpen(false);
            setForm(initialFormData);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.thongDiep || err?.message || "Vui lòng kiểm tra lại thông tin";
            toast.error("Thêm nhà cung cấp thất bại", msg);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
            mockApi.updateSupplier(id, data),
        onSuccess: (sup) => {
            toast.success("Cập nhật thành công", `Đã lưu thông tin nhà cung cấp ${sup.name}`);
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            if (viewingSup && viewingSup.id === sup.id) {
                setViewingSup(sup);
            }
            setIsFormOpen(false);
            setEditingSupplier(null);
            setForm(initialFormData);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.thongDiep || err?.message || "Không thể cập nhật nhà cung cấp";
            toast.error("Cập nhật thất bại", msg);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => mockApi.deleteSupplier(id),
        onSuccess: () => {
            toast.success("Đã xóa", "Đã xóa nhà cung cấp khỏi hệ thống");
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            setDeletingSup(null);
            setViewingSup(null);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.thongDiep || err?.message || "Không thể xóa nhà cung cấp";
            toast.error("Xóa thất bại", msg);
        },
    });

    const payOrderMutation = useMutation({
        mutationFn: ({ supplierId, orderId }: { supplierId: string; orderId: string }) =>
            mockApi.paySupplierOrder(supplierId, orderId),
        onSuccess: () => {
            toast.success("Thanh toán thành công", "Đã ghi nhận thanh toán công nợ đơn mua hàng");
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            queryClient.invalidateQueries({ queryKey: ["supplierOrders", viewingSup?.id] });
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.thongDiep || err?.message || "Không thể thanh toán công nợ";
            toast.error("Lỗi thanh toán", msg);
        },
    });

    const handleOpenCreate = () => {
        setEditingSupplier(null);
        setForm(initialFormData);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (sup: Supplier) => {
        setEditingSupplier(sup);
        setForm({
            name: sup.name,
            code: sup.code,
            contactPerson: sup.contactPerson || "",
            email: sup.email,
            phone: sup.phone,
            address: sup.address,
            taxId: sup.taxId || "",
            category: sup.category || "Thiết bị điện tử",
            leadTimeDays: sup.leadTimeDays || 7,
            rating: sup.rating || 5,
            status: sup.status || "ACTIVE",
        });
        setIsFormOpen(true);
    };

    const handleSaveForm = () => {
        if (!form.name.trim() || !form.code.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
            toast.error("Thiếu thông tin", "Vui lòng nhập tên, mã, email, số điện thoại và địa chỉ trụ sở");
            return;
        }

        if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier.id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const totalSuppliersCount = suppliers.length;
    const activeSuppliersCount = suppliers.filter((s) => s.status === "ACTIVE").length;
    const totalSpendAll = suppliers.reduce((acc, s) => acc + (s.totalSpend || 0), 0);
    const totalDebtAll = suppliers.reduce((acc, s) => acc + (s.unpaidDebt || 0), 0);
    const totalActiveOrdersAll = suppliers.reduce((acc, s) => acc + (s.activeOrders || 0), 0);

    const availableCategories = Array.from(
        new Set(suppliers.map((s) => s.category).filter(Boolean)),
    );

    const filtered = suppliers.filter((s) => {
        const query = search.toLowerCase();
        const matchesSearch =
            s.name.toLowerCase().includes(query) ||
            s.code.toLowerCase().includes(query) ||
            (s.contactPerson && s.contactPerson.toLowerCase().includes(query)) ||
            (s.taxId && s.taxId.toLowerCase().includes(query)) ||
            (s.email && s.email.toLowerCase().includes(query)) ||
            (s.category && s.category.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        if (categoryFilter !== "ALL" && s.category !== categoryFilter) {
            return false;
        }

        if (currentTab === "HAS_DEBT") return (s.unpaidDebt || 0) > 0;
        if (currentTab === "ACTIVE") return s.status === "ACTIVE";
        if (currentTab === "INACTIVE") return s.status === "INACTIVE";
        if (currentTab === "TOP_RATED") return (s.rating || 0) >= 4.5;

        return true;
    });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedSuppliers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const exportColumns = [
        { header: "Mã NCC", key: "code" },
        { header: "Tên nhà cung cấp", key: "name" },
        { header: "Người liên hệ", key: "contactPerson" },
        { header: "Số điện thoại", key: "phone" },
        { header: "Email", key: "email" },
        { header: "Địa chỉ", key: "address" },
        { header: "Mã số thuế", key: "taxId" },
        { header: "Ngành hàng", key: "category" },
        {
            header: "Tổng chi mua",
            key: "totalSpend",
            format: (v: number) => formatCurrency(v || 0),
        },
        {
            header: "Công nợ còn lại",
            key: "unpaidDebt",
            format: (v: number) => formatCurrency(v || 0),
        },
        {
            header: "Trạng thái",
            key: "status",
            format: (v: string) => (v === "ACTIVE" ? "Đang hợp tác" : "Tạm ngưng"),
        },
    ];

    const columns: Column<Supplier>[] = [
        {
            key: "name",
            header: "Nhà cung cấp",
            sortable: true,
            render: (s) => (
                <div className="flex flex-col py-1">
                    <span className="font-semibold text-[#000000] text-sm">{s.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-[#615d59] font-mono font-medium">{s.code}</span>
                        {s.taxId && (
                            <span className="text-[11px] text-[#a39e98]">MST {s.taxId}</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "contactPerson",
            header: "Liên hệ",
            render: (s) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium text-[#000000]">{s.contactPerson || "Đại diện kinh doanh"}</span>
                    <span className="text-[#615d59]">{s.phone}</span>
                </div>
            ),
        },
        {
            key: "category",
            header: "Ngành hàng & SLA",
            render: (s) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium text-[#31302e]">{s.category}</span>
                    <span className="text-[11px] text-[#615d59]">Giao trong {s.leadTimeDays} ngày</span>
                </div>
            ),
        },
        {
            key: "rating",
            header: "Đánh giá uy tín",
            sortable: true,
            render: (s) => (
                <div className="flex items-center gap-1.5 text-xs text-[#dd5b00] font-semibold">
                    <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((starIndex) => (
                            <Star
                                key={starIndex}
                                className={`w-3 h-3 ${
                                    starIndex <= Math.round(s.rating || 5)
                                        ? "fill-[#dd5b00] text-[#dd5b00]"
                                        : "text-[#e6e6e6]"
                                }`}
                            />
                        ))}
                    </div>
                    <span>{Number(s.rating || 5).toFixed(1)}</span>
                </div>
            ),
        },
        {
            key: "totalSpend",
            header: "Tổng chi mua",
            sortable: true,
            render: (s) => (
                <div className="flex flex-col text-xs">
                    <span className="font-bold text-[#000000]">{formatCurrency(s.totalSpend || 0)}</span>
                    <span className="text-[11px] text-[#615d59]">{s.activeOrders || 0} đơn đang xử lý</span>
                </div>
            ),
        },
        {
            key: "unpaidDebt",
            header: "Công nợ cần trả",
            sortable: true,
            render: (s) => {
                const debt = s.unpaidDebt || 0;
                return (
                    <div className="flex flex-col text-xs">
                        <span className={`font-bold ${debt > 0 ? "text-[#eb5757]" : "text-[#1aae39]"}`}>
                            {formatCurrency(debt)}
                        </span>
                        {debt > 0 ? (
                            <span className="text-[10px] text-[#eb5757] font-medium">Còn dư nợ</span>
                        ) : (
                            <span className="text-[10px] text-[#1aae39]">Đã thanh toán đủ</span>
                        )}
                    </div>
                );
            },
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (s) => (
                <Badge variant={s.status === "ACTIVE" ? "success" : "default"} size="xs">
                    {s.status === "ACTIVE" ? "Đang hợp tác" : "Tạm ngưng"}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "",
            render: (s) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="utility"
                        size="xs"
                        onClick={() => setViewingSup(s)}
                        leftIcon={<Eye className="w-3 h-3" />}
                    >
                        Chi tiết
                    </Button>
                    <Button
                        variant="utility"
                        size="xs"
                        onClick={() => handleOpenEdit(s)}
                        leftIcon={<Edit3 className="w-3 h-3" />}
                    >
                        Sửa
                    </Button>
                    <button
                        type="button"
                        onClick={() => setDeletingSup(s)}
                        className="p-1.5 text-[#eb5757] hover:bg-[#eb5757]/10 rounded-[4px] transition-colors cursor-pointer"
                        title="Xóa nhà cung cấp"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                        Nhà Cung Cấp & Công Nợ Cung Ứng
                    </h1>
                    <p className="text-xs text-[#615d59] mt-0.5">
                        Quản lý mạng lưới đối tác, theo dõi dòng tiền nhập hàng và nghĩa vụ thanh toán công nợ
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportButtons
                        filename="danh-sach-nha-cung-cap"
                        title="Danh sách nhà cung cấp"
                        columns={exportColumns}
                        data={filtered}
                    />
                    <Button
                        variant="utility"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["suppliers"] })}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#615d59]" />}
                    >
                        Làm mới
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleOpenCreate}
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Thêm nhà cung cấp
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#615d59]">Đối Tác Cung Ứng</span>
                        <Building2 className="w-4 h-4 text-[#0075de]" />
                    </div>
                    <div className="text-[22px] font-bold text-[#000000] tracking-tight">
                        {totalSuppliersCount}
                    </div>
                    <div className="text-[11px] text-[#1aae39] mt-1 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{activeSuppliersCount} đối tác đang hợp tác</span>
                    </div>
                </Card>

                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#615d59]">Tổng Chi Tiêu Mua</span>
                        <DollarSign className="w-4 h-4 text-[#1aae39]" />
                    </div>
                    <div
                        className="text-[22px] font-bold text-[#000000] tracking-tight truncate"
                        title={formatCurrency(totalSpendAll)}
                    >
                        {formatCompactCurrency(totalSpendAll)}
                    </div>
                    <div className="text-[11px] text-[#615d59] mt-1 truncate" title={formatCurrency(totalSpendAll)}>
                        Giá trị toàn bộ đơn mua hàng
                    </div>
                </Card>

                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#615d59]">Công Nợ Phải Trả</span>
                        <Receipt className="w-4 h-4 text-[#eb5757]" />
                    </div>
                    <div
                        className={`text-[22px] font-bold tracking-tight truncate ${
                            totalDebtAll > 0 ? "text-[#eb5757]" : "text-[#1aae39]"
                        }`}
                        title={formatCurrency(totalDebtAll)}
                    >
                        {formatCompactCurrency(totalDebtAll)}
                    </div>
                    <div className="text-[11px] text-[#eb5757] mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{totalDebtAll > 0 ? "Cần thanh toán đúng hạn" : "Không có dư nợ"}</span>
                    </div>
                </Card>

                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#615d59]">Đơn Chờ Giao Nhận</span>
                        <Truck className="w-4 h-4 text-[#dd5b00]" />
                    </div>
                    <div className="text-[22px] font-bold text-[#dd5b00] tracking-tight">
                        {totalActiveOrdersAll}
                    </div>
                    <div className="text-[11px] text-[#615d59] mt-1">
                        Đang trên lộ trình vận chuyển
                    </div>
                </Card>
            </div>

            <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-notion-sm">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <button
                        type="button"
                        onClick={() => {
                            setCurrentTab("ALL");
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors whitespace-nowrap cursor-pointer ${
                            currentTab === "ALL"
                                ? "bg-[#000000] text-white"
                                : "text-[#615d59] hover:bg-[#f6f5f4]"
                        }`}
                    >
                        Tất cả đối tác
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setCurrentTab("HAS_DEBT");
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors whitespace-nowrap cursor-pointer ${
                            currentTab === "HAS_DEBT"
                                ? "bg-[#000000] text-white"
                                : "text-[#615d59] hover:bg-[#f6f5f4]"
                        }`}
                    >
                        Có công nợ
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setCurrentTab("ACTIVE");
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors whitespace-nowrap cursor-pointer ${
                            currentTab === "ACTIVE"
                                ? "bg-[#000000] text-white"
                                : "text-[#615d59] hover:bg-[#f6f5f4]"
                        }`}
                    >
                        Đang hợp tác
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setCurrentTab("TOP_RATED");
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors whitespace-nowrap cursor-pointer ${
                            currentTab === "TOP_RATED"
                                ? "bg-[#000000] text-white"
                                : "text-[#615d59] hover:bg-[#f6f5f4]"
                        }`}
                    >
                        Uy tín cao từ 4.5 sao
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setCurrentTab("INACTIVE");
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors whitespace-nowrap cursor-pointer ${
                            currentTab === "INACTIVE"
                                ? "bg-[#000000] text-white"
                                : "text-[#615d59] hover:bg-[#f6f5f4]"
                        }`}
                    >
                        Tạm ngưng
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {availableCategories.length > 0 && (
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="text-xs bg-[#f6f5f4] border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 text-[#31302e] outline-none cursor-pointer"
                        >
                            <option value="ALL">Mọi ngành hàng</option>
                            {availableCategories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    )}

                    <SearchInput
                        placeholder="Tìm tên, mã, người liên hệ, MST..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setSearch("");
                            setCurrentPage(1);
                        }}
                        className="w-full sm:w-64"
                    />
                </div>
            </div>

            {suppliers.length === 0 && !isLoading ? (
                <div className="p-12 text-center bg-white border border-[#e6e6e6] rounded-[8px] space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#f6f5f4] text-[#615d59] flex items-center justify-center mx-auto">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-[#000000] text-sm">Chưa có nhà cung cấp nào</h3>
                    <p className="text-xs text-[#615d59] max-w-sm mx-auto">
                        Hiện chưa có dữ liệu nhà cung cấp trong hệ thống. Hãy thêm nhà cung cấp đầu tiên để bắt đầu tạo đơn nhập hàng.
                    </p>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleOpenCreate}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                        Thêm nhà cung cấp đầu tiên
                    </Button>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={paginatedSuppliers}
                    keyExtractor={(s) => s.id}
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
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingSupplier ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}
                description="Đăng ký và quản lý thông tin pháp nhân đối tác cung ứng"
                size="lg"
                footer={
                    <>
                        <Button variant="utility" size="sm" onClick={() => setIsFormOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveForm}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        >
                            {editingSupplier ? "Lưu thay đổi" : "Tạo đối tác"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <Input
                                label="Tên doanh nghiệp hoặc Nhà cung cấp"
                                required
                                placeholder="Ví dụ: Công ty Công nghệ Zebra Việt Nam"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Input
                                label="Mã đối tác"
                                required
                                placeholder="Ví dụ: NCC-ZEB-01"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <Input
                                label="Mã số thuế"
                                placeholder="Ví dụ: 0108992233"
                                value={form.taxId}
                                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                            />
                        </div>
                        <div>
                            <Input
                                label="Người đại diện liên hệ"
                                required
                                placeholder="Ví dụ: Trần Hải Đăng"
                                value={form.contactPerson}
                                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                            />
                        </div>
                        <div>
                            <Select
                                label="Ngành hàng cung cấp"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                options={[
                                    { label: "Thiết bị điện tử", value: "Thiết bị điện tử" },
                                    { label: "Thiết bị mã vạch", value: "Thiết bị mã vạch" },
                                    { label: "Máy in công nghiệp", value: "Máy in công nghiệp" },
                                    { label: "Vật tư đóng gói", value: "Vật tư đóng gói" },
                                    { label: "Kệ kho và Pallet", value: "Kệ kho và Pallet" },
                                    { label: "Bảo hộ lao động", value: "Bảo hộ lao động" },
                                    { label: "Khác", value: "Khác" },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                            label="Email liên hệ"
                            type="email"
                            required
                            placeholder="contact@zebra-vn.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <Input
                            label="Số điện thoại"
                            required
                            placeholder="02439887766"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>

                    <Input
                        label="Địa chỉ trụ sở"
                        required
                        placeholder="Ví dụ: Tòa nhà Lotte Center, 54 Liễu Giai, Ba Đình, Hà Nội"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[6px]">
                        <div>
                            <Input
                                label="Thời gian giao hàng tính theo ngày"
                                type="number"
                                min={1}
                                required
                                value={form.leadTimeDays}
                                onChange={(e) =>
                                    setForm({ ...form, leadTimeDays: Math.max(1, Number(e.target.value)) })
                                }
                            />
                        </div>

                        <div>
                            <label className="text-[13px] font-medium text-[#31302e] block mb-1.5">
                                Điểm uy tín chất lượng
                            </label>
                            <div className="flex items-center gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map((starValue) => (
                                    <button
                                        type="button"
                                        key={starValue}
                                        onClick={() => setForm({ ...form, rating: starValue })}
                                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                    >
                                        <Star
                                            className={`w-5 h-5 ${
                                                starValue <= form.rating
                                                    ? "fill-[#dd5b00] text-[#dd5b00]"
                                                    : "text-[#d1cfcc]"
                                            }`}
                                        />
                                    </button>
                                ))}
                                <span className="ml-2 font-bold text-xs text-[#dd5b00]">
                                    {form.rating} sao
                                </span>
                            </div>
                        </div>

                        <div>
                            <Select
                                label="Trạng thái hợp tác"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })}
                                options={[
                                    { label: "Đang hợp tác", value: "ACTIVE" },
                                    { label: "Tạm ngưng", value: "INACTIVE" },
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {viewingSup && (
                <Modal
                    isOpen={Boolean(viewingSup)}
                    onClose={() => setViewingSup(null)}
                    title={`Hồ sơ đối tác: ${viewingSup.name}`}
                    description={`Mã đối tác: ${viewingSup.code} • Ngành hàng: ${viewingSup.category}`}
                    size="xl"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="utility"
                                    size="xs"
                                    onClick={() => {
                                        const target = viewingSup;
                                        setViewingSup(null);
                                        handleOpenEdit(target);
                                    }}
                                    leftIcon={<Edit3 className="w-3 h-3" />}
                                >
                                    Chỉnh sửa hồ sơ
                                </Button>
                                <Button
                                    variant="danger"
                                    size="xs"
                                    onClick={() => {
                                        setDeletingSup(viewingSup);
                                        setViewingSup(null);
                                    }}
                                >
                                    Xóa đối tác này
                                </Button>
                            </div>
                            <Button variant="utility" size="xs" onClick={() => setViewingSup(null)}>
                                Đóng
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-xs text-left">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[8px]">
                            <div>
                                <span className="text-[#615d59]">Điểm uy tín SLA</span>
                                <div className="flex items-center gap-1 mt-1 text-[#dd5b00] font-bold text-sm">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    <span>{Number(viewingSup.rating || 5).toFixed(1)} trên 5.0</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-[#615d59]">Thời gian giao hàng</span>
                                <p className="font-bold text-sm text-[#000000] mt-1">
                                    {viewingSup.leadTimeDays} ngày
                                </p>
                            </div>
                            <div>
                                <span className="text-[#615d59]">Tổng chi tiêu đã mua</span>
                                <p className="font-bold text-sm text-[#000000] mt-1">
                                    {formatCurrency(viewingSup.totalSpend || 0)}
                                </p>
                            </div>
                            <div>
                                <span className="text-[#615d59]">Công nợ cần thanh toán</span>
                                <p
                                    className={`font-bold text-sm mt-1 ${
                                        (viewingSup.unpaidDebt || 0) > 0 ? "text-[#eb5757]" : "text-[#1aae39]"
                                    }`}
                                >
                                    {formatCurrency(viewingSup.unpaidDebt || 0)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-[#e6e6e6] rounded-[8px] bg-white">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-[#a39e98] shrink-0" />
                                    <span>
                                        Đại diện: <strong>{viewingSup.contactPerson || "Đại diện kinh doanh"}</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#a39e98] shrink-0" />
                                    <span>
                                        Email:{" "}
                                        <a href={`mailto:${viewingSup.email}`} className="text-[#0075de] hover:underline">
                                            {viewingSup.email}
                                        </a>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#a39e98] shrink-0" />
                                    <span>Hotline: <strong>{viewingSup.phone}</strong></span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-[#a39e98] shrink-0" />
                                    <span>Mã số thuế: <strong>{viewingSup.taxId || "Chưa cập nhật"}</strong></span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-[#a39e98] shrink-0 mt-0.5" />
                                    <span>Địa chỉ: {viewingSup.address}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-[#0075de]" />
                                    <h4 className="font-bold text-sm text-[#000000]">
                                        Lịch Sử Đơn Mua Hàng & Quản Lý Công Nợ
                                    </h4>
                                </div>
                                <span className="text-[#615d59] text-xs">
                                    {supplierOrders.length} đơn mua hàng
                                </span>
                            </div>

                            {isLoadingOrders ? (
                                <div className="p-6 text-center text-[#615d59] bg-[#f6f5f4] rounded-[6px]">
                                    Đang tải danh sách đơn hàng...
                                </div>
                            ) : supplierOrders.length === 0 ? (
                                <div className="p-6 text-center text-[#615d59] bg-[#f6f5f4] rounded-[6px] border border-[#e6e6e6]">
                                    Chưa phát sinh đơn mua hàng nào từ nhà cung cấp này.
                                </div>
                            ) : (
                                <div className="border border-[#e6e6e6] rounded-[6px] overflow-hidden max-h-64 overflow-y-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#f6f5f4] text-[#615d59] text-[11px] font-semibold border-b border-[#e6e6e6]">
                                                <th className="p-2.5">Mã đơn</th>
                                                <th className="p-2.5">Ngày tạo</th>
                                                <th className="p-2.5">Giá trị đơn</th>
                                                <th className="p-2.5">Trạng thái đơn</th>
                                                <th className="p-2.5">Thanh toán</th>
                                                <th className="p-2.5 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#e6e6e6] text-xs">
                                            {supplierOrders.map((order) => {
                                                const isPaid = (order as any).paymentStatus === "PAID";
                                                return (
                                                    <tr key={order.id} className="hover:bg-black/[0.02]">
                                                        <td className="p-2.5 font-mono font-semibold text-[#000000]">
                                                            {order.orderNumber}
                                                        </td>
                                                        <td className="p-2.5 text-[#615d59]">
                                                            {formatDate(order.orderDate)}
                                                        </td>
                                                        <td className="p-2.5 font-bold text-[#000000]">
                                                            {formatCurrency(order.totalAmount)}
                                                        </td>
                                                        <td className="p-2.5">
                                                            <Badge variant="default" size="xs">
                                                                {order.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-2.5">
                                                            <Badge variant={isPaid ? "success" : "danger"} size="xs">
                                                                {isPaid ? "Đã thanh toán" : "Còn nợ"}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-2.5 text-right">
                                                            {!isPaid && (
                                                                <Button
                                                                    variant="utility"
                                                                    size="xs"
                                                                    onClick={() =>
                                                                        payOrderMutation.mutate({
                                                                            supplierId: viewingSup.id,
                                                                            orderId: order.id,
                                                                        })
                                                                    }
                                                                    isLoading={payOrderMutation.isPending}
                                                                    leftIcon={<CreditCard className="w-3 h-3 text-[#1aae39]" />}
                                                                >
                                                                    Trả nợ đơn này
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {deletingSup && (
                <Modal
                    isOpen={Boolean(deletingSup)}
                    onClose={() => setDeletingSup(null)}
                    title="Xác nhận xóa nhà cung cấp"
                    size="sm"
                    footer={
                        <>
                            <Button variant="utility" size="sm" onClick={() => setDeletingSup(null)}>
                                Hủy
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => deleteMutation.mutate(deletingSup.id)}
                                isLoading={deleteMutation.isPending}
                            >
                                Xóa vĩnh viễn
                            </Button>
                        </>
                    }
                >
                    <p className="text-xs text-[#615d59]">
                        Anh có chắc chắn muốn xóa đối tác <strong>{deletingSup.name}</strong> mã <strong>{deletingSup.code}</strong> khỏi hệ thống không?
                    </p>
                </Modal>
            )}
        </div>
    );
};
