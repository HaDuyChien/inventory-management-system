import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Menu,
    Search,
    LogOut,
    Users,
    User as UserIcon,
} from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Dropdown } from "@/components/ui/Dropdown";
import { Badge } from "@/components/ui/Badge";
import { useUIStore } from "@/stores/useUIStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { UserRole } from "@/types";
import { ProfileModal } from "./ProfileModal";
import { NotificationPopover } from "./NotificationPopover";

export const Header: React.FC = () => {
    const { setMobileNavOpen, setCommandPaletteOpen } = useUIStore();
    const { currentUser, logout } = useAuthStore();
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const navigate = useNavigate();

    const roleConfigs: Record<
        UserRole,
        { label: string; variant: "primary" | "warning" | "teal" | "gray" }
    > = {
        ADMIN: { label: "Quản trị viên", variant: "primary" },
        WAREHOUSE_MANAGER: { label: "Quản lý kho", variant: "warning" },
        WAREHOUSE_STAFF: { label: "Nhân viên kho", variant: "teal" },
        VIEWER: { label: "Kiểm toán viên", variant: "gray" },
    };

    const currentRoleConfig = currentUser?.role ? roleConfigs[currentUser.role] : null;

    const userDropdownItems = [
        {
            id: "header-info",
            label: (
                <div className="py-1">
                    <p className="font-semibold text-[#000000]">{currentUser?.name || "Người dùng"}</p>
                    <p className="text-xs text-[#615d59]">{currentUser?.email || ""}</p>
                    {currentRoleConfig && (
                        <div className="mt-1.5">
                            <Badge variant={currentRoleConfig.variant} size="xs" dot>
                                {currentRoleConfig.label}
                            </Badge>
                        </div>
                    )}
                </div>
            ),
            disabled: true,
        },
        "divider" as const,
        {
            id: "profile-edit",
            label: "Thông tin cá nhân",
            icon: <UserIcon className="w-3.5 h-3.5 text-[#0075de]" />,
            onClick: () => setProfileModalOpen(true),
        },
        ...(currentUser?.role === "ADMIN"
            ? [
                  {
                      id: "users-manage",
                      label: "Quản lý nhân sự",
                      icon: <Users className="w-3.5 h-3.5 text-[#0075de]" />,
                      onClick: () => navigate("/users"),
                  },
              ]
            : []),
        "divider" as const,
        {
            id: "logout",
            label: "Đăng xuất",
            icon: <LogOut className="w-3.5 h-3.5 text-[#eb5757]" />,
            danger: true,
            onClick: () => {
                logout();
                navigate("/login", { replace: true });
            },
        },
    ];

    return (
        <header className="h-14 bg-white border-b border-[#e6e6e6] sticky top-0 z-10 px-4 flex items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="md:hidden p-1.5 rounded-[5px] text-[#615d59] hover:text-[#000000] hover:bg-black/5"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <Breadcrumbs />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">

                <button
                    type="button"
                    onClick={() => setCommandPaletteOpen(true)}
                    className="w-50 flex items-center justify-start px-2.5 py-1.5 text-xs text-[#615d59] bg-[#f6f5f4] hover:bg-[#eae8e6] border border-[#e6e6e6] rounded-[6px] transition-colors"
                >
                    <Search className="w-3.5 h-3.5 text-[#a39e98]" />
                    <span className="hidden sm:inline">Tìm nhanh...</span>
                
                </button>

                <NotificationPopover />

                {currentUser && (
                    <div className="hidden lg:block">
                        <Badge
                            variant={
                                currentUser.role === "ADMIN"
                                    ? "primary"
                                    : currentUser.role === "WAREHOUSE_MANAGER"
                                      ? "warning"
                                      : currentUser.role === "WAREHOUSE_STAFF"
                                        ? "teal"
                                        : "gray"
                            }
                            size="xs"
                            dot
                        >
                            {currentUser.role === "ADMIN"
                                ? "Quản trị"
                                : currentUser.role === "WAREHOUSE_MANAGER"
                                  ? "Quản lý"
                                  : currentUser.role === "WAREHOUSE_STAFF"
                                    ? "Nhân viên"
                                    : "Kiểm toán"}
                        </Badge>
                    </div>
                )}

                <Dropdown
                    trigger={
                        <div className="flex items-center gap-2 p-1 rounded-[6px] hover:bg-black/5 transition-colors">
                            {currentUser?.avatar ? (
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="w-7 h-7 rounded-full object-cover border border-[#e6e6e6]"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-[#0075de] text-white flex items-center justify-center text-xs font-semibold">
                                    {currentUser?.name.charAt(0) || "U"}
                                </div>
                            )}
                        </div>
                    }
                    items={userDropdownItems}
                    align="right"
                />
            </div>

            <ProfileModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
            />
        </header>
    );
};
