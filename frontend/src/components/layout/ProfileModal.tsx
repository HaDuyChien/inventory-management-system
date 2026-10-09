import React, { useState, useEffect, useRef } from "react";
import {
    User as UserIcon,
    Lock,
    Building,
    Phone,
    Mail,
    ShieldCheck,
    Check,
    UploadCloud,
    RefreshCw,
    Trash2,
    Link as LinkIcon,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/useAuthStore";
import { mockApi } from "@/services/mockApi";
import { toast } from "@/stores/useToastStore";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AVATAR_PRESETS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, updateProfile } = useAuthStore();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [department, setDepartment] = useState("");
    const [avatar, setAvatar] = useState("");
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || "");
            setPhone(currentUser.phone || "");
            setDepartment(currentUser.department || "");
            setAvatar(currentUser.avatar || "");
        }
        setShowPasswordFields(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setUploadError(null);
    }, [currentUser, isOpen]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError(null);

        if (!file.type.startsWith("image/")) {
            const err = "Vui lòng chọn tệp hình ảnh hợp lệ";
            setUploadError(err);
            toast.error("Lỗi", err);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            const err = "Kích thước ảnh tối đa 5MB";
            setUploadError(err);
            toast.error("Lỗi", err);
            return;
        }

        setIsUploading(true);
        try {
            const res = await mockApi.uploadAvatar(file);
            if (res && res.url) {
                setAvatar(res.url);
                toast.success("Thành công", "Đã tải ảnh lên Cloudinary");
            }
        } catch (err: any) {
            const msg =
                err.response?.data?.thongDiep ||
                err.message ||
                "Tải ảnh lên Cloudinary thất bại";
            setUploadError(msg);
            toast.error("Lỗi tải ảnh", msg);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Lỗi xác thực", "Họ và tên không được để trống");
            return;
        }

        if (showPasswordFields) {
            if (!currentPassword) {
                toast.error("Lỗi xác thực", "Vui lòng nhập mật khẩu hiện tại");
                return;
            }
            if (newPassword.length < 6) {
                toast.error("Lỗi xác thực", "Mật khẩu mới phải có tối thiểu 6 ký tự");
                return;
            }
            if (newPassword !== confirmPassword) {
                toast.error("Lỗi xác thực", "Mật khẩu xác nhận không khớp");
                return;
            }
        }

        setLoading(true);
        try {
            const payload: {
                name: string;
                phone?: string;
                department?: string;
                avatar?: string;
                currentPassword?: string;
                newPassword?: string;
            } = {
                name: name.trim(),
                phone: phone.trim(),
                department: department.trim(),
                avatar: avatar.trim(),
            };

            if (showPasswordFields && currentPassword && newPassword) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }

            const updatedUser = await mockApi.updateUserProfile(payload);
            updateProfile({
                name: updatedUser.name,
                phone: updatedUser.phone,
                department: updatedUser.department,
                avatar: updatedUser.avatar,
            });

            toast.success("Thành công", "Thông tin cá nhân đã được lưu");
            onClose();
        } catch (error: any) {
            const msg =
                error.response?.data?.thongDiep ||
                error.message ||
                "Cập nhật hồ sơ thất bại";
            toast.error("Lỗi", msg);
        } finally {
            setLoading(false);
        }
    };

    const isCloudinaryImage = avatar.includes("cloudinary");

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Thông tin cá nhân"
            size="lg"
            footer={
                <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSave} isLoading={loading}>
                        Lưu thay đổi
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSave} className="space-y-4">
                <div className="flex items-center justify-between gap-3 p-3 bg-[#fbfbfa] border border-[#e6e6e6] rounded-[10px]">
                    <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm text-[#000000] truncate">
                                {name || "Chưa có tên"}
                            </p>
                            <Badge variant="primary" size="xs" dot>
                                {currentUser?.role === "ADMIN"
                                    ? "Quản trị viên"
                                    : currentUser?.role === "WAREHOUSE_MANAGER"
                                      ? "Quản lý kho"
                                      : currentUser?.role === "WAREHOUSE_STAFF"
                                        ? "Nhân viên kho"
                                        : "Kiểm toán viên"}
                            </Badge>
                        </div>
                        <p className="text-xs text-[#615d59]">{currentUser?.email}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#31302e]">
                            Ảnh đại diện
                        </label>
                        {isCloudinaryImage && (
                            <span className="text-[11px] font-medium text-[#10b981] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-[4px]">
                                Đã lưu trên Cloudinary
                            </span>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                        id="avatar-image-upload"
                    />

                    {avatar ? (
                        <div className="border border-[#e6e6e6] rounded-[8px] p-3.5 bg-[#fafafa] flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[6px] overflow-hidden bg-white border border-[#e0e0e0] flex items-center justify-center flex-shrink-0 shadow-sm">
                                <img
                                    src={avatar}
                                    alt="Xem trước ảnh đại diện"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 text-center sm:text-left space-y-2 w-full min-w-0">
                                <p className="text-[13px] font-semibold text-[#1f2937] truncate">
                                    {avatar}
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
                                        onClick={() => setAvatar("")}
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
                                        Nhấn để chọn và tải ảnh đại diện lên Cloudinary
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

                    <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#615d59]">
                                Chọn ảnh đại diện có sẵn
                            </label>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {AVATAR_PRESETS.map((url, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setAvatar(url)}
                                        className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                            avatar === url
                                                ? "border-[#0075de] ring-2 ring-[#0075de]/20"
                                                : "border-transparent opacity-80 hover:opacity-100"
                                        }`}
                                    >
                                        <img src={url} alt="Preset" className="w-full h-full object-cover" />
                                        {avatar === url && (
                                            <div className="absolute inset-0 bg-[#0075de]/40 flex items-center justify-center text-white">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full sm:w-64 space-y-1">
                            <label className="text-xs font-semibold text-[#615d59]">
                                Hoặc liên kết ảnh
                            </label>
                            <Input
                                leftIcon={<LinkIcon className="w-3.5 h-3.5 text-[#a39e98]" />}
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                placeholder="https://example.com/photo.jpg"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e6e6e6]">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#31302e]">Họ và tên</label>
                        <Input
                            leftIcon={<UserIcon className="w-4 h-4 text-[#a39e98]" />}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập họ và tên"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#31302e]">Số điện thoại</label>
                        <Input
                            leftIcon={<Phone className="w-4 h-4 text-[#a39e98]" />}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Nhập số điện thoại"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#31302e]">Phòng ban</label>
                        <Input
                            leftIcon={<Building className="w-4 h-4 text-[#a39e98]" />}
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="Ví dụ: Vận hành kho"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#31302e]">Email đăng nhập</label>
                        <Input
                            leftIcon={<Mail className="w-4 h-4 text-[#a39e98]" />}
                            value={currentUser?.email || ""}
                            disabled
                            className="bg-[#f6f5f4] cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-[#e6e6e6]">
                    <button
                        type="button"
                        onClick={() => setShowPasswordFields(!showPasswordFields)}
                        className="flex items-center gap-1.5 text-xs text-[#0075de] hover:underline font-medium cursor-pointer"
                    >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{showPasswordFields ? "Ẩn đổi mật khẩu" : "Thay đổi mật khẩu đăng nhập"}</span>
                    </button>

                    {showPasswordFields && (
                        <div className="mt-3 space-y-2.5 p-3 bg-[#f8f9fa] border border-[#e6e6e6] rounded-[8px]">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#31302e]">Mật khẩu hiện tại</label>
                                <Input
                                    type="password"
                                    leftIcon={<Lock className="w-4 h-4 text-[#a39e98]" />}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu hiện tại"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[#31302e]">Mật khẩu mới</label>
                                    <Input
                                        type="password"
                                        leftIcon={<ShieldCheck className="w-4 h-4 text-[#a39e98]" />}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Tối thiểu 6 ký tự"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[#31302e]">Xác nhận mật khẩu mới</label>
                                    <Input
                                        type="password"
                                        leftIcon={<ShieldCheck className="w-4 h-4 text-[#a39e98]" />}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Nhập lại mật khẩu mới"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
};
