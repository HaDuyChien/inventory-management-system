import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    side?: "right" | "left";
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    side = "right",
    size = "md",
    className,
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeStyles = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-2xl",
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div
                className={cn(
                    "fixed inset-y-0 flex max-w-full z-10",
                    side === "right" ? "right-0" : "left-0",
                )}
            >
                <div
                    className={cn(
                        "w-screen bg-white border-l border-[#e6e6e6] shadow-notion-lg flex flex-col",
                        sizeStyles[size],
                        className,
                    )}
                >
                    <div className="flex items-start justify-between p-5 border-b border-[#e6e6e6]">
                        <div>
                            {title && (
                                <h3 className="text-[17px] font-semibold text-[#000000] tracking-tight">
                                    {title}
                                </h3>
                            )}
                            {description && (
                                <p className="text-[13px] text-[#615d59] mt-1">{description}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-[#a39e98] hover:text-[#000000] p-1.5 rounded-[6px] hover:bg-black/5 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto">{children}</div>

                    {footer && (
                        <div className="p-4 bg-[#f6f5f4] border-t border-[#e6e6e6] flex items-center justify-end gap-2.5">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
