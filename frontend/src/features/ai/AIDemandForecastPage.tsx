import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Sparkles,
    ShoppingCart,
    AlertCircle,
    Bot,
    Send,
    RefreshCw,
    MessageSquare,
    Zap,
} from "lucide-react";
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/States";
import { mockApi } from "@/services/mockApi";
import { useNavigate } from "react-router-dom";
import { toast } from "@/stores/useToastStore";

interface ChatMessage {
    role: "user" | "ai";
    content: string;
    timestamp: string;
}

export const AIDemandForecastPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedProductId, setSelectedProductId] = useState("");

    const [assistantQuestion, setAssistantQuestion] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            role: "ai",
            content:
                "Xin chào Quản lý kho. Tôi là Trợ lý Kho AI. Tôi có thể giúp bạn phân tích rủi ro hết hàng, gợi ý kế hoạch đặt hàng hoặc đề xuất chiến lược tối ưu lượng vốn lưu kho theo thời gian thực.",
            timestamp: "Vừa xong",
        },
    ]);

    const { data: products = [] } = useQuery({
        queryKey: ["products"],
        queryFn: mockApi.getProducts,
    });

    useEffect(() => {
        if (products.length > 0 && !selectedProductId) {
            setSelectedProductId(products[0].id);
        }
    }, [products, selectedProductId]);

    const { data: forecast, isLoading } = useQuery({
        queryKey: ["demand-forecast", selectedProductId],
        queryFn: () => mockApi.getDemandForecast(selectedProductId),
        enabled: Boolean(selectedProductId),
    });

    const handleAskAssistant = async (questionToAsk?: string) => {
        const query = (questionToAsk || assistantQuestion).trim();
        if (!query) return;

        const userMsg: ChatMessage = {
            role: "user",
            content: query,
            timestamp: new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        setChatMessages((prev) => [...prev, userMsg]);
        setAssistantQuestion("");
        setIsAsking(true);

        try {
            const contextSummary = forecast
                ? `Sản phẩm đang xem: ${forecast.productName}, SKU ${forecast.sku}, Tồn kho ${forecast.currentStock} cái, Dự báo 30 ngày ${forecast.forecast30Days} cái, Nguy cơ ${forecast.stockoutRiskScore}.`
                : "Hệ thống kho vận InventoHub";

            const reply = await mockApi.askAI(query, contextSummary);

            const aiMsg: ChatMessage = {
                role: "ai",
                content: reply,
                timestamp: new Date().toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
            setChatMessages((prev) => [...prev, aiMsg]);
        } catch (error: any) {
            const errorMsg: ChatMessage = {
                role: "ai",
                content:
                    "Hiện tại không thể kết nối tới mô hình AI. Vui lòng kiểm tra lại cấu hình kết nối mạng hoặc hệ thống.",
                timestamp: "Báo lỗi",
            };
            setChatMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsAsking(false);
        }
    };

    if (isLoading) return <LoadingState message="Mô hình AI đang tính toán dự báo..." />;

    if (products.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                        Dự báo nhu cầu và Định mức đặt hàng
                    </h1>
                    <Badge variant="purple" size="xs">
                        Trí tuệ nhân tạo AI
                    </Badge>
                </div>
                <Card variant="flat" padding="lg" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="w-10 h-10 text-[#615d59]" />
                        <h3 className="text-sm font-bold text-[#000000]">
                            Chưa có sản phẩm nào trong kho
                        </h3>
                        <p className="text-xs text-[#615d59] max-w-md">
                            Vui lòng thêm sản phẩm vào kho để mô hình AI có thể phân tích chuỗi tiêu thụ và lập định mức đặt hàng tự động.
                        </p>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate("/products/new")}
                        >
                            Thêm sản phẩm ngay
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                        Dự báo nhu cầu và Định mức đặt hàng
                    </h1>
                    <Badge variant="purple" size="xs">
                        Trí tuệ nhân tạo AI
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[#000000] whitespace-nowrap">
                        Sản phẩm phân tích:
                    </label>
                    <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="bg-white border border-[#e6e6e6] rounded-[6px] px-3 py-1.5 text-xs text-[#000000] font-medium shadow-notion-sm focus:outline-none focus:border-[#0075de]"
                    >
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} - {p.sku}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {forecast && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <Card variant="flat" padding="md">
                            <span className="text-xs text-[#615d59] font-medium uppercase">
                                Tồn kho hiện tại
                            </span>
                            <p className="text-[22px] font-bold text-[#000000] mt-1">
                                {forecast.currentStock} cái
                            </p>
                        </Card>

                        <Card variant="flat" padding="md">
                            <span className="text-xs text-[#615d59] font-medium uppercase">
                                Dự báo cầu 30 ngày
                            </span>
                            <p className="text-[22px] font-bold text-[#0075de] mt-1">
                                {forecast.forecast30Days} cái
                            </p>
                            <span className="text-[11px] text-[#0075de] font-medium">
                                Trung bình {forecast.averageDailySales} cái một ngày
                            </span>
                        </Card>

                        <Card variant="flat" padding="md">
                            <span className="text-xs text-[#615d59] font-medium uppercase">
                                Khuyến nghị đặt hàng
                            </span>
                            <p className="text-[22px] font-bold text-[#1aae39] mt-1">
                                +{forecast.recommendedReorderQty} cái
                            </p>
                        </Card>

                        <Card variant="flat" padding="md">
                            <span className="text-xs text-[#615d59] font-medium uppercase">
                                Mức độ rủi ro thiếu hàng
                            </span>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge
                                    variant={
                                        forecast.stockoutRiskScore === "CRITICAL"
                                            ? "danger"
                                            : forecast.stockoutRiskScore === "HIGH"
                                              ? "warning"
                                              : "success"
                                    }
                                    size="sm"
                                    dot
                                >
                                    {forecast.stockoutRiskScore === "CRITICAL"
                                        ? "RẤT CAO"
                                        : forecast.stockoutRiskScore === "HIGH"
                                          ? "CAO"
                                          : forecast.stockoutRiskScore === "MEDIUM"
                                            ? "TRUNG BÌNH"
                                            : "AN TOÀN"}
                                </Badge>
                            </div>
                        </Card>
                    </div>

                    <Card variant="flat" padding="md">
                        <CardHeader>
                            <CardTitle>Biến động bán hàng thực tế và Dự báo 15 ngày tới</CardTitle>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-0.5 bg-[#000000]" />
                                    <span>Doanh số thực tế</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-0.5 bg-[#0075de] border-dashed" />
                                    <span>Dự báo AI</span>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={forecast.chartData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="confidenceGrad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#0075de"
                                                stopOpacity={0.15}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#0075de"
                                                stopOpacity={0.02}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#a39e98"
                                        fontSize={11}
                                        tickLine={false}
                                    />
                                    <YAxis stroke="#a39e98" fontSize={11} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#ffffff",
                                            borderColor: "#e6e6e6",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="upperBound"
                                        stroke="transparent"
                                        fill="url(#confidenceGrad)"
                                        name="Ngưỡng trên tin cậy"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="historical"
                                        stroke="#000000"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        name="Thực tế"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="predicted"
                                        stroke="#0075de"
                                        strokeWidth={2.5}
                                        strokeDasharray="4 4"
                                        dot={{ r: 4 }}
                                        name="Dự báo AI"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card variant="flat" padding="lg" className="border-[#8a42d8]/30 bg-gradient-to-br from-white to-[#faf5ff]">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-[8px] bg-[#8a42d8]/15 text-[#8a42d8] flex items-center justify-center shrink-0 mt-0.5">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-[15px] font-bold text-[#000000]">
                                            Đề xuất thu mua từ AI
                                        </h4>
                                        <span className="text-[10px] font-mono bg-[#8a42d8]/15 text-[#8a42d8] px-1.5 py-0.5 rounded-[4px] font-bold">
                                            AI FORECAST
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-[#31302e] leading-relaxed mt-1.5 max-w-2xl">
                                        {forecast.reasoning}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => {
                                        navigate("/purchase-orders");
                                        toast.success(
                                            "Bắt đầu đặt hàng",
                                            `Tạo đơn nhập ${forecast.recommendedReorderQty} cái`,
                                        );
                                    }}
                                    leftIcon={<ShoppingCart className="w-4 h-4" />}
                                >
                                    Tạo đơn nhập hàng
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card variant="flat" padding="lg" className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#0075de]/10 text-[#0075de] flex items-center justify-center">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#000000]">
                                        Trợ lý Kho Thông Minh AI
                                    </h3>
                                    <p className="text-[11px] text-[#615d59]">
                                        Hỏi đáp trực tiếp và nhận tư vấn chiến lược lưu kho dựa trên mô hình AI
                                    </p>
                                </div>
                            </div>
                            <span className="text-[11px] text-[#1aae39] flex items-center gap-1 font-medium bg-[#e6f4ea] px-2 py-0.5 rounded-full">
                                <Zap className="w-3 h-3" /> Sẵn sàng
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {[
                                "Phân tích rủi ro tồn kho hiện tại",
                                "Gợi ý chiến lược tối ưu lượng vốn lưu kho",
                                "Đề xuất lịch nhập hàng hợp lý tuần này",
                            ].map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={isAsking}
                                    onClick={() => handleAskAssistant(suggestion)}
                                    className="text-xs bg-[#f6f5f4] hover:bg-[#edece9] text-[#31302e] px-2.5 py-1.5 rounded-[6px] transition-colors text-left flex items-center gap-1.5"
                                >
                                    <MessageSquare className="w-3 h-3 text-[#0075de]" />
                                    <span>{suggestion}</span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {chatMessages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-3 text-xs ${
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    }`}
                                >
                                    {msg.role === "ai" && (
                                        <div className="w-7 h-7 rounded-full bg-[#8a42d8]/15 text-[#8a42d8] flex items-center justify-center shrink-0">
                                            <Bot className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                    <div
                                        className={`p-3 rounded-[8px] max-w-xl leading-relaxed ${
                                            msg.role === "user"
                                                ? "bg-[#0075de] text-white"
                                                : "bg-[#f6f5f4] text-[#1f2937] border border-[#e6e6e6]"
                                        }`}
                                    >
                                        <p className="whitespace-pre-line">{msg.content}</p>
                                        <span
                                            className={`text-[10px] mt-1.5 block ${
                                                msg.role === "user"
                                                    ? "text-white/70 text-right"
                                                    : "text-[#8a8a8a]"
                                            }`}
                                        >
                                            {msg.timestamp}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {isAsking && (
                                <div className="flex items-center gap-2 text-xs text-[#7c3aed] py-2">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Mô hình AI đang xử lý câu trả lời...</span>
                                </div>
                            )}
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleAskAssistant();
                            }}
                            className="flex items-center gap-2 pt-2 border-t border-[#f0f0f0]"
                        >
                            <input
                                type="text"
                                placeholder="Đặt câu hỏi cho Trợ lý AI về kho vận, sản phẩm..."
                                value={assistantQuestion}
                                onChange={(e) => setAssistantQuestion(e.target.value)}
                                disabled={isAsking}
                                className="flex-1 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[6px] px-3 py-2 text-xs text-[#000000] focus:bg-white focus:border-[#0075de] focus:outline-none"
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={isAsking || !assistantQuestion.trim()}
                                leftIcon={<Send className="w-3.5 h-3.5" />}
                            >
                                Gửi
                            </Button>
                        </form>
                    </Card>
                </>
            )}
        </div>
    );
};
