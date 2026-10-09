import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Search,
    Plus,
    Check,
    Eye,
    ArrowRight,
    ShieldCheck,
    Truck,
    RotateCcw,
    Headphones,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    CheckCircle2,
    SlidersHorizontal,
} from "lucide-react";
import { mockApi } from "@/services/mockApi";
import { useCartStore } from "@/stores/useCartStore";
import type { Product } from "@/types";

const STICKER_COLORS: Record<string, string> = {
    "Điện tử": "#62aef0",
    "Phụ kiện": "#ff64c8",
    "Máy tính": "#2a9d99",
    "Lưu trữ": "#dd5b00",
    "Màn hình": "#d6b6f6",
    "Thiết bị": "#1aae39",
};

export const StorePage: React.FC = () => {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [priceRange, setPriceRange] = useState<string>("ALL");
    const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK">("ALL");
    const [sortBy, setSortBy] = useState<"NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "NAME_ASC">("NEWEST");
    const [currentPage, setCurrentPage] = useState(1);
    const [addedId, setAddedId] = useState<string | null>(null);

    const itemsPerPage = 8;
    const { addItem } = useCartStore();

    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: mockApi.getProducts,
    });

    const categories = useMemo(() => {
        const set = new Set<string>();
        products.forEach((p) => set.add(p.category));
        return ["ALL", ...Array.from(set)];
    }, [products]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { ALL: products.length };
        products.forEach((p) => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });
        return counts;
    }, [products]);

    const featuredProducts = useMemo(() => {
        return products.slice(0, 4);
    }, [products]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, priceRange, stockFilter, sortBy, search]);

    const filtered = useMemo(() => {
        const result = products.filter((p) => {
            const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
            const matchesSearch =
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.brand.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase());

            let matchesPrice = true;
            if (priceRange === "under-2m") matchesPrice = p.sellingPrice < 2000000;
            else if (priceRange === "2m-10m")
                matchesPrice = p.sellingPrice >= 2000000 && p.sellingPrice <= 10000000;
            else if (priceRange === "10m-25m")
                matchesPrice = p.sellingPrice > 10000000 && p.sellingPrice <= 25000000;
            else if (priceRange === "above-25m") matchesPrice = p.sellingPrice > 25000000;

            let matchesStock = true;
            if (stockFilter === "IN_STOCK") matchesStock = p.stock > 0;

            return matchesCat && matchesSearch && matchesPrice && matchesStock;
        });

        return result.sort((a, b) => {
            if (sortBy === "PRICE_ASC") return a.sellingPrice - b.sellingPrice;
            if (sortBy === "PRICE_DESC") return b.sellingPrice - a.sellingPrice;
            if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name, "vi");
            return 0;
        });
    }, [products, selectedCategory, search, priceRange, stockFilter, sortBy]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = filtered.slice(startIndex, startIndex + itemsPerPage);

    const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock <= 0) return;
        addItem(product, 1);
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1000);
    };

    const scrollToCatalog = () => {
        const el = document.getElementById("catalog-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        scrollToCatalog();
    };

    const resetFilters = () => {
        setSearch("");
        setSelectedCategory("ALL");
        setPriceRange("ALL");
        setStockFilter("ALL");
        setSortBy("NEWEST");
        setCurrentPage(1);
    };

    const isFiltered =
        search !== "" ||
        selectedCategory !== "ALL" ||
        priceRange !== "ALL" ||
        stockFilter !== "ALL" ||
        sortBy !== "NEWEST";

    return (
        <div className="space-y-12 pb-8">
            <section className="relative rounded-[16px] overflow-hidden border border-[#e6e6e6] bg-[#ffffff] shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                    <div className="lg:col-span-6 p-8 sm:p-12 space-y-6 z-10">
                        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#f6f5f4] text-[#0075de] border border-[#e6e6e6]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Bộ sưu tập 2026</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#000000] leading-tight">
                            Không gian làm việc tối giản
                        </h1>

                        <p className="text-sm sm:text-base text-[#615d59]">
                            Trang bị thiết bị chính hãng và công nghệ cao cấp.
                        </p>

                        <div className="pt-2 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={scrollToCatalog}
                                className="px-6 py-3 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                            >
                                <span>Khám phá ngay</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-6 h-64 sm:h-96 lg:h-[420px] relative overflow-hidden bg-[#f6f5f4]">
                        <img
                            src="/banners/hero.jpg"
                            alt="Tech Workspace"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] space-y-2">
                    <div className="w-9 h-9 rounded-full bg-[#0075de]/10 text-[#0075de] flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#000000]">Chính hãng 100%</h3>
                    <p className="text-xs text-[#615d59]">Cam kết nguồn gốc xuất xứ</p>
                </div>

                <div className="p-5 rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] space-y-2">
                    <div className="w-9 h-9 rounded-full bg-[#dd5b00]/10 text-[#dd5b00] flex items-center justify-center">
                        <Truck className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#000000]">Giao hàng 24h</h3>
                    <p className="text-xs text-[#615d59]">Miễn phí vận chuyển toàn quốc</p>
                </div>

                <div className="p-5 rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] space-y-2">
                    <div className="w-9 h-9 rounded-full bg-[#1aae39]/10 text-[#1aae39] flex items-center justify-center">
                        <RotateCcw className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#000000]">Đổi trả 7 ngày</h3>
                    <p className="text-xs text-[#615d59]">Hỗ trợ đổi mới nhanh chóng</p>
                </div>

                <div className="p-5 rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] space-y-2">
                    <div className="w-9 h-9 rounded-full bg-[#ff64c8]/10 text-[#ff64c8] flex items-center justify-center">
                        <Headphones className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#000000]">Hỗ trợ tận tâm</h3>
                    <p className="text-xs text-[#615d59]">Tư vấn kỹ thuật chuyên sâu</p>
                </div>
            </section>

            <section className="space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight text-[#000000]">
                        Sản phẩm nổi bật
                    </h2>
                    <button
                        type="button"
                        onClick={scrollToCatalog}
                        className="text-sm font-semibold text-[#0075de] hover:underline flex items-center gap-1"
                    >
                        <span>Xem tất cả</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {featuredProducts.map((p) => (
                        <Link
                            key={p.id}
                            to={`/store/product/${p.id}`}
                            className="group rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] p-4 flex flex-col justify-between transition-all hover:border-[#0075de] hover:shadow-md"
                        >
                            <div className="space-y-3">
                                <div className="aspect-square rounded-[8px] bg-[#f6f5f4] overflow-hidden flex items-center justify-center p-2">
                                    <img
                                        src={p.image}
                                        alt={p.name}
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-[#0075de] uppercase tracking-wider">
                                        {p.brand}
                                    </span>
                                    <h4 className="text-sm font-bold text-[#000000] line-clamp-2 mt-0.5">
                                        {p.name}
                                    </h4>
                                </div>
                            </div>

                            <div className="pt-3 mt-3 border-t border-[#e6e6e6] flex items-center justify-between">
                                <span className="text-base font-bold text-[#000000]">
                                    {p.sellingPrice.toLocaleString("vi-VN")} ₫
                                </span>
                                <span className="p-2 rounded-full bg-[#f6f5f4] text-[#0075de] group-hover:bg-[#0075de] group-hover:text-white transition-colors">
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="relative rounded-[16px] overflow-hidden border border-[#e6e6e6] bg-[#213183] text-white shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                    <div className="lg:col-span-7 p-8 sm:p-12 space-y-4">
                        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                            <span>Ưu đãi âm thanh</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                            Âm thanh đỉnh cao
                        </h2>

                        <p className="text-sm text-white/80 max-w-md">
                            Trải nghiệm tai nghe và thiết bị âm thanh chuẩn studio với độ chi tiết
                            vượt trội.
                        </p>

                        <div className="pt-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategory("Phụ kiện");
                                    scrollToCatalog();
                                }}
                                className="px-6 py-2.5 rounded-full bg-white text-[#213183] text-sm font-bold hover:bg-white/90 transition-colors"
                            >
                                Xem bộ sưu tập
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-5 h-64 sm:h-80 relative overflow-hidden bg-black/20">
                        <img
                            src="/banners/promo.jpg"
                            alt="Audio gear"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </section>

            <section id="catalog-section" className="space-y-6 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000]">
                            Danh mục sản phẩm
                        </h2>
                        <p className="text-xs sm:text-sm text-[#615d59] mt-1">
                            Hiển thị {filtered.length > 0 ? startIndex + 1 : 0} đến {Math.min(startIndex + itemsPerPage, filtered.length)} trên tổng số {filtered.length} sản phẩm
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a39e98]" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc thương hiệu..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-[6px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 bg-white border border-[#e6e6e6] rounded-[6px] px-2.5 py-1.5 text-xs text-[#615d59]">
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-transparent text-xs font-semibold text-[#000000] focus:outline-none cursor-pointer"
                            >
                                <option value="NEWEST">Mới nhất</option>
                                <option value="PRICE_ASC">Giá tăng dần</option>
                                <option value="PRICE_DESC">Giá giảm dần</option>
                                <option value="NAME_ASC">Tên sản phẩm A đến Z</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pb-1">
                    {categories.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        const stickerColor = STICKER_COLORS[cat] || "#0075de";
                        const count = categoryCounts[cat] || 0;

                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                                    isSelected
                                        ? "bg-[#000000] text-white border-[#000000]"
                                        : "bg-[#ffffff] text-[#615d59] border-[#e6e6e6] hover:text-[#000000] hover:bg-[#f6f5f4]"
                                }`}
                            >
                                {cat !== "ALL" && (
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: stickerColor }}
                                    />
                                )}
                                <span>{cat === "ALL" ? "Tất cả" : cat}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                        isSelected
                                            ? "bg-white/20 text-white"
                                            : "bg-[#f6f5f4] text-[#615d59]"
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e6e6e6]">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#615d59] mr-1">Mức giá:</span>
                        {[
                            { id: "ALL", label: "Tất cả" },
                            { id: "under-2m", label: "Dưới 2 triệu" },
                            { id: "2m-10m", label: "2 đến 10 triệu" },
                            { id: "10m-25m", label: "10 đến 25 triệu" },
                            { id: "above-25m", label: "Trên 25 triệu" },
                        ].map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setPriceRange(p.id)}
                                className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-colors border ${
                                    priceRange === p.id
                                        ? "bg-[#0075de] text-white border-[#0075de]"
                                        : "bg-[#ffffff] text-[#615d59] border-[#e6e6e6] hover:text-[#000000]"
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setStockFilter(stockFilter === "ALL" ? "IN_STOCK" : "ALL")
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-semibold border transition-colors ${
                                stockFilter === "IN_STOCK"
                                    ? "bg-[#10b981] text-white border-[#10b981]"
                                    : "bg-white text-[#615d59] border-[#e6e6e6] hover:text-[#000000]"
                            }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Chỉ hàng còn trong kho</span>
                        </button>

                        {isFiltered && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-[6px] text-xs font-semibold text-[#eb5757] hover:bg-[#eb5757]/10 transition-colors"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Đặt lại bộ lọc</span>
                            </button>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] p-4 space-y-3 animate-pulse"
                            >
                                <div className="aspect-square bg-[#f6f5f4] rounded-[8px]" />
                                <div className="h-5 bg-[#f6f5f4] rounded w-3/4" />
                                <div className="h-4 bg-[#f6f5f4] rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : paginatedProducts.length === 0 ? (
                    <div className="text-center py-20 text-[#615d59] rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] space-y-3">
                        <p className="text-base font-bold">Không tìm thấy sản phẩm phù hợp</p>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="text-xs text-[#0075de] font-bold hover:underline"
                        >
                            Đặt lại toàn bộ bộ lọc
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {paginatedProducts.map((product) => {
                            const inStock = product.stock > 0;
                            const isRecentlyAdded = addedId === product.id;
                            const stickerColor = STICKER_COLORS[product.category] || "#0075de";

                            return (
                                <Link
                                    key={product.id}
                                    to={`/store/product/${product.id}`}
                                    className="group rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] p-3.5 flex flex-col justify-between transition-all hover:border-[#0075de] hover:shadow-md"
                                >
                                    <div className="space-y-3">
                                        <div className="relative aspect-square rounded-[8px] bg-[#f6f5f4] overflow-hidden flex items-center justify-center p-2">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display =
                                                        "none";
                                                }}
                                            />
                                            <div className="absolute top-2 left-2">
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        inStock
                                                            ? "bg-[#1aae39]/10 text-[#1aae39]"
                                                            : "bg-[#eb5757]/10 text-[#eb5757]"
                                                    }`}
                                                >
                                                    {inStock ? "Còn hàng" : "Hết hàng"}
                                                </span>
                                            </div>

                                            <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="p-2 rounded-full bg-white text-[#000000] shadow-sm">
                                                    <Eye className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs text-[#615d59]">
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: stickerColor }}
                                                />
                                                <span className="truncate">{product.category}</span>
                                            </div>
                                            <h3 className="text-sm font-bold text-[#000000] line-clamp-2 mt-1 leading-snug">
                                                {product.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="pt-3 mt-3 border-t border-[#e6e6e6] flex items-center justify-between gap-2">
                                        <div className="font-bold text-sm sm:text-base tracking-tight text-[#000000]">
                                            {product.sellingPrice.toLocaleString("vi-VN")} ₫
                                        </div>

                                        <button
                                            type="button"
                                            disabled={!inStock}
                                            onClick={(e) => handleQuickAdd(e, product)}
                                            className={`p-2.5 rounded-[8px] text-xs transition-colors flex items-center justify-center ${
                                                isRecentlyAdded
                                                    ? "bg-[#1aae39] text-white"
                                                    : inStock
                                                      ? "bg-[#0075de] hover:bg-[#005bab] text-white"
                                                      : "bg-[#f6f5f4] text-[#a39e98] cursor-not-allowed"
                                            }`}
                                            title={inStock ? "Thêm vào giỏ" : "Hết hàng"}
                                        >
                                            {isRecentlyAdded ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <Plus className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="pt-6 border-t border-[#e6e6e6] flex items-center justify-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-[8px] border border-[#e6e6e6] bg-white text-xs font-semibold text-[#000000] hover:bg-[#f6f5f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Trang trước</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => handlePageChange(page)}
                                    className={`w-8 h-8 rounded-[8px] text-xs font-bold transition-colors ${
                                        currentPage === page
                                            ? "bg-[#0075de] text-white shadow-sm"
                                            : "bg-white border border-[#e6e6e6] text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-[8px] border border-[#e6e6e6] bg-white text-xs font-semibold text-[#000000] hover:bg-[#f6f5f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <span>Trang sau</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
};
