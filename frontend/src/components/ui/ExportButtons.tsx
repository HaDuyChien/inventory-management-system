import React, { useState, useRef, useEffect } from "react";
import { Button } from "./Button";
import { exportToExcel, exportToPDF, type ExportColumn } from "@/utils/exportUtils";
import { cn } from "@/utils/cn";

export type { ExportColumn };

export interface ExportButtonsProps {
    filename: string;
    title: string;
    columns: ExportColumn[];
    data: any[];
    disabled?: boolean;
    size?: "xs" | "sm" | "md";
    className?: string;
    label?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
    filename,
    title,
    columns,
    data,
    disabled = false,
    size = "sm",
    className,
    label = "Xuất dữ liệu",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExportExcel = () => {
        setIsOpen(false);
        exportToExcel({ filename, title, columns, data });
    };

    const handleExportPDF = () => {
        setIsOpen(false);
        exportToPDF({ filename, title, columns, data });
    };

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            <Button
                variant="utility"
                size={size}
                disabled={disabled || data.length === 0}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "min-w-[130px] sm:min-w-[140px] h-9 px-4 justify-center rounded-[8px] border border-[#d3d1cb] hover:border-[#0075de] hover:bg-[#fbfbfb] text-[#2a2826] font-semibold shadow-xs transition-all",
                    isOpen && "border-[#0075de] ring-2 ring-[#0075de]/15 bg-white",
                    className
                )}
            >
                <span className="text-xs tracking-tight">{label}</span>
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-[10px] bg-white border border-[#e6e6e6] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="w-full px-3.5 py-2 text-left rounded-[6px] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
                    >
                        <div className="text-xs font-semibold text-[#1f2937]">Xuất tệp Excel</div>
                        <div className="text-[11px] text-[#6b7280]">Bảng tính định dạng xlsx</div>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportPDF}
                        className="w-full px-3.5 py-2 text-left rounded-[6px] hover:bg-[#f6f5f4] transition-colors cursor-pointer border-t border-[#f0f0f0]"
                    >
                        <div className="text-xs font-semibold text-[#1f2937]">Xuất tệp PDF</div>
                        <div className="text-[11px] text-[#6b7280]">Tài liệu in định dạng pdf</div>
                    </button>
                </div>
            )}
        </div>
    );
};
