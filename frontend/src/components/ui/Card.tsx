import React from "react";
import { cn } from "@/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "flat" | "elevated" | "soft";
    padding?: "none" | "sm" | "md" | "lg";
}

export const Card: React.FC<CardProps> = ({
    className,
    variant = "flat",
    padding = "md",
    children,
    ...props
}) => {
    const variantStyles = {
        flat: "bg-white border border-[#e6e6e6]",
        elevated: "bg-white border border-[#e6e6e6] shadow-notion-md",
        soft: "bg-[#f6f5f4] border border-[#e6e6e6]",
    };

    const paddingStyles = {
        none: "p-0",
        sm: "p-3 sm:p-4",
        md: "p-4 sm:p-5",
        lg: "p-5 sm:p-6",
    };

    return (
        <div
            className={cn(
                "rounded-[10px] text-[#000000] transition-colors",
                variantStyles[variant],
                paddingStyles[padding],
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => (
    <div
        className={cn(
            "flex items-center justify-between gap-3 mb-3 border-b border-[#e6e6e6] pb-3 last:border-b-0 last:pb-0",
            className,
        )}
        {...props}
    >
        {children}
    </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
    className,
    children,
    ...props
}) => (
    <h3
        className={cn("text-[16px] font-semibold tracking-tight text-[#000000]", className)}
        {...props}
    >
        {children}
    </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
    className,
    children,
    ...props
}) => (
    <p className={cn("text-xs text-[#615d59] mt-0.5", className)} {...props}>
        {children}
    </p>
);
