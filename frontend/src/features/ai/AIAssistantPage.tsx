import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Sparkles,
    Send,
    Bot,
    User as UserIcon,
    RefreshCw,
    TrendingUp,
    Copy,
    Check,
    MessageSquare,
    Plus,
    Trash2,
    PanelLeft,
    Clock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { mockApi } from "@/services/mockApi";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";
import { useNavigate } from "react-router-dom";
import type { AIChatSessionSummary } from "@/services/api";

interface MessageItem {
    id: string;
    sender: "assistant" | "user";
    timestamp: string;
    text: string;
    suggestions?: string[];
}

const DEFAULT_MESSAGE: MessageItem = {
    id: "initial-msg",
    sender: "assistant",
    timestamp: "Vừa xong",
    text: "Xin chào! Tôi có thể hỗ trợ gì về kho hàng cho bạn hôm nay?",
    suggestions: [
        "Hàng sắp hết",
        "Giá trị tồn kho",
        "Sản phẩm bán chạy",
        "Công nợ nhà cung cấp",
    ],
};

export const AIAssistantPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentTitle, setCurrentTitle] = useState<string>("Đoạn chat mới");
    const [messages, setMessages] = useState<MessageItem[]>([DEFAULT_MESSAGE]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const chatBottomRef = useRef<HTMLDivElement>(null);

    const { data: snapshot } = useQuery({
        queryKey: ["ai-warehouse-snapshot"],
        queryFn: () => mockApi.getWarehouseSnapshot(),
    });

    const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
        queryKey: ["ai-chat-sessions"],
        queryFn: () => mockApi.getChatSessions(),
    });

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSelectSession = async (session: AIChatSessionSummary) => {
        if (session.id === currentSessionId) return;
        try {
            setCurrentSessionId(session.id);
            setCurrentTitle(session.title);
            const detail = await mockApi.getChatSessionById(session.id);
            if (detail.messages && detail.messages.length > 0) {
                setMessages(detail.messages);
            } else {
                setMessages([DEFAULT_MESSAGE]);
            }
        } catch (error) {
            toast.error("Lỗi", "Không thể tải nội dung đoạn chat");
        }
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setCurrentTitle("Đoạn chat mới");
        setMessages([DEFAULT_MESSAGE]);
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await mockApi.deleteChatSession(id);
            queryClient.invalidateQueries({ queryKey: ["ai-chat-sessions"] });
            toast.success("Thành công", "Đã xóa đoạn chat");
            if (currentSessionId === id) {
                handleNewChat();
            }
        } catch (error) {
            toast.error("Lỗi", "Không thể xóa đoạn chat");
        }
    };

    const handleSend = async (textToSend?: string) => {
        const text = (textToSend || inputValue).trim();
        if (!text || isTyping) return;

        const nowVN = new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const userMsg: MessageItem = {
            id: `usr-${Date.now()}`,
            sender: "user",
            timestamp: nowVN,
            text,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            const targetSessionId = currentSessionId || "new";
            const res = await mockApi.sendMessageToChatSession(targetSessionId, text);

            if (!currentSessionId && res.sessionId) {
                setCurrentSessionId(res.sessionId);
                setCurrentTitle(res.title || "Đoạn chat");
            } else if (res.title) {
                setCurrentTitle(res.title);
            }

            const aiMsg: MessageItem = {
                id: `ai-${Date.now()}`,
                sender: "assistant",
                timestamp: nowVN,
                text: res.reply,
                suggestions: res.suggestions,
            };

            setMessages((prev) => [...prev, aiMsg]);
            queryClient.invalidateQueries({ queryKey: ["ai-chat-sessions"] });
        } catch (error: any) {
            const detailMsg =
                error.response?.data?.thongDiep ||
                error.message ||
                "Lỗi kết nối";
            toast.error("Lỗi AI", detailMsg);
            const errorMsg: MessageItem = {
                id: `err-${Date.now()}`,
                sender: "assistant",
                timestamp: nowVN,
                text: "Không thể kết nối với máy chủ AI. Vui lòng thử lại sau.",
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Đã sao chép", "Đã lưu vào bộ nhớ tạm");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const activeSuggestions =
        messages[messages.length - 1]?.suggestions || [
            "Hàng sắp hết",
            "Giá trị tồn kho",
            "Sản phẩm bán chạy",
            "Công nợ nhà cung cấp",
        ];

    return (
        <div className="flex h-[calc(100vh-6.5rem)] gap-3 max-w-7xl mx-auto select-none">
            <div
                className={`${
                    showSidebar ? "w-64 sm:w-72" : "w-0 hidden"
                } transition-all duration-200 shrink-0 bg-white border border-[#e6e6e6] rounded-[10px] flex flex-col overflow-hidden shadow-sm`}
            >
                <div className="p-3 border-b border-[#e6e6e6] flex items-center justify-between gap-2">
                    <Button
                        variant="primary"
                        size="xs"
                        className="flex-1 justify-center"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        onClick={handleNewChat}
                    >
                        Đoạn chat mới
                    </Button>
                    <button
                        type="button"
                        onClick={() => setShowSidebar(false)}
                        className="p-1.5 text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4] rounded-[6px]"
                        title="Thu gọn lịch sử"
                    >
                        <PanelLeft className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <p className="px-2 py-1 text-[11px] font-semibold text-[#a39e98] uppercase tracking-wider">
                        Lịch sử hội thoại
                    </p>

                    {sessionsLoading && (
                        <div className="p-4 text-center text-xs text-[#a39e98]">
                            Đang tải lịch sử...
                        </div>
                    )}

                    {!sessionsLoading && sessions.length === 0 && (
                        <div className="p-4 text-center text-xs text-[#a39e98] space-y-1">
                            <MessageSquare className="w-6 h-6 mx-auto text-[#d4d4d4]" />
                            <p>Chưa có phiên trò chuyện nào</p>
                        </div>
                    )}

                    {sessions.map((s) => {
                        const isActive = s.id === currentSessionId;
                        return (
                            <div
                                key={s.id}
                                onClick={() => handleSelectSession(s)}
                                className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-[8px] text-xs cursor-pointer transition-colors ${
                                    isActive
                                        ? "bg-[#eef5fc] text-[#0075de] font-semibold"
                                        : "text-[#31302e] hover:bg-[#f6f5f4]"
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <MessageSquare
                                        className={`w-3.5 h-3.5 shrink-0 ${
                                            isActive ? "text-[#0075de]" : "text-[#a39e98]"
                                        }`}
                                    />
                                    <span className="truncate flex-1">{s.title || "Đoạn chat"}</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => handleDeleteSession(e, s.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#a39e98] hover:text-[#dc2626] rounded-[4px]"
                                    title="Xóa đoạn chat"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 space-y-3">
                <div className="flex items-center justify-between gap-3 shrink-0 pb-2 border-b border-[#e6e6e6]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {!showSidebar && (
                            <button
                                type="button"
                                onClick={() => setShowSidebar(true)}
                                className="p-1.5 text-[#615d59] hover:text-[#000000] hover:bg-white border border-[#e6e6e6] rounded-[6px] shadow-sm"
                                title="Mở lịch sử chat"
                            >
                                <PanelLeft className="w-4 h-4" />
                            </button>
                        )}
                        <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#8a42d8] to-[#c084fc] text-white flex items-center justify-center shadow-sm shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-[17px] font-bold text-[#000000] tracking-tight truncate">
                                {currentTitle}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="utility"
                            size="xs"
                            onClick={() => navigate("/ai-forecast")}
                            leftIcon={<TrendingUp className="w-3.5 h-3.5 text-[#0075de]" />}
                        >
                            Dự báo
                        </Button>
                        <Button
                            variant="utility"
                            size="xs"
                            onClick={handleNewChat}
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                            Đoạn chat mới
                        </Button>
                    </div>
                </div>

                {snapshot && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                        <div className="px-3 py-2 bg-white border border-[#e6e6e6] rounded-[8px] flex items-center justify-between shadow-sm">
                            <span className="text-xs text-[#615d59]">Hết hàng</span>
                            <span className="text-sm font-bold text-[#dc2626]">
                                {snapshot.outOfStockCount}
                            </span>
                        </div>

                        <div className="px-3 py-2 bg-white border border-[#e6e6e6] rounded-[8px] flex items-center justify-between shadow-sm">
                            <span className="text-xs text-[#615d59]">Sắp hết</span>
                            <span className="text-sm font-bold text-[#f59e0b]">
                                {snapshot.lowStockCount}
                            </span>
                        </div>

                        <div className="px-3 py-2 bg-white border border-[#e6e6e6] rounded-[8px] flex items-center justify-between shadow-sm">
                            <span className="text-xs text-[#615d59]">Tồn kho</span>
                            <span className="text-sm font-bold text-[#0075de]">
                                {formatCurrency(snapshot.totalValuation)}
                            </span>
                        </div>

                        <div className="px-3 py-2 bg-white border border-[#e6e6e6] rounded-[8px] flex items-center justify-between shadow-sm">
                            <span className="text-xs text-[#615d59]">Công nợ</span>
                            <span className="text-sm font-bold text-[#6366f1]">
                                {formatCurrency(snapshot.unpaidSupplierDebt)}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 shrink-0">
                    {activeSuggestions.map((q, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSend(q)}
                            disabled={isTyping}
                            className="px-2.5 py-1 text-xs text-[#31302e] bg-white hover:bg-[#f6f5f4] hover:text-[#0075de] border border-[#e6e6e6] rounded-full whitespace-nowrap shadow-sm transition-colors cursor-pointer"
                        >
                            {q}
                        </button>
                    ))}
                </div>

                <Card
                    variant="flat"
                    padding="md"
                    className="flex-1 overflow-y-auto space-y-4 bg-white shadow-sm border border-[#e6e6e6] rounded-[10px]"
                >
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex items-start gap-3 ${
                                m.sender === "user" ? "justify-end" : "justify-start"
                            }`}
                        >
                            {m.sender === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8a42d8] to-[#c084fc] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                    <Bot className="w-4 h-4" />
                                </div>
                            )}

                            <div
                                className={`max-w-2xl group relative space-y-2 ${
                                    m.sender === "user"
                                        ? "bg-[#0075de] text-white p-3 rounded-[12px] shadow-sm text-sm"
                                        : "bg-[#f8f9fa] text-[#1f2937] p-3.5 rounded-[12px] border border-[#e6e6e6] shadow-sm text-sm"
                                }`}
                            >
                                <div className="leading-relaxed whitespace-pre-line font-normal">
                                    {m.text}
                                </div>

                                <div
                                    className={`flex items-center justify-between text-[10px] pt-1 ${
                                        m.sender === "user" ? "text-white/80" : "text-[#9ca3af]"
                                    }`}
                                >
                                    <span>{m.timestamp}</span>
                                    {m.sender === "assistant" && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(m.id, m.text)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#615d59] hover:text-[#000000]"
                                            title="Sao chép"
                                        >
                                            {copiedId === m.id ? (
                                                <Check className="w-3 h-3 text-[#10b981]" />
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {m.sender === "user" && (
                                <div className="w-8 h-8 rounded-full bg-[#0075de] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-sm">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex items-start gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8a42d8] to-[#c084fc] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-[#f8f9fa] text-[#615d59] px-3 py-2 rounded-[12px] border border-[#e6e6e6] text-xs flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8a42d8] animate-bounce" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8a42d8] animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8a42d8] animate-bounce [animation-delay:0.4s]" />
                                </div>
                                <span>Đang trả lời...</span>
                            </div>
                        </div>
                    )}

                    <div ref={chatBottomRef} />
                </Card>

                <div className="p-2.5 bg-white border border-[#e6e6e6] rounded-[10px] shadow-sm flex items-center gap-2 shrink-0">
                    <input
                        type="text"
                        placeholder="Nhập câu hỏi..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={isTyping}
                        className="flex-1 text-sm bg-transparent border-none outline-none text-[#000000] placeholder-[#a39e98] px-1"
                    />

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSend()}
                        disabled={!inputValue.trim() || isTyping}
                        leftIcon={<Send className="w-4 h-4" />}
                    >
                        Gửi
                    </Button>
                </div>
            </div>
        </div>
    );
};
