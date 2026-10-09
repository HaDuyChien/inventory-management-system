import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SelectOption {
    label: string;
    value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, placeholder, id, ...props }, ref) => {
        const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

        return (
            <div className="w-full flex flex-col gap-1.5 text-left">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="text-[13px] font-medium text-[#31302e] select-none flex items-center justify-between"
                    >
                        <span>{label}</span>
                        {props.required && <span className="text-[#eb5757] text-xs">*</span>}
                    </label>
                )}
                <div className="relative flex items-center">
                    <select
                        id={selectId}
                        ref={ref}
                        className={cn(
                            "w-full appearance-none bg-white text-[#000000] text-[14px] border border-[#e6e6e6] rounded-[6px] pl-3 pr-8 py-1.5 transition-all duration-150",
                            "focus:outline-none focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/15 focus:shadow-notion-sm",
                            "disabled:bg-[#f6f5f4] disabled:text-[#a39e98] disabled:cursor-not-allowed",
                            error ? "border-[#eb5757]" : "",
                            className,
                        )}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 w-4 h-4 text-[#a39e98] pointer-events-none" />
                </div>
                {error && <p className="text-xs text-[#eb5757] mt-0.5">{error}</p>}
            </div>
        );
    },
);

Select.displayName = "Select";
