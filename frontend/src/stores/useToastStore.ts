import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        const duration = toast.duration ?? 4000;
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
            }, duration);
        }
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
    success: (title: string, description?: string) =>
        useToastStore.getState().addToast({ type: "success", title, description }),
    error: (title: string, description?: string) =>
        useToastStore.getState().addToast({ type: "error", title, description }),
    warning: (title: string, description?: string) =>
        useToastStore.getState().addToast({ type: "warning", title, description }),
    info: (title: string, description?: string) =>
        useToastStore.getState().addToast({ type: "info", title, description }),
};
