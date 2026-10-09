import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Package, Clock, Sparkles } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useUIStore } from "@/stores/useUIStore";
import { useNotificationStore, NotificationItem } from "@/stores/useNotificationStore";

export const NotificationsDrawer: React.FC = () => {
    const { isNotificationsOpen, setNotificationsOpen } = useUIStore();
    const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
    const navigate = useNavigate();

    const renderIcon = (item: NotificationItem) => {
        switch (item.badgeVariant) {
            case "danger":
                return <AlertTriangle className="w-4 h-4 text-[#eb5757]" />;
            case "primary":
                return <Package className="w-4 h-4 text-[#0075de]" />;
            case "success":
                return <CheckCircle2 className="w-4 h-4 text-[#1aae39]" />;
            case "purple":
                return <Sparkles className="w-4 h-4 text-[#8a42d8]" />;
            case "warning":
            default:
                return <Clock className="w-4 h-4 text-[#dd5b00]" />;
        }
    };

    const handleItemClick = (item: NotificationItem) => {
        markAsRead(item.id);
        setNotificationsOpen(false);
        if (item.link) {
            navigate(item.link);
        }
    };

    return (
        <Drawer
            isOpen={isNotificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            title="Trung tâm thông báo"
            size="md"
            footer={
                <div className="w-full flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => markAllAsRead()}
                        className="text-[#0075de] hover:underline"
                    >
                        Đánh dấu đã đọc
                    </Button>
                    <Button variant="utility" size="xs" onClick={() => setNotificationsOpen(false)}>
                        Đóng
                    </Button>
                </div>
            }
        >
            <div className="space-y-3">
                {notifications.length > 0 ? (
                    notifications.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => handleItemClick(n)}
                            className={`p-3 border rounded-[8px] transition-all shadow-notion-sm flex gap-3 cursor-pointer ${
                                n.read
                                    ? "bg-white border-[#e6e6e6] hover:border-[#a39e98]"
                                    : "bg-[#f8fafd] border-[#bfe0fb] hover:border-[#0075de]"
                            }`}
                        >
                            <div className="mt-0.5 shrink-0">{renderIcon(n)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        {!n.read && (
                                            <span className="w-2 h-2 rounded-full bg-[#0075de] shrink-0" />
                                        )}
                                        <h5
                                            className={`text-[13px] truncate ${
                                                n.read
                                                    ? "font-semibold text-[#31302e]"
                                                    : "font-bold text-[#000000]"
                                            }`}
                                        >
                                            {n.title}
                                        </h5>
                                    </div>
                                    <Badge variant={n.badgeVariant} size="xs">
                                        {n.badge}
                                    </Badge>
                                </div>
                                <p className="text-[12.5px] text-[#615d59] leading-relaxed mb-2">
                                    {n.desc}
                                </p>
                                <div className="flex items-center gap-1 text-[11px] text-[#a39e98]">
                                    <Clock className="w-3 h-3" />
                                    <span>{n.time}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 text-center text-xs text-[#615d59]">
                        Chưa có thông báo nào trong hệ thống
                    </div>
                )}
            </div>
        </Drawer>
    );
};
