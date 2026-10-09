import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Boxes, ArrowRight, UserCheck } from "lucide-react";
import { useCustomerAuthStore } from "@/stores/useCustomerAuthStore";
import { toast } from "@/stores/useToastStore";
import { getApiErrorMessage } from "@/services/api";

export const CustomerAuthPage: React.FC = () => {
    const navigate = useNavigate();
    const { loginWithCredentials, registerWithBackend, isAuthenticated, user, logout } =
        useCustomerAuthStore();

    const [tab, setTab] = useState<"login" | "register">("login");
    const [isLoading, setIsLoading] = useState(false);
    const [loginEmail, setLoginEmail] = useState("nguyenvana@gmail.com");
    const [loginPassword, setLoginPassword] = useState("khach123");

    const [regForm, setRegForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const customer = await loginWithCredentials(loginEmail.trim(), loginPassword);
            toast.success("Đăng nhập thành công", `Chào mừng ${customer.name} trở lại`);
            navigate("/store");
        } catch (error) {
            const msg = getApiErrorMessage(
                error,
                "Email hoặc mật khẩu không chính xác hoặc không thể kết nối máy chủ",
            );
            toast.error("Đăng nhập thất bại", msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const customer = await registerWithBackend({
                name: regForm.name.trim(),
                email: regForm.email.trim(),
                phone: regForm.phone.trim(),
                address: regForm.address.trim(),
                password: regForm.password,
            });
            toast.success("Đăng ký thành công", `Chào mừng ${customer.name} đến với cửa hàng`);
            navigate("/store");
        } catch (error) {
            const msg = getApiErrorMessage(
                error,
                "Đăng ký thất bại, vui lòng kiểm tra lại thông tin đã nhập",
            );
            toast.error("Đăng ký không thành công", msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthenticated && user) {
        return (
            <div className="max-w-sm mx-auto my-12 p-6 rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#1aae39]/10 text-[#1aae39] flex items-center justify-center mx-auto">
                    <UserCheck className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-[#000000]">{user.name}</h2>
                    <p className="text-xs text-[#615d59]">{user.email}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/store")}
                        className="flex-1 py-2 px-3 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold cursor-pointer"
                    >
                        Đến cửa hàng
                    </button>
                    <button
                        type="button"
                        onClick={logout}
                        className="py-2 px-3 rounded-full border border-[#e6e6e6] text-xs font-semibold hover:bg-[#f6f5f4] cursor-pointer"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-sm mx-auto my-10 space-y-6">
            <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-[10px] bg-[#0075de] text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Boxes className="w-5 h-5" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-[#000000]">
                    Tài khoản khách hàng
                </h1>
                <p className="text-xs text-[#615d59]">
                    Đăng nhập hoặc tạo tài khoản để quản lý và theo dõi đơn hàng
                </p>
            </div>

            <div className="rounded-[16px] border border-[#e6e6e6] bg-[#ffffff] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                <div className="grid grid-cols-2 p-1 bg-[#f6f5f4] rounded-[8px] text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setTab("login")}
                        className={`py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                            tab === "login"
                                ? "bg-[#ffffff] text-[#000000] shadow-sm"
                                : "text-[#615d59] hover:text-[#000000]"
                        }`}
                    >
                        Đăng nhập
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("register")}
                        className={`py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                            tab === "register"
                                ? "bg-[#ffffff] text-[#000000] shadow-sm"
                                : "text-[#615d59] hover:text-[#000000]"
                        }`}
                    >
                        Đăng ký
                    </button>
                </div>

                {tab === "login" ? (
                    <form onSubmit={handleLogin} className="space-y-3.5">
                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Email đăng nhập
                            </label>
                            <input
                                type="email"
                                required
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                required
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            <span>{isLoading ? "Đang xử lý..." : "Đăng nhập ngay"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Nguyễn Văn An"
                                value={regForm.name}
                                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="an@gmail.com"
                                value={regForm.email}
                                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Số điện thoại
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="0912345678"
                                value={regForm.phone}
                                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Địa chỉ nhận hàng
                            </label>
                            <input
                                type="text"
                                placeholder="Hà Nội"
                                value={regForm.address}
                                onChange={(e) =>
                                    setRegForm({ ...regForm, address: e.target.value })
                                }
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[#000000] block mb-1">
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="Tối thiểu 6 ký tự"
                                value={regForm.password}
                                onChange={(e) =>
                                    setRegForm({ ...regForm, password: e.target.value })
                                }
                                className="w-full px-3 py-2 text-xs rounded-[4px] border border-[#e6e6e6] bg-[#ffffff] text-[#000000] focus:outline-none focus:border-[#0075de]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            <span>{isLoading ? "Đang xử lý..." : "Tạo tài khoản"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </form>
                )}
            </div>

            <div className="text-center">
                <Link
                    to="/store"
                    className="text-xs text-[#615d59] hover:text-[#000000] transition-colors"
                >
                    Tiếp tục duyệt danh mục
                </Link>
            </div>
        </div>
    );
};
