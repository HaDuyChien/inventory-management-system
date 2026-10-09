import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Package,
    Warehouse,
    ShoppingBag,
    BarChart3,
    ArrowRight,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useUIStore } from "@/stores/useUIStore";

export const CommandMenu: React.FC = () => {
    const { isCommandPaletteOpen, setCommandPaletteOpen } = useUIStore();
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setCommandPaletteOpen(!isCommandPaletteOpen);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isCommandPaletteOpen, setCommandPaletteOpen]);

    const quickNav = [
        {
            label: "Danh mục sản phẩm",
            to: "/products",
            icon: <Package className="w-4 h-4 text-[#0075de]" />,
            category: "Điều hướng",
        },
        {
            label: "Bảng tồn kho",
            to: "/inventory",
            icon: <Package className="w-4 h-4 text-[#1aae39]" />,
            category: "Điều hướng",
        },
        {
            label: "Danh sách kho hàng",
            to: "/warehouses",
            icon: <Warehouse className="w-4 h-4 text-[#dd5b00]" />,
            category: "Điều hướng",
        },
        {
            label: "Đơn nhập hàng",
            to: "/purchase-orders",
            icon: <ShoppingBag className="w-4 h-4 text-[#2a9d99]" />,
            category: "Điều hướng",
        },
        {
            label: "Báo cáo phân tích",
            to: "/reports",
            icon: <BarChart3 className="w-4 h-4 text-[#ff64c8]" />,
            category: "Điều hướng",
        },
        {
            label: "Dự báo nhu cầu AI",
            to: "/ai-forecast",
            icon: <BarChart3 className="w-4 h-4 text-[#8a42d8]" />,
            category: "Công cụ AI",
        },
        {
            label: "Máy Quét Mã Vạch Zebra TC52x",
            to: "/products/prod-1",
            icon: <Package className="w-4 h-4 text-[#0075de]" />,
            category: "Sản phẩm gần đây",
        },
    ];

    const filtered = quickNav.filter(
        (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase()),
    );

    const handleSelect = (to: string) => {
        navigate(to);
        setCommandPaletteOpen(false);
        setQuery("");
    };

    return (
        <Modal
            isOpen={isCommandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            size="md"
            className="p-0 overflow-hidden"
        >
            <div className="border-b border-[#e6e6e6] p-3 flex items-center gap-2.5 bg-white">
                <Search className="w-4 h-4 text-[#a39e98] shrink-0" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm sản phẩm, đơn hàng, kho hàng hoặc chuyển trang..."
                    className="w-full text-[14px] bg-transparent text-[#000000] placeholder-[#a39e98] focus:outline-none"
                    autoFocus
                />
                <kbd className="hidden sm:inline-block text-[10px] text-[#a39e98] bg-[#f6f5f4] border border-[#e6e6e6] px-1.5 py-0.5 rounded font-mono">
                    ESC
                </kbd>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#615d59]">
                        Không tìm thấy kết quả cho "{query}"
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filtered.map((item, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelect(item.to)}
                                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-[6px] hover:bg-[#f6f5f4] group transition-colors select-none"
                            >
                                <div className="flex items-center gap-3">
                                    {item.icon}
                                    <div>
                                        <span className="text-[13.5px] font-medium text-[#000000]">
                                            {item.label}
                                        </span>
                                        <span className="ml-2 text-[11px] text-[#a39e98]">
                                            {item.category}
                                        </span>
                                    </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-[#a39e98] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-2.5 bg-[#f6f5f4] border-t border-[#e6e6e6] flex items-center justify-between text-[11px] text-[#615d59]">
                <span>Phím tắt</span>
                <div className="flex items-center gap-2">
                    <span>
                        Chọn: <strong>↵</strong>
                    </span>
                    <span>
                        Đóng: <strong>Esc</strong>
                    </span>
                </div>
            </div>
        </Modal>
    );
};
