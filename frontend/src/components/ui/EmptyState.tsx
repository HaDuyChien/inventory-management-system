import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/utils/cn";

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    className,
}) => {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-8 text-center bg-[#f6f5f4]/50 border border-dashed border-[#d4d4d4] rounded-[10px]",
                className,
            )}
        >
            <div className="w-12 h-12 rounded-full bg-white border border-[#e6e6e6] shadow-notion-sm flex items-center justify-center text-[#615d59] mb-3">
                {icon || <FolderOpen className="w-6 h-6 stroke-[1.5]" />}
            </div>
            <h4 className="text-[15px] font-semibold text-[#000000] tracking-tight mb-1">
                {title}
            </h4>
            {description && (
                <p className="text-[13px] text-[#615d59] max-w-sm mb-4">{description}</p>
            )}
            {action && <div className="mt-1">{action}</div>}
        </div>
    );
};
