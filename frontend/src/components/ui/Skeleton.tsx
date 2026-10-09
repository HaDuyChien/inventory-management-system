import React from "react";
import { cn } from "@/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "text" | "circular" | "rectangular";
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = "rectangular",
    ...props
}) => {
    const variantStyles = {
        text: "h-4 w-full rounded-[4px]",
        circular: "rounded-full",
        rectangular: "rounded-[6px]",
    };

    return (
        <div
            className={cn("animate-pulse bg-[#e6e6e6]/75", variantStyles[variant], className)}
            {...props}
        />
    );
};
