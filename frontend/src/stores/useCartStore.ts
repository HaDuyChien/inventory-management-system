import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product: Product, quantity = 1) => {
                const current = get().items;
                const index = current.findIndex((i) => i.product.id === product.id);
                if (index > -1) {
                    const next = [...current];
                    const maxStock = product.stock || 999;
                    next[index].quantity = Math.min(next[index].quantity + quantity, maxStock);
                    set({ items: next });
                } else {
                    set({ items: [...current, { product, quantity }] });
                }
            },
            removeItem: (productId: string) => {
                set({ items: get().items.filter((i) => i.product.id !== productId) });
            },
            updateQuantity: (productId: string, quantity: number) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                set({
                    items: get().items.map((i) =>
                        i.product.id === productId ? { ...i, quantity } : i,
                    ),
                });
            },
            clearCart: () => set({ items: [] }),
            getTotalItems: () => {
                return get().items.reduce((acc, curr) => acc + curr.quantity, 0);
            },
            getTotalPrice: () => {
                return get().items.reduce(
                    (acc, curr) => acc + curr.product.sellingPrice * curr.quantity,
                    0,
                );
            },
        }),
        {
            name: "notion_store_cart",
        },
    ),
);
