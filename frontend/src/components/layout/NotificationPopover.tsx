import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    AlertTriangle,
    Package,
    CheckCircle2,
    Sparkles,
    Clock,
    Trash2,
    Inbox,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNotificationStore, NotificationItem } from "@/stores/useNotificationStore";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/utils/cn";

export const NotificationPopover: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } =
        useNotificationStore();
    const { setNotificationsOpen } = useUIStore();

    const unreadCount = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const displayedNotifications =
        activeTab === "unread"
            ? notifications.filter((n) => !n.read)
            : notifications;

    const handleItemClick = (item: NotificationItem) => {
        markAsRead(item.id);
        setIsOpen(false);
        if (item.link) {
            navigate(item.link);
        }
    };

    const renderIcon = (item: NotificationItem) => {
        switch (item.badgeVariant) {
            case "danger":
                return (
                    <div className="w-8 h-8 rounded-full bg-[#fce8e6] text-[#eb5757] flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                );
            case "primary":
                return (
                    <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#0075de] flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                    </div>
                );
            case "success":
                return (
                    <div className="w-8 h-8 rounded-full bg-[#e6f4ea] text-[#137333] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                );
            case "purple":
                return (
                    <div className="w-8 h-8 rounded-full bg-[#f3e8fd] text-[#8a42d8] flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                    </div>
                );
            case "warning":
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-[#fef7e0] text-[#b06000] flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                    </div>
                );
        }
    };

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative p-2 rounded-[8px] text-[#615d59] hover:text-[#000000] hover:bg-black/5 transition-all cursor-pointer",
                    isOpen && "bg-black/5 text-[#000000] ring-2 ring-[#0075de]/20"
                )}
                title="Thông báo hệ thống"
            >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#eb5757] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[12px] bg-white border border-[#e6e6e6] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 border-b border-[#f0f0f0] bg-[#fafafa]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <h4 className="text-[14px] font-bold text-[#1f2937]">
                                    Thông báo
                                </h4>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eb5757]/10 text-[#eb5757]">
                                        {unreadCount} mới
                                    </span>
                                )}
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => markAllAsRead()}
                                    className="text-xs font-semibold text-[#0075de] hover:text-[#005bab] transition-colors cursor-pointer"
                                >
                                    Đọc tất cả
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-2.5">
                            <button
                                type="button"
                                onClick={() => setActiveTab("all")}
                                className={cn(
                                    "px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer",
                                    activeTab === "all"
                                        ? "bg-white text-[#0075de] shadow-xs border border-[#e6e6e6]"
                                        : "text-[#615d59] hover:text-[#000000]"
                                )}
                            >
                                Tất cả {notifications.length}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("unread")}
                                className={cn(
                                    "px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer",
                                    activeTab === "unread"
                                        ? "bg-white text-[#0075de] shadow-xs border border-[#e6e6e6]"
                                        : "text-[#615d59] hover:text-[#000000]"
                                )}
                            >
                                Chưa đọc {unreadCount}
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-[#f0f0f0]">
                        {displayedNotifications.length > 0 ? (
                            displayedNotifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleItemClick(n)}
                                    className={cn(
                                        "p-3 flex gap-3 hover:bg-[#f6f5f4] transition-colors cursor-pointer group relative",
                                        !n.read && "bg-[#f8fafd]"
                                    )}
                                >
                                    {renderIcon(n)}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {!n.read && (
                                                    <span className="w-2 h-2 rounded-full bg-[#0075de] shrink-0" />
                                                )}
                                                <h5
                                                    className={cn(
                                                        "text-xs truncate",
                                                        n.read
                                                            ? "font-medium text-[#4b5563]"
                                                            : "font-bold text-[#111827]"
                                                    )}
                                                >
                                                    {n.title}
                                                </h5>
                                            </div>
                                            <Badge variant={n.badgeVariant} size="xs">
                                                {n.badge}
                                            </Badge>
                                        </div>

                                        <p className="text-[12px] text-[#615d59] line-clamp-2 leading-relaxed mb-1.5">
                                            {n.desc}
                                        </p>

                                        <div className="flex items-center justify-between text-[11px] text-[#9ca3af]">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{n.time}</span>
                                            </div>

                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                                                <button
                                                    type="button"
                                                    title="Xóa thông báo"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(n.id);
                                                    }}
                                                    className="p-1 hover:text-[#eb5757] rounded"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="text-[#0075de] font-semibold text-xs">
                                                    Xem
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 px-4 text-center">
                                <div className="w-10 h-10 rounded-full bg-[#f6f5f4] text-[#a39e98] flex items-center justify-center mx-auto mb-2.5">
                                    <Inbox className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-semibold text-[#1f2937]">
                                    Không có thông báo nào
                                </p>
                                <p className="text-[11px] text-[#9ca3af] mt-0.5">
                                    {activeTab === "unread"
                                        ? "Bạn đã đọc hết mọi thông báo mới"
                                        : "Chưa có thông báo nào được ghi nhận"}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-2.5 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                                setIsOpen(false);
                                setNotificationsOpen(true);
                            }}
                            className="text-[#0075de] font-semibold hover:bg-white"
                        >
                            Xem trong ngăn kéo
                        </Button>

                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => clearAll()}
                                className="text-[#9ca3af] hover:text-[#eb5757] hover:bg-white"
                            >
                                Xóa toàn bộ
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
