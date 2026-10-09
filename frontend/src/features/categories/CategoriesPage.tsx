import React, { useState, useMemo, useRef } from "react";
import {
    Tags,
    Plus,
    Search,
    Edit2,
    Trash2,
    Sparkles,
    UploadCloud,
    CheckCircle2,
    RefreshCw,
    LayoutGrid,
    Table as TableIcon,
    Package,
    FolderKanban,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/States";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockApi } from "@/services/mockApi";
import { BackendCategory } from "@/services/api";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";
import { Pagination } from "@/components/data-table/Pagination";
import { ExportButtons } from "@/components/ui/ExportButtons";

interface CategoryFormState {
    name: string;
    slug: string;
    description: string;
    image: string;
    status: "ACTIVE" | "INACTIVE";
}

const initialFormState: CategoryFormState = {
    name: "",
    slug: "",
    description: "",
    image: "",
    status: "ACTIVE",
};

export const CategoriesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<BackendCategory | null>(null);
    const [formData, setFormData] = useState<CategoryFormState>(initialFormState);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<BackendCategory | null>(null);

    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
        queryKey: ["categories"],
        queryFn: mockApi.getCategories,
    });

    const { data: products = [] } = useQuery({
        queryKey: ["products"],
        queryFn: mockApi.getProducts,
    });

    const categoryStats = useMemo(() => {
        const statsMap: Record<string, { count: number; totalValue: number }> = {};

        products.forEach((p) => {
            const catName = p.category || "Chưa phân loại";
            if (!statsMap[catName]) {
                statsMap[catName] = { count: 0, totalValue: 0 };
            }
            statsMap[catName].count += 1;
            statsMap[catName].totalValue += (p.stock || 0) * (p.costPrice || 0);
        });

        const activeCount = categories.filter((c) => c.status === "ACTIVE").length;
        const totalSKU = products.length;
        const totalValuation = products.reduce(
            (acc, p) => acc + (p.stock || 0) * (p.costPrice || 0),
            0,
        );

        return {
            totalCategories: categories.length,
            activeCount,
            totalSKU,
            totalValuation,
            statsMap,
        };
    }, [categories, products]);

    const filteredCategories = useMemo(() => {
        return categories.filter((cat) => {
            const matchSearch =
                cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cat.slug.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus =
                statusFilter === "ALL" || cat.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [categories, searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredCategories.length / pageSize);
    const paginatedCategories = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCategories.slice(start, start + pageSize);
    }, [filteredCategories, currentPage, pageSize]);

    const exportColumns = [
        { header: "Tên danh mục", key: "name" },
        { header: "Mã đường dẫn", key: "slug" },
        { header: "Mô tả", key: "description" },
        {
            header: "Số lượng SKU",
            key: "name",
            format: (_: any, cat: BackendCategory) => {
                const s = categoryStats.statsMap[cat.name];
                return String(s ? s.count : cat.productCount || 0);
            },
        },
        {
            header: "Tổng vốn tồn kho",
            key: "name",
            format: (_: any, cat: BackendCategory) => {
                const s = categoryStats.statsMap[cat.name];
                return formatCurrency(s ? s.totalValue : 0);
            },
        },
        {
            header: "Trạng thái",
            key: "status",
            format: (v: string) => (v === "ACTIVE" ? "Hoạt động" : "Tạm dừng"),
        },
    ];

    const createMutation = useMutation({
        mutationFn: (data: CategoryFormState) => mockApi.createCategory(data),
        onSuccess: () => {
            toast.success("Tạo thành công", "Đã thêm danh mục mới vào hệ thống");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            closeFormModal();
        },
        onError: (err: any) => {
            const msg = err.response?.data?.thongDiep || err.message || "Tạo danh mục thất bại";
            toast.error("Lỗi tạo danh mục", msg);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormState> }) =>
            mockApi.updateCategory(id, data),
        onSuccess: () => {
            toast.success("Cập nhật thành công", "Đã lưu thay đổi thông tin danh mục");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            closeFormModal();
        },
        onError: (err: any) => {
            const msg = err.response?.data?.thongDiep || err.message || "Cập nhật danh mục thất bại";
            toast.error("Lỗi cập nhật", msg);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => mockApi.deleteCategory(id),
        onSuccess: () => {
            toast.success("Xóa thành công", "Đã xóa danh mục khỏi hệ thống");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setIsDeleteModalOpen(false);
            setCategoryToDelete(null);
        },
        onError: (err: any) => {
            const msg = err.response?.data?.thongDiep || err.message || "Xóa danh mục thất bại";
            toast.error("Lỗi xóa danh mục", msg);
        },
    });

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cat: BackendCategory) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || "",
            image: cat.image || "",
            status: cat.status || "ACTIVE",
        });
        setIsModalOpen(true);
    };

    const closeFormModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData(initialFormState);
    };

    const handleNameChange = (val: string) => {
        const safeSlug = val
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");

        setFormData((prev) => ({
            ...prev,
            name: val,
            slug: editingCategory ? prev.slug : safeSlug,
        }));
    };

    const handleGenerateDescriptionAI = async () => {
        if (!formData.name || formData.name.trim().length < 2) {
            toast.error("Thiếu thông tin", "Vui lòng nhập tên danh mục trước khi dùng AI sinh mô tả");
            return;
        }

        try {
            setIsGeneratingDesc(true);
            const desc = await mockApi.generateAIDescription({
                name: formData.name,
                category: formData.name,
            });
            setFormData((prev) => ({ ...prev, description: desc }));
            toast.success("Trợ lý AI hoàn tất", "Đã sinh mô tả chuyên sâu cho danh mục");
        } catch (err: any) {
            toast.error("Lỗi trợ lý AI", err.message || "Không thể sinh mô tả lúc này");
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];

        if (!file.type.startsWith("image/")) {
            toast.error("Tệp không hợp lệ", "Vui lòng chọn tệp hình ảnh");
            return;
        }

        try {
            setIsUploadingImage(true);
            const res = await mockApi.uploadProductImage(file);
            setFormData((prev) => ({ ...prev, image: res.url }));
            toast.success("Tải ảnh thành công", "Hình ảnh danh mục đã lưu trên Cloudinary");
        } catch (err: any) {
            toast.error("Lỗi tải ảnh", err.message || "Tải ảnh lên Cloudinary thất bại");
        } finally {
            setIsUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Lỗi nhập liệu", "Tên danh mục không được để trống");
            return;
        }

        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory._id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    if (isLoadingCategories) {
        return <LoadingState message="Đang tải dữ liệu danh mục..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                        Quản lý danh mục hàng hóa
                    </h1>
                    <p className="text-xs text-[#615d59]">
                        Phân nhóm sản phẩm, theo dõi số lượng SKU và định giá vốn tồn kho theo ngành hàng
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportButtons
                        filename="danh-sach-danh-muc"
                        title="Danh sách danh mục hàng hóa"
                        columns={exportColumns}
                        data={filteredCategories}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleOpenCreate}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                        Thêm danh mục mới
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#615d59] font-medium uppercase">
                            Tổng danh mục
                        </span>
                        <FolderKanban className="w-4 h-4 text-[#0075de]" />
                    </div>
                    <p className="text-[22px] font-bold text-[#000000] mt-1">
                        {categoryStats.totalCategories} nhóm
                    </p>
                </Card>

                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#615d59] font-medium uppercase">
                            Đang hoạt động
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-[#1aae39]" />
                    </div>
                    <p className="text-[22px] font-bold text-[#1aae39] mt-1">
                        {categoryStats.activeCount} nhóm
                    </p>
                </Card>

                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#615d59] font-medium uppercase">
                            Tổng SKU liên kết
                        </span>
                        <Package className="w-4 h-4 text-[#7c3aed]" />
                    </div>
                    <p className="text-[22px] font-bold text-[#7c3aed] mt-1">
                        {categoryStats.totalSKU} sản phẩm
                    </p>
                </Card>

                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#615d59] font-medium uppercase">
                            Tổng giá trị vốn kho
                        </span>
                        <Tags className="w-4 h-4 text-[#dd5b00]" />
                    </div>
                    <p className="text-[22px] font-bold text-[#000000] mt-1">
                        {formatCurrency(categoryStats.totalValuation)}
                    </p>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-[8px] border border-[#e6e6e6]">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm danh mục theo tên hoặc mã đường dẫn..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f6f5f4] border border-transparent rounded-[6px] focus:bg-white focus:border-[#0075de] focus:outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="inline-flex p-1 bg-[#f6f5f4] rounded-[6px] text-xs">
                        {[
                            { id: "ALL", label: "Tất cả" },
                            { id: "ACTIVE", label: "Đang dùng" },
                            { id: "INACTIVE", label: "Tạm dừng" },
                        ].map((st) => (
                            <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(st.id);
                                    setCurrentPage(1);
                                }}
                                className={`px-2.5 py-1 rounded-[4px] font-medium transition-all ${
                                    statusFilter === st.id
                                        ? "bg-white text-[#000000] shadow-sm"
                                        : "text-[#615d59] hover:text-[#000000]"
                                }`}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center border border-[#e6e6e6] rounded-[6px] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 transition-colors ${
                                viewMode === "grid"
                                    ? "bg-[#0075de] text-white"
                                    : "bg-white text-[#615d59] hover:text-[#000000]"
                            }`}
                            title="Hiển thị dạng lưới"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={`p-1.5 transition-colors ${
                                viewMode === "table"
                                    ? "bg-[#0075de] text-white"
                                    : "bg-white text-[#615d59] hover:text-[#000000]"
                            }`}
                            title="Hiển thị dạng bảng"
                        >
                            <TableIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {filteredCategories.length === 0 ? (
                <Card variant="flat" padding="lg" className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <Tags className="w-8 h-8 text-[#a39e98]" />
                        <h3 className="text-sm font-bold text-[#000000]">
                            Không tìm thấy danh mục phù hợp
                        </h3>
                        <p className="text-xs text-[#615d59]">
                            Thử điều chỉnh từ khóa tìm kiếm hoặc bấm thêm danh mục mới
                        </p>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleOpenCreate}
                            className="mt-2"
                        >
                            Thêm danh mục mới
                        </Button>
                    </div>
                </Card>
            ) : viewMode === "grid" ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {paginatedCategories.map((cat) => {
                            const stats = categoryStats.statsMap[cat.name] || {
                                count: cat.productCount || 0,
                                totalValue: 0,
                            };

                            return (
                                <Card
                                    key={cat._id}
                                    variant="flat"
                                    padding="md"
                                    className="hover:border-[#0075de]/40 transition-all flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                {cat.image ? (
                                                    <img
                                                        src={cat.image}
                                                        alt={cat.name}
                                                        className="w-10 h-10 rounded-[6px] object-cover border border-[#e6e6e6]"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-[6px] bg-[#0075de]/10 text-[#0075de] flex items-center justify-center font-bold text-sm">
                                                        <Tags className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-[15px] text-[#000000] leading-snug">
                                                        {cat.name}
                                                    </h3>
                                                    <span className="text-[11px] font-mono text-[#615d59]">
                                                        {cat.slug}
                                                    </span>
                                                </div>
                                            </div>

                                            <Badge
                                                variant={cat.status === "ACTIVE" ? "success" : "gray"}
                                                size="xs"
                                            >
                                                {cat.status === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}
                                            </Badge>
                                        </div>

                                        {cat.description && (
                                            <p className="text-xs text-[#615d59] line-clamp-2 leading-relaxed">
                                                {cat.description}
                                            </p>
                                        )}

                                        <div className="pt-2 border-t border-[#f0f0f0] grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-[#a39e98] text-[11px] block">
                                                    Số lượng SKU
                                                </span>
                                                <span className="font-bold text-[#000000]">
                                                    {stats.count} sản phẩm
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[#a39e98] text-[11px] block">
                                                    Giá trị vốn kho
                                                </span>
                                                <span className="font-bold text-[#0075de]">
                                                    {formatCurrency(stats.totalValue)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-[#f0f0f0] flex items-center justify-end gap-2">
                                        <Button
                                            variant="utility"
                                            size="xs"
                                            onClick={() => handleOpenEdit(cat)}
                                            leftIcon={<Edit2 className="w-3 h-3" />}
                                        >
                                            Chỉnh sửa
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="xs"
                                            onClick={() => {
                                                setCategoryToDelete(cat);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            leftIcon={<Trash2 className="w-3 h-3" />}
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredCategories.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            ) : (
                <div className="bg-white rounded-[8px] border border-[#e6e6e6] overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#e6e6e6] bg-[#f6f5f4] text-[#615d59] font-semibold">
                                <th className="py-2.5 px-4">Tên danh mục</th>
                                <th className="py-2.5 px-4">Mã đường dẫn</th>
                                <th className="py-2.5 px-4 text-center">Số SKU</th>
                                <th className="py-2.5 px-4 text-right">Tổng vốn tồn</th>
                                <th className="py-2.5 px-4 text-center">Trạng thái</th>
                                <th className="py-2.5 px-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6e6e6]">
                            {paginatedCategories.map((cat) => {
                                const stats = categoryStats.statsMap[cat.name] || {
                                    count: cat.productCount || 0,
                                    totalValue: 0,
                                };

                                return (
                                    <tr key={cat._id} className="hover:bg-[#f6f5f4]/60 transition-colors">
                                        <td className="py-3 px-4 font-semibold text-[#000000]">
                                            <div className="flex items-center gap-2">
                                                {cat.image ? (
                                                    <img
                                                        src={cat.image}
                                                        alt={cat.name}
                                                        className="w-7 h-7 rounded-[4px] object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-[4px] bg-[#0075de]/10 text-[#0075de] flex items-center justify-center font-bold text-[10px]">
                                                        {cat.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <span>{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-[#615d59]">
                                            {cat.slug}
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold text-[#000000]">
                                            {stats.count}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-[#0075de]">
                                            {formatCurrency(stats.totalValue)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge
                                                variant={
                                                    cat.status === "ACTIVE" ? "success" : "gray"
                                                }
                                                size="xs"
                                            >
                                                {cat.status === "ACTIVE"
                                                    ? "Hoạt động"
                                                    : "Tạm dừng"}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="utility"
                                                    size="xs"
                                                    onClick={() => handleOpenEdit(cat)}
                                                >
                                                    Sửa
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="xs"
                                                    onClick={() => {
                                                        setCategoryToDelete(cat);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredCategories.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeFormModal}
                title={editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                description="Khai báo thông tin ngành hàng để phân loại quản lý kho"
                size="lg"
                footer={
                    <>
                        <Button variant="utility" size="sm" onClick={closeFormModal}>
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            isLoading={createMutation.isPending || updateMutation.isPending}
                            onClick={handleSubmit}
                        >
                            {editingCategory ? "Lưu thay đổi" : "Tạo danh mục"}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Tên danh mục"
                            required
                            placeholder="VD: Thiết bị mạng viễn thông"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                        />

                        <Input
                            label="Mã đường dẫn"
                            required
                            placeholder="thiet-bi-mang-vien-thong"
                            value={formData.slug}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, slug: e.target.value }))
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label="Trạng thái"
                            value={formData.status}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    status: e.target.value as any,
                                }))
                            }
                            options={[
                                { label: "Đang hoạt động", value: "ACTIVE" },
                                { label: "Tạm dừng áp dụng", value: "INACTIVE" },
                            ]}
                        />

                        <div>
                            <label className="text-[13px] font-medium text-[#31302e] block mb-1.5">
                                Ảnh danh mục Cloudinary
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleUploadImage}
                                className="hidden"
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="utility"
                                    size="sm"
                                    disabled={isUploadingImage}
                                    onClick={() => fileInputRef.current?.click()}
                                    leftIcon={
                                        isUploadingImage ? (
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <UploadCloud className="w-3.5 h-3.5" />
                                        )
                                    }
                                >
                                    {isUploadingImage ? "Đang tải ảnh..." : "Chọn ảnh tải lên"}
                                </Button>
                                {formData.image && (
                                    <span className="text-xs text-[#1aae39] flex items-center gap-1 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Đã có ảnh
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[13px] font-medium text-[#31302e]">
                                Mô tả danh mục
                            </label>
                            <Button
                                type="button"
                                variant="utility"
                                size="xs"
                                disabled={isGeneratingDesc || !formData.name}
                                onClick={handleGenerateDescriptionAI}
                                leftIcon={
                                    isGeneratingDesc ? (
                                        <RefreshCw className="w-3 h-3 animate-spin text-[#7c3aed]" />
                                    ) : (
                                        <Sparkles className="w-3 h-3 text-[#7c3aed]" />
                                    )
                                }
                                className="text-[#7c3aed] border-[#7c3aed]/30 hover:bg-[#7c3aed]/10"
                            >
                                {isGeneratingDesc
                                    ? "AI đang viết..."
                                    : "Viết mô tả bằng AI"}
                            </Button>
                        </div>
                        <textarea
                            rows={3}
                            placeholder="Giới thiệu đặc điểm hàng hóa thuộc danh mục..."
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, description: e.target.value }))
                            }
                            className="w-full bg-white text-[#000000] text-[13px] border border-[#e6e6e6] rounded-[6px] p-2.5 focus:outline-none focus:border-[#0075de]"
                        />
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Xác nhận xóa danh mục"
                description="Hành động này sẽ loại bỏ danh mục vĩnh viễn khỏi hệ thống"
                size="sm"
                footer={
                    <>
                        <Button
                            variant="utility"
                            size="sm"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            isLoading={deleteMutation.isPending}
                            onClick={() =>
                                categoryToDelete && deleteMutation.mutate(categoryToDelete._id)
                            }
                        >
                            Xác nhận xóa
                        </Button>
                    </>
                }
            >
                {categoryToDelete && (
                    <div className="space-y-3 text-xs text-[#31302e]">
                        <p>
                            Bạn có chắc chắn muốn xóa danh mục{" "}
                            <strong className="text-[#000000]">{categoryToDelete.name}</strong> không?
                        </p>
                        {(categoryStats.statsMap[categoryToDelete.name]?.count || 0) > 0 && (
                            <div className="p-3 bg-[#fdf2f2] border border-[#f8b4b4] rounded-[6px] text-[#9b1c1c]">
                                Lưu ý: Danh mục này đang có{" "}
                                <strong>
                                    {categoryStats.statsMap[categoryToDelete.name].count} sản phẩm
                                </strong>{" "}
                                liên kết. Vui lòng chuyển sản phẩm sang danh mục khác trước khi xóa.
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
