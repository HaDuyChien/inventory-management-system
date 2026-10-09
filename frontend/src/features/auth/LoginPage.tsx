import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "@/stores/useToastStore";
import { getApiErrorMessage } from "@/services/api";
import { usePageTitle } from "@/utils/usePageTitle";

export const LoginPage: React.FC = () => {
    usePageTitle();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithCredentials, isAuthenticated, currentUser } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && currentUser) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, currentUser, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const loggedUser = await loginWithCredentials(email.trim(), password);
            toast.success("Xin chào", `${loggedUser.name} - ${loggedUser.role}`);
            navigate("/dashboard");
        } catch (error) {
            const errorMsg = getApiErrorMessage(
                error,
                "Email hoặc mật khẩu không chính xác hoặc máy chủ không phản hồi",
            );
            toast.error("Đăng nhập thất bại", errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f5f4] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-[10px] bg-[#0075de] text-white shadow-notion-md mb-1">
                        <Box className="w-6 h-6" />
                    </div>
                    <h1 className="text-[24px] font-bold tracking-tight text-[#000000]">
                        InventoHub
                    </h1>
                    <p className="text-[13px] text-[#615d59]">Quản lý kho hàng doanh nghiệp</p>
                </div>

                <Card variant="flat" padding="lg" className="bg-white shadow-notion-md">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ten@inventohub.vn"
                            leftIcon={<Mail className="w-4 h-4" />}
                        />

                        <Input
                            label="Mật khẩu"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            leftIcon={<Lock className="w-4 h-4" />}
                        />

                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-1.5 text-[#615d59] cursor-pointer">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded text-[#0075de]"
                                />
                                Ghi nhớ
                            </label>
                            <a href="#" className="text-[#0075de] hover:underline font-medium">
                                Quên mật khẩu?
                            </a>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            className="w-full mt-3"
                            isLoading={isLoading}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                            Đăng Nhập
                        </Button>
                    </form>
                </Card>

                <div className="flex items-center justify-center gap-1.5 text-xs text-[#a39e98]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Hệ thống bảo mật 256-bit TLS</span>
                </div>
            </div>
        </div>
    );
};
