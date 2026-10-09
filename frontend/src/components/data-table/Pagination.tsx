import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    className,
}) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div
            className={cn(
                "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-[#e6e6e6] text-[13px] text-[#615d59]",
                className,
            )}
        >
            <div className="flex items-center gap-3">
                <span>
                    Hiển thị <strong className="text-[#000000]">{startItem}</strong> -{" "}
                    <strong className="text-[#000000]">{endItem}</strong> trên{" "}
                    <strong className="text-[#000000]">{totalItems}</strong> mục
                </span>

                {onPageSizeChange && (
                    <div className="flex items-center gap-1.5 ml-2">
                        <span>Số dòng:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="bg-white border border-[#e6e6e6] rounded-[5px] px-2 py-0.5 text-xs text-[#000000] focus:outline-none focus:border-[#0075de]"
                        >
                            {[10, 20, 50, 100].map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5">
                <Button
                    variant="utility"
                    size="xs"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                    Trước
                </Button>

                <span className="px-2 text-xs font-medium text-[#31302e]">
                    Trang {currentPage} / {Math.max(1, totalPages)}
                </span>

                <Button
                    variant="utility"
                    size="xs"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                    Sau
                </Button>
            </div>
        </div>
    );
};
