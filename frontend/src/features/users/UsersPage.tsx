import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    UserPlus,
    Users,
    ShieldAlert,
    Warehouse,
    CheckCircle2,
    Shield,
    Edit3,
    KeyRound,
    Lock,
    Unlock,
    Trash2,
    Phone,
    Building2,
    Mail,
    AlertTriangle,
} from "lucide-react";
import { DataTable, type Column } from "@/components/data-table/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { mockApi } from "@/services/mockApi";
import { useAuthStore } from "@/stores/useAuthStore";
import type { User, UserRole } from "@/types";
import { formatDateTime } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";
import { ExportButtons } from "@/components/ui/ExportButtons";

export const UsersPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { currentUser } = useAuthStore();

    const [search, setSearch] = useState("");
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "WAREHOUSE_STAFF" as UserRole,
        department: "Kho vận",
        phone: "",
        avatar: "",
    });

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: "",
        department: "",
        phone: "",
        avatar: "",
    });

    const [roleUser, setRoleUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState<UserRole>("WAREHOUSE_STAFF");

    const [passwordUser, setPasswordUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["users"],
        queryFn: () => mockApi.getUsers(),
    });

    const { data: stats } = useQuery({
        queryKey: ["user-stats"],
        queryFn: () => mockApi.getUserStats(),
    });

    const createMutation = useMutation({
        mutationFn: mockApi.createUser,
        onSuccess: (newUser) => {
            toast.success("Thành công", `Đã tạo tài khoản cho ${newUser.name}`);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user-stats"] });
            queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
            setIsCreateModalOpen(false);
            setCreateFormData({
                name: "",
                email: "",
                password: "",
                role: "WAREHOUSE_STAFF",
                department: "Kho vận",
                phone: "",
                avatar: "",
            });
        },
        onError: (err: any) => {
            toast.error("Lỗi", err.response?.data?.thongDiep || err.message || "Không thể tạo tài khoản");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
            mockApi.updateUser(id, data),
        onSuccess: (updated) => {
            toast.success("Thành công", `Đã cập nhật thông tin của ${updated.name}`);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user-stats"] });
            queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
            setEditingUser(null);
        },
        onError: (err: any) => {
            toast.error("Lỗi", err.response?.data?.thongDiep || err.message || "Không thể cập nhật thông tin");
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
            mockApi.updateUserRole(userId, role),
        onSuccess: (updated) => {
            toast.success("Thành công", `Đã cập nhật vai trò của ${updated.name}`);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user-stats"] });
            queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
            setRoleUser(null);
        },
        onError: (err: any) => {
            toast.error("Lỗi", err.response?.data?.thongDiep || err.message || "Không thể thay đổi vai trò");
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (userId: string) => mockApi.toggleUserStatus(userId),
        onSuccess: (updated) => {
            const statusText = updated.status === "ACTIVE" ? "kích hoạt mở khóa" : "tạm thời khóa";
            toast.success("Thành công", `Đã ${statusText} tài khoản ${updated.name}`);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user-stats"] });
            queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
        },
        onError: (err: any) => {
            toast.error("Lỗi", err.response?.data?.thongDiep || err.message || "Không thể đổi trạng thái tài khoản");
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({ userId, pass }: { userId: string; pass: string }) =>
            mockApi.resetUserPassword(userId, pass),
        onSuccess: () => {
            toast.success("Thành công", "Đã đặt lại mật khẩu mới cho người dùng");
            queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
            setPasswordUser(null);
            setNewPassword("");
            setConfirmPassword("");
        },
        onError: (err: any) => {
            toast.error("Lỗi", err.response?.data?.thongDiep || err.message || "Không thể đặt lại mật khẩu");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => mockApi.deleteUser(userId),
        onSuccess: () => {
            toast.success("Thành công", "Đã xóa tài khoản người dùng khỏi hệ thống");
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user-stats"] });
            queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
            setDeletingUser(null);
        },
        onError: (err: any) => {
            toast.error("Lỗi", err.response?.data?.thongDiep || err.message || "Không thể xóa tài khoản");
        },
    });

    const filteredUsers = users.filter((u) => {
        const matchesRole =
            selectedRoleFilter === "ALL" || u.role === selectedRoleFilter;
        const matchesStatus =
            statusFilter === "ALL" || u.status === statusFilter;
        const s = search.toLowerCase().trim();
        const matchesSearch =
            !s ||
            u.name.toLowerCase().includes(s) ||
            u.email.toLowerCase().includes(s) ||
            (u.phone && u.phone.toLowerCase().includes(s)) ||
            (u.department && u.department.toLowerCase().includes(s));
        return matchesRole && matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const roleConfigs: Record<
        UserRole,
        { label: string; variant: "primary" | "warning" | "teal" | "gray" }
    > = {
        ADMIN: { label: "Quản trị viên", variant: "primary" },
        WAREHOUSE_MANAGER: { label: "Quản lý kho", variant: "warning" },
        WAREHOUSE_STAFF: { label: "Nhân viên kho", variant: "teal" },
        VIEWER: { label: "Kiểm toán viên", variant: "gray" },
    };

    const exportColumns = [
        { header: "Họ và tên", key: "name" },
        { header: "Email", key: "email" },
        { header: "Số điện thoại", key: "phone" },
        { header: "Bộ phận", key: "department" },
        {
            header: "Vai trò",
            key: "role",
            format: (v: UserRole) => roleConfigs[v]?.label || v,
        },
        {
            header: "Trạng thái",
            key: "status",
            format: (v: string) => (v === "ACTIVE" ? "Hoạt động" : "Đã khóa"),
        },
        {
            header: "Lần đăng nhập cuối",
            key: "lastLogin",
            format: (v: string) => (v ? formatDateTime(v) : "Chưa đăng nhập"),
        },
    ];

    const handleOpenEdit = (u: User) => {
        setEditingUser(u);
        setEditFormData({
            name: u.name,
            department: u.department || "",
            phone: u.phone || "",
            avatar: u.avatar || "",
        });
    };

    const handleOpenRole = (u: User) => {
        setRoleUser(u);
        setNewRole(u.role);
    };

    const handleOpenPassword = (u: User) => {
        setPasswordUser(u);
        setNewPassword("");
        setConfirmPassword("");
    };

    const handleSavePassword = () => {
        if (!passwordUser) return;
        if (newPassword.length < 6) {
            toast.warning("Cảnh báo", "Mật khẩu mới phải có tối thiểu 6 ký tự");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.warning("Cảnh báo", "Xác nhận mật khẩu mới không trùng khớp");
            return;
        }
        resetPasswordMutation.mutate({ userId: passwordUser.id, pass: newPassword });
    };

    const isCurrentUser = (u: User) => {
        return (
            currentUser?.email?.toLowerCase() === u.email?.toLowerCase() ||
            currentUser?.id === u.id
        );
    };

    const columns: Column<User>[] = [
        {
            key: "name",
            header: "Thành viên",
            sortable: true,
            render: (u) => (
                <div className="flex items-center gap-3 py-1">
                    {u.avatar ? (
                        <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#e6e6e6] shadow-sm"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0075de] to-[#00a3ff] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                            {u.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#000000] text-sm">{u.name}</p>
                            {isCurrentUser(u) && (
                                <span className="text-[10px] bg-[#eef5fc] text-[#0075de] px-1.5 py-0.5 rounded font-medium border border-[#cfe2fe]">
                                    Bạn
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#615d59]">
                            <Mail className="w-3 h-3 text-[#a39e98]" />
                            <span>{u.email}</span>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "role",
            header: "Vai trò",
            render: (u) => {
                const config = roleConfigs[u.role] || { label: u.role, variant: "gray" };
                return (
                    <Badge variant={config.variant} size="xs" dot>
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            key: "department",
            header: "Bộ phận",
            render: (u) => (
                <div className="flex items-center gap-1.5 text-xs text-[#3d3a37]">
                    <Building2 className="w-3.5 h-3.5 text-[#a39e98]" />
                    <span>{u.department || "Kho vận"}</span>
                </div>
            ),
        },
        {
            key: "phone",
            header: "Số điện thoại",
            render: (u) => (
                <div className="flex items-center gap-1.5 text-xs text-[#615d59] font-mono">
                    <Phone className="w-3 h-3 text-[#a39e98]" />
                    <span>{u.phone || "Chưa cập nhật"}</span>
                </div>
            ),
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (u) => (
                <Badge variant={u.status === "ACTIVE" ? "success" : "gray"} size="xs">
                    {u.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                </Badge>
            ),
        },
        {
            key: "lastLogin",
            header: "Đăng nhập gần nhất",
            render: (u) => (
                <span className="text-xs text-[#a39e98] font-mono">
                    {u.lastLogin ? formatDateTime(u.lastLogin) : "Chưa đăng nhập"}
                </span>
            ),
        },
        {
            key: "actions",
            header: "Thao tác",
            className: "text-right",
            render: (u) => {
                const isSelf = isCurrentUser(u);
                return (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            type="button"
                            title="Phân quyền vai trò"
                            onClick={() => handleOpenRole(u)}
                            className="p-1.5 text-[#615d59] hover:text-[#0075de] hover:bg-[#eef5fc] rounded transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            title="Chỉnh sửa thông tin"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-[#615d59] hover:text-[#0075de] hover:bg-[#eef5fc] rounded transition-colors"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            title="Đặt lại mật khẩu"
                            onClick={() => handleOpenPassword(u)}
                            className="p-1.5 text-[#615d59] hover:text-[#f59e0b] hover:bg-[#fffbeb] rounded transition-colors"
                        >
                            <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            title={u.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            disabled={isSelf || toggleStatusMutation.isPending}
                            onClick={() => toggleStatusMutation.mutate(u.id)}
                            className={`p-1.5 rounded transition-colors ${
                                isSelf
                                    ? "text-[#ccc9c5] cursor-not-allowed"
                                    : u.status === "ACTIVE"
                                      ? "text-[#615d59] hover:text-[#dc2626] hover:bg-[#fef2f2]"
                                      : "text-[#10b981] hover:text-[#059669] hover:bg-[#ecfdf5]"
                            }`}
                        >
                            {u.status === "ACTIVE" ? (
                                <Lock className="w-4 h-4" />
                            ) : (
                                <Unlock className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            type="button"
                            title="Xóa tài khoản"
                            disabled={isSelf}
                            onClick={() => setDeletingUser(u)}
                            className={`p-1.5 rounded transition-colors ${
                                isSelf
                                    ? "text-[#ccc9c5] cursor-not-allowed"
                                    : "text-[#615d59] hover:text-[#dc2626] hover:bg-[#fef2f2]"
                            }`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e6e6e6] pb-4">
                <div>
                    <h1 className="text-[22px] font-bold text-[#000000] tracking-tight">
                        Quản lý Người dùng & Phân quyền
                    </h1>
                    <p className="text-xs text-[#615d59] mt-0.5">
                        Kiểm soát danh sách nhân sự, phân cấp vai trò và thiết lập quyền truy cập hệ thống kho
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportButtons
                        filename="danh-sach-nhan-su"
                        title="Danh sách người dùng và phân quyền"
                        columns={exportColumns}
                        data={filteredUsers}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        leftIcon={<UserPlus className="w-4 h-4" />}
                    >
                        Thêm nhân viên mới
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-[#e6e6e6] rounded-[10px] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#615d59]">Tổng nhân sự</p>
                        <p className="text-2xl font-bold text-[#000000] mt-1">
                            {stats?.totalUsers ?? users.length}
                        </p>
                        <span className="text-[11px] text-[#0075de] font-medium">
                            Toàn bộ tài khoản
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-[#eef5fc] flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#0075de]" />
                    </div>
                </div>

                <div className="p-4 bg-white border border-[#e6e6e6] rounded-[10px] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#615d59]">Quản lý kho</p>
                        <p className="text-2xl font-bold text-[#000000] mt-1">
                            {stats?.managerCount ?? users.filter((u) => u.role === "WAREHOUSE_MANAGER").length}
                        </p>
                        <span className="text-[11px] text-[#f59e0b] font-medium">
                            Giám sát vận hành kho
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-[#fffbeb] flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-[#f59e0b]" />
                    </div>
                </div>

                <div className="p-4 bg-white border border-[#e6e6e6] rounded-[10px] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#615d59]">Nhân viên kho</p>
                        <p className="text-2xl font-bold text-[#000000] mt-1">
                            {stats?.staffCount ?? users.filter((u) => u.role === "WAREHOUSE_STAFF").length}
                        </p>
                        <span className="text-[11px] text-[#10b981] font-medium">
                            Xuất nhập và kiểm kê
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-[#ecfdf5] flex items-center justify-center">
                        <Warehouse className="w-5 h-5 text-[#10b981]" />
                    </div>
                </div>

                <div className="p-4 bg-white border border-[#e6e6e6] rounded-[10px] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#615d59]">Đang hoạt động</p>
                        <p className="text-2xl font-bold text-[#000000] mt-1">
                            {stats?.activeCount ?? users.filter((u) => u.status === "ACTIVE").length}
                        </p>
                        <span className="text-[11px] text-[#6366f1] font-medium">
                            Sẵn sàng làm việc
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-[#eef2ff] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-[#6366f1]" />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e6e6e6] pb-2">
                {[
                    { key: "ALL", label: "Tất cả" },
                    { key: "ADMIN", label: "Quản trị viên" },
                    { key: "WAREHOUSE_MANAGER", label: "Quản lý kho" },
                    { key: "WAREHOUSE_STAFF", label: "Nhân viên kho" },
                    { key: "VIEWER", label: "Kiểm toán viên" },
                ].map((tab) => {
                    const isActive = selectedRoleFilter === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => {
                                setSelectedRoleFilter(tab.key);
                                setCurrentPage(1);
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                                isActive
                                    ? "bg-[#0075de] text-white shadow-sm"
                                    : "text-[#615d59] hover:bg-[#f2f1ef] hover:text-[#000000]"
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                <SearchInput
                    placeholder="Tìm theo tên, email, số điện thoại, bộ phận..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    onClear={() => {
                        setSearch("");
                        setCurrentPage(1);
                    }}
                    className="w-full sm:max-w-md"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        options={[
                            { label: "Tất cả trạng thái", value: "ALL" },
                            { label: "Đang hoạt động", value: "ACTIVE" },
                            { label: "Đã khóa", value: "INACTIVE" },
                        ]}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={paginatedUsers}
                keyExtractor={(u) => u.id}
                isLoading={isLoading}
                pagination={{
                    currentPage,
                    totalPages,
                    totalItems: filteredUsers.length,
                    pageSize,
                    onPageChange: setCurrentPage,
                    onPageSizeChange: (size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    },
                }}
            />

            {isCreateModalOpen && (
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Thêm nhân viên mới"
                    description="Khởi tạo tài khoản nhân sự và thiết lập vai trò phân quyền ban đầu"
                    footer={
                        <>
                            <Button
                                variant="utility"
                                size="sm"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                isLoading={createMutation.isPending}
                                onClick={() => {
                                    if (!createFormData.name.trim()) {
                                        toast.warning("Cảnh báo", "Vui lòng nhập họ và tên nhân viên");
                                        return;
                                    }
                                    if (!createFormData.email.trim()) {
                                        toast.warning("Cảnh báo", "Vui lòng nhập email nhân viên");
                                        return;
                                    }
                                    if (!createFormData.password || createFormData.password.length < 6) {
                                        toast.warning("Cảnh báo", "Mật khẩu ban đầu phải có tối thiểu 6 ký tự");
                                        return;
                                    }
                                    createMutation.mutate(createFormData);
                                }}
                            >
                                Khởi tạo tài khoản
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4 text-left">
                        <Input
                            label="Họ và tên nhân viên"
                            placeholder="Ví dụ: Lê Hoàng Nam"
                            value={createFormData.name}
                            onChange={(e) =>
                                setCreateFormData({ ...createFormData, name: e.target.value })
                            }
                        />

                        <Input
                            label="Địa chỉ email đăng nhập"
                            type="email"
                            placeholder="Ví dụ: nam.le@inventohub.com"
                            value={createFormData.email}
                            onChange={(e) =>
                                setCreateFormData({ ...createFormData, email: e.target.value })
                            }
                        />

                        <Input
                            label="Mật khẩu khởi tạo"
                            type="password"
                            placeholder="Tối thiểu 6 ký tự"
                            value={createFormData.password}
                            onChange={(e) =>
                                setCreateFormData({ ...createFormData, password: e.target.value })
                            }
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Select
                                label="Vai trò phân quyền"
                                value={createFormData.role}
                                onChange={(e) =>
                                    setCreateFormData({
                                        ...createFormData,
                                        role: e.target.value as UserRole,
                                    })
                                }
                                options={[
                                    { label: "Nhân viên kho", value: "WAREHOUSE_STAFF" },
                                    { label: "Quản lý kho", value: "WAREHOUSE_MANAGER" },
                                    { label: "Kiểm toán viên", value: "VIEWER" },
                                    { label: "Quản trị viên", value: "ADMIN" },
                                ]}
                            />

                            <Input
                                label="Bộ phận phụ trách"
                                placeholder="Ví dụ: Tổ đóng gói hoặc Kho tổng"
                                value={createFormData.department}
                                onChange={(e) =>
                                    setCreateFormData({
                                        ...createFormData,
                                        department: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                                label="Số điện thoại"
                                placeholder="Ví dụ: 0912345678"
                                value={createFormData.phone}
                                onChange={(e) =>
                                    setCreateFormData({ ...createFormData, phone: e.target.value })
                                }
                            />

                            <Input
                                label="Ảnh đại diện liên kết"
                                placeholder="Đường dẫn ảnh trực tuyến"
                                value={createFormData.avatar}
                                onChange={(e) =>
                                    setCreateFormData({ ...createFormData, avatar: e.target.value })
                                }
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {editingUser && (
                <Modal
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    title={`Chỉnh sửa: ${editingUser.name}`}
                    description={`Cập nhật thông tin hồ sơ cho tài khoản ${editingUser.email}`}
                    footer={
                        <>
                            <Button
                                variant="utility"
                                size="sm"
                                onClick={() => setEditingUser(null)}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                isLoading={updateMutation.isPending}
                                onClick={() => {
                                    if (!editFormData.name.trim()) {
                                        toast.warning("Cảnh báo", "Họ và tên không được để trống");
                                        return;
                                    }
                                    updateMutation.mutate({
                                        id: editingUser.id,
                                        data: editFormData,
                                    });
                                }}
                            >
                                Lưu thay đổi
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4 text-left">
                        <Input
                            label="Họ và tên"
                            value={editFormData.name}
                            onChange={(e) =>
                                setEditFormData({ ...editFormData, name: e.target.value })
                            }
                        />

                        <Input
                            label="Bộ phận công tác"
                            value={editFormData.department}
                            onChange={(e) =>
                                setEditFormData({ ...editFormData, department: e.target.value })
                            }
                        />

                        <Input
                            label="Số điện thoại"
                            value={editFormData.phone}
                            onChange={(e) =>
                                setEditFormData({ ...editFormData, phone: e.target.value })
                            }
                        />

                        <Input
                            label="Ảnh đại diện"
                            placeholder="Đường dẫn ảnh trực tuyến"
                            value={editFormData.avatar}
                            onChange={(e) =>
                                setEditFormData({ ...editFormData, avatar: e.target.value })
                            }
                        />
                    </div>
                </Modal>
            )}

            {roleUser && (
                <Modal
                    isOpen={!!roleUser}
                    onClose={() => setRoleUser(null)}
                    title={`Phân quyền: ${roleUser.name}`}
                    description={`Tài khoản: ${roleUser.email}`}
                    footer={
                        <>
                            <Button
                                variant="utility"
                                size="sm"
                                onClick={() => setRoleUser(null)}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                isLoading={updateRoleMutation.isPending}
                                onClick={() =>
                                    updateRoleMutation.mutate({
                                        userId: roleUser.id,
                                        role: newRole,
                                    })
                                }
                            >
                                Lưu vai trò
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4 text-left">
                        <Select
                            label="Vai trò trong hệ thống"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as UserRole)}
                            options={[
                                { label: "Quản trị viên - Toàn quyền cấu hình và nhân sự", value: "ADMIN" },
                                { label: "Quản lý kho - Toàn quyền xuất nhập và phê duyệt", value: "WAREHOUSE_MANAGER" },
                                { label: "Nhân viên kho - Thực hiện phiếu nhập xuất và quét mã", value: "WAREHOUSE_STAFF" },
                                { label: "Kiểm toán viên - Chỉ xem báo cáo và kiểm kê", value: "VIEWER" },
                            ]}
                        />
                        <div className="p-3 bg-[#f2f1ef] rounded-[8px] text-xs text-[#615d59] space-y-1">
                            <p className="font-semibold text-[#000000]">Quy định an toàn phân quyền:</p>
                            <p>Không thể hạ vai trò của Quản trị viên duy nhất còn lại trong hệ thống.</p>
                        </div>
                    </div>
                </Modal>
            )}

            {passwordUser && (
                <Modal
                    isOpen={!!passwordUser}
                    onClose={() => setPasswordUser(null)}
                    title="Đặt lại mật khẩu"
                    description={`Cấp lại mật khẩu mới cho tài khoản ${passwordUser.email}`}
                    footer={
                        <>
                            <Button
                                variant="utility"
                                size="sm"
                                onClick={() => setPasswordUser(null)}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                isLoading={resetPasswordMutation.isPending}
                                onClick={handleSavePassword}
                            >
                                Cập nhật mật khẩu
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4 text-left">
                        <Input
                            label="Mật khẩu mới"
                            type="password"
                            placeholder="Tối thiểu 6 ký tự"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />

                        <Input
                            label="Xác nhận mật khẩu mới"
                            type="password"
                            placeholder="Nhập lại mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </Modal>
            )}

            {deletingUser && (
                <Modal
                    isOpen={!!deletingUser}
                    onClose={() => setDeletingUser(null)}
                    title="Xác nhận xóa tài khoản"
                    description="Hành động này sẽ xóa vĩnh viễn tài khoản người dùng khỏi cơ sở dữ liệu."
                    footer={
                        <>
                            <Button
                                variant="utility"
                                size="sm"
                                onClick={() => setDeletingUser(null)}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                isLoading={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(deletingUser.id)}
                            >
                                Xóa tài khoản
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-3 text-left">
                        <div className="flex items-start gap-3 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-[8px] text-xs text-[#991b1b]">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#dc2626]" />
                            <div>
                                <p className="font-semibold text-sm">
                                    Xóa người dùng: {deletingUser.name}
                                </p>
                                <p className="mt-1">
                                    Email: {deletingUser.email}
                                </p>
                                <p className="mt-0.5">
                                    Sau khi xóa, người này sẽ không thể đăng nhập vào hệ thống InventoHub.
                                </p>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
