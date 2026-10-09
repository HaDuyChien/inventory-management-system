import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
        const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

        return (
            <div className="w-full flex flex-col gap-1.5 text-left">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-[13px] font-medium text-[#31302e] select-none flex items-center justify-between"
                    >
                        <span>{label}</span>
                        {props.required && <span className="text-[#eb5757] text-xs">*</span>}
                    </label>
                )}
                <div className="relative flex items-center">
                    {leftIcon && (
                        <div className="absolute left-2.5 text-[#a39e98] pointer-events-none flex items-center">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        ref={ref}
                        className={cn(
                            "w-full bg-white text-[#000000] text-[14px] placeholder-[#a39e98]",
                            "border border-[#e6e6e6] rounded-[6px] px-3 py-1.5 transition-all duration-150",
                            "focus:outline-none focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/15 focus:shadow-notion-sm",
                            "disabled:bg-[#f6f5f4] disabled:text-[#a39e98] disabled:cursor-not-allowed",
                            leftIcon ? "pl-9" : "",
                            rightIcon ? "pr-9" : "",
                            error
                                ? "border-[#eb5757] focus:border-[#eb5757] focus:ring-[#eb5757]/15"
                                : "",
                            className,
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-2.5 text-[#a39e98] flex items-center">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && <p className="text-xs text-[#eb5757] mt-0.5">{error}</p>}
                {!error && helperText && (
                    <p className="text-xs text-[#615d59] mt-0.5">{helperText}</p>
                )}
            </div>
        );
    },
);

Input.displayName = "Input";
