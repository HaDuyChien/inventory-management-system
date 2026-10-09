import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "utility" | "ghost" | "danger" | "outline";
    size?: "xs" | "sm" | "md" | "lg";
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = "utility",
            size = "md",
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            ...props
        },
        ref,
    ) => {
        const baseStyles =
            "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

        const sizeStyles = {
            xs: "text-xs px-2.5 py-1 gap-1.5 rounded-[5px]",
            sm: "text-[13px] px-3 py-1.5 gap-1.5 rounded-[6px]",
            md: "text-[14px] px-3.5 py-2 gap-2 rounded-[8px]",
            lg: "text-[15px] px-5 py-2.5 gap-2.5 rounded-[10px]",
        };

        const variantStyles = {
            primary:
                "bg-[#0075de] hover:bg-[#005bab] active:scale-[0.98] text-white shadow-notion-sm rounded-full font-medium",
            secondary:
                "bg-white hover:bg-[#f6f5f4] active:scale-[0.98] text-[#000000] border border-[#e6e6e6] shadow-notion-sm rounded-full",
            utility:
                "bg-white hover:bg-[#f6f5f4] text-[#000000] border border-[#e6e6e6] shadow-notion-sm rounded-[8px] active:bg-[#eae8e6]",
            ghost: "bg-transparent hover:bg-black/5 text-[#31302e] rounded-[6px] active:bg-black/10",
            outline:
                "bg-transparent border border-[#e6e6e6] hover:bg-white text-[#31302e] rounded-[8px]",
            danger: "bg-[#eb5757] hover:bg-[#d63f3f] text-white shadow-notion-sm rounded-[8px] active:scale-[0.98]",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
                {...props}
            >
                {isLoading && (
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                        />
                    </svg>
                )}
                {!children && !isLoading && leftIcon && (
                    <span className="inline-flex shrink-0">{leftIcon}</span>
                )}
                <span>{children}</span>
                {!children && !isLoading && rightIcon && (
                    <span className="inline-flex shrink-0">{rightIcon}</span>
                )}
            </button>
        );
    },
);

Button.displayName = "Button";
