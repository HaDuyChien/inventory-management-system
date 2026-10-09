import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable, type Column } from "@/components/data-table/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { mockApi } from "@/services/mockApi";
import type { AuditLog } from "@/types";
import { formatDateTime } from "@/utils/formatters";

export const AuditLogsPage: React.FC = () => {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ["audit-logs"],
        queryFn: mockApi.getAuditLogs,
    });

    const filtered = logs.filter(
        (l) =>
            l.user.toLowerCase().includes(search.toLowerCase()) ||
            l.action.toLowerCase().includes(search.toLowerCase()) ||
            l.resource.toLowerCase().includes(search.toLowerCase()) ||
            l.resourceId.toLowerCase().includes(search.toLowerCase()),
    );

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedLogs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const exportColumns = [
        { header: "Thời gian", key: "timestamp", format: (v: string) => formatDateTime(v) },
        { header: "Người thực hiện", key: "user" },
        { header: "Địa chỉ IP", key: "ipAddress" },
        { header: "Hành động", key: "action" },
        { header: "Đối tượng", key: "resource" },
        { header: "Mã đối tượng", key: "resourceId" },
        { header: "Giá trị cũ", key: "previousValue" },
        { header: "Giá trị mới", key: "newValue" },
    ];

    const columns: Column<AuditLog>[] = [
        {
            key: "timestamp",
            header: "Thời gian",
            sortable: true,
            render: (log) => (
                <span className="font-mono text-xs text-[#615d59]">
                    {formatDateTime(log.timestamp)}
                </span>
            ),
        },
        {
            key: "user",
            header: "Người thực hiện",
            render: (log) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-xs text-[#000000]">{log.user}</span>
                    <span className="text-[10.5px] text-[#a39e98] font-mono">{log.ipAddress}</span>
                </div>
            ),
        },
        {
            key: "action",
            header: "Hành động",
            render: (log) => (
                <Badge variant="primary" size="xs">
                    {log.action}
                </Badge>
            ),
        },
        {
            key: "resource",
            header: "Đối tượng",
            render: (log) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium text-[#000000]">{log.resource}</span>
                    <span className="text-[#615d59] font-mono text-[11px] truncate max-w-xs">
                        {log.resourceId}
                    </span>
                </div>
            ),
        },
        {
            key: "diff",
            header: "Thay đổi: Cũ sang Mới",
            render: (log) => (
                <div className="flex flex-col text-xs font-mono max-w-md">
                    <span className="text-[#eb5757] line-through text-[11px]">
                        {log.previousValue}
                    </span>
                    <span className="text-[#1aae39] font-semibold text-[11px]">{log.newValue}</span>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-bold text-[#000000] tracking-tight">
                        Nhật ký kiểm toán hệ thống
                    </h1>
                    <p className="text-xs text-[#615d59]">
                        Theo dõi mọi biến động dữ liệu và hoạt động của tài khoản người dùng
                    </p>
                </div>

                <ExportButtons
                    filename="nhat-ky-kiem-toan"
                    title="Nhật ký kiểm toán hệ thống"
                    columns={exportColumns}
                    data={filtered}
                />
            </div>

            <div className="p-3 bg-white border border-[#e6e6e6] rounded-[8px] flex items-center justify-between">
                <SearchInput
                    placeholder="Tìm theo người dùng, hành động, đối tượng..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    onClear={() => {
                        setSearch("");
                        setCurrentPage(1);
                    }}
                    className="max-w-md"
                />
            </div>

            <DataTable
                columns={columns}
                data={paginatedLogs}
                keyExtractor={(log) => log.id}
                isLoading={isLoading}
                pagination={{
                    currentPage,
                    totalPages,
                    totalItems: filtered.length,
                    pageSize,
                    onPageChange: setCurrentPage,
                    onPageSizeChange: (size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    },
                }}
            />
        </div>
    );
};
