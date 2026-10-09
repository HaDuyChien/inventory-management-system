import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";
import { authApi } from "@/services/api";

interface AuthStore {
    currentUser: User | null;
    isAuthenticated: boolean;
    token: string | null;
    login: (user: User, token?: string) => void;
    loginWithCredentials: (email: string, password: string) => Promise<User>;
    logout: () => void;
    switchRole: (role: UserRole) => void;
    updateProfile: (updated: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            currentUser: {
                id: "usr-admin",
                name: "Quản trị viên",
                email: "admin@inventohub.com",
                role: "ADMIN",
                avatar: "",
                department: "Ban Giám Đốc",
                status: "ACTIVE",
            },
            isAuthenticated: true,
            token: localStorage.getItem("inventohub_admin_token"),

            login: (user, token) => {
                if (token) {
                    localStorage.setItem("inventohub_admin_token", token);
                }
                set({ currentUser: user, isAuthenticated: true, token: token || null });
            },

            loginWithCredentials: async (email: string, password: string) => {
                const result = await authApi.adminLogin(email, password);
                set({
                    currentUser: result.user,
                    isAuthenticated: true,
                    token: result.token,
                });
                return result.user;
            },

            logout: () => {
                localStorage.removeItem("inventohub_admin_token");
                localStorage.removeItem("inventohub_admin_auth");
                set({ currentUser: null, isAuthenticated: false, token: null });
            },

            switchRole: (role) =>
                set((state) => {
                    if (!state.currentUser) return state;
                    return {
                        currentUser: {
                            ...state.currentUser,
                            role,
                        },
                    };
                }),

            updateProfile: (updated) =>
                set((state) => {
                    if (!state.currentUser) return state;
                    return {
                        currentUser: {
                            ...state.currentUser,
                            ...updated,
                        },
                    };
                }),
        }),
        {
            name: "inventohub_admin_auth",
        },
    ),
);
