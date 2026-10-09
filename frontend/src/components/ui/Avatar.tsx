import React, { useState } from "react";
import { cn } from "@/utils/cn";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string;
    name?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    name = "User",
    size = "md",
    className,
    ...props
}) => {
    const [imageError, setImageError] = useState(false);

    const sizeStyles = {
        xs: "w-6 h-6 text-[10px]",
        sm: "w-7 h-7 text-xs",
        md: "w-8 h-8 text-sm",
        lg: "w-12 h-12 text-base font-semibold",
        xl: "w-16 h-16 text-lg font-bold",
    };

    const initial = name.trim().charAt(0).toUpperCase() || "U";

    if (src && !imageError) {
        return (
            <div
                className={cn(
                    "relative inline-flex items-center justify-center rounded-full overflow-hidden bg-[#f6f5f4] shrink-0 border border-[#e6e6e6]",
                    sizeStyles[size],
                    className,
                )}
                {...props}
            >
                <img
                    src={src}
                    alt={name}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-[#0075de] to-[#60a5fa] text-white font-medium shrink-0 select-none shadow-sm",
                sizeStyles[size],
                className,
            )}
            {...props}
        >
            {initial}
        </div>
    );
};
