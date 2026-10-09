import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Warehouse as WarehouseIcon, Plus, MapPin, User, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/States";
import { mockApi } from "@/services/mockApi";
import { formatNumber } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";

export const WarehouseListPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newWh, setNewWh] = useState({
        name: "",
        code: "",
        address: "",
        city: "",
        manager: "",
        totalCapacity: 10000,
    });

    const { data: warehouses = [], isLoading } = useQuery({
        queryKey: ["warehouses"],
        queryFn: mockApi.getWarehouses,
    });

    const createMutation = useMutation({
        mutationFn: (whData: typeof newWh) =>
            mockApi.createWarehouse({
                ...whData,
                occupiedCapacity: 0,
                zonesCount: 1,
                racksCount: 4,
                binsCount: 32,
                zones: [],
            }),
        onSuccess: (created) => {
            toast.success("Tạo thành công", `Đã thêm kho ${created.name} - Mã ${created.code}`);
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
            setIsCreateModalOpen(false);
            setNewWh({
                name: "",
                code: "",
                address: "",
                city: "",
                manager: "",
                totalCapacity: 10000,
            });
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWh.name || !newWh.code) {
            toast.error("Thiếu thông tin", "Vui lòng nhập tên và mã kho.");
            return;
        }
        createMutation.mutate(newWh);
    };

    if (isLoading) return <LoadingState message="Đang tải danh sách kho bãi..." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                    Hệ thống kho bãi
                </h1>

                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                >
                    Thêm kho mới
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {warehouses.map((wh) => {
                    const occupancyRate =
                        Math.round((wh.occupiedCapacity / wh.totalCapacity) * 100) || 0;
                    const isHighOccupancy = occupancyRate >= 85;

                    return (
                        <Card
                            key={wh.id}
                            variant="flat"
                            padding="lg"
                            className="hover:border-[#d4d4d4] transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="w-10 h-10 rounded-[8px] bg-[#0075de]/10 text-[#0075de] flex items-center justify-center shrink-0">
                                        <WarehouseIcon className="w-5 h-5" />
                                    </div>
                                    <Badge
                                        variant={isHighOccupancy ? "warning" : "success"}
                                        size="xs"
                                    >
                                        Đã chứa {occupancyRate}%
                                    </Badge>
                                </div>

                                <div>
                                    <h3 className="text-[17px] font-bold text-[#000000] tracking-tight">
                                        {wh.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-[#615d59] mt-1">
                                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#a39e98]" />
                                        <span className="truncate">
                                            {wh.address}, {wh.city}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#615d59]">Sức chứa</span>
                                        <span className="font-semibold text-[#000000]">
                                            {formatNumber(wh.occupiedCapacity)} /{" "}
                                            {formatNumber(wh.totalCapacity)} ô
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-[#e6e6e6] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${
                                                isHighOccupancy ? "bg-[#dd5b00]" : "bg-[#0075de]"
                                            }`}
                                            style={{ width: `${occupancyRate}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#e6e6e6] text-xs">
                                    <div>
                                        <span className="text-[#615d59]">Khu vực</span>
                                        <p className="font-semibold text-[#000000] mt-0.5">
                                            {wh.zonesCount || 3}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[#615d59]">Dãy kệ</span>
                                        <p className="font-semibold text-[#000000] mt-0.5">
                                            {wh.racksCount || 18}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[#615d59]">Vị trí ô</span>
                                        <p className="font-semibold text-[#000000] mt-0.5">
                                            {wh.binsCount || 144}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-[#31302e]">
                                    <User className="w-3.5 h-3.5 text-[#a39e98]" />
                                    <span>
                                        Quản lý kho:{" "}
                                        <strong>{wh.manager || "Chưa phân công"}</strong>
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-[#e6e6e6] flex items-center justify-between">
                                <span className="font-mono text-xs text-[#a39e98]">{wh.code}</span>
                                <Button
                                    variant="utility"
                                    size="xs"
                                    onClick={() => navigate(`/warehouses/${wh.id}`)}
                                    rightIcon={<ArrowRight className="w-3 h-3" />}
                                >
                                    Xem sơ đồ kho
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Thêm kho mới"
                description="Đăng ký thêm cơ sở kho hoặc trung tâm phân phối mới"
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
                            onClick={handleCreate}
                            isLoading={createMutation.isPending}
                        >
                            Tạo kho
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <Input
                        label="Tên kho"
                        required
                        placeholder="VD: Kho Cần Thơ"
                        value={newWh.name}
                        onChange={(e) => setNewWh({ ...newWh, name: e.target.value })}
                    />
                    <Input
                        label="Mã kho"
                        required
                        placeholder="VD: KHO-CT"
                        value={newWh.code}
                        onChange={(e) => setNewWh({ ...newWh, code: e.target.value })}
                    />
                    <Input
                        label="Địa chỉ"
                        required
                        placeholder="VD: KCN Trà Nóc, Q. Bình Thủy"
                        value={newWh.address}
                        onChange={(e) => setNewWh({ ...newWh, address: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Tỉnh / Thành phố"
                            required
                            placeholder="VD: Cần Thơ"
                            value={newWh.city}
                            onChange={(e) => setNewWh({ ...newWh, city: e.target.value })}
                        />
                        <Input
                            label="Quản lý phụ trách"
                            required
                            placeholder="VD: Trần Văn Bình"
                            value={newWh.manager}
                            onChange={(e) => setNewWh({ ...newWh, manager: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Sức chứa tiêu chuẩn"
                        type="number"
                        required
                        placeholder="10000"
                        value={newWh.totalCapacity}
                        onChange={(e) =>
                            setNewWh({ ...newWh, totalCapacity: Number(e.target.value) })
                        }
                    />
                </form>
            </Modal>
        </div>
    );
};
