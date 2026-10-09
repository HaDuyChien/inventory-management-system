import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Product } from "@/types";
import { mockApi } from "@/services/mockApi";
import { toast } from "@/stores/useToastStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useQueryClient } from "@tanstack/react-query";

interface AdjustStockModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({ product, isOpen, onClose }) => {
    const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
    const [type, setType] = useState<"ADJUSTMENT" | "DAMAGE" | "INBOUND" | "OUTBOUND">(
        "ADJUSTMENT",
    );
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    if (!product) return null;

    const newStock = Math.max(0, product.stock + Number(adjustmentQty || 0));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustmentQty || adjustmentQty === 0) {
            toast.error("Lỗi", "Số lượng điều chỉnh không thể bằng 0.");
            return;
        }
        if (!reason.trim()) {
            toast.error("Lỗi", "Vui lòng nhập lý do điều chỉnh.");
            return;
        }

        setIsSubmitting(true);
        try {
            await mockApi.adjustStock(product.id, Number(adjustmentQty), type, reason);
            toast.success("Thành công", `Đã cập nhật tồn kho ${product.sku} thành ${newStock}.`);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["stock-levels"] });

            if (newStock <= (product.minStock || 10)) {
                useNotificationStore.getState().addNotification({
                    id: `low-stock-${product.id}-${Date.now()}`,
                    title: "Cảnh báo tồn kho thấp",
                    desc: `Sản phẩm ${product.name} chỉ còn ${newStock} đơn vị, chạm ngưỡng tối thiểu.`,
                    type: "inventory",
                    link: "/inventory/stock",
                    badge: "Tồn kho thấp",
                    badgeVariant: "danger",
                });
            } else {
                useNotificationStore.getState().addNotification({
                    id: `adjust-${product.id}-${Date.now()}`,
                    title: "Điều chỉnh tồn kho",
                    desc: `Sản phẩm ${product.name} vừa được điều chỉnh số lượng tồn thành ${newStock}.`,
                    type: "inventory",
                    link: "/inventory/stock",
                    badge: "Điều chỉnh",
                    badgeVariant: "warning",
                });
            }

            onClose();
            setAdjustmentQty(0);
            setReason("");
        } catch (err: any) {
            toast.error("Lỗi", err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Điều chỉnh tồn kho"
            description={`Sản phẩm: ${product.name}`}
            size="md"
            footer={
                <>
                    <Button variant="utility" size="sm" onClick={onClose} disabled={isSubmitting}>
                        Hủy
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                    >
                        Xác nhận
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="p-3 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[8px] flex items-center justify-between text-xs">
                    <div>
                        <span className="text-[#615d59]">Tồn hiện tại: </span>
                        <strong className="text-[#000000] text-sm">{product.stock}</strong>
                    </div>
                    <div>
                        <span className="text-[#615d59]">Tồn dự kiến: </span>
                        <strong
                            className={`text-sm ${
                                newStock < product.minStock ? "text-[#eb5757]" : "text-[#1aae39]"
                            }`}
                        >
                            {newStock}
                        </strong>
                    </div>
                </div>

                <Select
                    label="Loại điều chỉnh"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    options={[
                        { label: "Kiểm kê định kỳ", value: "ADJUSTMENT" },
                        { label: "Hàng hư hại", value: "DAMAGE" },
                        { label: "Nhập trực tiếp", value: "INBOUND" },
                        { label: "Xuất trực tiếp", value: "OUTBOUND" },
                    ]}
                />

                <Input
                    label="Số lượng thay đổi"
                    type="number"
                    required
                    placeholder="VD: 10 hoặc -5"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                />

                <Input
                    label="Lý do điều chỉnh"
                    required
                    placeholder="VD: Lệch số liệu kiểm kê thực tế"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
            </form>
        </Modal>
    );
};
