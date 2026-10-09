import React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?:
        | "default"
        | "primary"
        | "success"
        | "warning"
        | "danger"
        | "purple"
        | "pink"
        | "teal"
        | "sky"
        | "gray";
    size?: "xs" | "sm" | "md";
    dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
    className,
    variant = "default",
    size = "sm",
    dot = false,
    children,
    ...props
}) => {
    const sizeStyles = {
        xs: "text-[11px] px-1.5 py-0.5 tracking-tight",
        sm: "text-[12px] px-2 py-0.5 tracking-tight font-medium",
        md: "text-[13px] px-2.5 py-1 tracking-tight font-medium",
    };

    const variantStyles = {
        default: "bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6]",
        primary: "bg-[#0075de]/10 text-[#0075de] border border-[#0075de]/20",
        success: "bg-[#1aae39]/12 text-[#15802a] border border-[#1aae39]/20",
        warning: "bg-[#dd5b00]/12 text-[#b04800] border border-[#dd5b00]/20",
        danger: "bg-[#eb5757]/12 text-[#c83232] border border-[#eb5757]/20",
        purple: "bg-[#d6b6f6]/30 text-[#391c57] border border-[#d6b6f6]/50",
        pink: "bg-[#ff64c8]/15 text-[#aa1a72] border border-[#ff64c8]/30",
        teal: "bg-[#2a9d99]/15 text-[#116663] border border-[#2a9d99]/30",
        sky: "bg-[#62aef0]/20 text-[#0265b8] border border-[#62aef0]/40",
        gray: "bg-black/5 text-[#615d59] border border-black/5",
    };

    const dotColors = {
        default: "bg-[#615d59]",
        primary: "bg-[#0075de]",
        success: "bg-[#1aae39]",
        warning: "bg-[#dd5b00]",
        danger: "bg-[#eb5757]",
        purple: "bg-[#793da8]",
        pink: "bg-[#ff64c8]",
        teal: "bg-[#2a9d99]",
        sky: "bg-[#62aef0]",
        gray: "bg-[#a39e98]",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full select-none leading-none",
                sizeStyles[size],
                variantStyles[variant],
                className,
            )}
            {...props}
        >
            {dot && (
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
            )}
            <span>{children}</span>
        </span>
    );
};
