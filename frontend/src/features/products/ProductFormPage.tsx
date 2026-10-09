import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Save,
    UploadCloud,
    Trash2,
    RefreshCw,
    CheckCircle2,
    Image as ImageIcon,
    Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/ui/States";
import { mockApi } from "@/services/mockApi";
import { toast } from "@/stores/useToastStore";

const productSchema = z.object({
    name: z.string().min(3, "Tên sản phẩm tối thiểu 3 ký tự"),
    sku: z.string().min(3, "Mã SKU tối thiểu 3 ký tự"),
    category: z.string().min(1, "Vui lòng chọn danh mục"),
    brand: z.string().min(2, "Vui lòng nhập thương hiệu"),
    model: z.string().optional(),
    costPrice: z.coerce.number().positive("Giá vốn phải lớn hơn 0"),
    sellingPrice: z.coerce.number().positive("Giá bán phải lớn hơn 0"),
    stock: z.coerce.number().int().min(0, "Tồn kho không được âm"),
    minStock: z.coerce.number().int().min(1, "Định mức tối thiểu ít nhất là 1"),
    warehouseName: z.string().min(1, "Vui lòng chọn kho lưu trữ"),
    location: z.string().min(1, "Vui lòng nhập vị trí lưu trữ"),
    warranty: z.string().min(1, "Vui lòng nhập thời hạn bảo hành"),
    status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
    image: z.string().optional().or(z.literal("")),
    description: z.string().min(10, "Mô tả tối thiểu 10 ký tự"),
    barcode: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export const ProductFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = Boolean(id);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: existingProduct, isLoading: isLoadingExisting } = useQuery({
        queryKey: ["product", id],
        queryFn: () => mockApi.getProductById(id!),
        enabled: isEditing,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: () => mockApi.getCategories(),
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ["warehouses"],
        queryFn: () => mockApi.getWarehouses(),
    });

    const categoryOptions =
        categories.length > 0
            ? categories.map((c) => ({ label: c.name, value: c.name }))
            : [
                  {
                      label: "Thiết bị mã vạch và Quét kho",
                      value: "Thiết bị mã vạch và Quét kho",
                  },
                  {
                      label: "Thiết bị điện tử và Viễn thông",
                      value: "Thiết bị điện tử và Viễn thông",
                  },
                  {
                      label: "Vật tư đóng gói và Vận chuyển",
                      value: "Vật tư đóng gói và Vận chuyển",
                  },
                  {
                      label: "Bảo hộ lao động và An toàn",
                      value: "Bảo hộ lao động và An toàn",
                  },
                  {
                      label: "Kệ và Hệ thống lưu trữ kho",
                      value: "Kệ và Hệ thống lưu trữ kho",
                  },
              ];

    const warehouseOptions =
        warehouses.length > 0
            ? warehouses.map((w) => ({ label: w.name, value: w.name }))
            : [
                  { label: "Kho Tổng Hà Nội", value: "Kho Tổng Hà Nội" },
                  {
                      label: "Kho Trung Chuyển Đà Nẵng",
                      value: "Kho Trung Chuyển Đà Nẵng",
                  },
                  {
                      label: "Kho Phân Phối Sài Gòn",
                      value: "Kho Phân Phối Sài Gòn",
                  },
              ];

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            sku: "",
            category: "Thiết bị điện tử và Viễn thông",
            brand: "",
            model: "",
            costPrice: 0,
            sellingPrice: 0,
            stock: 10,
            minStock: 5,
            warehouseName: "Kho Tổng Hà Nội",
            location: "Khu A - Kệ 01 - Ô 01",
            warranty: "24 Tháng chính hãng",
            status: "ACTIVE",
            image: "",
            description: "",
            barcode: "",
        },
    });

    const currentImage = watch("image");

    useEffect(() => {
        if (existingProduct) {
            reset({
                name: existingProduct.name,
                sku: existingProduct.sku,
                category: existingProduct.category,
                brand: existingProduct.brand,
                model: existingProduct.model || "",
                costPrice: existingProduct.costPrice,
                sellingPrice: existingProduct.sellingPrice,
                stock: existingProduct.stock,
                minStock: existingProduct.minStock,
                warehouseName: existingProduct.warehouseName,
                location: existingProduct.location,
                warranty: existingProduct.warranty,
                status: existingProduct.status,
                image: existingProduct.image || "",
                description: existingProduct.description,
                barcode: existingProduct.barcode || "",
            });
        }
    }, [existingProduct, reset]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];

        if (!file.type.startsWith("image/")) {
            setUploadError("Vui lòng chọn tệp hình ảnh hợp lệ");
            toast.error("Lỗi tệp", "Chỉ hỗ trợ tệp định dạng hình ảnh");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError("Dung lượng ảnh vượt quá 5MB");
            toast.error("Lỗi dung lượng", "Ảnh tải lên không được vượt quá 5MB");
            return;
        }

        try {
            setIsUploading(true);
            setUploadError(null);
            const res = await mockApi.uploadProductImage(file);
            setValue("image", res.url, { shouldValidate: true, shouldDirty: true });
            toast.success("Tải ảnh thành công", "Hình ảnh đã được tải lên Cloudinary");
        } catch (err: any) {
            const msg = err.response?.data?.thongDiep || err.message || "Tải ảnh lên thất bại";
            setUploadError(msg);
            toast.error("Lỗi tải ảnh", msg);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

    const handleGenerateAIDescription = async () => {
        const productName = watch("name");
        if (!productName || productName.trim().length < 2) {
            toast.error("Thiếu thông tin", "Vui lòng nhập tên sản phẩm trước khi tạo mô tả bằng AI");
            return;
        }

        try {
            setIsGeneratingDesc(true);
            const desc = await mockApi.generateAIDescription({
                name: productName,
                category: watch("category"),
                brand: watch("brand"),
            });
            setValue("description", desc, { shouldValidate: true, shouldDirty: true });
            toast.success("Trợ lý AI hoàn tất", "Đã sinh mô tả chi tiết cho sản phẩm");
        } catch (err: any) {
            toast.error("Lỗi trợ lý AI", err.message || "Không thể sinh mô tả lúc này");
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const createMutation = useMutation({
        mutationFn: (data: ProductFormData) =>
            mockApi.createProduct({
                name: data.name,
                sku: data.sku,
                category: data.category,
                brand: data.brand,
                model: data.model || "",
                costPrice: Number(data.costPrice),
                sellingPrice: Number(data.sellingPrice),
                stock: Number(data.stock),
                minStock: Number(data.minStock),
                warehouseName: data.warehouseName,
                location: data.location,
                warranty: data.warranty,
                status: data.status,
                image: data.image || "",
                description: data.description,
                barcode: data.barcode || "",
                warehouseId: "wh-1",
                reservedStock: 0,
                availableStock: Number(data.stock),
            }),
        onSuccess: (newProduct) => {
            toast.success("Tạo thành công", `Đã thêm sản phẩm ${newProduct.name}`);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            navigate(`/products/${newProduct.id}`);
        },
        onError: (err: any) => {
            const message =
                err.response?.data?.thongDiep ||
                err.response?.data?.message ||
                err.message ||
                "Không thể tạo sản phẩm";
            toast.error("Lỗi tạo sản phẩm", message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: ProductFormData) =>
            mockApi.updateProduct(id!, {
                ...data,
                availableStock: Math.max(0, data.stock - (existingProduct?.reservedStock || 0)),
            }),
        onSuccess: () => {
            toast.success("Cập nhật thành công", "Đã lưu thông tin sản phẩm");
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            navigate(`/products/${id}`);
        },
        onError: (err: any) => {
            const message =
                err.response?.data?.thongDiep ||
                err.response?.data?.message ||
                err.message ||
                "Không thể cập nhật sản phẩm";
            toast.error("Lỗi cập nhật sản phẩm", message);
        },
    });

    const onSubmit = (formData: ProductFormData) => {
        if (isEditing) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    if (isEditing && isLoadingExisting) {
        return <LoadingState message="Đang tải dữ liệu sản phẩm..." />;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="utility"
                        size="sm"
                        onClick={() => navigate(isEditing ? `/products/${id}` : "/products")}
                        leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    >
                        Quay lại
                    </Button>
                    <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                        {isEditing ? `Sửa sản phẩm: ${existingProduct?.name}` : "Thêm sản phẩm mới"}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card variant="flat" padding="lg">
                    <CardHeader>
                        <CardTitle>Thông tin cơ bản</CardTitle>
                    </CardHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <Input
                                label="Tên sản phẩm"
                                required
                                placeholder="Nhập tên sản phẩm..."
                                {...register("name")}
                                error={errors.name?.message}
                            />
                        </div>

                        <Input
                            label="Mã SKU"
                            required
                            placeholder="VD: SKU-SCN-001"
                            {...register("sku")}
                            error={errors.sku?.message}
                        />

                        <Select
                            label="Danh mục"
                            required
                            {...register("category")}
                            error={errors.category?.message}
                            options={categoryOptions}
                        />

                        <Input
                            label="Hãng sản xuất"
                            required
                            placeholder="VD: Zebra Technologies"
                            {...register("brand")}
                            error={errors.brand?.message}
                        />

                        <Input
                            label="Model"
                            placeholder="VD: TC520L-1PEZU4P"
                            {...register("model")}
                            error={errors.model?.message}
                        />

                        <Input
                            label="Mã vạch"
                            placeholder="VD: 880923481021"
                            {...register("barcode")}
                            error={errors.barcode?.message}
                        />

                        <Select
                            label="Trạng thái"
                            {...register("status")}
                            error={errors.status?.message}
                            options={[
                                { label: "Đang kinh doanh", value: "ACTIVE" },
                                { label: "Bản nháp", value: "DRAFT" },
                                { label: "Ngừng bán", value: "ARCHIVED" },
                            ]}
                        />
                    </div>
                </Card>

                <Card variant="flat" padding="lg">
                    <CardHeader>
                        <CardTitle>Giá & Định mức tồn</CardTitle>
                    </CardHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <Input
                            label="Giá vốn"
                            type="number"
                            required
                            placeholder="0"
                            {...register("costPrice")}
                            error={errors.costPrice?.message}
                        />

                        <Input
                            label="Giá bán"
                            type="number"
                            required
                            placeholder="0"
                            {...register("sellingPrice")}
                            error={errors.sellingPrice?.message}
                        />

                        <Input
                            label="Tồn kho ban đầu"
                            type="number"
                            required
                            placeholder="10"
                            {...register("stock")}
                            error={errors.stock?.message}
                        />

                        <Input
                            label="Định mức tối thiểu"
                            type="number"
                            required
                            placeholder="5"
                            {...register("minStock")}
                            error={errors.minStock?.message}
                        />
                    </div>
                </Card>

                <Card variant="flat" padding="lg">
                    <CardHeader>
                        <CardTitle>Vị trí kho & Bảo hành</CardTitle>
                    </CardHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Select
                            label="Kho lưu trữ"
                            required
                            {...register("warehouseName")}
                            error={errors.warehouseName?.message}
                            options={warehouseOptions}
                        />

                        <Input
                            label="Vị trí lưu kho"
                            required
                            placeholder="VD: Khu A - Kệ 01 - Ô 02"
                            {...register("location")}
                            error={errors.location?.message}
                        />

                        <Input
                            label="Thời hạn bảo hành"
                            required
                            placeholder="VD: 24 Tháng chính hãng"
                            {...register("warranty")}
                            error={errors.warranty?.message}
                        />
                    </div>

                    <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[13px] font-medium text-[#31302e]">
                                Hình ảnh sản phẩm Cloudinary
                            </label>
                            {currentImage && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Đã lưu trên Cloudinary
                                </span>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/webp, image/gif"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="product-image-upload"
                        />

                        {currentImage ? (
                            <div className="border border-[#e6e6e6] rounded-[8px] p-3.5 bg-[#fafafa] flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[6px] overflow-hidden bg-white border border-[#e0e0e0] flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <img
                                        src={currentImage}
                                        alt="Xem trước ảnh sản phẩm"
                                        className="w-full h-full object-contain p-1"
                                    />
                                </div>

                                <div className="flex-1 text-center sm:text-left space-y-2 w-full min-w-0">
                                    <p className="text-[13px] font-semibold text-[#1f2937] truncate">
                                        {currentImage}
                                    </p>
                                    <p className="text-[12px] text-[#6b7280]">
                                        Hình ảnh được lưu trữ an toàn và phân phối qua CDN Cloudinary tốc độ cao
                                    </p>
                                    <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                                        <Button
                                            type="button"
                                            variant="utility"
                                            size="sm"
                                            disabled={isUploading}
                                            onClick={() => fileInputRef.current?.click()}
                                            leftIcon={
                                                isUploading ? (
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <UploadCloud className="w-3.5 h-3.5" />
                                                )
                                            }
                                        >
                                            {isUploading ? "Đang tải lên..." : "Thay ảnh khác"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            disabled={isUploading}
                                            onClick={() =>
                                                setValue("image", "", {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                })
                                            }
                                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                                        >
                                            Gỡ ảnh
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-[8px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                                    isUploading
                                        ? "bg-[#f5f5f5] border-[#d1d5db] cursor-wait"
                                        : "bg-[#fafafa] hover:bg-[#f0f7ff] border-[#d1d5db] hover:border-[#0075de]"
                                }`}
                            >
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-2 py-4">
                                        <RefreshCw className="w-8 h-8 text-[#0075de] animate-spin" />
                                        <p className="text-[14px] font-medium text-[#1f2937]">
                                            Đang tải ảnh lên Cloudinary...
                                        </p>
                                        <p className="text-[12px] text-[#6b7280]">
                                            Vui lòng chờ trong giây lát
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 py-2">
                                        <div className="w-12 h-12 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#0075de] mb-1">
                                            <UploadCloud className="w-6 h-6" />
                                        </div>
                                        <p className="text-[14px] font-medium text-[#1f2937]">
                                            Nhấn để chọn và tải ảnh sản phẩm lên Cloudinary
                                        </p>
                                        <p className="text-[12px] text-[#6b7280]">
                                            Hỗ trợ định dạng PNG, JPG, WEBP dung lượng tối đa 5MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {uploadError && (
                            <p className="text-xs text-[#eb5757] font-medium">{uploadError}</p>
                        )}
                        {errors.image && (
                            <p className="text-xs text-[#eb5757]">{errors.image.message}</p>
                        )}
                    </div>

                    <div className="mt-5 flex flex-col gap-1.5 text-left">
                        <div className="flex items-center justify-between">
                            <label className="text-[13px] font-medium text-[#31302e]">
                                Mô tả chi tiết <span className="text-[#eb5757]">*</span>
                            </label>
                            <Button
                                type="button"
                                variant="utility"
                                size="xs"
                                disabled={isGeneratingDesc || !watch("name")}
                                onClick={handleGenerateAIDescription}
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
                            rows={4}
                            placeholder="Thông số kỹ thuật, ghi chú sử dụng..."
                            className="w-full bg-white text-[#000000] text-[14px] border border-[#e6e6e6] rounded-[6px] p-3 focus:outline-none focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/15"
                            {...register("description")}
                        />
                        {errors.description && (
                            <p className="text-xs text-[#eb5757]">{errors.description.message}</p>
                        )}
                    </div>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="utility"
                        size="md"
                        onClick={() => navigate("/products")}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={
                            isSubmitting ||
                            createMutation.isPending ||
                            updateMutation.isPending ||
                            isUploading
                        }
                        leftIcon={<Save className="w-4 h-4" />}
                    >
                        {isEditing ? "Lưu thay đổi" : "Tạo sản phẩm"}
                    </Button>
                </div>
            </form>
        </div>
    );
};
