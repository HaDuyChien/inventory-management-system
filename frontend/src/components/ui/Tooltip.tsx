import React, { useState } from "react";
import { cn } from "@/utils/cn";

export interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = "top",
    className,
}) => {
    const [isVisible, setIsVisible] = useState(false);

    const posStyles = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
        left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
        right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
    };

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    role="tooltip"
                    className={cn(
                        "absolute z-50 px-2.5 py-1 text-xs font-medium text-white bg-[#111111] rounded-[5px] shadow-sm pointer-events-none whitespace-nowrap animate-in fade-in duration-150",
                        posStyles[position],
                        className,
                    )}
                >
                    {content}
                </div>
            )}
        </div>
    );
};
