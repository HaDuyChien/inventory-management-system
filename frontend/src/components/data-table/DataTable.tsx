import React, { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Pagination } from "./Pagination";
import { Checkbox } from "@/components/ui/Checkbox";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/utils/cn";

export interface Column<T> {
    key: string;
    header: React.ReactNode;
    sortable?: boolean;
    width?: string;
    className?: string;
    render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    isLoading?: boolean;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        pageSize: number;
        onPageChange: (page: number) => void;
        onPageSizeChange?: (size: number) => void;
    };
    selectable?: boolean;
    selectedKeys?: string[];
    onSelectionChange?: (selectedKeys: string[]) => void;
    bulkActions?: React.ReactNode;
    emptyMessage?: string;
    emptyTitle?: string;
    onRowClick?: (item: T) => void;
    className?: string;
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    isLoading = false,
    pagination,
    selectable = false,
    selectedKeys = [],
    onSelectionChange,
    bulkActions,
    emptyTitle = "Không có dữ liệu",
    emptyMessage = "Không tìm thấy bản ghi nào phù hợp với bộ lọc.",
    onRowClick,
    className,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("asc");
        }
    };

    const allSelected =
        data.length > 0 && data.every((item) => selectedKeys.includes(keyExtractor(item)));
    const someSelected = selectedKeys.length > 0 && !allSelected;

    const toggleSelectAll = () => {
        if (!onSelectionChange) return;
        if (allSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(data.map(keyExtractor));
        }
    };

    const toggleSelectRow = (key: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onSelectionChange) return;
        if (selectedKeys.includes(key)) {
            onSelectionChange(selectedKeys.filter((k) => k !== key));
        } else {
            onSelectionChange([...selectedKeys, key]);
        }
    };

    return (
        <div
            className={cn(
                "bg-white border border-[#e6e6e6] rounded-[10px] overflow-hidden shadow-notion-sm",
                className,
            )}
        >
            {selectable && selectedKeys.length > 0 && (
                <div className="bg-[#f6f5f4] border-b border-[#e6e6e6] px-4 py-2 flex items-center justify-between text-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#000000]">{selectedKeys.length}</span>
                        <span className="text-[#615d59]">mục đã chọn</span>
                    </div>
                    {bulkActions && <div className="flex items-center gap-2">{bulkActions}</div>}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="bg-[#f6f5f4] border-b border-[#e6e6e6]">
                            {selectable && (
                                <th className="w-10 px-3.5 py-2.5">
                                    <Checkbox
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someSelected;
                                        }}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                            )}
                            {columns.map((col) => {
                                const isSorted = sortKey === col.key;
                                return (
                                    <th
                                        key={col.key}
                                        style={{ width: col.width }}
                                        className={cn(
                                            "px-3.5 py-2.5 text-[11.5px] font-semibold text-[#615d59] uppercase tracking-wider select-none whitespace-nowrap",
                                            col.sortable
                                                ? "cursor-pointer hover:text-[#000000]"
                                                : "",
                                            col.className,
                                        )}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>{col.header}</span>
                                            {col.sortable && (
                                                <span className="text-[#a39e98]">
                                                    {isSorted ? (
                                                        sortOrder === "asc" ? (
                                                            <ArrowUp className="w-3 h-3 text-[#0075de]" />
                                                        ) : (
                                                            <ArrowDown className="w-3 h-3 text-[#0075de]" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="w-3 h-3 hover:text-[#615d59]" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6e6e6] text-[13.5px]">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={`loading-row-${idx}`}>
                                    {selectable && (
                                        <td className="px-3.5 py-3">
                                            <Skeleton className="w-4 h-4 rounded-[4px]" />
                                        </td>
                                    )}
                                    {columns.map((col) => (
                                        <td
                                            key={`skeleton-cell-${col.key}`}
                                            className="px-3.5 py-3"
                                        >
                                            <Skeleton className="h-4 w-3/4 rounded-[4px]" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    className="px-4 py-12 text-center"
                                >
                                    <EmptyState title={emptyTitle} description={emptyMessage} />
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => {
                                const key = keyExtractor(item);
                                const isSelected = selectedKeys.includes(key);
                                return (
                                    <tr
                                        key={key}
                                        onClick={() => onRowClick?.(item)}
                                        className={cn(
                                            "hover:bg-[#f6f5f4]/80 transition-colors",
                                            isSelected ? "bg-[#0075de]/5" : "",
                                            onRowClick ? "cursor-pointer" : "",
                                        )}
                                    >
                                        {selectable && (
                                            <td
                                                className="w-10 px-3.5 py-2.5"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={(e) => toggleSelectRow(key, e as any)}
                                                />
                                            </td>
                                        )}
                                        {columns.map((col) => {
                                            const value = (item as any)[col.key];
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={cn(
                                                        "px-3.5 py-2.5 text-[#000000] align-middle",
                                                        col.className,
                                                    )}
                                                >
                                                    {col.render
                                                        ? col.render(item, index)
                                                        : (value ?? "—")}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    pageSize={pagination.pageSize}
                    onPageChange={pagination.onPageChange}
                    onPageSizeChange={pagination.onPageSizeChange}
                />
            )}
        </div>
    );
}
