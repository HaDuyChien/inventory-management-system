import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
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
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[92vw]",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            <div
                className={cn(
                    "relative w-full bg-white rounded-[12px] border border-[#e6e6e6] shadow-notion-lg z-10 my-8 overflow-hidden transition-all",
                    sizeStyles[size],
                    className,
                )}
            >
                {(title || description) && (
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
                            className="text-[#a39e98] hover:text-[#000000] p-1.5 rounded-[6px] hover:bg-black/5 transition-colors -mr-1 -mt-1 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>

                {footer && (
                    <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-[#f6f5f4] border-t border-[#e6e6e6]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
