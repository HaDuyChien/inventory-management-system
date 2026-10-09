import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/utils/cn";

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
    message = "Đang tải dữ liệu...",
    className,
}) => {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-16 text-[#615d59]",
                className,
            )}
        >
            <Loader2 className="w-7 h-7 animate-spin text-[#0075de] mb-3" />
            <p className="text-[13.5px] font-medium">{message}</p>
        </div>
    );
};

export const ErrorState: React.FC<{
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
}> = ({
    title = "Lỗi kết nối",
    message = "Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại.",
    onRetry,
    className,
}) => {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-8 text-center bg-[#fff8f8] border border-[#eb5757]/20 rounded-[10px]",
                className,
            )}
        >
            <div className="w-10 h-10 rounded-full bg-[#eb5757]/10 flex items-center justify-center text-[#eb5757] mb-3">
                <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="text-[15px] font-semibold text-[#000000] mb-1">{title}</h4>
            <p className="text-[13px] text-[#615d59] max-w-sm mb-4">{message}</p>
            {onRetry && (
                <Button variant="utility" size="sm" onClick={onRetry}>
                    Thử Lại
                </Button>
            )}
        </div>
    );
};
