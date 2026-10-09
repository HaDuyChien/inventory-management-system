import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/services/api";

export interface CustomerUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    segment?: string;
    totalOrders?: number;
    totalSpent?: number;
}

interface CustomerAuthState {
    user: CustomerUser | null;
    isAuthenticated: boolean;
    token: string | null;
    loginWithCredentials: (email: string, password: string) => Promise<CustomerUser>;
    registerWithBackend: (data: {
        name: string;
        email: string;
        phone: string;
        password: string;
        address?: string;
    }) => Promise<CustomerUser>;
    logout: () => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            token: localStorage.getItem("inventohub_customer_token"),

            loginWithCredentials: async (email: string, password: string) => {
                const result = await authApi.customerLogin(email, password);
                const mappedUser: CustomerUser = {
                    id: result.customer._id,
                    name: result.customer.name,
                    email: result.customer.email,
                    phone: result.customer.phone,
                    address: result.customer.address || "",
                    segment: result.customer.segment,
                    totalOrders: result.customer.totalOrders,
                    totalSpent: result.customer.totalSpent,
                };
                set({ user: mappedUser, isAuthenticated: true, token: result.token });
                return mappedUser;
            },

            registerWithBackend: async (data) => {
                const result = await authApi.customerRegister(data);
                const mappedUser: CustomerUser = {
                    id: result.customer._id,
                    name: result.customer.name,
                    email: result.customer.email,
                    phone: result.customer.phone,
                    address: result.customer.address || "",
                    segment: result.customer.segment,
                    totalOrders: result.customer.totalOrders,
                    totalSpent: result.customer.totalSpent,
                };
                set({ user: mappedUser, isAuthenticated: true, token: result.token });
                return mappedUser;
            },

            logout: () => {
                localStorage.removeItem("inventohub_customer_token");
                set({ user: null, isAuthenticated: false, token: null });
            },
        }),
        {
            name: "notion_store_customer_auth",
        },
    ),
);
