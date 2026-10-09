import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Grid3X3, Box, ArrowRightLeft, Plus, Settings, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { mockApi } from "@/services/mockApi";
import type { BinLocation } from "@/types";
import { formatNumber, formatDate } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";

export const WarehouseDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("locations");
    const [selectedBin, setSelectedBin] = useState<BinLocation | null>(null);

    const [isRelocateModalOpen, setIsRelocateModalOpen] = useState(false);
    const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
    const [isAddRackModalOpen, setIsAddRackModalOpen] = useState(false);
    const [isAddBinModalOpen, setIsAddBinModalOpen] = useState(false);
    const [isEditBinModalOpen, setIsEditBinModalOpen] = useState(false);

    const [targetWarehouseId, setTargetWarehouseId] = useState(id || "");
    const [sourceBinCode, setSourceBinCode] = useState("");
    const [targetBinCode, setTargetBinCode] = useState("");
    const [relocateQuantity, setRelocateQuantity] = useState(1);
    const [relocateReason, setRelocateReason] = useState("Điều chuyển cân bằng vị trí kho");

    const [newZoneName, setNewZoneName] = useState("");
    const [newZoneCode, setNewZoneCode] = useState("");

    const [targetZoneCodeForRack, setTargetZoneCodeForRack] = useState("");
    const [newRackCode, setNewRackCode] = useState("");
    const [newRackName, setNewRackName] = useState("");

    const [targetZoneForBin, setTargetZoneForBin] = useState("");
    const [targetRackForBin, setTargetRackForBin] = useState("");
    const [newBinCode, setNewBinCode] = useState("");
    const [newBinName, setNewBinName] = useState("");
    const [newBinCapacity, setNewBinCapacity] = useState(100);

    const [editBinStatus, setEditBinStatus] = useState<"AVAILABLE" | "OCCUPIED" | "FULL" | "MAINTENANCE">("AVAILABLE");
    const [editBinCapacity, setEditBinCapacity] = useState(100);

    const { data: warehouse, isLoading } = useQuery({
        queryKey: ["warehouse", id],
        queryFn: () => mockApi.getWarehouseById(id || ""),
        enabled: !!id,
    });

    const { data: allWarehouses = [] } = useQuery({
        queryKey: ["warehouses"],
        queryFn: mockApi.getWarehouses,
    });

    const { data: products = [] } = useQuery({
        queryKey: ["products"],
        queryFn: mockApi.getProducts,
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ["transactions"],
        queryFn: mockApi.getTransactions,
    });

    const relocateMutation = useMutation({
        mutationFn: (data: {
            sourceWarehouseId: string;
            sourceBinCode: string;
            targetWarehouseId: string;
            targetBinCode: string;
            quantity: number;
            reason: string;
        }) =>
            mockApi.relocateStock({
                ...data,
                performedBy: "Quản trị viên",
            }),
        onSuccess: () => {
            toast.success("Điều chuyển thành công", `Đã chuyển ${relocateQuantity} sản phẩm sang ô ${targetBinCode}`);
            queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsRelocateModalOpen(false);
            setSelectedBin(null);
        },
        onError: (err: any) => {
            toast.error("Điều chuyển thất bại", err?.message || "Không thể thực hiện điều chuyển vị trí");
        },
    });

    const addZoneMutation = useMutation({
        mutationFn: (zoneData: { zoneName: string; code: string }) =>
            mockApi.addWarehouseZone(id || "", zoneData),
        onSuccess: () => {
            toast.success("Thêm phân khu thành công", `Đã thêm phân khu ${newZoneName}`);
            queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
            setIsAddZoneModalOpen(false);
            setNewZoneName("");
            setNewZoneCode("");
        },
        onError: (err: any) => {
            toast.error("Lỗi tạo phân khu", err?.message || "Vui lòng thử lại");
        },
    });

    const addRackMutation = useMutation({
        mutationFn: (rackData: { zoneCode: string; rackCode: string; name: string }) =>
            mockApi.addWarehouseRack(id || "", rackData),
        onSuccess: () => {
            toast.success("Thêm dãy kệ thành công", `Đã thêm dãy kệ ${newRackCode}`);
            queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
            setIsAddRackModalOpen(false);
            setNewRackCode("");
            setNewRackName("");
        },
        onError: (err: any) => {
            toast.error("Lỗi tạo dãy kệ", err?.message || "Vui lòng thử lại");
        },
    });

    const addBinMutation = useMutation({
        mutationFn: (binData: {
            zoneCode: string;
            rackCode: string;
            binCode: string;
            name: string;
            capacity: number;
        }) =>
            mockApi.addWarehouseBin(id || "", binData),
        onSuccess: () => {
            toast.success("Thêm ô chứa thành công", `Đã tạo ô lưu trữ ${newBinCode}`);
            queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
            setIsAddBinModalOpen(false);
            setNewBinCode("");
            setNewBinName("");
            setNewBinCapacity(100);
        },
        onError: (err: any) => {
            toast.error("Lỗi tạo ô chứa", err?.message || "Vui lòng thử lại");
        },
    });

    const updateBinMutation = useMutation({
        mutationFn: (binData: {
            binId: string;
            status: "AVAILABLE" | "OCCUPIED" | "FULL" | "MAINTENANCE";
            capacity: number;
        }) =>
            mockApi.updateWarehouseBin(id || "", binData),
        onSuccess: () => {
            toast.success("Cập nhật ô thành công", "Thông số ô lưu trữ đã được lưu vào hệ thống");
            queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
            setIsEditBinModalOpen(false);
            setSelectedBin(null);
        },
        onError: (err: any) => {
            toast.error("Lỗi cập nhật", err?.message || "Vui lòng thử lại");
        },
    });

    if (isLoading) return <LoadingState message="Đang tải sơ đồ kho bãi..." />;
    if (!warehouse)
        return <ErrorState title="Không tìm thấy kho" onRetry={() => navigate("/warehouses")} />;

    const binProductMap = new Map<string, { binCode: string; qty: number }>();
    (warehouse.zones || []).forEach((z) => {
        (z.racks || []).forEach((r) => {
            (r.bins || []).forEach((b: any) => {
                if (b.product) {
                    binProductMap.set(String(b.product), { binCode: b.binCode || b.name, qty: b.occupancy || 0 });
                }
                if (b.sku) {
                    binProductMap.set(b.sku, { binCode: b.binCode || b.name, qty: b.occupancy || 0 });
                }
            });
        });
    });

    const warehouseProducts = products
        .filter(
            (p) =>
                p.warehouseName === warehouse.name ||
                p.warehouseId === warehouse.id ||
                binProductMap.has(p.id) ||
                binProductMap.has(p.sku),
        )
        .map((p) => {
            const binInfo = binProductMap.get(p.id) || binProductMap.get(p.sku);
            return {
                ...p,
                location: binInfo?.binCode || p.location,
                stock: binInfo?.qty !== undefined && binInfo.qty > 0 ? binInfo.qty : p.stock,
                availableStock: binInfo?.qty !== undefined && binInfo.qty > 0 ? binInfo.qty : p.availableStock,
            };
        });
    const warehouseTx = transactions
        .filter((tx) => tx.reference.includes(warehouse.code) || true)
        .slice(0, 10);

    const tabs = [
        { id: "locations", label: "Sơ đồ Khu - Kệ - Ô", icon: <Grid3X3 className="w-3.5 h-3.5" /> },
        { id: "overview", label: "Thông số kho" },
        { id: "inventory", label: "Mặt hàng lưu trữ", count: warehouseProducts.length },
        { id: "transactions", label: "Lịch sử luân chuyển", count: warehouseTx.length },
    ];

    const openRelocateModalWithBin = (bin: BinLocation) => {
        setSourceBinCode(bin.binCode || bin.name);
        setRelocateQuantity(bin.occupancy > 0 ? bin.occupancy : 1);
        setTargetWarehouseId(id || "");
        setTargetBinCode("");
        setIsRelocateModalOpen(true);
    };

    const openEditBinModal = (bin: BinLocation) => {
        setSelectedBin(bin);
        setEditBinStatus(bin.status);
        setEditBinCapacity(bin.capacity);
        setIsEditBinModalOpen(true);
    };

    const handleExecuteRelocate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceBinCode || !targetBinCode) {
            toast.error("Thiếu thông tin", "Vui lòng điền đầy đủ mã ô xuất và ô đích");
            return;
        }
        relocateMutation.mutate({
            sourceWarehouseId: id || "",
            sourceBinCode,
            targetWarehouseId,
            targetBinCode,
            quantity: Number(relocateQuantity),
            reason: relocateReason,
        });
    };

    const handleAddZone = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newZoneName || !newZoneCode) {
            toast.error("Thiếu thông tin", "Vui lòng điền tên và mã phân khu");
            return;
        }
        addZoneMutation.mutate({
            zoneName: newZoneName,
            code: newZoneCode.toUpperCase(),
        });
    };

    const handleAddRack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetZoneCodeForRack || !newRackCode) {
            toast.error("Thiếu thông tin", "Vui lòng chọn phân khu và nhập mã dãy kệ");
            return;
        }
        addRackMutation.mutate({
            zoneCode: targetZoneCodeForRack,
            rackCode: newRackCode.toUpperCase(),
            name: newRackName || `Kệ ${newRackCode.toUpperCase()}`,
        });
    };

    const handleAddBin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetZoneForBin || !targetRackForBin || !newBinCode) {
            toast.error("Thiếu thông tin", "Vui lòng điền đầy đủ phân khu kệ và mã ô");
            return;
        }
        addBinMutation.mutate({
            zoneCode: targetZoneForBin,
            rackCode: targetRackForBin,
            binCode: newBinCode.toUpperCase(),
            name: newBinName || `Ô ${newBinCode.toUpperCase()}`,
            capacity: Number(newBinCapacity),
        });
    };

    const handleUpdateBin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBin) return;
        updateBinMutation.mutate({
            binId: selectedBin.id,
            status: editBinStatus,
            capacity: Number(editBinCapacity),
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="utility"
                        size="sm"
                        onClick={() => navigate("/warehouses")}
                        leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    >
                        Kho bãi
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                                {warehouse.name}
                            </h1>
                            <Badge variant="primary" size="xs">
                                {warehouse.code}
                            </Badge>
                        </div>
                        <p className="text-xs text-[#615d59]">
                            {warehouse.address}, {warehouse.city} • Quản lý kho:{" "}
                            <strong className="text-[#000000]">{warehouse.manager}</strong>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            setSourceBinCode("");
                            setTargetBinCode("");
                            setIsRelocateModalOpen(true);
                        }}
                        leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                    >
                        Điều chuyển vị trí
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsAddZoneModalOpen(true)}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                        Thêm phân khu
                    </Button>
                </div>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "locations" && (
                <div className="space-y-6">
                    <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-4">
                            <span className="font-semibold text-[#000000]">
                                Trạng thái lưu kho:
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-[3px] bg-[#1aae39]/20 border border-[#1aae39]" />
                                <span className="text-[#615d59]">Còn trống</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-[3px] bg-[#0075de]/20 border border-[#0075de]" />
                                <span className="text-[#615d59]">Đang chứa hàng</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-[3px] bg-[#dd5b00]/20 border border-[#dd5b00]" />
                                <span className="text-[#615d59]">Đã đầy 100%</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-[3px] bg-black/10 border border-black/20" />
                                <span className="text-[#615d59]">Đang bảo trì</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="utility"
                                size="xs"
                                onClick={() => {
                                    if (warehouse.zones && warehouse.zones.length > 0) {
                                        setTargetZoneCodeForRack(warehouse.zones[0].code || "Z-01");
                                    }
                                    setIsAddRackModalOpen(true);
                                }}
                                leftIcon={<Plus className="w-3 h-3" />}
                            >
                                Thêm dãy kệ
                            </Button>
                            <Button
                                variant="utility"
                                size="xs"
                                onClick={() => {
                                    if (warehouse.zones && warehouse.zones.length > 0) {
                                        setTargetZoneForBin(warehouse.zones[0].code || "Z-01");
                                        if (warehouse.zones[0].racks && warehouse.zones[0].racks.length > 0) {
                                            setTargetRackForBin(warehouse.zones[0].racks[0].id || "R-01");
                                        }
                                    }
                                    setIsAddBinModalOpen(true);
                                }}
                                leftIcon={<Plus className="w-3 h-3" />}
                            >
                                Thêm ô lưu trữ
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {(warehouse.zones || []).length === 0 ? (
                            <Card
                                variant="flat"
                                padding="lg"
                                className="text-center py-12 text-[#615d59]"
                            >
                                <p className="mb-3">Kho này chưa thiết lập sơ đồ phân khu và dãy kệ chi tiết.</p>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setIsAddZoneModalOpen(true)}
                                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                                >
                                    Khởi tạo phân khu đầu tiên
                                </Button>
                            </Card>
                        ) : (
                            warehouse.zones.map((zone) => (
                                <Card
                                    key={zone.id}
                                    variant="flat"
                                    padding="md"
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#0075de]" />
                                            <h3 className="font-bold text-[15px] text-[#000000]">
                                                {zone.name}
                                            </h3>
                                            <Badge variant="gray" size="xs">
                                                {zone.code}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-[#615d59]">
                                                {zone.racks.length} dãy kệ
                                            </span>
                                            <Button
                                                variant="utility"
                                                size="xs"
                                                onClick={() => {
                                                    setTargetZoneCodeForRack(zone.code);
                                                    setIsAddRackModalOpen(true);
                                                }}
                                                leftIcon={<Plus className="w-2.5 h-2.5" />}
                                            >
                                                Kệ
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {zone.racks.map((rack) => (
                                            <div
                                                key={rack.id}
                                                className="p-3 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[8px] space-y-2.5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-xs text-[#000000]">
                                                        {rack.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-[#615d59] font-mono">
                                                            {rack.bins.length} ô chứa
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setTargetZoneForBin(zone.code);
                                                                setTargetRackForBin(rack.name.replace("Kệ ", "").trim());
                                                                setIsAddBinModalOpen(true);
                                                            }}
                                                            className="text-[11px] text-[#0075de] hover:underline font-medium cursor-pointer"
                                                        >
                                                            + Ô
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {rack.bins.map((bin) => {
                                                        const isFull =
                                                            bin.status === "FULL" ||
                                                            bin.occupancy >= bin.capacity;
                                                        const isOccupied =
                                                            bin.status === "OCCUPIED" ||
                                                            (bin.occupancy > 0 && !isFull);
                                                        const isMaintenance =
                                                            bin.status === "MAINTENANCE";
                                                        const isSelected =
                                                            selectedBin?.id === bin.id;

                                                        return (
                                                            <button
                                                                key={bin.id}
                                                                type="button"
                                                                onClick={() => setSelectedBin(bin)}
                                                                className={`p-2.5 rounded-[6px] border text-left transition-all select-none cursor-pointer flex flex-col justify-between min-h-[90px] ${
                                                                    isSelected
                                                                        ? "ring-2 ring-[#0075de] border-[#0075de] shadow-notion-md"
                                                                        : ""
                                                                } ${
                                                                    isMaintenance
                                                                        ? "bg-black/5 border-black/15 text-[#a39e98]"
                                                                        : isFull
                                                                          ? "bg-[#dd5b00]/10 border-[#dd5b00]/30 hover:bg-[#dd5b00]/15"
                                                                          : isOccupied
                                                                            ? "bg-[#0075de]/10 border-[#0075de]/25 hover:bg-[#0075de]/15"
                                                                            : "bg-white border-[#1aae39]/30 hover:bg-[#1aae39]/10"
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-mono text-[11px] font-bold text-[#000000]">
                                                                        {bin.binCode || bin.name}
                                                                    </span>
                                                                    <span className="text-[9.5px] text-[#615d59]">
                                                                        {Math.round(
                                                                            (bin.occupancy /
                                                                                bin.capacity) *
                                                                                100,
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>

                                                                <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden my-1">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-300 ${
                                                                            isFull
                                                                                ? "bg-[#dd5b00]"
                                                                                : isOccupied
                                                                                  ? "bg-[#0075de]"
                                                                                  : "bg-[#1aae39]"
                                                                        }`}
                                                                        style={{
                                                                            width: `${Math.min(100, Math.round((bin.occupancy / bin.capacity) * 100))}%`,
                                                                        }}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <span className="text-[10px] font-semibold text-[#000000] truncate block">
                                                                        {bin.sku || "Ô trống"}
                                                                    </span>
                                                                    <span className="text-[9px] text-[#615d59] truncate block">
                                                                        {bin.occupancy}/{bin.capacity} đơn vị
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {selectedBin && (
                        <Card
                            variant="elevated"
                            padding="md"
                            className="border-[#0075de]/40 bg-white shadow-notion-md"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-[8px] bg-[#0075de]/10 text-[#0075de] flex items-center justify-center shrink-0 mt-0.5">
                                        <Box className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[15px] font-bold text-[#000000]">
                                                Chi tiết vị trí ô: {selectedBin.binCode || selectedBin.name}
                                            </h4>
                                            <Badge
                                                variant={
                                                    selectedBin.status === "FULL"
                                                        ? "warning"
                                                        : selectedBin.status === "OCCUPIED"
                                                          ? "primary"
                                                          : selectedBin.status === "AVAILABLE"
                                                            ? "success"
                                                            : "gray"
                                                }
                                                size="xs"
                                                dot
                                            >
                                                {selectedBin.status === "FULL"
                                                    ? "Đầy hàng"
                                                    : selectedBin.status === "OCCUPIED"
                                                      ? "Đang chứa hàng"
                                                      : selectedBin.status === "AVAILABLE"
                                                        ? "Sẵn sàng nhận hàng"
                                                        : "Bảo trì định kỳ"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-[#615d59] mt-1">
                                            Mã SKU:{" "}
                                            <strong className="text-[#000000]">
                                                {selectedBin.sku || "Chưa gán hàng"}
                                            </strong>
                                            {selectedBin.productName &&
                                                ` — ${selectedBin.productName}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs">
                                    <div>
                                        <span className="text-[#615d59] block">Sức chứa</span>
                                        <p className="font-semibold text-[#000000]">
                                            {selectedBin.capacity} đơn vị
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[#615d59] block">Số lượng hiện tại</span>
                                        <p className="font-bold text-[#0075de]">
                                            {selectedBin.occupancy} đơn vị
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[#615d59] block">Chỗ trống</span>
                                        <p className="font-semibold text-[#1aae39]">
                                            {Math.max(0, selectedBin.capacity - selectedBin.occupancy)} đơn vị
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 ml-auto">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => openRelocateModalWithBin(selectedBin)}
                                            leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                                        >
                                            Điều chuyển
                                        </Button>
                                        <Button
                                            variant="utility"
                                            size="sm"
                                            onClick={() => openEditBinModal(selectedBin)}
                                            leftIcon={<Settings className="w-3.5 h-3.5" />}
                                        >
                                            Sửa ô
                                        </Button>
                                        <Button
                                            variant="utility"
                                            size="sm"
                                            onClick={() => setSelectedBin(null)}
                                        >
                                            Đóng
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card variant="flat" padding="md" className="space-y-3 text-xs">
                        <CardHeader>
                            <CardTitle>Thông số vận hành kho</CardTitle>
                        </CardHeader>
                        <div className="space-y-2 text-[#31302e]">
                            <div className="flex justify-between py-1.5 border-b border-[#e6e6e6]">
                                <span className="text-[#615d59]">Tên kho</span>
                                <span className="font-semibold text-[#000000]">
                                    {warehouse.name}
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#e6e6e6]">
                                <span className="text-[#615d59]">Mã định danh</span>
                                <span className="font-mono font-semibold text-[#000000]">
                                    {warehouse.code}
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#e6e6e6]">
                                <span className="text-[#615d59]">Thời gian hoạt động</span>
                                <span>24/7 Giao nhận và xuất hàng</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#e6e6e6]">
                                <span className="text-[#615d59]">Tổng sức chứa</span>
                                <span>
                                    {formatNumber(warehouse.totalCapacity)} ô chứa tiêu chuẩn
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#e6e6e6]">
                                <span className="text-[#615d59]">Tổng số phân khu</span>
                                <span className="font-semibold">{warehouse.zonesCount || warehouse.zones.length} khu</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#e6e6e6]">
                                <span className="text-[#615d59]">Tổng số dãy kệ</span>
                                <span className="font-semibold">{warehouse.racksCount} dãy</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-[#615d59]">Ngày khởi tạo</span>
                                <span>{formatDate(warehouse.createdAt)}</span>
                            </div>
                        </div>
                    </Card>

                    <Card variant="flat" padding="md" className="space-y-3 text-xs">
                        <CardHeader>
                            <CardTitle>Liên hệ và Giám sát vận hành</CardTitle>
                        </CardHeader>
                        <div className="space-y-2 text-[#31302e]">
                            <p>
                                <strong>Quản lý kho:</strong> {warehouse.manager}
                            </p>
                            <p>
                                <strong>Hotline tiếp nhận:</strong> 1900 6868
                            </p>
                            <p>
                                <strong>Cửa xuất nhập hàng:</strong> 12 Cửa nhận, 16 Cửa xuất
                            </p>
                            <p>
                                <strong>Điều kiện lưu kho:</strong> Nhiệt độ phòng tiêu chuẩn từ 22 đến 25 độ C, kho mát riêng biệt
                            </p>
                            <p>
                                <strong>Hệ thống quản lý:</strong> InventoHub WMS tích hợp thời gian thực với cơ sở dữ liệu MongoDB Atlas
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "inventory" && (
                <Card variant="flat" padding="md">
                    <CardHeader>
                        <CardTitle>Sản phẩm đang lưu tại {warehouse.name}</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-[#e6e6e6] text-[#615d59] uppercase tracking-wider text-[11px]">
                                    <th className="py-2.5">Tên sản phẩm</th>
                                    <th className="py-2.5">SKU</th>
                                    <th className="py-2.5">Vị trí ô</th>
                                    <th className="py-2.5">Tồn thực tế</th>
                                    <th className="py-2.5">Có thể xuất</th>
                                    <th className="py-2.5">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e6e6e6]">
                                {warehouseProducts.map((p) => (
                                    <tr key={p.id} className="hover:bg-[#f6f5f4]">
                                        <td className="py-3 font-semibold text-[#000000]">
                                            {p.name}
                                        </td>
                                        <td className="py-3 font-mono text-[#615d59]">{p.sku}</td>
                                        <td className="py-3 font-mono text-[#0075de]">
                                            {p.location}
                                        </td>
                                        <td className="py-3 font-bold text-[#000000]">{p.stock}</td>
                                        <td className="py-3 text-[#1aae39] font-medium">
                                            {p.availableStock}
                                        </td>
                                        <td className="py-3">
                                            <Button
                                                variant="utility"
                                                size="xs"
                                                onClick={() => navigate(`/products/${p.id}`)}
                                            >
                                                Xem
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === "transactions" && (
                <Card variant="flat" padding="md">
                    <CardHeader>
                        <CardTitle>Lịch sử giao dịch và luân chuyển kho</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-[#e6e6e6] text-[#615d59] uppercase tracking-wider text-[11px]">
                                    <th className="py-2.5">Loại giao dịch</th>
                                    <th className="py-2.5">Sản phẩm</th>
                                    <th className="py-2.5">Số lượng</th>
                                    <th className="py-2.5">Mã chứng từ</th>
                                    <th className="py-2.5">Nhân viên</th>
                                    <th className="py-2.5">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e6e6e6]">
                                {warehouseTx.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-[#f6f5f4]">
                                        <td className="py-2.5">
                                            <Badge
                                                variant={
                                                    tx.type === "TRANSFER"
                                                        ? "purple"
                                                        : tx.type === "INBOUND"
                                                          ? "success"
                                                          : tx.type === "OUTBOUND"
                                                            ? "warning"
                                                            : "primary"
                                                }
                                                size="xs"
                                            >
                                                {tx.type}
                                            </Badge>
                                        </td>
                                        <td className="py-2.5 font-medium text-[#000000]">
                                            {tx.productName}
                                        </td>
                                        <td className="py-2.5 font-bold">
                                            {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                                        </td>
                                        <td className="py-2.5 font-mono text-[#615d59]">
                                            {tx.reference}
                                        </td>
                                        <td className="py-2.5 text-[#31302e]">{tx.user}</td>
                                        <td className="py-2.5 text-[#a39e98]">
                                            {formatDate(tx.date)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal
                isOpen={isRelocateModalOpen}
                onClose={() => setIsRelocateModalOpen(false)}
                title="Điều chuyển vị trí hàng trong kho"
                size="md"
            >
                <form onSubmit={handleExecuteRelocate} className="space-y-4 text-xs">
                    <div>
                        <label className="block text-[#615d59] font-medium mb-1">
                            Kho xuất hàng
                        </label>
                        <Input
                            value={warehouse.name}
                            disabled
                            className="bg-[#f6f5f4]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[#615d59] font-medium mb-1">
                                Mã ô xuất
                            </label>
                            <Input
                                placeholder="Ví dụ: A-01-01"
                                value={sourceBinCode}
                                onChange={(e) => setSourceBinCode(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[#615d59] font-medium mb-1">
                                Số lượng chuyển
                            </label>
                            <Input
                                type="number"
                                min={1}
                                value={relocateQuantity}
                                onChange={(e) => setRelocateQuantity(Math.max(1, Number(e.target.value)))}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Select
                                label="Kho đích đến"
                                value={targetWarehouseId}
                                onChange={(e) => setTargetWarehouseId(e.target.value)}
                                options={allWarehouses.map((w) => ({
                                    label: w.name,
                                    value: w.id,
                                }))}
                            />
                        </div>
                        <div>
                            <label className="block text-[#615d59] font-medium mb-1">
                                Mã ô đích đến
                            </label>
                            <Input
                                placeholder="Ví dụ: A-01-03"
                                value={targetBinCode}
                                onChange={(e) => setTargetBinCode(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[#615d59] font-medium mb-1">
                            Lý do điều chuyển
                        </label>
                        <Input
                            value={relocateReason}
                            onChange={(e) => setRelocateReason(e.target.value)}
                            placeholder="Nhập lý do điều chuyển hàng"
                            required
                        />
                    </div>

                    <div className="pt-3 border-t border-[#e6e6e6] flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="utility"
                            size="sm"
                            onClick={() => setIsRelocateModalOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={relocateMutation.isPending}
                        >
                            Xác nhận điều chuyển
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isAddZoneModalOpen}
                onClose={() => setIsAddZoneModalOpen(false)}
                title="Thêm phân khu kho mới"
                size="sm"
            >
                <form onSubmit={handleAddZone} className="space-y-4 text-xs">
                    <div>
                        <label className="block text-[#615d59] font-medium mb-1">
                            Tên phân khu
                        </label>
                        <Input
                            placeholder="Ví dụ: Khu C - Đóng gói"
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[#615d59] font-medium mb-1">
                            Mã phân khu
                        </label>
                        <Input
                            placeholder="Ví dụ: Z-03"
                            value={newZoneCode}
                            onChange={(e) => setNewZoneCode(e.target.value)}
                            required
                        />
                    </div>
                    <div className="pt-3 border-t border-[#e6e6e6] flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="utility"
                            size="sm"
                            onClick={() => setIsAddZoneModalOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={addZoneMutation.isPending}
                        >
                            Lưu phân khu
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isAddRackModalOpen}
                onClose={() => setIsAddRackModalOpen(false)}
                title="Thêm dãy kệ lưu trữ"
                size="sm"
            >
                <form onSubmit={handleAddRack} className="space-y-4 text-xs">
                    <div>
                        <Select
                            label="Thuộc phân khu"
                            value={targetZoneCodeForRack}
                            onChange={(e) => setTargetZoneCodeForRack(e.target.value)}
                            options={(warehouse.zones || []).map((z) => ({
                                label: `${z.name} - ${z.code}`,
                                value: z.code,
                            }))}
                        />
                    </div>
                    <div>
                        <label className="block text-[#615d59] font-medium mb-1">
                            Mã dãy kệ
                        </label>
                        <Input
                            placeholder="Ví dụ: C-01"
                            value={newRackCode}
                            onChange={(e) => setNewRackCode(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[#615d59] font-medium mb-1">
                            Tên dãy kệ
                        </label>
                        <Input
                            placeholder="Ví dụ: Kệ trung chuyển hàng hóa"
                            value={newRackName}
                            onChange={(e) => setNewRackName(e.target.value)}
                        />
                    </div>
                    <div className="pt-3 border-t border-[#e6e6e6] flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="utility"
                            size="sm"
                            onClick={() => setIsAddRackModalOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={addRackMutation.isPending}
                        >
                            Tạo dãy kệ
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isAddBinModalOpen}
                onClose={() => setIsAddBinModalOpen(false)}
                title="Thêm ô lưu trữ mới"
                size="sm"
            >
                <form onSubmit={handleAddBin} className="space-y-4 text-xs">
                    <div>
                        <Select
                            label="Thuộc phân khu"
                            value={targetZoneForBin}
                            onChange={(e) => setTargetZoneForBin(e.target.value)}
                            options={(warehouse.zones || []).map((z) => ({
                                label: `${z.name} - ${z.code}`,
                                value: z.code,
                            }))}
                        />
                    </div>
                    <div>
                        <label className="block text-[#615d59] font-medium mb-1">
                            Mã dãy kệ
                        </label>
                        <Input
                            placeholder="Ví dụ: A-01"
                            value={targetRackForBin}
                            onChange={(e) => setTargetRackForBin(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[#615d59] font-medium mb-1">
                            Mã ô lưu trữ
                        </label>
                        <Input
                            placeholder="Ví dụ: A-01-04"
                            value={newBinCode}
                            onChange={(e) => setNewBinCode(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[#615d59] font-medium mb-1">
                            Sức chứa ô
                        </label>
                        <Input
                            type="number"
                            min={10}
                            value={newBinCapacity}
                            onChange={(e) => setNewBinCapacity(Number(e.target.value))}
                            required
                        />
                    </div>
                    <div className="pt-3 border-t border-[#e6e6e6] flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="utility"
                            size="sm"
                            onClick={() => setIsAddBinModalOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={addBinMutation.isPending}
                        >
                            Tạo ô chứa
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isEditBinModalOpen}
                onClose={() => setIsEditBinModalOpen(false)}
                title={`Cập nhật ô lưu trữ: ${selectedBin?.binCode || selectedBin?.name || ""}`}
                size="sm"
            >
                <form onSubmit={handleUpdateBin} className="space-y-4 text-xs">
                    <div>
                        <Select
                            label="Trạng thái ô"
                            value={editBinStatus}
                            onChange={(e) => setEditBinStatus(e.target.value as any)}
                            options={[
                                { label: "Sẵn sàng nhận hàng - Trống", value: "AVAILABLE" },
                                { label: "Đang chứa hàng", value: "OCCUPIED" },
                                { label: "Đã đầy 100%", value: "FULL" },
                                { label: "Đang bảo trì kỹ thuật", value: "MAINTENANCE" },
                            ]}
                        />
                    </div>
                    <div>
                        <label className="block text-[#615d59] font-medium mb-1">
                            Sức chứa tối đa
                        </label>
                        <Input
                            type="number"
                            min={1}
                            value={editBinCapacity}
                            onChange={(e) => setEditBinCapacity(Number(e.target.value))}
                            required
                        />
                    </div>
                    <div className="pt-3 border-t border-[#e6e6e6] flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="utility"
                            size="sm"
                            onClick={() => setIsEditBinModalOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={updateBinMutation.isPending}
                        >
                            Lưu cập nhật
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
