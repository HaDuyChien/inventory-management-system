import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, PackageCheck, AlertTriangle } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/data-table/Pagination";
import { ExportButtons, ExportColumn } from "@/components/ui/ExportButtons";
import { LoadingState } from "@/components/ui/States";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "@/stores/useToastStore";
import { mockApi } from "@/services/mockApi";

export const ReportsPage: React.FC = () => {
    const [dateRange, setDateRange] = useState("30d");

    const { data: inventoryData, isLoading } = useQuery({
        queryKey: ["inventory-analytics", dateRange],
        queryFn: () => mockApi.getInventoryAnalytics(dateRange),
    });

    const metrics = inventoryData?.metrics || {
        totalStock: 0,
        totalValuation: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalInbound: 0,
        totalOutbound: 0,
    };

    const turnoverData = inventoryData?.turnoverData || [];
    const movementData = inventoryData?.movementData || [];
    const topSelling = inventoryData?.topSelling || [];
    const slowMoving = inventoryData?.slowMoving || [];

    const [topSellingPage, setTopSellingPage] = useState(1);
    const topSellingPageSize = 5;
    const paginatedTopSelling = topSelling.slice(
        (topSellingPage - 1) * topSellingPageSize,
        topSellingPage * topSellingPageSize
    );

    const [slowMovingPage, setSlowMovingPage] = useState(1);
    const slowMovingPageSize = 5;
    const paginatedSlowMoving = slowMoving.slice(
        (slowMovingPage - 1) * slowMovingPageSize,
        slowMovingPage * slowMovingPageSize
    );

    const reportExportData = [
        ...topSelling.map((it: any) => ({
            type: "Bán chạy nhất",
            name: it.name,
            quantity: it.unitsSold,
            value: it.revenue,
            stock: it.stock,
        })),
        ...slowMoving.map((it: any) => ({
            type: "Chậm luân chuyển",
            name: it.name,
            quantity: it.idleUnits,
            value: it.capitalTied,
            stock: it.idleUnits,
        })),
    ];

    const reportExportColumns: ExportColumn[] = [
        { header: "Phân loại", key: "type" },
        { header: "Tên sản phẩm", key: "name" },
        { header: "Số lượng", key: "quantity" },
        {
            header: "Giá trị",
            key: "value",
            format: (val: any) => formatCurrency(Number(val) || 0),
        },
        { header: "Tồn kho", key: "stock" },
    ];

    if (isLoading) {
        return <LoadingState message="Đang tải dữ liệu phân tích kho..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                    Báo cáo và Phân tích kho
                </h1>

                <div className="flex items-center gap-2">
                    <div className="inline-flex p-1 bg-white border border-[#e6e6e6] rounded-[8px] text-xs">
                        {[
                            { id: "7d", label: "7 ngày" },
                            { id: "30d", label: "30 ngày" },
                            { id: "90d", label: "Quý" },
                            { id: "ytd", label: "Năm" },
                        ].map((rng) => (
                            <button
                                key={rng.id}
                                type="button"
                                onClick={() => setDateRange(rng.id)}
                                className={`px-3 py-1 rounded-[5px] font-medium transition-all ${
                                    dateRange === rng.id
                                        ? "bg-[#0075de] text-white"
                                        : "text-[#615d59] hover:text-[#000000]"
                                }`}
                            >
                                {rng.label}
                            </button>
                        ))}
                    </div>

                    <ExportButtons
                        columns={reportExportColumns}
                        data={reportExportData}
                        filename="bao-cao-phan-tich-kho"
                        title="Báo cáo và phân tích kho hàng"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card variant="flat" padding="md">
                    <span className="text-xs text-[#615d59] uppercase font-semibold">
                        Tổng vốn lưu kho
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-[22px] font-bold text-[#000000]">
                            {formatCurrency(metrics.totalValuation)}
                        </span>
                    </div>
                    <span className="text-[11px] text-[#615d59] mt-1 block">
                        Định giá theo giá vốn
                    </span>
                </Card>

                <Card variant="flat" padding="md">
                    <span className="text-xs text-[#615d59] uppercase font-semibold">
                        Tổng lượng hàng tồn
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-[22px] font-bold text-[#0075de]">
                            {metrics.totalStock.toLocaleString("vi-VN")} cái
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#1aae39] font-medium mt-1">
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Sẵn sàng cung ứng</span>
                    </div>
                </Card>

                <Card variant="flat" padding="md">
                    <span className="text-xs text-[#615d59] uppercase font-semibold">
                        Cảnh báo sắp hết hàng
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-[22px] font-bold text-[#dd5b00]">
                            {metrics.lowStockCount} sản phẩm
                        </span>
                    </div>
                    <span className="text-[11px] text-[#dd5b00] font-medium mt-1 block">
                        Dưới ngưỡng tồn tối thiểu
                    </span>
                </Card>

                <Card variant="flat" padding="md">
                    <span className="text-xs text-[#615d59] uppercase font-semibold">
                        Sản phẩm đã hết hàng
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-[22px] font-bold text-[#eb5757]">
                            {metrics.outOfStockCount} sản phẩm
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#eb5757] font-medium mt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Cần nhập kho gấp</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card variant="flat" padding="md">
                    <CardHeader>
                        <CardTitle>Xu hướng quay vòng tồn kho</CardTitle>
                    </CardHeader>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={turnoverData}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                                <XAxis
                                    dataKey="period"
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
                                    dataKey="turnover"
                                    stroke="#0075de"
                                    fill="#0075de"
                                    fillOpacity={0.15}
                                    name="Vòng quay thực tế"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="benchmark"
                                    stroke="#a39e98"
                                    strokeDasharray="3 3"
                                    fill="none"
                                    name="Mục tiêu định mức"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card variant="flat" padding="md">
                    <CardHeader>
                        <CardTitle>Khối lượng Nhập và Xuất theo nhóm hàng</CardTitle>
                    </CardHeader>
                    <div className="h-64 w-full">
                        {movementData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={movementData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <XAxis
                                        dataKey="category"
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
                                    <Bar
                                        dataKey="inbound"
                                        fill="#1aae39"
                                        name="Nhập kho"
                                        radius={[3, 3, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="outbound"
                                        fill="#0075de"
                                        name="Xuất kho"
                                        radius={[3, 3, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-[#615d59]">
                                Chưa có phát sinh giao dịch nhập xuất trong kỳ
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card variant="flat" padding="md">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#1aae39]" />
                            <CardTitle>Sản phẩm bán chạy nhất</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        {topSelling.length > 0 ? (
                            <>
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-[#e6e6e6] text-[#615d59] uppercase tracking-wider text-[11px]">
                                            <th className="py-2">Sản phẩm</th>
                                            <th className="py-2 text-center">Đã bán</th>
                                            <th className="py-2 text-right">Doanh thu</th>
                                            <th className="py-2 text-right">Tồn kho</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e6e6e6]">
                                        {paginatedTopSelling.map((it) => (
                                            <tr key={it.id} className="hover:bg-[#f6f5f4]">
                                                <td className="py-2.5 font-medium text-[#000000]">
                                                    {it.name}
                                                </td>
                                                <td className="py-2.5 font-bold text-center">
                                                    {it.unitsSold}
                                                </td>
                                                <td className="py-2.5 text-right font-semibold text-[#0075de]">
                                                    {formatCurrency(it.revenue)}
                                                </td>
                                                <td className="py-2.5 text-right font-medium text-[#615d59]">
                                                    {it.stock} cái
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {topSelling.length > topSellingPageSize && (
                                    <div className="mt-4 pt-3 border-t border-[#e6e6e6]">
                                        <Pagination
                                            currentPage={topSellingPage}
                                            totalPages={Math.ceil(topSelling.length / topSellingPageSize)}
                                            totalItems={topSelling.length}
                                            pageSize={topSellingPageSize}
                                            onPageChange={setTopSellingPage}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-8 text-center text-xs text-[#615d59]">
                                Chưa có số liệu bán chạy trong kỳ này
                            </div>
                        )}
                    </div>
                </Card>

                <Card variant="flat" padding="md">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#dd5b00]" />
                            <CardTitle>Sản phẩm chậm luân chuyển</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        {slowMoving.length > 0 ? (
                            <>
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-[#e6e6e6] text-[#615d59] uppercase tracking-wider text-[11px]">
                                            <th className="py-2">Sản phẩm</th>
                                            <th className="py-2 text-center">Tồn đọng</th>
                                            <th className="py-2 text-right">Vốn ứ đọng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e6e6e6]">
                                        {paginatedSlowMoving.map((it) => (
                                            <tr key={it.id} className="hover:bg-[#f6f5f4]">
                                                <td className="py-2.5 font-medium text-[#000000]">
                                                    {it.name}
                                                </td>
                                                <td className="py-2.5 font-semibold text-center text-[#dd5b00]">
                                                    {it.idleUnits} cái
                                                </td>
                                                <td className="py-2.5 text-right font-bold text-[#eb5757]">
                                                    {formatCurrency(it.capitalTied)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {slowMoving.length > slowMovingPageSize && (
                                    <div className="mt-4 pt-3 border-t border-[#e6e6e6]">
                                        <Pagination
                                            currentPage={slowMovingPage}
                                            totalPages={Math.ceil(slowMoving.length / slowMovingPageSize)}
                                            totalItems={slowMoving.length}
                                            pageSize={slowMovingPageSize}
                                            onPageChange={setSlowMovingPage}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-8 text-center text-xs text-[#615d59]">
                                Không có sản phẩm nào bị tồn đọng vốn
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
