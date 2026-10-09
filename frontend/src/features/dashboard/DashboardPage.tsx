import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Package,
    DollarSign,
    AlertTriangle,
    XCircle,
    Plus,
    ArrowRight,
    Sparkles,
    Sliders,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/States";
import { mockApi } from "@/services/mockApi";
import { formatCurrency, formatCompactCurrency, formatNumber, formatDate } from "@/utils/formatters";

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();

    const { data: products = [], isLoading: isLoadingProducts } = useQuery({
        queryKey: ["products"],
        queryFn: mockApi.getProducts,
    });

    const { data: transactions = [], isLoading: isLoadingTx } = useQuery({
        queryKey: ["transactions"],
        queryFn: mockApi.getTransactions,
    });

    if (isLoadingProducts || isLoadingTx) {
        return <LoadingState message="Đang tải dữ liệu tổng quan..." />;
    }

    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
    const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const outOfStockProducts = products.filter((p) => p.stock === 0);

    const now = new Date();
    const dayLabels = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    const movementData = [6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
        const targetDate = new Date();
        targetDate.setDate(now.getDate() - daysAgo);
        const dayKey = targetDate.toDateString();
        const label = dayLabels[targetDate.getDay()];

        const dayTx = transactions.filter((t: any) => {
            const txDate = new Date(t.createdAt || t.timestamp || 0);
            return txDate.toDateString() === dayKey;
        });

        const inbound = dayTx
            .filter((t: any) => t.type === "INBOUND")
            .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);
        const outbound = dayTx
            .filter((t: any) => t.type === "OUTBOUND")
            .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);

        return {
            day: label,
            inbound,
            outbound,
        };
    });

    const valueTrendData = [5, 4, 3, 2, 1, 0].map((monthsAgo) => {
        const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
        const monthLabel = `T${d.getMonth() + 1}`;
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);

        const netChange = transactions
            .filter((t: any) => {
                const txDate = new Date(t.createdAt || t.timestamp || 0);
                return txDate >= d && txDate < nextMonth;
            })
            .reduce((sum: number, t: any) => {
                const qty = t.quantity || 0;
                return t.type === "INBOUND" ? sum + qty : t.type === "OUTBOUND" ? sum - qty : sum;
            }, 0);

        const factor = Math.max(0.5, 1 - monthsAgo * 0.04 + (netChange > 0 ? 0.02 : -0.02));
        return {
            month: monthLabel,
            value: Math.round(totalInventoryValue * factor),
        };
    });

    const categoryMap: Record<string, { value: number; stock: number }> = {};
    products.forEach((p) => {
        const catName = (p.category || "Chưa phân loại").trim();
        if (!categoryMap[catName]) {
            categoryMap[catName] = { value: 0, stock: 0 };
        }
        categoryMap[catName].value += p.stock * p.costPrice;
        categoryMap[catName].stock += p.stock;
    });

    const totalCatValue = Object.values(categoryMap).reduce((sum, it) => sum + it.value, 0);

    const categoryChartData = Object.entries(categoryMap)
        .map(([name, data]) => {
            const percentage = totalCatValue > 0 ? (data.value / totalCatValue) * 100 : 0;
            return {
                name,
                value: Math.round(data.value),
                stock: data.stock,
                percentage: Number(percentage.toFixed(1)),
            };
        })
        .sort((a, b) => b.value - a.value);

    const CATEGORY_COLORS = [
        "#0075de",
        "#2a9d99",
        "#dd5b00",
        "#7c3aed",
        "#ec4899",
        "#10b981",
        "#f59e0b",
        "#6366f1",
        "#14b8a6",
        "#8b5cf6",
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-[22px] font-bold text-[#000000] tracking-tight">
                    Tổng Quan Kho
                </h1>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="utility"
                        size="sm"
                        onClick={() => navigate("/inventory/adjustments")}
                        leftIcon={<Sliders className="w-3.5 h-3.5 text-[#615d59]" />}
                    >
                        Điều Chỉnh
                    </Button>
                    <Button
                        variant="utility"
                        size="sm"
                        onClick={() => navigate("/purchase-orders")}
                        leftIcon={<ShoppingBag className="w-3.5 h-3.5 text-[#615d59]" />}
                    >
                        Tạo Đơn Nhập
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate("/products/new")}
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Thêm Sản Phẩm
                    </Button>
                </div>
            </div>

            {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
                <div className="p-3 bg-white border border-[#dd5b00]/30 rounded-[8px] shadow-notion-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-[#dd5b00] shrink-0" />
                        <span className="text-[13px] text-[#000000]">
                            Có <strong>{lowStockProducts.length} sản phẩm sắp hết</strong> và{" "}
                            <strong>{outOfStockProducts.length} sản phẩm hết hàng</strong>.
                        </span>
                    </div>
                    <Button
                        variant="utility"
                        size="xs"
                        onClick={() => navigate("/inventory")}
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                    >
                        Xem Ngay
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#615d59]">Tổng Sản Phẩm</span>
                        <Package className="w-4 h-4 text-[#615d59]" />
                    </div>
                    <div className="text-[24px] font-bold text-[#000000] tracking-tight">
                        {formatNumber(totalProducts)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#1aae39] mt-1 font-medium">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>+12% so với tháng trước</span>
                    </div>
                </Card>

                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#615d59]">Giá Trị Tồn Kho</span>
                        <DollarSign className="w-4 h-4 text-[#0075de]" />
                    </div>
                    <div
                        className="text-[20px] sm:text-[22px] font-bold text-[#000000] tracking-tight truncate"
                        title={formatCurrency(totalInventoryValue)}
                    >
                        {formatCompactCurrency(totalInventoryValue)}
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[11px] text-[#1aae39] mt-1 font-medium">
                        <div className="flex items-center gap-1 shrink-0">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>+8.4%</span>
                        </div>
                        <span className="text-[#615d59] font-normal truncate text-[10px]" title={formatCurrency(totalInventoryValue)}>
                            {formatCurrency(totalInventoryValue)}
                        </span>
                    </div>
                </Card>

                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#615d59]">Sắp Hết Hàng</span>
                        <AlertTriangle className="w-4 h-4 text-[#dd5b00]" />
                    </div>
                    <div className="text-[24px] font-bold text-[#dd5b00] tracking-tight">
                        {lowStockProducts.length}
                    </div>
                    <span className="text-[11px] text-[#dd5b00] mt-1 block">Cần đặt thêm</span>
                </Card>

                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#615d59]">Hết Hàng</span>
                        <XCircle className="w-4 h-4 text-[#eb5757]" />
                    </div>
                    <div className="text-[24px] font-bold text-[#eb5757] tracking-tight">
                        {outOfStockProducts.length}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#eb5757] mt-1 font-medium">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>0 sản phẩm có sẵn</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card variant="flat" padding="md" className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Biến Động Giá Trị Kho</CardTitle>
                        <Badge variant="primary" size="xs">
                            Thời gian thực
                        </Badge>
                    </CardHeader>
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={valueTrendData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0075de" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#0075de" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="month"
                                    stroke="#a39e98"
                                    fontSize={11}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#a39e98"
                                    fontSize={11}
                                    tickLine={false}
                                    tickFormatter={(val) => {
                                        if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}tỷ`;
                                        if (val >= 1_000_000) return `${Math.round(val / 1_000_000)}tr`;
                                        return String(val);
                                    }}
                                />
                                <Tooltip
                                    formatter={(val: any) => [
                                        formatCurrency(Number(val)),
                                        "Giá trị",
                                    ]}
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderColor: "#e6e6e6",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#0075de"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#valGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card variant="flat" padding="md">
                    <div className="flex items-center justify-between mb-2">
                        <CardTitle>Cơ Cấu Danh Mục</CardTitle>
                        <span className="text-[11px] text-[#615d59] font-medium">
                            {categoryChartData.length} nhóm hàng
                        </span>
                    </div>
                    <div className="h-48 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {categoryChartData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(val: any, _: any, item: any) => [
                                        `${formatCurrency(Number(val))} - ${item.payload.percentage}%`,
                                        item.payload.name,
                                    ]}
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderColor: "#e6e6e6",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 mt-2 text-xs max-h-44 overflow-y-auto pr-1">
                        {categoryChartData.slice(0, 5).map((item, idx) => (
                            <div
                                key={item.name}
                                className="flex items-center justify-between text-[#615d59] py-0.5 hover:bg-[#f7f6f3] px-1 rounded transition-colors"
                            >
                                <div className="flex items-center gap-1.5 truncate max-w-[55%]">
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{
                                            backgroundColor:
                                                CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                                        }}
                                    />
                                    <span className="truncate font-medium text-[#000000]" title={item.name}>
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] text-[#615d59] font-medium">
                                        {item.percentage}%
                                    </span>
                                    <span className="font-semibold text-[#000000]">
                                        {formatCurrency(item.value)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card variant="flat" padding="md">
                    <CardHeader>
                        <CardTitle>Xuất Nhập Trong Tuần</CardTitle>
                    </CardHeader>
                    <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={movementData}
                                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                            >
                                <XAxis
                                    dataKey="day"
                                    stroke="#a39e98"
                                    fontSize={11}
                                    tickLine={false}
                                />
                                <YAxis stroke="#a39e98" fontSize={11} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderColor: "#e6e6e6",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                    }}
                                />
                                <Bar
                                    dataKey="inbound"
                                    fill="#1aae39"
                                    name="Nhập"
                                    radius={[3, 3, 0, 0]}
                                />
                                <Bar
                                    dataKey="outbound"
                                    fill="#0075de"
                                    name="Xuất"
                                    radius={[3, 3, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[#615d59]">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm bg-[#1aae39]" />
                            <span>Nhập kho</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm bg-[#0075de]" />
                            <span>Xuất kho</span>
                        </div>
                    </div>
                </Card>

                <Card variant="flat" padding="md" className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Giao Dịch Gần Đây</CardTitle>
                        <Link
                            to="/inventory/transactions"
                            className="text-xs text-[#0075de] hover:underline font-medium flex items-center gap-1"
                        >
                            Xem tất cả
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-[#e6e6e6] text-[#615d59] text-[11px] font-semibold uppercase">
                                    <th className="pb-2">Loại</th>
                                    <th className="pb-2">Sản phẩm</th>
                                    <th className="pb-2">Số lượng</th>
                                    <th className="pb-2">Mã đơn</th>
                                    <th className="pb-2">Người tạo</th>
                                    <th className="pb-2">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e6e6e6]">
                                {transactions.slice(0, 5).map((tx) => (
                                    <tr key={tx.id} className="hover:bg-[#f6f5f4]">
                                        <td className="py-2.5">
                                            <Badge
                                                variant={
                                                    tx.type === "INBOUND"
                                                        ? "success"
                                                        : tx.type === "OUTBOUND"
                                                          ? "primary"
                                                          : tx.type === "DAMAGE"
                                                            ? "danger"
                                                            : tx.type === "ADJUSTMENT"
                                                              ? "warning"
                                                              : "teal"
                                                }
                                                size="xs"
                                            >
                                                {tx.type === "INBOUND"
                                                    ? "Nhập"
                                                    : tx.type === "OUTBOUND"
                                                      ? "Xuất"
                                                      : tx.type === "DAMAGE"
                                                        ? "Hỏng"
                                                        : tx.type === "ADJUSTMENT"
                                                          ? "Cân đối"
                                                          : "Chuyển kho"}
                                            </Badge>
                                        </td>
                                        <td className="py-2.5 font-medium text-[#000000] max-w-[180px] truncate">
                                            {tx.productName}
                                        </td>
                                        <td className="py-2.5 font-semibold">
                                            <span
                                                className={
                                                    tx.quantity > 0
                                                        ? "text-[#1aae39]"
                                                        : "text-[#eb5757]"
                                                }
                                            >
                                                {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-[#615d59] font-mono text-xs">
                                            {tx.reference}
                                        </td>
                                        <td className="py-2.5 text-[#615d59]">{tx.user}</td>
                                        <td className="py-2.5 text-[#a39e98] text-xs">
                                            {formatDate(tx.date)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
