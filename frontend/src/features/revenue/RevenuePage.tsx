import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    ShoppingBag,
    ArrowUpRight,
    PieChart as PieIcon,
    Download,
    Coins,
    Percent,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { mockApi } from "@/services/mockApi";
import { LoadingState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { Pagination } from "@/components/data-table/Pagination";

export const RevenuePage: React.FC = () => {
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "year">("30d");

    const { data: analyticsData, isLoading } = useQuery({
        queryKey: ["revenue-analytics", timeRange],
        queryFn: () => mockApi.getRevenueAnalytics(timeRange),
    });

    const metrics = analyticsData?.metrics || {
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        profitMargin: 0,
        orderCount: 0,
        aov: 0,
        successRate: 100,
    };

    const revenueTimeline = analyticsData?.revenueTimeline || [];
    const categoryRevenue = analyticsData?.categoryRevenue || [];
    const topSellingProducts = analyticsData?.topSellingProducts || [];
    const paymentDistribution = analyticsData?.paymentDistribution || [];

    const [topProductPage, setTopProductPage] = useState(1);
    const [topProductPageSize, setTopProductPageSize] = useState(5);

    const totalTopProductPages = Math.ceil(topSellingProducts.length / topProductPageSize);
    const paginatedTopProducts = topSellingProducts.slice(
        (topProductPage - 1) * topProductPageSize,
        topProductPage * topProductPageSize,
    );

    const timelineExportColumns = [
        { header: "Thời gian", key: "date" },
        { header: "Doanh thu", key: "revenue", format: (v: number) => formatCurrency(v) },
        { header: "Số đơn hàng", key: "orders" },
    ];

    const topProductExportColumns = [
        { header: "Tên sản phẩm", key: "name" },
        { header: "Mã SKU", key: "sku" },
        { header: "Số lượng bán", key: "qty" },
        { header: "Tổng doanh thu", key: "revenue", format: (v: number) => formatCurrency(v) },
    ];

    if (isLoading) {
        return <LoadingState message="Đang tải dữ liệu phân tích doanh thu..." />;
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#000000]">
                        Báo cáo doanh thu
                    </h1>
                    <p className="text-xs text-[#615d59]">
                        Phân tích dòng tiền bán hàng, lợi nhuận gộp và cơ cấu thanh toán theo thời gian thực
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportButtons
                        filename={`bao-cao-doanh-thu-${timeRange}`}
                        title="Báo cáo doanh thu theo mốc thời gian"
                        columns={timelineExportColumns}
                        data={revenueTimeline}
                    />

                    <div className="flex items-center gap-1 bg-white border border-[#e6e6e6] p-1 rounded-[6px]">
                        {[
                            { id: "7d", label: "7 ngày" },
                            { id: "30d", label: "30 ngày" },
                            { id: "year", label: "Năm nay" },
                        ].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTimeRange(t.id as any)}
                                className={`px-3 py-1 text-xs font-semibold rounded-[4px] transition-colors ${
                                    timeRange === t.id
                                        ? "bg-[#0075de] text-white"
                                        : "text-[#615d59] hover:text-[#000000]"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between text-[#615d59] text-xs font-semibold">
                        <span>Tổng doanh thu</span>
                        <DollarSign className="w-4 h-4 text-[#1aae39]" />
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">
                        {formatCurrency(metrics.totalRevenue)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#1aae39] font-semibold mt-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Dòng tiền bán lẻ ổn định</span>
                    </div>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between text-[#615d59] text-xs font-semibold">
                        <span>Lợi nhuận gộp ước tính</span>
                        <Coins className="w-4 h-4 text-[#7c3aed]" />
                    </div>
                    <div className="text-xl font-bold text-[#7c3aed] mt-2">
                        {formatCurrency(metrics.grossProfit || Math.round(metrics.totalRevenue * 0.35))}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#7c3aed] font-semibold mt-1">
                        <span>Biên lợi nhuận gộp: {metrics.profitMargin || 35}%</span>
                    </div>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between text-[#615d59] text-xs font-semibold">
                        <span>Số đơn đã hoàn tất</span>
                        <ShoppingBag className="w-4 h-4 text-[#0075de]" />
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">
                        {metrics.orderCount} đơn
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#0075de] font-semibold mt-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Kênh bán hàng hoạt động tốt</span>
                    </div>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between text-[#615d59] text-xs font-semibold">
                        <span>Giá trị trung bình đơn</span>
                        <CreditCard className="w-4 h-4 text-[#dd5b00]" />
                    </div>
                    <div className="text-xl font-bold text-[#000000] mt-2">
                        {formatCurrency(metrics.aov)}
                    </div>
                    <div className="text-[11px] text-[#615d59] mt-1">
                        Trung bình trên mỗi giao dịch
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {paymentDistribution.map((item: any) => (
                    <div
                        key={item.key}
                        className="p-3.5 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between"
                    >
                        <div>
                            <span className="text-[11px] font-semibold text-[#615d59] block">
                                {item.name}
                            </span>
                            <span className="text-base font-bold text-[#000000] block mt-1">
                                {formatCurrency(item.value)}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-[#0075de] block">
                                {item.count} giao dịch
                            </span>
                            <span className="text-[10px] text-[#a39e98] block">
                                {metrics.totalRevenue > 0
                                    ? Math.round((item.value / metrics.totalRevenue) * 100)
                                    : 0}% doanh số
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 p-5 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
                    <div>
                        <h2 className="text-sm font-bold text-[#000000]">
                            Biến động doanh thu theo thời gian
                        </h2>
                        <p className="text-[11px] text-[#615d59]">
                            Dữ liệu thực tế từ các đơn bán hàng trong cơ sở dữ liệu
                        </p>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTimeline}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0075de" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0075de" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e6e6e6"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="#615d59"
                                    fontSize={11}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#615d59"
                                    fontSize={11}
                                    tickLine={false}
                                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                                />
                                <Tooltip
                                    formatter={(value: any) => [
                                        `${Number(value).toLocaleString("vi-VN")} ₫`,
                                        "Doanh thu",
                                    ]}
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "6px",
                                        borderColor: "#e6e6e6",
                                        fontSize: "12px",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#0075de"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#revenueGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-4 p-5 rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
                    <div>
                        <h2 className="text-sm font-bold text-[#000000]">
                            Doanh thu theo danh mục
                        </h2>
                        <p className="text-[11px] text-[#615d59]">Cơ cấu nguồn thu theo nhóm sản phẩm</p>
                    </div>

                    <div className="h-64 w-full">
                        {categoryRevenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={categoryRevenue}
                                    layout="vertical"
                                    margin={{ top: 5, right: 15, left: -10, bottom: 5 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e6e6e6"
                                        horizontal={false}
                                    />
                                    <XAxis
                                        type="number"
                                        stroke="#615d59"
                                        fontSize={10}
                                        tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="#615d59"
                                        fontSize={11}
                                        width={130}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => {
                                            const total = categoryRevenue.reduce(
                                                (s: number, it: any) => s + (it.value || 0),
                                                0,
                                            );
                                            const pct =
                                                total > 0
                                                    ? ((Number(value) / total) * 100).toFixed(1)
                                                    : "0";
                                            return [
                                                `${Number(value).toLocaleString("vi-VN")} ₫ - ${pct}%`,
                                                "Doanh thu",
                                            ];
                                        }}
                                        contentStyle={{
                                            backgroundColor: "#ffffff",
                                            borderRadius: "6px",
                                            borderColor: "#e6e6e6",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Bar dataKey="value" fill="#213183" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-[#615d59]">
                                Chưa có dữ liệu đơn hàng theo danh mục
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-[8px] bg-white border border-[#e6e6e6] shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-bold text-[#000000]">
                            Sản phẩm đóng góp doanh thu cao nhất
                        </h2>
                        <p className="text-[11px] text-[#615d59]">
                            Xếp hạng các mặt hàng bán chạy và tạo ra nguồn thu lớn nhất
                        </p>
                    </div>

                    <ExportButtons
                        filename="top-san-pham-doanh-thu"
                        title="Sản phẩm đóng góp doanh thu cao nhất"
                        columns={topProductExportColumns}
                        data={topSellingProducts}
                        size="xs"
                    />
                </div>

                <div className="overflow-x-auto">
                    {topSellingProducts.length > 0 ? (
                        <>
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-[#e6e6e6] bg-[#f6f5f4] text-[#615d59] font-semibold">
                                        <th className="py-2.5 px-4">Tên sản phẩm</th>
                                        <th className="py-2.5 px-4">Mã SKU</th>
                                        <th className="py-2.5 px-4 text-center">Số lượng bán</th>
                                        <th className="py-2.5 px-4 text-right">Tổng doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e6e6e6]">
                                    {paginatedTopProducts.map((p: any, idx: number) => {
                                        const globalIndex = (topProductPage - 1) * topProductPageSize + idx + 1;
                                        return (
                                            <tr key={p.sku} className="hover:bg-[#f6f5f4]/60 transition-colors">
                                                <td className="py-3 px-4 font-semibold text-[#000000]">
                                                    <span className="text-[#a39e98] mr-2">#{globalIndex}</span>
                                                    <span>{p.name}</span>
                                                </td>
                                                <td className="py-3 px-4 font-mono text-[#615d59]">{p.sku}</td>
                                                <td className="py-3 px-4 text-center font-bold text-[#000000]">
                                                    {p.qty}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-[#0075de]">
                                                    {formatCurrency(p.revenue)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <Pagination
                                currentPage={topProductPage}
                                totalPages={totalTopProductPages}
                                totalItems={topSellingProducts.length}
                                pageSize={topProductPageSize}
                                onPageChange={setTopProductPage}
                                onPageSizeChange={(size) => {
                                    setTopProductPageSize(size);
                                    setTopProductPage(1);
                                }}
                            />
                        </>
                    ) : (
                        <div className="py-8 text-center text-xs text-[#615d59]">
                            Chưa có sản phẩm nào phát sinh đơn hàng bán ra
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
