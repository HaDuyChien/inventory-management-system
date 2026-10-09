import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NotificationItem {
    id: string;
    title: string;
    desc: string;
    time: string;
    read: boolean;
    type: "inventory" | "order" | "ai" | "return";
    link: string;
    badge: string;
    badgeVariant: "danger" | "primary" | "purple" | "success" | "warning";
}

interface NotificationStore {
    notifications: NotificationItem[];
    unreadCount: () => number;
    addNotification: (
        item: Omit<NotificationItem, "id" | "time" | "read"> & {
            id?: string;
            time?: string;
            read?: boolean;
        }
    ) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    clearAll: () => void;
}

const initialNotifications: NotificationItem[] = [
    {
        id: "notif-1",
        title: "Cảnh báo tồn kho dưới định mức",
        desc: "Thùng Carton 5 Lớp Chịu Lực SKU-BX-020 chỉ còn 8 hộp, định mức tối thiểu là 25 hộp.",
        time: "10 phút trước",
        read: false,
        type: "inventory",
        link: "/inventory/stock",
        badge: "Tồn kho thấp",
        badgeVariant: "danger",
    },
    {
        id: "notif-2",
        title: "Lô hàng nhập PO-2026-004 đã tới kho",
        desc: "Đơn mua hàng từ Zebra Technologies đã vào Cửa Dock 3 và sẵn sàng kiểm đếm.",
        time: "45 phút trước",
        read: false,
        type: "order",
        link: "/orders/purchases",
        badge: "Đang nhập kho",
        badgeVariant: "primary",
    },
    {
        id: "notif-3",
        title: "Đơn bán hàng mới thanh toán VNPay",
        desc: "Đơn hàng SO-119006 đã thanh toán thành công trực tuyến và sẵn sàng xuất kho.",
        time: "2 giờ trước",
        read: false,
        type: "order",
        link: "/orders/sales",
        badge: "Đã thanh toán",
        badgeVariant: "success",
    },
    {
        id: "notif-4",
        title: "Dự báo nhu cầu AI quý mới",
        desc: "Thuật toán phát hiện nhu cầu máy quét mã vạch dự kiến tăng 24% trong quý tới.",
        time: "4 giờ trước",
        read: false,
        type: "ai",
        link: "/ai/demand-forecast",
        badge: "Phân tích AI",
        badgeVariant: "purple",
    },
    {
        id: "notif-5",
        title: "Yêu cầu trả hàng mới cần xử lý",
        desc: "Khách hàng Nguyễn Văn A gửi yêu cầu trả hàng cho đơn SO-119005 do thừa số lượng.",
        time: "1 ngày trước",
        read: true,
        type: "return",
        link: "/orders/returns",
        badge: "Đổi trả",
        badgeVariant: "warning",
    },
];

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            notifications: initialNotifications,
            unreadCount: () => {
                return get().notifications.filter((n) => !n.read).length;
            },
            addNotification: (item) => {
                const newItem: NotificationItem = {
                    id: item.id || `notif-${Date.now()}`,
                    time: item.time || "Vừa xong",
                    read: item.read ?? false,
                    title: item.title,
                    desc: item.desc,
                    type: item.type,
                    link: item.link,
                    badge: item.badge,
                    badgeVariant: item.badgeVariant,
                };
                set((state) => ({
                    notifications: [
                        newItem,
                        ...state.notifications.filter((n) => n.id !== newItem.id),
                    ],
                }));
            },
            markAsRead: (id: string) => {
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    ),
                }));
            },
            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                }));
            },
            deleteNotification: (id: string) => {
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                }));
            },
            clearAll: () => {
                set({ notifications: [] });
            },
        }),
        {
            name: "inventohub-notifications-storage",
        }
    )
);
