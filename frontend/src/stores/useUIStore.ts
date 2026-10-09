import { create } from "zustand";

interface UIStore {
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;

    isMobileNavOpen: boolean;
    setMobileNavOpen: (open: boolean) => void;

    isCommandPaletteOpen: boolean;
    setCommandPaletteOpen: (open: boolean) => void;

    isNotificationsOpen: boolean;
    setNotificationsOpen: (open: boolean) => void;

    theme: "light" | "dark";
    toggleTheme: () => void;
}

const initialTheme =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

export const useUIStore = create<UIStore>((set) => ({
    isSidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

    isMobileNavOpen: false,
    setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),

    isCommandPaletteOpen: false,
    setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

    isNotificationsOpen: false,
    setNotificationsOpen: (open) => set({ isNotificationsOpen: open }),

    theme: initialTheme,
    toggleTheme: () =>
        set((state) => {
            const next = state.theme === "dark" ? "light" : "dark";
            if (typeof document !== "undefined") {
                if (next === "dark") {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            }
            return { theme: next };
        }),
}));
