import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { ShoppingBag, User as UserIcon, PackageSearch, LogOut } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { useCustomerAuthStore } from "@/stores/useCustomerAuthStore";
import { usePageTitle } from "@/utils/usePageTitle";

export const ClientLayout: React.FC = () => {
    usePageTitle();
    const location = useLocation();
    const { getTotalItems } = useCartStore();
    const { user, isAuthenticated, logout } = useCustomerAuthStore();
    const totalItems = getTotalItems();

    return (
        <div className="min-h-screen bg-[#f6f5f4] text-[#000000] flex flex-col font-sans antialiased">
            <header className="sticky top-0 z-40 w-full border-b border-[#e6e6e6] bg-[#ffffff]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-8">
                        <Link
                            to="/store"
                            className="font-bold text-xl tracking-tight text-[#000000] hover:opacity-80 transition-opacity"
                        >
                            TechStore
                        </Link>

                        <nav className="hidden sm:flex items-center gap-1">
                            <Link
                                to="/store"
                                className={`px-3 py-1.5 rounded-[6px] text-sm font-semibold transition-colors ${
                                    location.pathname === "/store"
                                        ? "bg-[#f6f5f4] text-[#000000]"
                                        : "text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]"
                                }`}
                            >
                                Cửa hàng
                            </Link>
                            <Link
                                to="/store/lookup"
                                className={`px-3 py-1.5 rounded-[6px] text-sm font-semibold transition-colors ${
                                    location.pathname === "/store/lookup"
                                        ? "bg-[#f6f5f4] text-[#000000]"
                                        : "text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]"
                                }`}
                            >
                                Tra cứu đơn
                            </Link>
                            {isAuthenticated && (
                                <Link
                                    to="/store/orders"
                                    className={`px-3 py-1.5 rounded-[6px] text-sm font-semibold transition-colors ${
                                        location.pathname === "/store/orders"
                                            ? "bg-[#f6f5f4] text-[#000000]"
                                            : "text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]"
                                    }`}
                                >
                                    Đơn của tôi
                                </Link>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            to="/store/lookup"
                            className="sm:hidden p-2 rounded-[6px] text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]"
                            title="Tra cứu đơn"
                        >
                            <PackageSearch className="w-5 h-5" />
                        </Link>

                        <Link
                            to="/store/cart"
                            className="relative flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#e6e6e6] bg-[#ffffff] hover:bg-[#f6f5f4] text-[#000000] text-sm font-semibold transition-colors"
                        >
                            <ShoppingBag className="w-4 h-4 text-[#0075de]" />
                            <span className="hidden sm:inline">Giỏ hàng</span>
                            {totalItems > 0 && (
                                <span className="w-5 h-5 rounded-full bg-[#0075de] text-[11px] font-bold text-white flex items-center justify-center">
                                    {totalItems > 99 ? "99+" : totalItems}
                                </span>
                            )}
                        </Link>

                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-2 pl-2 border-l border-[#e6e6e6]">
                                <Link
                                    to="/store/orders"
                                    className="flex items-center gap-1.5 text-xs font-bold px-2 py-1.5 rounded-[6px] hover:bg-[#f6f5f4] text-[#000000]"
                                >
                                    <UserIcon className="w-4 h-4 text-[#615d59]" />
                                    <span className="truncate max-w-[120px]">{user.name}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={logout}
                                    title="Đăng xuất"
                                    className="p-1.5 rounded-[6px] text-[#615d59] hover:text-[#eb5757] hover:bg-[#f6f5f4]"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 pl-2 border-l border-[#e6e6e6]">
                                <Link
                                    to="/store/auth"
                                    className="text-xs font-bold px-3 py-2 rounded-[6px] text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4] transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/store/auth"
                                    className="text-xs font-bold px-4 py-2 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white transition-colors"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-10">
                <Outlet />
            </main>

            <footer className="border-t border-[#e6e6e6] bg-[#f6f5f4] py-8 text-xs text-[#615d59]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#000000]">Invento</span>
                        <span>– Thiết bị chính hãng</span>
                    </div>

                    <div className="flex items-center gap-5 font-medium">
                        <Link to="/store" className="hover:text-[#000000]">
                            Sản phẩm
                        </Link>
                        <Link to="/store/lookup" className="hover:text-[#000000]">
                            Tra cứu đơn
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};
