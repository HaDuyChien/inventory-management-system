import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, value, onClear, onChange, ...props }, ref) => {
        return (
            <div className={cn("relative flex items-center w-full max-w-sm", className)}>
                <Search className="absolute left-2.5 w-4 h-4 text-[#a39e98] pointer-events-none" />
                <input
                    ref={ref}
                    type="text"
                    value={value}
                    onChange={onChange}
                    className="w-full bg-white text-[#000000] text-[13.5px] placeholder-[#a39e98] border border-[#e6e6e6] rounded-[6px] pl-8.5 pr-8 py-1.5 transition-all duration-150 focus:outline-none focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/15 focus:shadow-notion-sm"
                    {...props}
                />
                {value && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute right-2 text-[#a39e98] hover:text-[#31302e] p-0.5 rounded-full hover:bg-black/5"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        );
    },
);

SearchInput.displayName = "SearchInput";
