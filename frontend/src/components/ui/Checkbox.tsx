import React, { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: React.ReactNode;
    description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, description, id, checked, ...props }, ref) => {
        const inputId =
            id ||
            (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

        return (
            <label
                htmlFor={inputId}
                className="inline-flex items-start gap-2.5 cursor-pointer select-none"
            >
                <div className="relative flex items-center justify-center mt-0.5">
                    <input
                        id={inputId}
                        ref={ref}
                        type="checkbox"
                        checked={checked}
                        className="peer sr-only"
                        {...props}
                    />
                    <div
                        className={cn(
                            "w-4 h-4 rounded-[4px] border border-[#d4d4d4] bg-white transition-colors duration-150",
                            "peer-checked:bg-[#0075de] peer-checked:border-[#0075de]",
                            "peer-focus:ring-2 peer-focus:ring-[#0075de]/20",
                            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                            className,
                        )}
                    />
                    <Check className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                {(label || description) && (
                    <div className="flex flex-col">
                        {label && (
                            <span className="text-[13.5px] font-medium text-[#31302e]">
                                {label}
                            </span>
                        )}
                        {description && (
                            <span className="text-xs text-[#615d59]">{description}</span>
                        )}
                    </div>
                )}
            </label>
        );
    },
);

Checkbox.displayName = "Checkbox";

export interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    className,
}) => {
    return (
        <div className={cn("flex items-center justify-between gap-4", className)}>
            {(label || description) && (
                <div className="flex flex-col">
                    {label && (
                        <span className="text-[13.5px] font-medium text-[#31302e]">{label}</span>
                    )}
                    {description && <span className="text-xs text-[#615d59]">{description}</span>}
                </div>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0075de]/20 disabled:cursor-not-allowed disabled:opacity-50",
                    checked ? "bg-[#0075de]" : "bg-[#e6e6e6]",
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                        checked ? "translate-x-4" : "translate-x-0",
                    )}
                />
            </button>
        </div>
    );
};
